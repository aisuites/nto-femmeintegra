import json
import logging
import secrets
import string
from datetime import date

from django.contrib.auth.mixins import LoginRequiredMixin
from django.core.cache import cache
from django.core.exceptions import ValidationError
from django.db import IntegrityError, transaction
from django.http import JsonResponse
from django.utils.decorators import method_decorator
from django.views import View
from django.views.decorators.cache import cache_page
from django.views.decorators.csrf import ensure_csrf_cookie
from django.views.generic import TemplateView
from django_ratelimit.decorators import ratelimit

logger = logging.getLogger(__name__)

from .models import (
    DadosRequisicao,
    Origem,
    PortadorRepresentante,
    Requisicao,
    StatusRequisicao,
    Unidade,
)


@method_decorator(ensure_csrf_cookie, name='dispatch')
class RecebimentoView(LoginRequiredMixin, TemplateView):
    template_name = 'operacao/recebimento.html'
    login_url = 'admin:login'

    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        
        # Cache de unidades (raramente muda)
        unidades = cache.get('recebimento:unidades')
        if unidades is None:
            unidades = list(Unidade.objects.order_by('codigo', 'nome'))
            cache.set('recebimento:unidades', unidades, 3600)  # 1 hora
        
        # Cache de portadores (raramente muda)
        portadores = cache.get('recebimento:portadores')
        if portadores is None:
            portadores = list(
                PortadorRepresentante.objects.filter(ativo=True)
                .select_related('origem', 'unidade')
                .order_by('nome')
            )
            cache.set('recebimento:portadores', portadores, 3600)  # 1 hora
        
        # Requisições recentes (não cachear - dados em tempo real)
        requisicoes = (
            Requisicao.objects.select_related('unidade', 'origem')
            .order_by('-created_at')[:10]
        )

        context.update(
            {
                'unidades': unidades,
                'unidade_padrao': unidades[0] if unidades else None,
                'portadores': portadores,
                'portadores_json': json.dumps(
                    [
                        {
                            'id': portador.id,
                            'nome': portador.nome,
                            'unidade_id': portador.unidade_id,
                            'origem': portador.origem.descricao if portador.origem else '',
                            'origem_id': portador.origem_id,
                            'tipo': portador.get_tipo_display(),
                        }
                        for portador in portadores
                    ],
                    ensure_ascii=False,
                ),
                'requisicoes_recent': requisicoes,
                'active_page': 'recebimento',
            }
        )
        return context


@method_decorator(ratelimit(key='user', rate='30/m', method='POST'), name='dispatch')
class RecebimentoLocalizarView(LoginRequiredMixin, View):
    login_url = 'admin:login'

    def post(self, request, *args, **kwargs):
        try:
            payload = json.loads(request.body or '{}')
        except json.JSONDecodeError:
            return JsonResponse(
                {'status': 'error', 'message': 'Formato de dados inválido.'},
                status=400,
            )

        cod_barras = (payload.get('cod_barras') or '').strip()
        if not cod_barras:
            return JsonResponse(
                {'status': 'error', 'message': 'Informe o código de barras.'},
                status=400,
            )

        exists = DadosRequisicao.objects.filter(cod_barras_req=cod_barras).exists()
        if exists:
            return JsonResponse({'status': 'found'})

        return JsonResponse({'status': 'not_found'})


