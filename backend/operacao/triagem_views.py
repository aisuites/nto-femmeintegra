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

from core.services.external_api import get_korus_client, get_receita_client, get_femme_client

from .models import (
    AmostraMotivoArmazenamentoInadequado,
    DadosRequisicao,
    LogAlteracaoAmostra,
    MotivoArmazenamentoInadequado,
    MotivoAlteracaoAmostra,
    RequisicaoAmostra,
    RequisicaoPendencia,
    RequisicaoStatusHistorico,
    StatusRequisicao,
    TipoAmostra,
    TipoPendencia,
    TipoPendenciaEtapa,
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
            ).select_related('requisicao', 'tipo_amostra').order_by('ordem')
            
            amostras_data = []
            for amostra in amostras:
                amostras_data.append({
                    'id': amostra.id,
                    'ordem': amostra.ordem,
                    'cod_barras_amostra': amostra.cod_barras_amostra,
                    'tipo_amostra_id': amostra.tipo_amostra_id,
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
            amostra.descricao = data.get('descricao', '')
            
            # Obter IDs dos motivos selecionados (array)
            motivos_ids = data.get('motivos_inadequados_ids', [])
            
            # VALIDAÇÕES
            erros = []
            
            # 1. Data de validade obrigatória APENAS SE flag "sem data de validade" NÃO estiver marcada
            # Se flag estiver marcada, segue como impeditivo (não bloqueia)
            if not amostra.data_validade and not amostra.flag_sem_data_validade:
                erros.append('Data de validade é obrigatória ou marque "Sem data de validade"')
            
            # 2. Se armazenamento inadequado, pelo menos um motivo é obrigatório
            if amostra.flag_armazenamento_inadequado and len(motivos_ids) == 0:
                erros.append('Selecione pelo menos um motivo de armazenamento inadequado')
            
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
                
                # Salvar motivos na tabela intermediária
                if amostra.flag_armazenamento_inadequado and motivos_ids:
                    # Remover motivos anteriores
                    AmostraMotivoArmazenamentoInadequado.objects.filter(amostra=amostra).delete()
                    # Criar novos registros
                    for motivo_id in motivos_ids:
                        AmostraMotivoArmazenamentoInadequado.objects.create(
                            amostra=amostra,
                            cod_barras=amostra.cod_barras_amostra,
                            motivo_id=motivo_id,
                            usuario=request.user
                        )
                
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
            
            # Salvar motivos na tabela intermediária (se houver)
            if amostra.flag_armazenamento_inadequado and motivos_ids:
                # Remover motivos anteriores
                AmostraMotivoArmazenamentoInadequado.objects.filter(amostra=amostra).delete()
                # Criar novos registros
                for motivo_id in motivos_ids:
                    AmostraMotivoArmazenamentoInadequado.objects.create(
                        amostra=amostra,
                        cod_barras=amostra.cod_barras_amostra,
                        motivo_id=motivo_id,
                        usuario=request.user
                    )
            
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


# ============================================
# TRIAGEM ETAPA 2 - CONFERÊNCIA DE PENDÊNCIAS
# ============================================

@method_decorator(ratelimit(key='user', rate='60/m', method='GET'), name='dispatch')
class ListarTiposPendenciaView(LoginRequiredMixin, View):
    """
    Lista tipos de pendência ativos para a Etapa 2 da triagem.
    
    GET /operacao/triagem/tipos-pendencia/
    
    Response:
        {
            "status": "success",
            "tipos": [
                {"id": 1, "codigo": 1, "descricao": "CPF EM BRANCO"},
                ...
            ]
        }
    """
    login_url = 'admin:login'
    
    def get(self, request):
        try:
            # Obter parâmetro de etapa (default: 2)
            etapa = request.GET.get('etapa', '2')
            try:
                etapa = int(etapa)
            except ValueError:
                etapa = 2
            
            # Buscar pendências configuradas para a etapa específica
            pendencias_etapa = TipoPendenciaEtapa.objects.filter(
                etapa=etapa,
                ativo=True,
                tipo_pendencia__ativo=True
            ).select_related('tipo_pendencia').order_by('ordem', 'tipo_pendencia__codigo')
            
            tipos = [
                {
                    'id': pe.tipo_pendencia.id,
                    'codigo': pe.tipo_pendencia.codigo,
                    'descricao': pe.tipo_pendencia.descricao,
                    'ordem': pe.ordem
                }
                for pe in pendencias_etapa
            ]
            
            return JsonResponse({
                'status': 'success',
                'etapa': etapa,
                'tipos': tipos
            })
            
        except Exception as e:
            logger.error(f"Erro ao listar tipos de pendência: {str(e)}", exc_info=True)
            return JsonResponse(
                {'status': 'error', 'message': 'Erro ao listar tipos de pendência.'},
                status=500
            )


@method_decorator(ratelimit(key='user', rate='30/m', method='POST'), name='dispatch')
class FinalizarTriagemView(LoginRequiredMixin, View):
    """
    Finaliza a triagem (Etapa 2) registrando pendências e atualizando status.
    
    POST /operacao/triagem/finalizar/
    
    Request:
        {
            "requisicao_id": 123,
            "pendencias": [
                {"tipo_pendencia_id": 1, "codigo": 1},
                {"tipo_pendencia_id": 2, "codigo": 2}
            ]
        }
    
    Response:
        {
            "status": "success",
            "message": "Triagem finalizada com sucesso!",
            "novo_status": "TRIAGEM2-OK" ou "PENDENTE"
        }
    """
    login_url = 'admin:login'
    
    def post(self, request):
        try:
            data = json.loads(request.body)
            requisicao_id = data.get('requisicao_id')
            pendencias = data.get('pendencias', [])
            
            if not requisicao_id:
                return JsonResponse(
                    {'status': 'error', 'message': 'ID da requisição não informado.'},
                    status=400
                )
            
            # Buscar requisição
            requisicao = DadosRequisicao.objects.select_related('status').get(id=requisicao_id)
            
            # Verificar se está no status correto (TRIAGEM1-OK = código 7)
            if requisicao.status.codigo != '7':
                return JsonResponse(
                    {'status': 'error', 'message': f'Requisição não está apta para etapa 2. Status atual: {requisicao.status.descricao}'},
                    status=400
                )
            
            status_anterior = requisicao.status
            
            # Determinar novo status baseado nas pendências
            if pendencias:
                # Tem pendências - status PENDÊNCIA (código 6)
                novo_status = StatusRequisicao.objects.get(codigo='6')
                status_msg = 'Triagem finalizada com pendências registradas.'
            else:
                # Sem pendências - status TRIAGEM2-OK (código 8)
                novo_status = StatusRequisicao.objects.get(codigo='8')
                status_msg = 'Triagem finalizada com sucesso!'
            
            # Registrar pendências (se houver)
            for pend in pendencias:
                tipo_pendencia_id = pend.get('tipo_pendencia_id')
                if tipo_pendencia_id:
                    tipo = TipoPendencia.objects.get(id=tipo_pendencia_id)
                    RequisicaoPendencia.objects.create(
                        requisicao=requisicao,
                        codigo_barras=requisicao.cod_barras_req,
                        tipo_pendencia=tipo,
                        usuario=request.user,
                        status='PENDENTE'
                    )
            
            # Atualizar status da requisição
            requisicao.status = novo_status
            requisicao.updated_by = request.user
            requisicao.save()
            
            # Registrar no histórico
            observacao = f'Triagem etapa 2 finalizada. Status anterior: {status_anterior.descricao}'
            if pendencias:
                observacao += f'. Pendências registradas: {len(pendencias)}'
            
            RequisicaoStatusHistorico.objects.create(
                requisicao=requisicao,
                cod_req=requisicao.cod_req,
                status=novo_status,
                usuario=request.user,
                observacao=observacao
            )
            
            logger.info(
                f"Triagem etapa 2 finalizada - Requisição {requisicao.cod_req}: "
                f"{status_anterior.descricao} → {novo_status.descricao} "
                f"({len(pendencias)} pendências) por {request.user.username}"
            )
            
            return JsonResponse({
                'status': 'success',
                'message': status_msg,
                'novo_status': novo_status.descricao,
                'pendencias_count': len(pendencias)
            })
            
        except DadosRequisicao.DoesNotExist:
            return JsonResponse(
                {'status': 'error', 'message': 'Requisição não encontrada.'},
                status=404
            )
        except StatusRequisicao.DoesNotExist:
            return JsonResponse(
                {'status': 'error', 'message': 'Status de destino não encontrado. Verifique a configuração do sistema.'},
                status=500
            )
        except TipoPendencia.DoesNotExist:
            return JsonResponse(
                {'status': 'error', 'message': 'Tipo de pendência não encontrado.'},
                status=400
            )
        except json.JSONDecodeError:
            return JsonResponse(
                {'status': 'error', 'message': 'Dados inválidos.'},
                status=400
            )
        except Exception as e:
            logger.error(f"Erro ao finalizar triagem: {str(e)}", exc_info=True)
            return JsonResponse(
                {'status': 'error', 'message': 'Erro ao finalizar triagem.'},
                status=500
            )


# ============================================
# TRIAGEM ETAPA 3 - CADASTRO
# ============================================

@method_decorator(ratelimit(key='user', rate='60/m', method='GET'), name='dispatch')
class ListarMotivosExclusaoAmostraView(LoginRequiredMixin, View):
    """
    Lista motivos de exclusão de amostra ativos.
    
    GET /operacao/triagem/motivos-exclusao-amostra/
    """
    login_url = 'admin:login'
    
    def get(self, request):
        try:
            tipo = request.GET.get('tipo', 'EXCLUSAO')
            motivos = MotivoAlteracaoAmostra.objects.filter(
                tipo=tipo,
                ativo=True
            ).values('id', 'codigo', 'descricao').order_by('codigo')
            
            return JsonResponse({
                'status': 'success',
                'motivos': list(motivos)
            })
            
        except Exception as e:
            logger.error(f"Erro ao listar motivos de alteração: {str(e)}", exc_info=True)
            return JsonResponse(
                {'status': 'error', 'message': 'Erro ao listar motivos.'},
                status=500
            )


@method_decorator(ratelimit(key='user', rate='60/m', method='GET'), name='dispatch')
class ListarTiposAmostraView(LoginRequiredMixin, View):
    """
    Lista tipos de amostra ativos para a Etapa 3 da triagem.
    
    GET /operacao/triagem/tipos-amostra/
    """
    login_url = 'admin:login'
    
    def get(self, request):
        try:
            tipos = TipoAmostra.objects.filter(
                ativo=True
            ).values('id', 'descricao').order_by('descricao')
            
            return JsonResponse({
                'status': 'success',
                'tipos': list(tipos)
            })
            
        except Exception as e:
            logger.error(f"Erro ao listar tipos de amostra: {str(e)}", exc_info=True)
            return JsonResponse(
                {'status': 'error', 'message': 'Erro ao listar tipos de amostra.'},
                status=500
            )


@method_decorator(ratelimit(key='user', rate='30/m', method='POST'), name='dispatch')
class AtualizarTipoAmostraView(LoginRequiredMixin, View):
    """
    Atualiza o tipo de amostra de uma amostra específica.
    
    POST /operacao/triagem/amostras/atualizar/
    """
    login_url = 'admin:login'
    
    def post(self, request):
        try:
            data = json.loads(request.body)
            amostra_id = data.get('amostra_id')
            tipo_amostra_id = data.get('tipo_amostra_id')
            
            if not amostra_id:
                return JsonResponse(
                    {'status': 'error', 'message': 'ID da amostra não informado.'},
                    status=400
                )
            
            amostra = RequisicaoAmostra.objects.get(id=amostra_id)
            
            if tipo_amostra_id:
                tipo = TipoAmostra.objects.get(id=tipo_amostra_id)
                amostra.tipo_amostra = tipo
            else:
                amostra.tipo_amostra = None
            
            amostra.updated_by = request.user
            amostra.save()
            
            logger.info(
                f"Tipo de amostra atualizado - Amostra {amostra.cod_barras_amostra}: "
                f"tipo_amostra_id={tipo_amostra_id} por {request.user.username}"
            )
            
            return JsonResponse({
                'status': 'success',
                'message': 'Tipo de amostra atualizado.'
            })
            
        except RequisicaoAmostra.DoesNotExist:
            return JsonResponse(
                {'status': 'error', 'message': 'Amostra não encontrada.'},
                status=404
            )
        except TipoAmostra.DoesNotExist:
            return JsonResponse(
                {'status': 'error', 'message': 'Tipo de amostra não encontrado.'},
                status=404
            )
        except json.JSONDecodeError:
            return JsonResponse(
                {'status': 'error', 'message': 'Dados inválidos.'},
                status=400
            )
        except Exception as e:
            logger.error(f"Erro ao atualizar tipo de amostra: {str(e)}", exc_info=True)
            return JsonResponse(
                {'status': 'error', 'message': 'Erro ao atualizar tipo de amostra.'},
                status=500
            )


@method_decorator(ratelimit(key='user', rate='20/m', method='POST'), name='dispatch')
class ExcluirAmostraView(LoginRequiredMixin, View):
    """
    Exclui uma amostra da requisição com registro de auditoria.
    
    POST /operacao/triagem/amostras/excluir/
    Body:
        {
            "amostra_id": 123,
            "motivo_exclusao_id": 1,
            "etapa": "TRIAGEM3"
        }
    """
    login_url = 'admin:login'
    
    def post(self, request):
        try:
            data = json.loads(request.body)
            amostra_id = data.get('amostra_id')
            motivo_exclusao_id = data.get('motivo_exclusao_id')
            etapa = data.get('etapa', 'TRIAGEM3')
            
            if not amostra_id:
                return JsonResponse(
                    {'status': 'error', 'message': 'ID da amostra não informado.'},
                    status=400
                )
            
            if not motivo_exclusao_id:
                return JsonResponse(
                    {'status': 'error', 'message': 'Motivo da exclusão é obrigatório.'},
                    status=400
                )
            
            # Buscar motivo de exclusão
            motivo = MotivoAlteracaoAmostra.objects.get(id=motivo_exclusao_id, tipo='EXCLUSAO', ativo=True)
            
            amostra = RequisicaoAmostra.objects.select_related('requisicao').get(id=amostra_id)
            cod_barras_amostra = amostra.cod_barras_amostra
            ordem_amostra = amostra.ordem
            requisicao = amostra.requisicao
            
            # Registrar log de auditoria ANTES de excluir
            LogAlteracaoAmostra.objects.create(
                requisicao=requisicao,
                cod_barras_requisicao=requisicao.cod_barras_req,
                cod_barras_amostra=cod_barras_amostra,
                ordem_amostra=ordem_amostra,
                tipo_alteracao=LogAlteracaoAmostra.TipoAlteracao.EXCLUSAO,
                etapa=etapa,
                usuario=request.user,
                motivo=motivo,
                observacao=f'Frasco {ordem_amostra} - Motivo: {motivo.descricao}'
            )
            
            # Excluir amostra
            amostra.delete()
            
            logger.info(
                f"Amostra excluída - Código: {cod_barras_amostra}, Frasco: {ordem_amostra}, "
                f"Requisição: {requisicao.cod_req}, Motivo: {motivo.descricao}, "
                f"Etapa: {etapa} por {request.user.username}"
            )
            
            return JsonResponse({
                'status': 'success',
                'message': 'Amostra excluída com sucesso.'
            })
            
        except MotivoAlteracaoAmostra.DoesNotExist:
            return JsonResponse(
                {'status': 'error', 'message': 'Motivo de exclusão não encontrado.'},
                status=404
            )
        except RequisicaoAmostra.DoesNotExist:
            return JsonResponse(
                {'status': 'error', 'message': 'Amostra não encontrada.'},
                status=404
            )
        except json.JSONDecodeError:
            return JsonResponse(
                {'status': 'error', 'message': 'Dados inválidos.'},
                status=400
            )
        except Exception as e:
            logger.error(f"Erro ao excluir amostra: {str(e)}", exc_info=True)
            return JsonResponse(
                {'status': 'error', 'message': 'Erro ao excluir amostra.'},
                status=500
            )


@method_decorator(ratelimit(key='user', rate='20/m', method='POST'), name='dispatch')
class AdicionarAmostraView(LoginRequiredMixin, View):
    """
    Adiciona uma nova amostra à requisição com registro de auditoria.
    REGRA DE NEGÓCIO: O código de barras da amostra DEVE ser igual ao código de barras da requisição.
    
    POST /operacao/triagem/amostras/adicionar/
    Body:
        {
            "requisicao_id": 123,
            "cod_barras_amostra": "ABC123",
            "motivo_adicao_id": 1,
            "etapa": "TRIAGEM3"
        }
    """
    login_url = 'admin:login'
    
    def post(self, request):
        try:
            data = json.loads(request.body)
            requisicao_id = data.get('requisicao_id')
            cod_barras_amostra = data.get('cod_barras_amostra', '').strip()
            motivo_adicao_id = data.get('motivo_adicao_id')
            etapa = data.get('etapa', 'TRIAGEM3')
            
            if not requisicao_id:
                return JsonResponse(
                    {'status': 'error', 'message': 'ID da requisição não informado.'},
                    status=400
                )
            
            if not cod_barras_amostra:
                return JsonResponse(
                    {'status': 'error', 'message': 'Código de barras da amostra não informado.'},
                    status=400
                )
            
            if not motivo_adicao_id:
                return JsonResponse(
                    {'status': 'error', 'message': 'Motivo da adição é obrigatório.'},
                    status=400
                )
            
            # Buscar motivo de adição
            motivo = MotivoAlteracaoAmostra.objects.get(id=motivo_adicao_id, tipo='ADICAO', ativo=True)
            
            requisicao = DadosRequisicao.objects.get(id=requisicao_id)
            
            # REGRA DE NEGÓCIO: Código de barras da amostra DEVE ser igual ao da requisição
            if cod_barras_amostra != requisicao.cod_barras_req:
                return JsonResponse(
                    {
                        'status': 'error',
                        'message': f'O código de barras da amostra deve ser igual ao código de barras da requisição ({requisicao.cod_barras_req}).',
                        'codigo_esperado': requisicao.cod_barras_req,
                        'codigo_informado': cod_barras_amostra
                    },
                    status=400
                )
            
            # Determinar próxima ordem
            ultima_ordem = RequisicaoAmostra.objects.filter(
                requisicao=requisicao
            ).order_by('-ordem').values_list('ordem', flat=True).first() or 0
            
            # Criar nova amostra
            nova_amostra = RequisicaoAmostra.objects.create(
                requisicao=requisicao,
                cod_barras_amostra=cod_barras_amostra,
                data_hora_bipagem=timezone.now(),
                ordem=ultima_ordem + 1,
                triagem1_validada=True,  # Já validada pois está na etapa 3
            )
            
            # Registrar log de auditoria
            LogAlteracaoAmostra.objects.create(
                requisicao=requisicao,
                cod_barras_requisicao=requisicao.cod_barras_req,
                cod_barras_amostra=cod_barras_amostra,
                ordem_amostra=nova_amostra.ordem,
                tipo_alteracao=LogAlteracaoAmostra.TipoAlteracao.ADICAO,
                etapa=etapa,
                usuario=request.user,
                motivo=motivo,
                observacao=f'Frasco {nova_amostra.ordem} - Motivo: {motivo.descricao}'
            )
            
            logger.info(
                f"Amostra adicionada - Código: {cod_barras_amostra}, "
                f"Requisição: {requisicao.cod_req}, Ordem: {nova_amostra.ordem}, "
                f"Motivo: {motivo.descricao}, Etapa: {etapa} por {request.user.username}"
            )
            
            return JsonResponse({
                'status': 'success',
                'message': 'Amostra adicionada com sucesso.',
                'amostra': {
                    'id': nova_amostra.id,
                    'cod_barras_amostra': nova_amostra.cod_barras_amostra,
                    'ordem': nova_amostra.ordem
                }
            })
            
        except MotivoAlteracaoAmostra.DoesNotExist:
            return JsonResponse(
                {'status': 'error', 'message': 'Motivo de adição não encontrado.'},
                status=404
            )
        except DadosRequisicao.DoesNotExist:
            return JsonResponse(
                {'status': 'error', 'message': 'Requisição não encontrada.'},
                status=404
            )
        except json.JSONDecodeError:
            return JsonResponse(
                {'status': 'error', 'message': 'Dados inválidos.'},
                status=400
            )
        except Exception as e:
            logger.error(f"Erro ao adicionar amostra: {str(e)}", exc_info=True)
            return JsonResponse(
                {'status': 'error', 'message': 'Erro ao adicionar amostra.'},
                status=500
            )


@method_decorator(ratelimit(key='user', rate='20/m', method='POST'), name='dispatch')
class CadastrarRequisicaoView(LoginRequiredMixin, View):
    """
    Finaliza a Etapa 3 - Cadastra a requisição ou envia para pendências.
    
    POST /operacao/triagem/cadastrar/
    Body:
        {
            "requisicao_id": 123,
            "cpf_paciente": "12345678901",
            "nome_paciente": "Nome",
            "crm": "12345",
            "uf_crm": "SP",
            "nome_medico": "Dr. Nome",
            "end_medico": "Endereço",
            "dest_medico": "INTERNET",
            "flag_problema_cpf": false,
            "flag_problema_medico": false,
            "enviar_para_pendencia": false
        }
    """
    login_url = 'admin:login'
    
    def post(self, request):
        try:
            data = json.loads(request.body)
            requisicao_id = data.get('requisicao_id')
            
            if not requisicao_id:
                return JsonResponse(
                    {'status': 'error', 'message': 'ID da requisição não informado.'},
                    status=400
                )
            
            requisicao = DadosRequisicao.objects.select_related('status').get(id=requisicao_id)
            
            # Verificar se está no status correto (TRIAGEM2-OK = código 8)
            if requisicao.status.codigo != '8':
                return JsonResponse(
                    {'status': 'error', 'message': f'Requisição não está apta para cadastro. Status atual: {requisicao.status.descricao}'},
                    status=400
                )
            
            # Verificar flags de problema
            flag_problema_cpf = data.get('flag_problema_cpf', False)
            flag_problema_medico = data.get('flag_problema_medico', False)
            enviar_para_pendencia = data.get('enviar_para_pendencia', False)
            
            # Se há problemas mas não foi confirmado envio para pendência
            if (flag_problema_cpf or flag_problema_medico) and not enviar_para_pendencia:
                return JsonResponse(
                    {'status': 'error', 'message': 'Confirme o envio para fila de pendências.'},
                    status=400
                )
            
            status_anterior = requisicao.status
            
            # Atualizar dados da requisição
            requisicao.cpf_paciente = data.get('cpf_paciente', '')
            requisicao.nome_paciente = data.get('nome_paciente', '')
            requisicao.crm = data.get('crm', '')
            requisicao.uf_crm = data.get('uf_crm', '')
            requisicao.nome_medico = data.get('nome_medico', '')
            requisicao.end_medico = data.get('end_medico', '')
            requisicao.dest_medico = data.get('dest_medico', '')
            requisicao.flag_problema_cpf = flag_problema_cpf
            requisicao.flag_problema_medico = flag_problema_medico
            
            # Determinar novo status
            if flag_problema_cpf or flag_problema_medico:
                # Enviar para PENDÊNCIA (código 6)
                novo_status = StatusRequisicao.objects.get(codigo='6')
                mensagem = 'Requisição enviada para fila de pendências!'
                
                # Criar registros de pendência
                if flag_problema_cpf:
                    tipo_pend_cpf = TipoPendencia.objects.get(codigo=17)  # CPF em branco ou inválido
                    RequisicaoPendencia.objects.get_or_create(
                        requisicao=requisicao,
                        tipo_pendencia=tipo_pend_cpf,
                        defaults={
                            'codigo_barras': requisicao.cod_barras_req,
                            'usuario': request.user,
                            'status': 'PENDENTE'
                        }
                    )
                
                if flag_problema_medico:
                    tipo_pend_medico = TipoPendencia.objects.get(codigo=18)  # Dados médico incompletos
                    RequisicaoPendencia.objects.get_or_create(
                        requisicao=requisicao,
                        tipo_pendencia=tipo_pend_medico,
                        defaults={
                            'codigo_barras': requisicao.cod_barras_req,
                            'usuario': request.user,
                            'status': 'PENDENTE'
                        }
                    )
            else:
                # Cadastrar normalmente - CADASTRADA (código 12)
                novo_status = StatusRequisicao.objects.get(codigo='12')
                mensagem = 'Requisição cadastrada com sucesso!'
            
            requisicao.status = novo_status
            requisicao.updated_by = request.user
            requisicao.save()
            
            # Registrar no histórico
            observacao = 'Requisição cadastrada na etapa 3.'
            if flag_problema_cpf or flag_problema_medico:
                pendencias = []
                if flag_problema_cpf:
                    pendencias.append('CPF')
                if flag_problema_medico:
                    pendencias.append('Dados médico')
                observacao = f'Requisição enviada para pendências: {", ".join(pendencias)}.'
            
            RequisicaoStatusHistorico.objects.create(
                requisicao=requisicao,
                cod_req=requisicao.cod_req,
                status=novo_status,
                usuario=request.user,
                observacao=f'{observacao} Status anterior: {status_anterior.descricao}'
            )
            
            logger.info(
                f"Requisição processada - {requisicao.cod_req}: "
                f"{status_anterior.descricao} → {novo_status.descricao} "
                f"por {request.user.username}"
            )
            
            return JsonResponse({
                'status': 'success',
                'message': mensagem,
                'novo_status': novo_status.descricao
            })
            
        except DadosRequisicao.DoesNotExist:
            return JsonResponse(
                {'status': 'error', 'message': 'Requisição não encontrada.'},
                status=404
            )
        except StatusRequisicao.DoesNotExist:
            return JsonResponse(
                {'status': 'error', 'message': 'Status CADASTRADA não encontrado. Verifique a configuração do sistema.'},
                status=500
            )
        except json.JSONDecodeError:
            return JsonResponse(
                {'status': 'error', 'message': 'Dados inválidos.'},
                status=400
            )
        except Exception as e:
            logger.error(f"Erro ao cadastrar requisição: {str(e)}", exc_info=True)
            return JsonResponse(
                {'status': 'error', 'message': 'Erro ao cadastrar requisição.'},
                status=500
            )


@method_decorator(ratelimit(key='user', rate='30/m', method='GET'), name='dispatch')
class ConsultarCPFKorusView(LoginRequiredMixin, View):
    """
    Consulta dados de paciente por CPF na API Korus.
    
    GET /operacao/triagem/consultar-cpf-korus/?cpf=12345678900&requisicao_id=123
    
    Response (sucesso):
        {
            "status": "success",
            "paciente": {
                "nome": "MARIA DA SILVA",
                "data_nascimento": "1990-01-15",
                "email": "maria@email.com",
                "sexo": "F",
                "matricula": "123456",
                "convenio": "UNIMED",
                "plano": "NACIONAL"
            }
        }
    
    Response (erro):
        {
            "status": "error",
            "message": "CPF não encontrado na base FEMME."
        }
    """
    login_url = 'admin:login'
    
    def get(self, request, *args, **kwargs):
        cpf = request.GET.get('cpf', '').strip()
        requisicao_id = request.GET.get('requisicao_id')
        
        if not cpf:
            return JsonResponse(
                {'status': 'error', 'message': 'CPF não informado.'},
                status=400
            )
        
        # ZERAR campos ANTES de consultar API (evita mistura de dados antigos)
        # Nota: alguns campos não permitem NULL, então usamos string vazia
        if requisicao_id:
            try:
                requisicao = DadosRequisicao.objects.get(id=requisicao_id)
                cpf_formatado = cpf.replace('.', '').replace('-', '').strip()
                requisicao.cpf_paciente = cpf_formatado
                requisicao.nome_paciente = ''  # null=False, usar string vazia
                requisicao.data_nasc_paciente = None  # null=True, pode ser None
                requisicao.sexo_paciente = ''  # null=False
                requisicao.email_paciente = ''  # null=False
                requisicao.matricula_paciente = ''  # null=False
                requisicao.convenio_paciente = ''  # null=False
                requisicao.plano_paciente = ''  # null=False
                requisicao.updated_by = request.user
                requisicao.save()
                logger.info(f"Campos do paciente zerados antes de consultar API - Requisição ID: {requisicao_id}")
            except DadosRequisicao.DoesNotExist:
                logger.warning(f"Requisição {requisicao_id} não encontrada para zerar campos")
            except Exception as e:
                logger.error(f"Erro ao zerar campos do paciente: {str(e)}", exc_info=True)
        
        try:
            # Consultar API Korus
            korus_client = get_korus_client()
            response = korus_client.buscar_paciente_por_cpf(cpf)
            
            if not response.success:
                error_msg = response.error or 'Erro ao consultar CPF.'
                logger.warning(f"Erro na consulta CPF Korus: {error_msg}")
                return JsonResponse(
                    {'status': 'error', 'message': error_msg},
                    status=404 if 'não encontrado' in error_msg.lower() else 500
                )
        except Exception as e:
            logger.error(f"Exceção ao consultar API Korus: {str(e)}", exc_info=True)
            return JsonResponse(
                {'status': 'error', 'message': 'Erro ao conectar com a API externa. Tente novamente.'},
                status=500
            )
        
        # Extrair dados do paciente da resposta
        # A estrutura pode variar, então tratamos diferentes formatos
        dados_api = response.data
        
        # Log para debug - ver estrutura real da resposta
        logger.info(f"Resposta API Korus (tipo={type(dados_api).__name__}): {dados_api}")
        
        # Se for lista, pegar primeiro item
        if isinstance(dados_api, list) and len(dados_api) > 0:
            dados_api = dados_api[0]
            logger.info(f"Primeiro item da lista: {dados_api}")
        
        # Mapear campos da API Korus para nosso formato
        # Estrutura real: pessoaFisica contém nome, cpf, dataNascimento, sexo
        # contato contém email
        # campos raiz: matricula, convenio, plano
        pessoa_fisica = dados_api.get('pessoaFisica', {}) or {}
        contato = dados_api.get('contato', {}) or {}
        
        paciente = {
            'nome': pessoa_fisica.get('nome', '') or '',
            'data_nascimento': pessoa_fisica.get('dataNascimento', '') or '',
            'email': contato.get('email', '') or '',
            'sexo': pessoa_fisica.get('sexo', '') or '',
            'matricula': dados_api.get('matricula', '') or '',
            'convenio': dados_api.get('convenio', '') or '',
            'plano': dados_api.get('plano', '') or '',
        }
        
        logger.info(f"Dados mapeados do paciente: {paciente}")
        
        # Se requisicao_id foi informado, atualizar com dados da API (campos já foram zerados antes)
        if requisicao_id:
            try:
                requisicao = DadosRequisicao.objects.get(id=requisicao_id)
                
                # Atualizar campos do paciente com dados da API
                if paciente['nome']:
                    requisicao.nome_paciente = paciente['nome']
                if paciente['data_nascimento']:
                    # Converter data se necessário
                    try:
                        from datetime import datetime
                        if isinstance(paciente['data_nascimento'], str):
                            # Tentar diferentes formatos
                            for fmt in ['%Y-%m-%d', '%d/%m/%Y', '%Y-%m-%dT%H:%M:%S']:
                                try:
                                    requisicao.data_nasc_paciente = datetime.strptime(
                                        paciente['data_nascimento'].split('T')[0], 
                                        fmt.split('T')[0]
                                    ).date()
                                    break
                                except ValueError:
                                    continue
                    except Exception as e:
                        logger.warning(f"Erro ao converter data de nascimento: {e}")
                if paciente['email']:
                    requisicao.email_paciente = paciente['email']
                if paciente['sexo']:
                    requisicao.sexo_paciente = paciente['sexo']
                if paciente['matricula']:
                    requisicao.matricula_paciente = paciente['matricula']
                if paciente['convenio']:
                    requisicao.convenio_paciente = paciente['convenio']
                if paciente['plano']:
                    requisicao.plano_paciente = paciente['plano']
                
                requisicao.updated_by = request.user
                requisicao.save()
                
                logger.info(
                    f"Dados do paciente atualizados via Korus - Requisição: {requisicao.cod_req}, "
                    f"CPF: {cpf[:3]}***{cpf[-2:]}, Usuário: {request.user.username}"
                )
                
            except DadosRequisicao.DoesNotExist:
                logger.warning(f"Requisição {requisicao_id} não encontrada para atualização")
            except Exception as e:
                logger.error(f"Erro ao salvar dados do paciente: {str(e)}", exc_info=True)
        
        return JsonResponse({
            'status': 'success',
            'paciente': paciente
        })


@method_decorator(ratelimit(key='user', rate='30/m', method='GET'), name='dispatch')
class ConsultarCPFReceitaView(LoginRequiredMixin, View):
    """
    Consulta dados de CPF na Receita Federal (via Hub do Desenvolvedor).
    
    GET /operacao/triagem/consultar-cpf-receita/?cpf=12345678900&requisicao_id=123
    
    Response (sucesso):
        {
            "status": "success",
            "paciente": {
                "nome": "NOME DA PESSOA",
                "data_nascimento": "26/08/1939",
                "situacao_cadastral": "REGULAR"
            }
        }
    
    Response (erro):
        {
            "status": "error",
            "message": "CPF não encontrado na Receita Federal."
        }
    """
    login_url = 'admin:login'
    
    def get(self, request, *args, **kwargs):
        cpf = request.GET.get('cpf', '').strip()
        requisicao_id = request.GET.get('requisicao_id')
        
        if not cpf:
            return JsonResponse(
                {'status': 'error', 'message': 'CPF não informado.'},
                status=400
            )
        
        # ZERAR campos ANTES de consultar API (evita mistura de dados antigos)
        # Nota: alguns campos não permitem NULL, então usamos string vazia
        if requisicao_id:
            try:
                requisicao = DadosRequisicao.objects.get(id=requisicao_id)
                cpf_formatado = cpf.replace('.', '').replace('-', '').strip()
                requisicao.cpf_paciente = cpf_formatado
                requisicao.nome_paciente = ''  # null=False, usar string vazia
                requisicao.data_nasc_paciente = None  # null=True, pode ser None
                requisicao.sexo_paciente = ''  # null=False
                requisicao.email_paciente = ''  # null=False
                requisicao.matricula_paciente = ''  # null=False
                requisicao.convenio_paciente = ''  # null=False
                requisicao.plano_paciente = ''  # null=False
                requisicao.updated_by = request.user
                requisicao.save()
                logger.info(f"Campos do paciente zerados antes de consultar API Receita - Requisição ID: {requisicao_id}")
            except DadosRequisicao.DoesNotExist:
                logger.warning(f"Requisição {requisicao_id} não encontrada para zerar campos")
            except Exception as e:
                logger.error(f"Erro ao zerar campos do paciente: {str(e)}", exc_info=True)
        
        try:
            # Consultar API Receita
            receita_client = get_receita_client()
            response = receita_client.buscar_cpf(cpf)
            
            if not response.success:
                error_msg = response.error or 'Erro ao consultar CPF.'
                logger.warning(f"Erro na consulta CPF Receita: {error_msg}")
                return JsonResponse(
                    {'status': 'error', 'message': error_msg},
                    status=404 if 'não encontrado' in error_msg.lower() else 500
                )
        except Exception as e:
            logger.error(f"Exceção ao consultar API Receita: {str(e)}", exc_info=True)
            return JsonResponse(
                {'status': 'error', 'message': 'Erro ao conectar com a API externa. Tente novamente.'},
                status=500
            )
        
        # Extrair dados do CPF da resposta
        dados_api = response.data
        
        # Log para debug
        logger.info(f"Resposta API Receita: {dados_api}")
        
        # Mapear campos da API Receita para nosso formato
        # Campos disponíveis: nome_da_pf, data_nascimento, situacao_cadastral
        paciente = {
            'nome': dados_api.get('nome_da_pf', '') or '',
            'data_nascimento': dados_api.get('data_nascimento', '') or '',
            'situacao_cadastral': dados_api.get('situacao_cadastral', '') or '',
        }
        
        logger.info(f"Dados mapeados do paciente (Receita): {paciente}")
        
        # Se requisicao_id foi informado, atualizar com dados da API (campos já foram zerados antes)
        if requisicao_id:
            try:
                requisicao = DadosRequisicao.objects.get(id=requisicao_id)
                
                # Atualizar campos do paciente com dados da API
                if paciente['nome']:
                    requisicao.nome_paciente = paciente['nome']
                if paciente['data_nascimento']:
                    # Converter data de DD/MM/YYYY para date
                    try:
                        from datetime import datetime
                        if isinstance(paciente['data_nascimento'], str):
                            # Formato esperado: DD/MM/YYYY
                            data_str = paciente['data_nascimento'].replace('\\/', '/')
                            requisicao.data_nasc_paciente = datetime.strptime(
                                data_str, '%d/%m/%Y'
                            ).date()
                    except Exception as e:
                        logger.warning(f"Erro ao converter data de nascimento: {e}")
                
                # Nota: API Receita não retorna sexo, email, matricula, convenio, plano
                # Esses campos permanecem vazios
                
                requisicao.updated_by = request.user
                requisicao.save()
                
                logger.info(
                    f"Dados do paciente atualizados via Receita - Requisição: {requisicao.cod_req}, "
                    f"CPF: {cpf[:3]}***{cpf[-2:]}, Usuário: {request.user.username}"
                )
                
            except DadosRequisicao.DoesNotExist:
                logger.warning(f"Requisição {requisicao_id} não encontrada para atualização")
            except Exception as e:
                logger.error(f"Erro ao salvar dados do paciente: {str(e)}", exc_info=True)
        
        return JsonResponse({
            'status': 'success',
            'paciente': paciente
        })


@method_decorator(ratelimit(key='user', rate='30/m', method='GET'), name='dispatch')
class ValidarMedicoView(LoginRequiredMixin, View):
    """
    Valida médico por CRM e UF na API FEMME.
    
    GET /operacao/triagem/validar-medico/?crm=XXX&uf_crm=YY
    
    Response (sucesso):
        {
            "status": "success",
            "medicos": [...],
            "total": 1 ou mais
        }
    
    Response (erro):
        {
            "status": "error",
            "message": "Médico não encontrado."
        }
    """
    login_url = 'admin:login'
    
    def get(self, request, *args, **kwargs):
        crm = request.GET.get('crm', '').strip()
        uf_crm = request.GET.get('uf_crm', '').strip()
        
        if not crm:
            return JsonResponse(
                {'status': 'error', 'message': 'CRM não informado.'},
                status=400
            )
        
        if not uf_crm:
            return JsonResponse(
                {'status': 'error', 'message': 'UF do CRM não informada.'},
                status=400
            )
        
        try:
            # Consultar API FEMME
            femme_client = get_femme_client()
            response = femme_client.buscar_medico(crm, uf_crm)
            
            if not response.success:
                error_msg = response.error or 'Erro ao consultar médico.'
                logger.warning(f"Erro na consulta médico FEMME: {error_msg}")
                return JsonResponse(
                    {'status': 'error', 'message': error_msg},
                    status=404 if 'não encontrado' in error_msg.lower() else 500
                )
        except Exception as e:
            logger.error(f"Exceção ao consultar API FEMME: {str(e)}", exc_info=True)
            return JsonResponse(
                {'status': 'error', 'message': 'Erro ao conectar com a API externa. Tente novamente.'},
                status=500
            )
        
        # Extrair lista de médicos
        medicos = response.data
        
        # Log para debug
        logger.info(f"Médicos encontrados: {len(medicos)} registro(s)")
        
        # Mapear campos para formato simplificado
        medicos_formatados = []
        for med in medicos:
            medicos_formatados.append({
                'id_medico': med.get('id_medico', ''),
                'nome_medico': med.get('nome_medico', ''),
                'crm': med.get('crm', ''),
                'uf_crm': med.get('uf_crm', '').upper(),
                'endereco': med.get('logradouro', ''),  # Apenas logradouro conforme solicitado
                'destino': med.get('destino', ''),
            })
        
        return JsonResponse({
            'status': 'success',
            'medicos': medicos_formatados,
            'total': len(medicos_formatados)
        })


@method_decorator(ratelimit(key='user', rate='30/m', method='POST'), name='dispatch')
class SalvarMedicoView(LoginRequiredMixin, View):
    """
    Salva dados do médico selecionado na requisição.
    
    POST /operacao/triagem/salvar-medico/
    Body: {
        "requisicao_id": 123,
        "nome_medico": "NOME DO MÉDICO",
        "endereco_medico": "LOGRADOURO",
        "destino_medico": "INTERNET",
        "crm": "123456",
        "uf_crm": "SP"
    }
    """
    login_url = 'admin:login'
    
    def post(self, request, *args, **kwargs):
        try:
            data = json.loads(request.body)
        except json.JSONDecodeError:
            return JsonResponse(
                {'status': 'error', 'message': 'JSON inválido.'},
                status=400
            )
        
        requisicao_id = data.get('requisicao_id')
        nome_medico = data.get('nome_medico', '').strip()
        endereco_medico = data.get('endereco_medico', '').strip()
        destino_medico = data.get('destino_medico', '').strip()
        crm = data.get('crm', '').strip()
        uf_crm = data.get('uf_crm', '').strip().upper()
        
        if not requisicao_id:
            return JsonResponse(
                {'status': 'error', 'message': 'ID da requisição não informado.'},
                status=400
            )
        
        try:
            requisicao = DadosRequisicao.objects.get(id=requisicao_id)
            
            # Atualizar campos do médico
            requisicao.crm = crm
            requisicao.uf_crm = uf_crm
            requisicao.nome_medico = nome_medico
            requisicao.end_medico = endereco_medico
            requisicao.dest_medico = destino_medico
            requisicao.updated_by = request.user
            requisicao.save()
            
            logger.info(
                f"Dados do médico salvos - Requisição: {requisicao.cod_req}, "
                f"CRM: {crm}-{uf_crm}, Médico: {nome_medico[:30] if nome_medico else 'N/A'}..., "
                f"Usuário: {request.user.username}"
            )
            
            return JsonResponse({
                'status': 'success',
                'message': 'Dados do médico salvos com sucesso.'
            })
            
        except DadosRequisicao.DoesNotExist:
            logger.warning(f"Requisição {requisicao_id} não encontrada para salvar médico")
            return JsonResponse(
                {'status': 'error', 'message': 'Requisição não encontrada.'},
                status=404
            )
        except Exception as e:
            logger.error(f"Erro ao salvar dados do médico: {str(e)}", exc_info=True)
            return JsonResponse(
                {'status': 'error', 'message': 'Erro ao salvar dados do médico.'},
                status=500
            )


@method_decorator(ratelimit(key='user', rate='30/m', method='GET'), name='dispatch')
class VisualizarEtapaView(LoginRequiredMixin, View):
    """
    Retorna dados de uma etapa anterior para visualização (somente leitura).
    
    GET /operacao/triagem/visualizar-etapa/?requisicao_id=123&etapa=1
    """
    login_url = 'admin:login'
    
    def get(self, request):
        requisicao_id = request.GET.get('requisicao_id')
        etapa = request.GET.get('etapa')
        
        if not requisicao_id or not etapa:
            return JsonResponse(
                {'status': 'error', 'message': 'Parâmetros obrigatórios: requisicao_id e etapa.'},
                status=400
            )
        
        try:
            etapa = int(etapa)
            requisicao = DadosRequisicao.objects.select_related('status').get(id=requisicao_id)
            
            if etapa == 1:
                # Dados da Etapa 1: amostras e suas validações
                amostras = RequisicaoAmostra.objects.filter(
                    requisicao=requisicao
                ).select_related('tipo_amostra').order_by('ordem')
                
                # Buscar amostras excluídas do log
                amostras_excluidas = LogAlteracaoAmostra.objects.filter(
                    requisicao=requisicao,
                    tipo_alteracao=LogAlteracaoAmostra.TipoAlteracao.EXCLUSAO
                ).select_related('motivo', 'usuario').order_by('created_at')
                
                amostras_data = []
                for amostra in amostras:
                    amostras_data.append({
                        'id': amostra.id,
                        'ordem': amostra.ordem,
                        'cod_barras': amostra.cod_barras_amostra,
                        'validada': amostra.triagem1_validada,
                        'data_coleta': amostra.data_coleta.isoformat() if amostra.data_coleta else None,
                        'data_validade': amostra.data_validade.isoformat() if amostra.data_validade else None,
                        'flag_data_coleta_rasurada': amostra.flag_data_coleta_rasurada,
                        'flag_sem_data_validade': amostra.flag_sem_data_validade,
                    })
                
                excluidas_data = []
                for log in amostras_excluidas:
                    excluidas_data.append({
                        'cod_barras': log.cod_barras_amostra,
                        'ordem': log.ordem_amostra,
                        'motivo': log.motivo.descricao if log.motivo else 'Não informado',
                        'data': log.created_at.strftime('%d/%m/%Y %H:%M'),
                        'usuario': log.usuario.get_full_name() or log.usuario.username if log.usuario else 'N/A',
                    })
                
                return JsonResponse({
                    'status': 'success',
                    'etapa': 1,
                    'amostras': amostras_data,
                    'amostras_excluidas': excluidas_data,
                })
            
            elif etapa == 2:
                # Dados da Etapa 2: pendências (se houver)
                pendencias = RequisicaoPendencia.objects.filter(
                    requisicao=requisicao
                ).select_related('tipo_pendencia')
                
                pendencias_data = []
                for p in pendencias:
                    pendencias_data.append({
                        'id': p.id,
                        'tipo': p.tipo_pendencia.descricao if p.tipo_pendencia else 'N/A',
                        'observacao': p.observacao or '',
                    })
                
                return JsonResponse({
                    'status': 'success',
                    'etapa': 2,
                    'pendencias': pendencias_data,
                    'tem_pendencias': len(pendencias_data) > 0,
                })
            
            else:
                return JsonResponse(
                    {'status': 'error', 'message': 'Etapa inválida. Use 1 ou 2.'},
                    status=400
                )
                
        except DadosRequisicao.DoesNotExist:
            return JsonResponse(
                {'status': 'error', 'message': 'Requisição não encontrada.'},
                status=404
            )
        except Exception as e:
            logger.error(f"Erro ao visualizar etapa: {str(e)}", exc_info=True)
            return JsonResponse(
                {'status': 'error', 'message': 'Erro ao carregar dados da etapa.'},
                status=500
            )


@method_decorator(ratelimit(key='user', rate='10/m', method='POST'), name='dispatch')
class RetornarEtapaView(LoginRequiredMixin, View):
    """
    Retorna a requisição para uma etapa anterior, zerando dados necessários.
    
    POST /operacao/triagem/retornar-etapa/
    Body: {
        "requisicao_id": 123,
        "etapa_destino": 1  // 1 ou 2
    }
    """
    login_url = 'admin:login'
    
    def post(self, request):
        try:
            data = json.loads(request.body)
        except json.JSONDecodeError:
            return JsonResponse(
                {'status': 'error', 'message': 'JSON inválido.'},
                status=400
            )
        
        requisicao_id = data.get('requisicao_id')
        etapa_destino = data.get('etapa_destino')
        
        if not requisicao_id or not etapa_destino:
            return JsonResponse(
                {'status': 'error', 'message': 'Parâmetros obrigatórios: requisicao_id e etapa_destino.'},
                status=400
            )
        
        try:
            etapa_destino = int(etapa_destino)
            requisicao = DadosRequisicao.objects.select_related('status').get(id=requisicao_id)
            status_atual = requisicao.status.codigo
            
            # Validar se pode retornar
            if status_atual not in ['7', '8']:
                return JsonResponse(
                    {'status': 'error', 'message': 'Requisição não está em etapa que permita retorno.'},
                    status=400
                )
            
            if etapa_destino == 1:
                # Retornar para Etapa 1 (Status 2 - RECEBIDO)
                novo_status = StatusRequisicao.objects.get(codigo='2')
                observacao = "Retorno para Etapa 1 - Correção de amostras"
                
                # Zerar validação das amostras (para serem reavaliadas)
                RequisicaoAmostra.objects.filter(requisicao=requisicao).update(
                    triagem1_validada=False
                )
                
            elif etapa_destino == 2:
                # Retornar para Etapa 2 (Status 7 - TRIAGEM1-OK)
                if status_atual != '8':
                    return JsonResponse(
                        {'status': 'error', 'message': 'Só é possível voltar para Etapa 2 a partir da Etapa 3.'},
                        status=400
                    )
                novo_status = StatusRequisicao.objects.get(codigo='7')
                observacao = "Retorno para Etapa 2 - Identificação de pendência"
                
            else:
                return JsonResponse(
                    {'status': 'error', 'message': 'Etapa destino inválida. Use 1 ou 2.'},
                    status=400
                )
            
            # Atualizar status da requisição
            requisicao.status = novo_status
            requisicao.updated_by = request.user
            requisicao.save()
            
            # Registrar no histórico de status
            RequisicaoStatusHistorico.objects.create(
                requisicao=requisicao,
                cod_req=requisicao.cod_req,
                status=novo_status,
                usuario=request.user,
                observacao=observacao
            )
            
            logger.info(
                f"Retorno de etapa - Requisição: {requisicao.cod_req}, "
                f"De: {status_atual} Para: {novo_status.codigo}, "
                f"Usuário: {request.user.username}"
            )
            
            return JsonResponse({
                'status': 'success',
                'message': f'Requisição retornada para Etapa {etapa_destino}.',
                'novo_status': novo_status.codigo,
                'etapa': etapa_destino
            })
            
        except StatusRequisicao.DoesNotExist:
            return JsonResponse(
                {'status': 'error', 'message': 'Status de destino não encontrado.'},
                status=500
            )
        except DadosRequisicao.DoesNotExist:
            return JsonResponse(
                {'status': 'error', 'message': 'Requisição não encontrada.'},
                status=404
            )
        except Exception as e:
            logger.error(f"Erro ao retornar etapa: {str(e)}", exc_info=True)
            return JsonResponse(
                {'status': 'error', 'message': 'Erro ao retornar para etapa anterior.'},
                status=500
            )
