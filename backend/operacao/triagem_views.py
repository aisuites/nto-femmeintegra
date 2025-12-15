"""
Views para o processo de triagem de requisições.
Etapa 1: Validação de amostras com verificação de impeditivos.
"""
import json
import logging
from datetime import timedelta

from django.contrib.auth.mixins import LoginRequiredMixin
from django.http import JsonResponse
from django.utils import timezone
from django.utils.decorators import method_decorator
from django.views import View
from django_ratelimit.decorators import ratelimit

from .models import (
    AmostraMotivoArmazenamentoInadequado,
    DadosRequisicao,
    MotivoArmazenamentoInadequado,
    RequisicaoAmostra,
    RequisicaoStatusHistorico,
    StatusRequisicao,
)

logger = logging.getLogger(__name__)


@method_decorator(ratelimit(key='user', rate='60/m', method='GET'), name='dispatch')
class ListarMotivosInadequadosView(LoginRequiredMixin, View):
    """
    Lista motivos de armazenamento inadequado ativos.
    
    GET /operacao/triagem/motivos-inadequados/
    
    Response:
        {
            "status": "success",
            "motivos": [
                {"id": 1, "codigo": "TEMP", "descricao": "Temperatura inadequada"},
                ...
            ]
        }
    """
    login_url = 'admin:login'
    
    def get(self, request):
        try:
            motivos = MotivoArmazenamentoInadequado.objects.filter(
                ativo=True
            ).values('id', 'codigo', 'descricao').order_by('codigo')
            
            return JsonResponse({
                'status': 'success',
                'motivos': list(motivos)
            })
            
        except Exception as e:
            logger.error(f"Erro ao listar motivos inadequados: {str(e)}", exc_info=True)
            return JsonResponse(
                {'status': 'error', 'message': 'Erro ao listar motivos.'},
                status=500
            )


@method_decorator(ratelimit(key='user', rate='60/m', method='GET'), name='dispatch')
class VerificarArquivoRequisicaoView(LoginRequiredMixin, View):
    """
    Verifica se requisição tem arquivo digitalizado registrado no banco.
    
    GET /operacao/triagem/verificar-arquivo/?requisicao_id=123
    
    Response:
        {
            "status": "success",
            "tem_arquivo": true
        }
    """
    login_url = 'admin:login'
    
    def get(self, request):
        try:
            requisicao_id = request.GET.get('requisicao_id')
            
            if not requisicao_id:
                return JsonResponse(
                    {'status': 'error', 'message': 'ID da requisição não informado.'},
                    status=400
                )
            
            from .models import RequisicaoArquivo, TipoArquivo
            
            # Buscar tipo de arquivo REQUISICAO (código 1)
            tipo_requisicao = TipoArquivo.objects.filter(codigo=1).first()
            
            tem_arquivo = False
            if tipo_requisicao:
                tem_arquivo = RequisicaoArquivo.objects.filter(
                    requisicao_id=requisicao_id,
                    tipo_arquivo=tipo_requisicao
                ).exists()
            
            return JsonResponse({
                'status': 'success',
                'tem_arquivo': tem_arquivo
            })
            
        except Exception as e:
            logger.error(f"Erro ao verificar arquivo: {str(e)}", exc_info=True)
            return JsonResponse(
                {'status': 'error', 'message': 'Erro ao verificar arquivo.'},
                status=500
            )