@method_decorator(ratelimit(key='user', rate='20/m', method='POST'), name='dispatch')
class RecebimentoValidarView(LoginRequiredMixin, View):
    login_url = 'admin:login'

    def post(self, request, *args, **kwargs):
        try:
            payload = json.loads(request.body or '{}')
        except json.JSONDecodeError:
            return JsonResponse(
                {'status': 'error', 'message': 'Formato de dados inválido.'},
                status=400,
            )

        cod_barras_req = (payload.get('cod_barras_req') or '').strip()
        cod_barras_amostras = payload.get('cod_barras_amostras', [])
        unidade_id = payload.get('unidade_id')
        portador_id = payload.get('portador_id')
        origem_id = payload.get('origem_id')

        # Validar IDs
        if not unidade_id:
            return JsonResponse(
                {'status': 'error', 'message': 'Unidade não informada.'},
                status=400,
            )
        if not portador_id:
            return JsonResponse(
                {'status': 'error', 'message': 'Portador não informado.'},
                status=400,
            )

        # Validações
        if not cod_barras_req:
            return JsonResponse(
                {'status': 'error', 'message': 'Código de barras da requisição não informado.'},
                status=400,
            )

        if not cod_barras_amostras or not isinstance(cod_barras_amostras, list):
            return JsonResponse(
                {'status': 'error', 'message': 'Códigos de barras das amostras não informados.'},
                status=400,
            )

        # Verificar se todos os códigos são iguais
        todos_codigos = [cod_barras_req] + cod_barras_amostras
        if len(set(todos_codigos)) != 1:
            return JsonResponse(
                {'status': 'error', 'message': 'Todos os códigos de barras devem ser iguais.'},
                status=400,
            )

        # Verificar se já existe
        if DadosRequisicao.objects.filter(cod_barras_req=cod_barras_req).exists():
            return JsonResponse(
                {'status': 'error', 'message': 'Já existe um registro com este código de barras.'},
                status=400,
            )

        # Gerar código aleatório de 10 caracteres (com retry limitado)
        def gerar_cod_req():
            chars = string.ascii_uppercase + string.digits
            return ''.join(secrets.choice(chars) for _ in range(10))

        max_tentativas = 10
        cod_req = None
        for _ in range(max_tentativas):
            cod_req_temp = gerar_cod_req()
            if not Requisicao.objects.filter(cod_req=cod_req_temp).exists():
                cod_req = cod_req_temp
                break
        
        if not cod_req:
            logger.error('Falha ao gerar código único após %d tentativas', max_tentativas)
            return JsonResponse(
                {'status': 'error', 'message': 'Erro ao gerar código. Tente novamente.'},
                status=500,
            )

        try:
            with transaction.atomic():
                # Validar FKs existem
                try:
                    unidade = Unidade.objects.get(id=unidade_id)
                    portador = PortadorRepresentante.objects.get(id=portador_id)
                    if origem_id:
                        origem = Origem.objects.get(id=origem_id)
                except Unidade.DoesNotExist:
                    return JsonResponse(
                        {'status': 'error', 'message': 'Unidade não encontrada.'},
                        status=400,
                    )
                except PortadorRepresentante.DoesNotExist:
                    return JsonResponse(
                        {'status': 'error', 'message': 'Portador não encontrado.'},
                        status=400,
                    )
                except Origem.DoesNotExist:
                    return JsonResponse(
                        {'status': 'error', 'message': 'Origem não encontrada.'},
                        status=400,
                    )

                # Criar DadosRequisicao
                dados_req = DadosRequisicao.objects.create(
                    cod_barras_req=cod_barras_req,
                    dados={
                        'cod_barras_amostras': cod_barras_amostras,
                        'quantidade': len(cod_barras_amostras),
                    },
                )

                # Buscar status inicial por código (mais seguro que ID)
                try:
                    status_inicial = StatusRequisicao.objects.get(codigo='ABERTO_NTO')
                except StatusRequisicao.DoesNotExist:
                    logger.error('Status ABERTO_NTO não encontrado')
                    return JsonResponse(
                        {'status': 'error', 'message': 'Configuração de status inválida.'},
                        status=500,
                    )

                # Criar Requisicao
                requisicao = Requisicao.objects.create(
                    cod_req=cod_req,
                    cod_barras_req=cod_barras_req,
                    unidade=unidade,
                    status=status_inicial,
                    portador=portador,
                    origem_id=origem_id,
                    created_by=request.user,
                    updated_by=request.user,
                )

                logger.info(
                    'Requisição %s criada com sucesso por %s',
                    cod_req,
                    request.user.username,
                )

                return JsonResponse({
                    'status': 'success',
                    'message': 'Requisição criada com sucesso.',
                    'cod_req': cod_req,
                })

        except IntegrityError as e:
            logger.error('Erro de integridade ao criar requisição: %s', str(e))
            return JsonResponse(
                {'status': 'error', 'message': 'Código de barras já cadastrado.'},
                status=400,
            )
        except Exception as e:
            logger.exception('Erro inesperado ao criar requisição')
            return JsonResponse(
                {'status': 'error', 'message': 'Erro ao processar requisição. Contate o suporte.'},
                status=500,
            )
