"""
Views para o Sistema de Tarefas (Kanban)
"""
import logging
from datetime import timedelta

from django.contrib.auth import get_user_model
from django.contrib.auth.decorators import login_required
from django.db import transaction
from django.http import JsonResponse
from django.shortcuts import render
from django.utils import timezone
from django.views import View
from django.views.decorators.http import require_http_methods

from .models import Tarefa, TipoTarefa, Notificacao

logger = logging.getLogger(__name__)
User = get_user_model()


class TarefasKanbanView(View):
    """View principal da página Kanban de tarefas"""
    
    def get(self, request):
        # Buscar tipos de tarefa ativos para o formulário
        tipos_tarefa = TipoTarefa.objects.filter(ativo=True).order_by('nome')
        
        # Buscar colaboradores ativos para atribuição
        colaboradores = User.objects.filter(
            is_active=True
        ).order_by('first_name', 'username')
        
        # Verificar se usuário é gestor (pode criar tarefas para outros)
        # Por enquanto, qualquer usuário autenticado pode criar tarefas
        pode_criar_tarefa = request.user.is_authenticated
        
        context = {
            'tipos_tarefa': tipos_tarefa,
            'colaboradores': colaboradores,
            'pode_criar_tarefa': pode_criar_tarefa,
            'prioridades': Tarefa.Prioridade.choices,
            'status_choices': Tarefa.Status.choices,
        }
        
        return render(request, 'operacao/tarefas_kanban.html', context)


class ListarTarefasAPIView(View):
    """API para listar tarefas (usado pelo Kanban)"""
    
    def get(self, request):
        try:
            # Filtros opcionais
            responsavel_id = request.GET.get('responsavel_id')
            status = request.GET.get('status')
            prioridade = request.GET.get('prioridade')
            tipo_id = request.GET.get('tipo_id')
            minhas_tarefas = request.GET.get('minhas_tarefas') == 'true'
            
            # Query base
            tarefas = Tarefa.objects.select_related(
                'tipo', 'responsavel', 'criado_por', 'protocolo', 'requisicao'
            )
            
            # Aplicar filtros
            if minhas_tarefas and request.user.is_authenticated:
                tarefas = tarefas.filter(responsavel=request.user)
            elif responsavel_id:
                tarefas = tarefas.filter(responsavel_id=responsavel_id)
            
            if status:
                tarefas = tarefas.filter(status=status)
            
            if prioridade:
                tarefas = tarefas.filter(prioridade=prioridade)
            
            if tipo_id:
                tarefas = tarefas.filter(tipo_id=tipo_id)
            
            # Ordenar por prioridade (urgente primeiro) e data de criação
            tarefas = tarefas.order_by(
                '-prioridade',  # URGENTE > ALTA > MEDIA > BAIXA
                '-created_at'
            )
            
            # Serializar
            tarefas_data = []
            for tarefa in tarefas:
                tarefas_data.append({
                    'id': tarefa.id,
                    'codigo': tarefa.codigo,
                    'titulo': tarefa.titulo,
                    'descricao': tarefa.descricao,
                    'status': tarefa.status,
                    'status_display': tarefa.get_status_display(),
                    'prioridade': tarefa.prioridade,
                    'prioridade_display': tarefa.get_prioridade_display(),
                    'origem': tarefa.origem,
                    'origem_display': tarefa.get_origem_display(),
                    'tipo': {
                        'id': tarefa.tipo.id,
                        'nome': tarefa.tipo.nome,
                        'prazo_dias': tarefa.tipo.prazo_dias,
                    } if tarefa.tipo else None,
                    'responsavel': {
                        'id': tarefa.responsavel.id,
                        'nome': tarefa.responsavel.get_full_name() or tarefa.responsavel.username,
                        'username': tarefa.responsavel.username,
                    },
                    'criado_por': {
                        'id': tarefa.criado_por.id,
                        'nome': tarefa.criado_por.get_full_name() or tarefa.criado_por.username,
                    } if tarefa.criado_por else None,
                    'data_prazo': tarefa.data_prazo.isoformat() if tarefa.data_prazo else None,
                    'data_inicio': tarefa.data_inicio.isoformat() if tarefa.data_inicio else None,
                    'data_conclusao': tarefa.data_conclusao.isoformat() if tarefa.data_conclusao else None,
                    'created_at': tarefa.created_at.isoformat(),
                    'esta_atrasada': tarefa.esta_atrasada,
                    'dias_restantes': tarefa.dias_restantes,
                    'protocolo_id': tarefa.protocolo_id,
                    'requisicao_id': tarefa.requisicao_id,
                    'observacoes': tarefa.observacoes,
                })
            
            return JsonResponse({
                'status': 'success',
                'tarefas': tarefas_data,
                'total': len(tarefas_data),
            })
            
        except Exception as e:
            logger.exception('Erro ao listar tarefas: %s', str(e))
            return JsonResponse({
                'status': 'error',
                'message': f'Erro ao listar tarefas: {str(e)}'
            }, status=500)


