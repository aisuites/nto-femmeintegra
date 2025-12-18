"""
Views para a página de Cadastro de Requisição.
"""
import logging

from django.contrib.auth.mixins import LoginRequiredMixin
from django.db import transaction
from django.http import JsonResponse
from django.utils import timezone
from django.views import View
from django.views.generic import TemplateView

from .models import (
    DadosRequisicao,
    RequisicaoArquivo,
    RequisicaoExame,
    RequisicaoStatusHistorico,
    StatusRequisicao,
    TipoAtendimento,
)

logger = logging.getLogger('operacao')

# Status permitido para cadastro
STATUS_CADASTRADA = '12'
# Status de destino após autorização
STATUS_AUTOMACAO = '13'


class CadastroRequisicaoView(LoginRequiredMixin, TemplateView):
    """View principal da página de Cadastro de Requisição."""
    template_name = 'operacao/cadastro_requisicao.html'
    
    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        context['tipos_atendimento'] = TipoAtendimento.objects.filter(ativo=True)
        return context


class CadastroLocalizarView(LoginRequiredMixin, View):
    """
    Localiza uma requisição pelo código de barras para cadastro.
    Apenas requisições com status CADASTRADA (12) são elegíveis.
    """
    
    def post(self, request):
        import json
        
        try:
            data = json.loads(request.body)
            cod_barras = data.get('cod_barras', '').strip()
            
            if not cod_barras:
                return JsonResponse({
                    'status': 'error',
                    'message': 'Código de barras não informado.',
                }, status=400)
            
            # Buscar requisição
            try:
                requisicao = DadosRequisicao.objects.select_related(
                    'unidade', 'status', 'origem', 'portador_representante'
                ).get(cod_barras_req=cod_barras)
            except DadosRequisicao.DoesNotExist:
                return JsonResponse({
                    'status': 'not_found',
                    'message': 'Requisição não encontrada no sistema.',
                })
            
            # Verificar se está no status correto
            if requisicao.status.codigo != STATUS_CADASTRADA:
                return JsonResponse({
                    'status': 'not_eligible',
                    'message': f'Requisição não elegível para cadastro. Status atual: {requisicao.status.descricao}',
                })
            
            # Buscar arquivos da requisição
            arquivos = list(requisicao.arquivos.values(
                'id', 'nome_arquivo', 'url_arquivo', 'cod_tipo_arquivo'
            ))
            
            # Buscar exames existentes
            exames = list(requisicao.exames.select_related(
                'tipo_amostra', 'tipo_atendimento'
            ).values(
                'id',
                'tipo_amostra_id',
                'tipo_amostra__descricao',
                'tipo_atendimento_id',
                'tipo_atendimento__descricao',
                'num_autorizacao',
                'num_guia',
                'num_guia_prestador',
            ))
            
            # Formatar exames
            exames_formatados = []
            for exame in exames:
                exames_formatados.append({
                    'id': exame['id'],
                    'tipo_amostra_id': exame['tipo_amostra_id'],
                    'tipo_amostra_descricao': exame['tipo_amostra__descricao'],
                    'tipo_atendimento_id': exame['tipo_atendimento_id'],
                    'tipo_atendimento_descricao': exame['tipo_atendimento__descricao'],
                    'num_autorizacao': exame['num_autorizacao'],
                    'num_guia': exame['num_guia'],
                    'num_guia_prestador': exame['num_guia_prestador'],
                })
            
            # Montar resposta
            requisicao_data = {
                'id': requisicao.id,
                'cod_req': requisicao.cod_req,
                'cod_barras_req': requisicao.cod_barras_req,
                'unidade_id': requisicao.unidade_id,
                'unidade_nome': requisicao.unidade.nome if requisicao.unidade else None,
                'status_codigo': requisicao.status.codigo,
                'status_descricao': requisicao.status.descricao,
                
                # Dados do paciente
                'cpf_paciente': requisicao.cpf_paciente,
                'nome_paciente': requisicao.nome_paciente,
                'data_um': requisicao.data_um.isoformat() if requisicao.data_um else None,
                'data_nasc_paciente': requisicao.data_nasc_paciente.isoformat() if requisicao.data_nasc_paciente else None,
                'email_paciente': requisicao.email_paciente,
                'telefone_paciente': requisicao.telefone_paciente,
                'sexo_paciente': requisicao.sexo_paciente,
                'flag_sexo_a_confirmar': requisicao.flag_sexo_a_confirmar,
                'flag_problema_cpf': requisicao.flag_problema_cpf,
                
                # Dados do médico
                'crm': requisicao.crm,
                'uf_crm': requisicao.uf_crm,
                'nome_medico': requisicao.nome_medico,
                'end_medico': requisicao.end_medico,
                'dest_medico': requisicao.dest_medico,
                'flag_problema_medico': requisicao.flag_problema_medico,
                
                # Arquivos e exames
                'arquivos': arquivos,
                'exames': exames_formatados,
            }
            
            return JsonResponse({
                'status': 'success',
                'requisicao': requisicao_data,
            })
            
        except json.JSONDecodeError:
            return JsonResponse({
                'status': 'error',
                'message': 'Dados inválidos.',
            }, status=400)
        except Exception as e:
            logger.exception('Erro ao localizar requisição para cadastro: %s', str(e))
            return JsonResponse({
                'status': 'error',
                'message': 'Erro interno ao localizar requisição.',
            }, status=500)