@method_decorator(ratelimit(key='user', rate='60/m', method='GET'), name='dispatch')
class ListarAmostrasRequisicaoView(LoginRequiredMixin, View):
    """
    Lista amostras de uma requisição com status de validação.
    
    GET /operacao/triagem/amostras/?requisicao_id=123
    
    Response:
        {
            "status": "success",
            "amostras": [
                {
                    "id": 1,
                    "ordem": 1,
                    "cod_barras_amostra": "AMO123",
                    "triagem1_validada": false,
                    "flags": {...},
                    ...
                }
            ],
            "total": 3,
            "validadas": 0,
            "pendentes": 3
        }
    """
    login_url = 'admin:login'
    
    def get(self, request):
        try:
            requisicao_id = request.GET.get('requisicao_id')
            
            if not requisicao_id:
                return JsonResponse(
                    {'status': 'error', 'message': 'ID da requisição não informado.'},
                    status=400
                )
            
            # Buscar amostras
            amostras = RequisicaoAmostra.objects.filter(
                requisicao_id=requisicao_id
            ).select_related('requisicao', 'motivo_inadequado').order_by('ordem')
            
            amostras_data = []
            for amostra in amostras:
                amostras_data.append({
                    'id': amostra.id,
                    'ordem': amostra.ordem,
                    'cod_barras_amostra': amostra.cod_barras_amostra,
                    'tipos_amostra_id': amostra.tipos_amostra_id,
                    'data_coleta': amostra.data_coleta.isoformat() if amostra.data_coleta else None,
                    'data_validade': amostra.data_validade.isoformat() if amostra.data_validade else None,
                    'triagem1_validada': amostra.triagem1_validada,
                    'flags': {
                        'data_coleta_rasurada': amostra.flag_data_coleta_rasurada,
                        'sem_data_validade': amostra.flag_sem_data_validade,
                        'amostra_sem_identificacao': amostra.flag_amostra_sem_identificacao,
                        'armazenamento_inadequado': amostra.flag_armazenamento_inadequado,
                        'frasco_trocado': amostra.flag_frasco_trocado_tipo_coleta,
                        'material_nao_analisado': amostra.flag_material_nao_analisado,
                    },
                    'motivo_inadequado_id': amostra.motivo_inadequado_id,
                    'descricao': amostra.descricao or '',
                })
            
            total = len(amostras_data)
            validadas = sum(1 for a in amostras_data if a['triagem1_validada'])
            pendentes = total - validadas
            
            return JsonResponse({
                'status': 'success',
                'amostras': amostras_data,
                'total': total,
                'validadas': validadas,
                'pendentes': pendentes
            })
            
        except Exception as e:
            logger.error(f"Erro ao listar amostras: {str(e)}", exc_info=True)
            return JsonResponse(
                {'status': 'error', 'message': 'Erro ao listar amostras.'},
                status=500
            )