class CriarTarefaAPIView(View):
    """API para criar nova tarefa"""
    
    def post(self, request):
        try:
            import json
            data = json.loads(request.body)
            
            # Validar campos obrigatórios
            titulo = data.get('titulo', '').strip()
            responsavel_id = data.get('responsavel_id')
            
            if not titulo:
                return JsonResponse({
                    'status': 'error',
                    'message': 'Título é obrigatório.'
                }, status=400)
            
            if not responsavel_id:
                return JsonResponse({
                    'status': 'error',
                    'message': 'Responsável é obrigatório.'
                }, status=400)
            
            # Buscar responsável
            try:
                responsavel = User.objects.get(id=responsavel_id, is_active=True)
            except User.DoesNotExist:
                return JsonResponse({
                    'status': 'error',
                    'message': 'Responsável não encontrado.'
                }, status=404)
            
            # Campos opcionais
            descricao = data.get('descricao', '').strip()
            tipo_id = data.get('tipo_id')
            prioridade = data.get('prioridade', Tarefa.Prioridade.MEDIA)
            data_prazo_str = data.get('data_prazo')
            protocolo_id = data.get('protocolo_id')
            requisicao_id = data.get('requisicao_id')
            observacoes = data.get('observacoes', '').strip()
            
            # Buscar tipo (opcional)
            tipo = None
            if tipo_id:
                try:
                    tipo = TipoTarefa.objects.get(id=tipo_id, ativo=True)
                except TipoTarefa.DoesNotExist:
                    pass
            
            # Calcular data de prazo
            data_prazo = None
            if data_prazo_str:
                from datetime import datetime
                try:
                    data_prazo = datetime.strptime(data_prazo_str, '%Y-%m-%d').date()
                except ValueError:
                    pass
            elif tipo:
                # Usar prazo padrão do tipo
                data_prazo = timezone.now().date() + timedelta(days=tipo.prazo_dias)
            
            with transaction.atomic():
                # Determinar origem: PROPRIO se criou para si mesmo, GESTOR se criou para outro
                if request.user.is_authenticated and responsavel == request.user:
                    origem_tarefa = Tarefa.Origem.PROPRIO
                else:
                    origem_tarefa = Tarefa.Origem.GESTOR
                
                # Criar tarefa
                tarefa = Tarefa.objects.create(
                    titulo=titulo,
                    descricao=descricao,
                    tipo=tipo,
                    status=Tarefa.Status.A_FAZER,
                    prioridade=prioridade,
                    origem=origem_tarefa,
                    criado_por=request.user if request.user.is_authenticated else None,
                    responsavel=responsavel,
                    data_prazo=data_prazo,
                    protocolo_id=protocolo_id,
                    requisicao_id=requisicao_id,
                    observacoes=observacoes,
                )
                
                # Criar notificação para o responsável (apenas se for outro usuário)
                if responsavel and responsavel != request.user:
                    Notificacao.objects.create(
                        usuario=responsavel,
                        tipo='TAREFA',
                        titulo='Nova tarefa atribuída',
                        mensagem=f'Você recebeu uma nova tarefa: {tarefa.titulo}',
                        dados={
                            'tarefa_id': tarefa.id,
                            'tarefa_codigo': tarefa.codigo,
                            'criado_por': request.user.get_full_name() if request.user.is_authenticated else 'Sistema',
                        }
                    )
            
            logger.info(
                'Tarefa criada: %s por %s para %s',
                tarefa.codigo,
                request.user.username if request.user.is_authenticated else 'Sistema',
                responsavel.username
            )
            
            return JsonResponse({
                'status': 'success',
                'message': 'Tarefa criada com sucesso!',
                'tarefa': {
                    'id': tarefa.id,
                    'codigo': tarefa.codigo,
                    'titulo': tarefa.titulo,
                }
            })
            
        except json.JSONDecodeError:
            return JsonResponse({
                'status': 'error',
                'message': 'Dados inválidos.'
            }, status=400)
        except Exception as e:
            logger.exception('Erro ao criar tarefa: %s', str(e))
            return JsonResponse({
                'status': 'error',
                'message': f'Erro ao criar tarefa: {str(e)}'
            }, status=500)


