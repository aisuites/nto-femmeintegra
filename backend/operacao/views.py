import json
import logging
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

from .models import (
    DadosRequisicao,
    Origem,
    PortadorRepresentante,
    StatusRequisicao,
    Unidade,
)
from .services import RequisicaoService, BuscaService

logger = logging.getLogger(__name__)


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
        
        # Requisições recebidas pelo usuário logado com status 1 (ABERTO_NTO)
        requisicoes = (
            DadosRequisicao.objects
            .filter(
                recebido_por=self.request.user,
                status__codigo='1'
            )
            .select_related('unidade', 'origem', 'status', 'recebido_por')
            .order_by('-created_at')
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
    """View para localizar código de barras no sistema."""
    
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

        # Delegar para service
        resultado = BuscaService.buscar_codigo_barras(cod_barras)
        return JsonResponse(resultado)


@method_decorator(ratelimit(key='user', rate='20/m', method='POST'), name='dispatch')
class RecebimentoValidarView(LoginRequiredMixin, View):
    """View para validar e criar requisições."""
    
    login_url = 'admin:login'

    def post(self, request, *args, **kwargs):
        try:
            payload = json.loads(request.body or '{}')
        except json.JSONDecodeError:
            return JsonResponse(
                {'status': 'error', 'message': 'Formato de dados inválido.'},
                status=400,
            )

        # Extrair dados do payload
        cod_barras_req = (payload.get('cod_barras_req') or '').strip()
        cod_barras_amostras = payload.get('cod_barras_amostras', [])
        unidade_id = payload.get('unidade_id')
        portador_id = payload.get('portador_id')
        origem_id = payload.get('origem_id')

        # Validações básicas de entrada
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

        # Delegar toda a lógica de negócio para o service
        try:
            resultado = RequisicaoService.criar_requisicao(
                cod_barras_req=cod_barras_req,
                cod_barras_amostras=cod_barras_amostras,
                unidade_id=unidade_id,
                portador_id=portador_id,
                origem_id=origem_id,
                user=request.user,
            )
            
            # Determinar status HTTP baseado no resultado
            status_code = 200 if resultado['status'] == 'success' else 400
            return JsonResponse(resultado, status=status_code)
            
        except ValidationError as e:
            logger.warning('Erro de validação: %s', str(e))
            return JsonResponse(
                {'status': 'error', 'message': str(e)},
                status=400,
            )
        except Exception as e:
            logger.exception('Erro inesperado ao criar requisição')
            return JsonResponse(
                {'status': 'error', 'message': 'Erro ao processar requisição. Contate o suporte.'},
                status=500,
            )


@method_decorator(ratelimit(key='user', rate='10/m', method='POST'), name='dispatch')
class RecebimentoFinalizarView(LoginRequiredMixin, View):
    """View para finalizar o kit de recebimento."""
    
    login_url = 'admin:login'

    def post(self, request, *args, **kwargs):
        # Delegar para o service
        try:
            resultado = RequisicaoService.finalizar_kit_recebimento(request.user)
            
            status_code = 200 if resultado['status'] == 'success' else 400
            return JsonResponse(resultado, status=status_code)
            
        except Exception as e:
            logger.exception('Erro inesperado ao finalizar recebimento')
            return JsonResponse(
                {'status': 'error', 'message': 'Erro ao finalizar recebimento. Contate o suporte.'},
                status=500,
            )