@method_decorator(ratelimit(key='user', rate='30/m', method='POST'), name='dispatch')
class SalvarAmostraTriagemView(LoginRequiredMixin, View):
    """
    Salva dados da amostra na triagem etapa 1 e valida impeditivos.
    
    POST /operacao/triagem/salvar-amostra/
    
    Body:
        {
            "amostra_id": 1,
            "data_coleta": "2024-12-10",
            "data_validade": "2024-12-15",
            "flag_data_coleta_rasurada": false,
            "flag_sem_data_validade": false,
            "flag_amostra_sem_identificacao": false,
            "flag_armazenamento_inadequado": true,
            "motivo_inadequado_id": 2,
            "flag_frasco_trocado": false,
            "flag_material_nao_analisado": false,
            "descricao": "Observações..."
        }
    
    Response (sem impeditivos):
        {
            "status": "success",
            "message": "Amostra validada com sucesso!",
            "proxima_amostra": {
                "existe": true,
                "id": 2,
                "ordem": 2
            }
        }
    
    Response (com impeditivos):
        {
            "status": "impeditivo",
            "impeditivos": ["Data de coleta rasurada", ...],
            "status_rejeicao": {
                "id": 5,
                "nome": "CAIXA BARRADOS"
            },
            "unidade_codigo": "09"
        }
    """
    login_url = 'admin:login'
    
    def post(self, request):
        try:
            from datetime import datetime
            
            data = json.loads(request.body)
            amostra_id = data.get('amostra_id')
            
            if not amostra_id:
                return JsonResponse(
                    {'status': 'error', 'message': 'ID da amostra não informado.'},
                    status=400
                )
            
            # Buscar amostra
            amostra = RequisicaoAmostra.objects.select_related(
                'requisicao',
                'requisicao__unidade'
            ).get(id=amostra_id)
            
            # VALIDAÇÃO CRÍTICA: Verificar se existe arquivo de requisição
            from .models import RequisicaoArquivo, TipoArquivo
            
            # Buscar tipo de arquivo REQUISICAO (código 1)
            tipo_requisicao = TipoArquivo.objects.filter(codigo=1).first()
            
            if tipo_requisicao:
                tem_arquivo = RequisicaoArquivo.objects.filter(
                    requisicao=amostra.requisicao,
                    tipo_arquivo=tipo_requisicao
                ).exists()
                
                if not tem_arquivo:
                    return JsonResponse(
                        {
                            'status': 'error',
                            'message': 'É obrigatório digitalizar a requisição antes de validar as amostras.'
                        },
                        status=400
                    )
            
            # Atualizar campos - converter strings de data para objetos date
            data_coleta_str = data.get('data_coleta')
            data_validade_str = data.get('data_validade')
            
            # Converter strings YYYY-MM-DD para objetos date
            if data_coleta_str:
                amostra.data_coleta = datetime.strptime(data_coleta_str, '%Y-%m-%d').date()
            else:
                amostra.data_coleta = None
                
            if data_validade_str:
                amostra.data_validade = datetime.strptime(data_validade_str, '%Y-%m-%d').date()
            else:
                amostra.data_validade = None
            amostra.flag_data_coleta_rasurada = data.get('flag_data_coleta_rasurada', False)
            amostra.flag_sem_data_validade = data.get('flag_sem_data_validade', False)
            amostra.flag_amostra_sem_identificacao = data.get('flag_amostra_sem_identificacao', False)
            amostra.flag_armazenamento_inadequado = data.get('flag_armazenamento_inadequado', False)
            amostra.flag_frasco_trocado_tipo_coleta = data.get('flag_frasco_trocado', False)
            amostra.flag_material_nao_analisado = data.get('flag_material_nao_analisado', False)
            amostra.motivo_inadequado_id = data.get('motivo_inadequado_id') or None
            amostra.descricao = data.get('descricao', '')
            
            # VALIDAÇÕES
            erros = []
            
            # 1. Data de validade obrigatória APENAS SE flag "sem data de validade" NÃO estiver marcada
            # Se flag estiver marcada, segue como impeditivo (não bloqueia)
            if not amostra.data_validade and not amostra.flag_sem_data_validade:
                erros.append('Data de validade é obrigatória ou marque "Sem data de validade"')
            
            # 2. Se armazenamento inadequado, motivo é obrigatório
            if amostra.flag_armazenamento_inadequado and not amostra.motivo_inadequado_id:
                erros.append('Motivo de armazenamento inadequado é obrigatório')
            
            if erros:
                return JsonResponse(
                    {'status': 'error', 'message': '\n'.join(erros)},
                    status=400
                )
            
            # VERIFICAR IMPEDITIVOS
            impeditivos = []
            
            if amostra.flag_data_coleta_rasurada:
                impeditivos.append('Data de coleta rasurada')
            
            if amostra.flag_sem_data_validade:
                impeditivos.append('Sem data de validade')
            
            if amostra.data_validade:
                # Calcular quantos dias atrás está a data de validade
                dias_atras = (timezone.now().date() - amostra.data_validade).days
                if dias_atras > 90:
                    impeditivos.append(f'Data de validade excede 90 dias (há {dias_atras} dias)')
            
            if amostra.flag_amostra_sem_identificacao:
                impeditivos.append('Amostra sem identificação')
            
            if amostra.flag_armazenamento_inadequado:
                impeditivos.append('Armazenamento inadequado')
            
            if amostra.flag_frasco_trocado_tipo_coleta:
                impeditivos.append('Frasco trocado')
            
            if amostra.flag_material_nao_analisado:
                impeditivos.append('Material não analisado')
            
            # Se há impeditivos, retornar para frontend decidir
            if impeditivos:
                # Determinar status de rejeição baseado na unidade
                unidade_codigo = amostra.requisicao.unidade.codigo
                
                if unidade_codigo == '09':  # EXTERNOS
                    status_rejeicao_id = 5  # CAIXA BARRADOS
                    status_rejeicao_nome = 'CAIXA BARRADOS'
                elif unidade_codigo == '17':  # PAPA BRASIL
                    status_rejeicao_id = 4  # CAIXA BO
                    status_rejeicao_nome = 'CAIXA BO'
                else:
                    # Outras unidades - usar CAIXA BO como padrão
                    status_rejeicao_id = 4
                    status_rejeicao_nome = 'CAIXA BO'
                
                # Salvar dados mesmo com impeditivos (para não perder o trabalho)
                amostra.updated_by = request.user
                amostra.save()
                
                return JsonResponse({
                    'status': 'impeditivo',
                    'impeditivos': impeditivos,
                    'status_rejeicao': {
                        'id': status_rejeicao_id,
                        'nome': status_rejeicao_nome
                    },
                    'unidade_codigo': unidade_codigo
                })
            
            # SEM IMPEDITIVOS - Marcar como validada
            amostra.triagem1_validada = True
            amostra.updated_by = request.user
            amostra.save()
            
            logger.info(
                f"Amostra {amostra.id} (requisição {amostra.requisicao.cod_req}) "
                f"validada na triagem etapa 1 por {request.user.username}"
            )
            
            # Verificar se há mais amostras pendentes
            proxima_amostra = RequisicaoAmostra.objects.filter(
                requisicao=amostra.requisicao,
                triagem1_validada=False
            ).exclude(id=amostra.id).order_by('ordem').first()
            
            # Se não há mais amostras pendentes, atualizar status da requisição para TRIAGEM1-OK
            todas_validadas = not proxima_amostra
            if todas_validadas:
                # Buscar status TRIAGEM1-OK (código 7)
                status_triagem1_ok = StatusRequisicao.objects.filter(codigo=7).first()
                
                if status_triagem1_ok:
                    status_anterior = amostra.requisicao.status
                    amostra.requisicao.status = status_triagem1_ok
                    amostra.requisicao.updated_by = request.user
                    amostra.requisicao.save()
                    
                    # Registrar no histórico
                    RequisicaoStatusHistorico.objects.create(
                        requisicao=amostra.requisicao,
                        cod_req=amostra.requisicao.cod_req,
                        status=status_triagem1_ok,
                        usuario=request.user,
                        observacao=f'Triagem Etapa 1 concluída. Todas as amostras validadas. Status anterior: {status_anterior.descricao}'
                    )
                    
                    logger.info(
                        f"Requisição {amostra.requisicao.cod_req} - Todas amostras validadas. "
                        f"Status alterado para TRIAGEM1-OK por {request.user.username}"
                    )
            
            return JsonResponse({
                'status': 'success',
                'message': 'Amostra validada com sucesso!',
                'todas_validadas': todas_validadas,
                'proxima_amostra': {
                    'existe': proxima_amostra is not None,
                    'id': proxima_amostra.id if proxima_amostra else None,
                    'ordem': proxima_amostra.ordem if proxima_amostra else None
                }
            })
            
        except RequisicaoAmostra.DoesNotExist:
            return JsonResponse(
                {'status': 'error', 'message': 'Amostra não encontrada.'},
                status=404
            )
        except Exception as e:
            logger.error(f"Erro ao salvar amostra: {str(e)}", exc_info=True)
            return JsonResponse(
                {'status': 'error', 'message': f'Erro ao salvar amostra: {str(e)}'},
                status=500
            )