class AtualizarStatusTarefaAPIView(View):
    """API para atualizar status da tarefa (drag & drop no Kanban)"""
    
    def post(self, request):
        try:
            import json
            data = json.loads(request.body)
            
            tarefa_id = data.get('tarefa_id')
            novo_status = data.get('status')
            
            if not tarefa_id:
                return JsonResponse({
                    'status': 'error',
                    'message': 'ID da tarefa é obrigatório.'
                }, status=400)
            
            if novo_status not in dict(Tarefa.Status.choices):
                return JsonResponse({
                    'status': 'error',
                    'message': 'Status inválido.'
                }, status=400)
            
            try:
                tarefa = Tarefa.objects.get(id=tarefa_id)
            except Tarefa.DoesNotExist:
                return JsonResponse({
                    'status': 'error',
                    'message': 'Tarefa não encontrada.'
                }, status=404)
            
            status_anterior = tarefa.status
            tarefa.status = novo_status
            tarefa.save()
            
            logger.info(
                'Status da tarefa %s alterado de %s para %s por %s',
                tarefa.codigo,
                status_anterior,
                novo_status,
                request.user.username if request.user.is_authenticated else 'Anônimo'
            )
            
            return JsonResponse({
                'status': 'success',
                'message': 'Status atualizado com sucesso!',
                'tarefa': {
                    'id': tarefa.id,
                    'codigo': tarefa.codigo,
                    'status': tarefa.status,
                    'status_display': tarefa.get_status_display(),
                    'data_inicio': tarefa.data_inicio.isoformat() if tarefa.data_inicio else None,
                    'data_conclusao': tarefa.data_conclusao.isoformat() if tarefa.data_conclusao else None,
                }
            })
            
        except json.JSONDecodeError:
            return JsonResponse({
                'status': 'error',
                'message': 'Dados inválidos.'
            }, status=400)
        except Exception as e:
            logger.exception('Erro ao atualizar status: %s', str(e))
            return JsonResponse({
                'status': 'error',
                'message': f'Erro ao atualizar status: {str(e)}'
            }, status=500)