class CadastroAutorizarView(LoginRequiredMixin, View):
    """
    Autoriza uma requisição, atualizando seus dados e mudando o status para AUTOMAÇÃO.
    """
    
    def post(self, request):
        import json
        
        try:
            data = json.loads(request.body)
            requisicao_id = data.get('requisicao_id')
            
            if not requisicao_id:
                return JsonResponse({
                    'status': 'error',
                    'message': 'ID da requisição não informado.',
                }, status=400)
            
            # Buscar requisição
            try:
                requisicao = DadosRequisicao.objects.select_related('status').get(id=requisicao_id)
            except DadosRequisicao.DoesNotExist:
                return JsonResponse({
                    'status': 'error',
                    'message': 'Requisição não encontrada.',
                }, status=404)
            
            # Verificar status
            if requisicao.status.codigo != STATUS_CADASTRADA:
                return JsonResponse({
                    'status': 'error',
                    'message': f'Requisição não pode ser autorizada. Status atual: {requisicao.status.descricao}',
                }, status=400)
            
            # Buscar status de destino
            try:
                status_automacao = StatusRequisicao.objects.get(codigo=STATUS_AUTOMACAO)
            except StatusRequisicao.DoesNotExist:
                return JsonResponse({
                    'status': 'error',
                    'message': 'Status AUTOMAÇÃO não encontrado no sistema.',
                }, status=500)
            
            with transaction.atomic():
                # Atualizar dados do paciente
                requisicao.cpf_paciente = data.get('cpf_paciente', requisicao.cpf_paciente)
                requisicao.nome_paciente = data.get('nome_paciente', requisicao.nome_paciente)
                requisicao.email_paciente = data.get('email_paciente', requisicao.email_paciente)
                requisicao.telefone_paciente = data.get('telefone_paciente', requisicao.telefone_paciente)
                requisicao.sexo_paciente = data.get('sexo_paciente', requisicao.sexo_paciente)
                requisicao.flag_sexo_a_confirmar = data.get('flag_sexo_a_confirmar', False)
                requisicao.flag_problema_cpf = data.get('flag_problema_cpf', False)
                
                # Atualizar datas
                if data.get('data_um'):
                    from datetime import datetime
                    requisicao.data_um = datetime.strptime(data['data_um'], '%Y-%m-%d').date()
                
                if data.get('data_nasc_paciente'):
                    from datetime import datetime
                    requisicao.data_nasc_paciente = datetime.strptime(data['data_nasc_paciente'], '%Y-%m-%d').date()
                
                # Atualizar dados do médico
                requisicao.crm = data.get('crm', requisicao.crm)
                requisicao.uf_crm = data.get('uf_crm', requisicao.uf_crm)
                requisicao.nome_medico = data.get('nome_medico', requisicao.nome_medico)
                requisicao.end_medico = data.get('end_medico', requisicao.end_medico)
                requisicao.dest_medico = data.get('dest_medico', requisicao.dest_medico)
                requisicao.flag_problema_medico = data.get('flag_problema_medico', False)
                
                # Atualizar status
                requisicao.status = status_automacao
                requisicao.updated_by = request.user
                requisicao.save()
                
                # Registrar histórico de status
                RequisicaoStatusHistorico.objects.create(
                    requisicao=requisicao,
                    cod_req=requisicao.cod_req,
                    status=status_automacao,
                    usuario=request.user,
                    observacao='Requisição autorizada via página de Cadastro',
                )
                
                # Processar exames (se houver)
                exames = data.get('exames', [])
                for exame_data in exames:
                    # Verificar se já existe
                    if exame_data.get('id'):
                        # Atualizar existente
                        try:
                            exame = RequisicaoExame.objects.get(id=exame_data['id'])
                            exame.num_autorizacao = exame_data.get('num_autorizacao', exame.num_autorizacao)
                            exame.num_guia = exame_data.get('num_guia', exame.num_guia)
                            exame.num_guia_prestador = exame_data.get('num_guia_prestador', exame.num_guia_prestador)
                            exame.updated_by = request.user
                            exame.save()
                        except RequisicaoExame.DoesNotExist:
                            pass
                    else:
                        # Criar novo
                        if exame_data.get('tipo_amostra_id') and exame_data.get('tipo_atendimento_id'):
                            RequisicaoExame.objects.create(
                                requisicao=requisicao,
                                cod_req=requisicao.cod_req,
                                cod_barras_req=requisicao.cod_barras_req,
                                tipo_amostra_id=exame_data['tipo_amostra_id'],
                                tipo_atendimento_id=exame_data['tipo_atendimento_id'],
                                num_autorizacao=exame_data.get('num_autorizacao', ''),
                                num_guia=exame_data.get('num_guia', ''),
                                num_guia_prestador=exame_data.get('num_guia_prestador', ''),
                                created_by=request.user,
                                updated_by=request.user,
                            )
            
            logger.info(
                'Requisição %s autorizada pelo usuário %s',
                requisicao.cod_req,
                request.user.username
            )
            
            return JsonResponse({
                'status': 'success',
                'message': 'Requisição autorizada com sucesso!',
                'cod_req': requisicao.cod_req,
            })
            
        except json.JSONDecodeError:
            return JsonResponse({
                'status': 'error',
                'message': 'Dados inválidos.',
            }, status=400)
        except Exception as e:
            logger.exception('Erro ao autorizar requisição: %s', str(e))
            return JsonResponse({
                'status': 'error',
                'message': 'Erro interno ao autorizar requisição.',
            }, status=500)