@method_decorator(ratelimit(key='user', rate='30/m', method='POST'), name='dispatch')
class RejeitarRequisicaoView(LoginRequiredMixin, View):
    """
    Rejeita requisição alterando status para CAIXA BO/BARRADOS.
    
    POST /operacao/triagem/rejeitar-requisicao/
    
    Body:
        {
            "requisicao_id": 123,
            "status_rejeicao_id": 5
        }
    
    Response:
        {
            "status": "success",
            "message": "Requisição enviada para CAIXA BARRADOS"
        }
    """
    login_url = 'admin:login'
    
    def post(self, request):
        try:
            data = json.loads(request.body)
            requisicao_id = data.get('requisicao_id')
            status_rejeicao_id = data.get('status_rejeicao_id')
            
            if not requisicao_id or not status_rejeicao_id:
                return JsonResponse(
                    {'status': 'error', 'message': 'Dados incompletos.'},
                    status=400
                )
            
            # Buscar requisição
            requisicao = DadosRequisicao.objects.select_related('status').get(id=requisicao_id)
            
            # Buscar status
            status_rejeicao = StatusRequisicao.objects.get(id=status_rejeicao_id)
            
            # Alterar status
            status_anterior = requisicao.status
            requisicao.status = status_rejeicao
            requisicao.updated_by = request.user
            requisicao.save()
            
            # Registrar no histórico
            RequisicaoStatusHistorico.objects.create(
                requisicao=requisicao,
                cod_req=requisicao.cod_req,
                status=status_rejeicao,
                usuario=request.user,
                observacao=f'Rejeitada na triagem etapa 1. Status anterior: {status_anterior.descricao}'
            )
            
            logger.info(
                f"Requisição {requisicao.cod_req} rejeitada: "
                f"{status_anterior.descricao} → {status_rejeicao.descricao} "
                f"por {request.user.username}"
            )
            
            return JsonResponse({
                'status': 'success',
                'message': f'Requisição enviada para {status_rejeicao.descricao}'
            })
            
        except DadosRequisicao.DoesNotExist:
            return JsonResponse(
                {'status': 'error', 'message': 'Requisição não encontrada.'},
                status=404
            )
        except StatusRequisicao.DoesNotExist:
            return JsonResponse(
                {'status': 'error', 'message': 'Status de rejeição não encontrado.'},
                status=404
            )
        except Exception as e:
            logger.error(f"Erro ao rejeitar requisição: {str(e)}", exc_info=True)
            return JsonResponse(
                {'status': 'error', 'message': 'Erro ao rejeitar requisição.'},
                status=500
            )