class AtualizarTarefaAPIView(View):
    """API para atualizar dados da tarefa"""
    
    def post(self, request):
        try:
            import json
            data = json.loads(request.body)
            
            tarefa_id = data.get('tarefa_id')
            
            if not tarefa_id:
                return JsonResponse({
                    'status': 'error',
                    'message': 'ID da tarefa é obrigatório.'
                }, status=400)
            
            try:
                tarefa = Tarefa.objects.get(id=tarefa_id)
            except Tarefa.DoesNotExist:
                return JsonResponse({
                    'status': 'error',
                    'message': 'Tarefa não encontrada.'
                }, status=404)
            
            # Atualizar campos permitidos
            if 'titulo' in data:
                tarefa.titulo = data['titulo'].strip()
            
            if 'descricao' in data:
                tarefa.descricao = data['descricao'].strip()
            
            if 'prioridade' in data:
                if data['prioridade'] in dict(Tarefa.Prioridade.choices):
                    tarefa.prioridade = data['prioridade']
            
            if 'responsavel_id' in data:
                try:
                    novo_responsavel = User.objects.get(id=data['responsavel_id'], is_active=True)
                    responsavel_anterior = tarefa.responsavel
                    tarefa.responsavel = novo_responsavel
                    
                    # Notificar novo responsável se mudou
                    if novo_responsavel != responsavel_anterior:
                        Notificacao.objects.create(
                            usuario=novo_responsavel,
                            tipo='TAREFA',
                            titulo='Tarefa transferida para você',
                            mensagem=f'A tarefa "{tarefa.titulo}" foi transferida para você.',
                            dados_extras={
                                'tarefa_id': tarefa.id,
                                'tarefa_codigo': tarefa.codigo,
                                'responsavel_anterior': responsavel_anterior.get_full_name(),
                            }
                        )
                except User.DoesNotExist:
                    pass
            
            if 'data_prazo' in data:
                if data['data_prazo']:
                    from datetime import datetime
                    try:
                        tarefa.data_prazo = datetime.strptime(data['data_prazo'], '%Y-%m-%d').date()
                    except ValueError:
                        pass
                else:
                    tarefa.data_prazo = None
            
            if 'observacoes' in data:
                tarefa.observacoes = data['observacoes'].strip()
            
            tarefa.save()
            
            logger.info(
                'Tarefa %s atualizada por %s',
                tarefa.codigo,
                request.user.username if request.user.is_authenticated else 'Anônimo'
            )
            
            return JsonResponse({
                'status': 'success',
                'message': 'Tarefa atualizada com sucesso!',
                'tarefa': {
                    'id': tarefa.id,
                    'codigo': tarefa.codigo,
                    'titulo': tarefa.titulo,
                }
            })
            
        except json.JSONDecodeError:
            return JsonResponse({
                'status': 'error',
                'message': 'Dados inválidos.'
            }, status=400)
        except Exception as e:
            logger.exception('Erro ao atualizar tarefa: %s', str(e))
            return JsonResponse({
                'status': 'error',
                'message': f'Erro ao atualizar tarefa: {str(e)}'
            }, status=500)


class ExcluirTarefaAPIView(View):
    """API para excluir/cancelar tarefa"""
    
    def post(self, request):
        try:
            import json
            data = json.loads(request.body)
            
            tarefa_id = data.get('tarefa_id')
            
            if not tarefa_id:
                return JsonResponse({
                    'status': 'error',
                    'message': 'ID da tarefa é obrigatório.'
                }, status=400)
            
            try:
                tarefa = Tarefa.objects.get(id=tarefa_id)
            except Tarefa.DoesNotExist:
                return JsonResponse({
                    'status': 'error',
                    'message': 'Tarefa não encontrada.'
                }, status=404)
            
            # Ao invés de excluir, marcar como cancelada
            tarefa.status = Tarefa.Status.CANCELADA
            tarefa.save()
            
            logger.info(
                'Tarefa %s cancelada por %s',
                tarefa.codigo,
                request.user.username if request.user.is_authenticated else 'Anônimo'
            )
            
            return JsonResponse({
                'status': 'success',
                'message': 'Tarefa cancelada com sucesso!',
            })
            
        except json.JSONDecodeError:
            return JsonResponse({
                'status': 'error',
                'message': 'Dados inválidos.'
            }, status=400)
        except Exception as e:
            logger.exception('Erro ao cancelar tarefa: %s', str(e))
            return JsonResponse({
                'status': 'error',
                'message': f'Erro ao cancelar tarefa: {str(e)}'
            }, status=500)


class ObterTarefaAPIView(View):
    """API para obter detalhes de uma tarefa específica"""
    
    def get(self, request):
        try:
            tarefa_id = request.GET.get('tarefa_id')
            
            if not tarefa_id:
                return JsonResponse({
                    'status': 'error',
                    'message': 'ID da tarefa é obrigatório.'
                }, status=400)
            
            try:
                tarefa = Tarefa.objects.select_related(
                    'tipo', 'responsavel', 'criado_por', 'protocolo', 'requisicao'
                ).get(id=tarefa_id)
            except Tarefa.DoesNotExist:
                return JsonResponse({
                    'status': 'error',
                    'message': 'Tarefa não encontrada.'
                }, status=404)
            
            return JsonResponse({
                'status': 'success',
                'tarefa': {
                    'id': tarefa.id,
                    'codigo': tarefa.codigo,
                    'titulo': tarefa.titulo,
                    'descricao': tarefa.descricao,
                    'status': tarefa.status,
                    'status_display': tarefa.get_status_display(),
                    'prioridade': tarefa.prioridade,
                    'prioridade_display': tarefa.get_prioridade_display(),
                    'origem': tarefa.origem,
                    'origem_display': tarefa.get_origem_display(),
                    'tipo': {
                        'id': tarefa.tipo.id,
                        'nome': tarefa.tipo.nome,
                        'prazo_dias': tarefa.tipo.prazo_dias,
                    } if tarefa.tipo else None,
                    'responsavel': {
                        'id': tarefa.responsavel.id,
                        'nome': tarefa.responsavel.get_full_name() or tarefa.responsavel.username,
                        'username': tarefa.responsavel.username,
                    },
                    'criado_por': {
                        'id': tarefa.criado_por.id,
                        'nome': tarefa.criado_por.get_full_name() or tarefa.criado_por.username,
                    } if tarefa.criado_por else None,
                    'data_prazo': tarefa.data_prazo.isoformat() if tarefa.data_prazo else None,
                    'data_inicio': tarefa.data_inicio.isoformat() if tarefa.data_inicio else None,
                    'data_conclusao': tarefa.data_conclusao.isoformat() if tarefa.data_conclusao else None,
                    'created_at': tarefa.created_at.isoformat(),
                    'esta_atrasada': tarefa.esta_atrasada,
                    'dias_restantes': tarefa.dias_restantes,
                    'protocolo': {
                        'id': tarefa.protocolo.id,
                        'codigo': tarefa.protocolo.codigo,
                    } if tarefa.protocolo else None,
                    'requisicao': {
                        'id': tarefa.requisicao.id,
                        'cod_req': tarefa.requisicao.cod_req,
                    } if tarefa.requisicao else None,
                    'observacoes': tarefa.observacoes,
                }
            })
            
        except Exception as e:
            logger.exception('Erro ao obter tarefa: %s', str(e))
            return JsonResponse({
                'status': 'error',
                'message': f'Erro ao obter tarefa: {str(e)}'
            }, status=500)


class ListarTiposTarefaAPIView(View):
    """API para listar tipos de tarefa ativos"""
    
    def get(self, request):
        try:
            tipos = TipoTarefa.objects.filter(ativo=True).order_by('nome')
            
            tipos_data = [{
                'id': tipo.id,
                'codigo': tipo.codigo,
                'nome': tipo.nome,
                'descricao': tipo.descricao,
                'prazo_dias': tipo.prazo_dias,
            } for tipo in tipos]
            
            return JsonResponse({
                'status': 'success',
                'tipos': tipos_data,
            })
            
        except Exception as e:
            logger.exception('Erro ao listar tipos de tarefa: %s', str(e))
            return JsonResponse({
                'status': 'error',
                'message': f'Erro ao listar tipos: {str(e)}'
            }, status=500)


class ListarColaboradoresAPIView(View):
    """API para listar colaboradores ativos para atribuição de tarefas"""
    
    def get(self, request):
        try:
            colaboradores = User.objects.filter(
                is_active=True
            ).order_by('first_name', 'username')
            
            colaboradores_data = [{
                'id': user.id,
                'nome': user.get_full_name() or user.username,
                'username': user.username,
                'email': user.email,
            } for user in colaboradores]
            
            return JsonResponse({
                'status': 'success',
                'colaboradores': colaboradores_data,
            })
            
        except Exception as e:
            logger.exception('Erro ao listar colaboradores: %s', str(e))
            return JsonResponse({
                'status': 'error',
                'message': f'Erro ao listar colaboradores: {str(e)}'
            }, status=500)
