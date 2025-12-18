"""
Protocolo Views - Página e APIs para cadastro de protocolos

@version 1.0.0
@date 2024-12-18
"""

import json
import logging
import uuid
from datetime import datetime

from django.conf import settings
from django.contrib.auth.mixins import LoginRequiredMixin
from django.http import JsonResponse
from django.utils.decorators import method_decorator
from django.views import View
from django.views.generic import TemplateView
from django_ratelimit.decorators import ratelimit

from core.config import get_aws_signed_url_api, get_file_url
from core.services.external_api import get_korus_client
from core.services.email_service import get_email_service
from core.models import ConfiguracaoEmail
from .models import (
    Origem,
    PortadorRepresentante,
    Protocolo,
    Unidade,
)

logger = logging.getLogger(__name__)


class CadastroProtocoloView(LoginRequiredMixin, TemplateView):
    """
    Página de cadastro de protocolo.
    """
    template_name = 'operacao/cadastro_protocolo.html'
    login_url = 'admin:login'
    
    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        
        # Carregar unidades ativas
        context['unidades'] = Unidade.objects.filter(ativo=True).order_by('codigo', 'nome')
        
        # Carregar portadores/representantes ativos
        context['portadores'] = PortadorRepresentante.objects.filter(
            ativo=True
        ).select_related('unidade', 'origem').order_by('nome')
        
        # Unidade padrão do usuário (se houver)
        context['unidade_padrao'] = None
        if hasattr(self.request.user, 'unidade_padrao'):
            context['unidade_padrao'] = self.request.user.unidade_padrao
        
        # Lista de UFs para o dropdown
        context['ufs'] = [
            'AC', 'AL', 'AM', 'AP', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA',
            'MG', 'MS', 'MT', 'PA', 'PB', 'PE', 'PI', 'PR', 'RJ', 'RN',
            'RO', 'RR', 'RS', 'SC', 'SE', 'SP', 'TO'
        ]
        
        return context


@method_decorator(ratelimit(key='user', rate='30/m', method='POST'), name='dispatch')
class ValidarMedicoProtocoloView(LoginRequiredMixin, View):
    """
    API para validar médico via CRM e UF usando API Korus.
    
    POST /operacao/protocolo/validar-medico/
    Body:
        {
            "crm": "12345",
            "uf": "SP"
        }
    
    Response (sucesso - 1 médico):
        {
            "status": "success",
            "medico": {
                "id": 123,
                "nome": "Dr. João Silva",
                "crm": "12345",
                "uf": "SP",
                "conselho": "CRM"
            }
        }
    
    Response (erro - não encontrado):
        {
            "status": "error",
            "code": "not_found",
            "message": "Médico não encontrado na base."
        }
    
    Response (erro - múltiplos médicos):
        {
            "status": "error",
            "code": "multiple_found",
            "message": "Múltiplos médicos encontrados (2 registros)...",
            "medicos": [...],
            "quantidade": 2
        }
    """
    
    login_url = 'admin:login'
    
    def post(self, request, *args, **kwargs):
        try:
            data = json.loads(request.body)
            crm = data.get('crm', '').strip()
            uf = data.get('uf', '').strip().upper()
            
            # Validações básicas
            if not crm:
                return JsonResponse(
                    {'status': 'error', 'code': 'validation', 'message': 'CRM não informado.'},
                    status=400
                )
            
            if not uf or len(uf) != 2:
                return JsonResponse(
                    {'status': 'error', 'code': 'validation', 'message': 'UF inválida.'},
                    status=400
                )
            
            # Chamar API Korus para validar médico
            korus_client = get_korus_client()
            response = korus_client.buscar_medico_por_crm(crm, uf)
            
            logger.info(f"Validação médico CRM={crm}, UF={uf} - success={response.success}")
            
            if response.success:
                # Sucesso - 1 médico encontrado
                medico = response.data.get('medico', {})
                return JsonResponse({
                    'status': 'success',
                    'medico': {
                        'id': medico.get('id'),
                        'nome': medico.get('nome', ''),
                        'crm': medico.get('crm', crm),
                        'uf': medico.get('uf', uf),
                        'conselho': medico.get('conselho', '')
                    }
                })
            
            # Verificar se é caso de múltiplos médicos
            if response.data and response.data.get('quantidade', 0) > 1:
                return JsonResponse({
                    'status': 'error',
                    'code': 'multiple_found',
                    'message': response.error,
                    'medicos': response.data.get('medicos', []),
                    'quantidade': response.data.get('quantidade', 0)
                }, status=200)  # 200 pois não é erro de servidor
            
            # Médico não encontrado
            return JsonResponse({
                'status': 'error',
                'code': 'not_found',
                'message': response.error or 'Médico não encontrado na base.'
            }, status=404)
            
        except json.JSONDecodeError:
            return JsonResponse(
                {'status': 'error', 'code': 'validation', 'message': 'JSON inválido.'},
                status=400
            )
        except Exception as e:
            logger.exception(f"Erro ao validar médico: {e}")
            return JsonResponse(
                {'status': 'error', 'code': 'server_error', 'message': 'Erro interno ao validar médico.'},
                status=500
            )


@method_decorator(ratelimit(key='user', rate='30/m', method='GET'), name='dispatch')
class ObterSignedUrlProtocoloView(LoginRequiredMixin, View):
    """
    Gera URL pré-assinada para upload de arquivo do protocolo.
    
    GET /operacao/protocolo/signed-url/
    Query params:
        - filename: Nome do arquivo
        - content_type: Tipo MIME (ex: application/pdf)
    
    Response:
        {
            "status": "success",
            "signed_url": "https://s3...",
            "file_key": "protocolos/PROT-20241218-0001/uuid-filename.pdf",
            "expires_in": 3600
        }
    """
    
    login_url = 'admin:login'
    
    def get(self, request, *args, **kwargs):
        try:
            content_type = request.GET.get('content_type', 'application/pdf')
            
            # Gerar nome único para o arquivo
            timestamp = datetime.now().strftime('%Y%m%d%H%M%S')
            unique_id = str(uuid.uuid4())[:8]
            filename = f"PROT_{timestamp}_{unique_id}.pdf"
            
            # Obter signed URL da API Lambda
            import requests
            
            aws_signed_url_api = get_aws_signed_url_api()
            
            if not aws_signed_url_api:
                logger.error("AWS_SIGNED_URL_API não configurada")
                return JsonResponse(
                    {'status': 'error', 'message': 'Configuração de upload não encontrada.'},
                    status=500
                )
            
            # Gerar process_id único para o protocolo
            process_id = f"protocolo_{timestamp}_{unique_id}"
            
            # Chamar API Lambda
            payload = {
                'process_id': process_id,
                'filename': filename,
                'content_type': content_type
            }
            
            try:
                response = requests.post(
                    aws_signed_url_api,
                    json=payload,
                    timeout=15
                )
                
                if response.status_code == 200:
                    result = response.json()
                    
                    # Extrair dados da resposta
                    signed_url = result.get('signed_url') or result.get('url')
                    file_key = result.get('file_key') or result.get('key')
                    
                    if signed_url:
                        # Construir URL final do arquivo
                        file_url = get_file_url(file_key) if file_key else None
                        
                        return JsonResponse({
                            'status': 'success',
                            'signed_url': signed_url,
                            'file_key': file_key,
                            'file_url': file_url,
                            'filename': filename,
                            'expires_in': 3600
                        })
                    else:
                        logger.error(f"Resposta da API sem signed_url: {result}")
                        return JsonResponse(
                            {'status': 'error', 'message': 'Erro ao obter URL de upload.'},
                            status=500
                        )
                else:
                    logger.error(f"API signed URL retornou status {response.status_code}: {response.text}")
                    return JsonResponse(
                        {'status': 'error', 'message': 'Erro ao obter URL de upload.'},
                        status=500
                    )
                    
            except requests.RequestException as e:
                logger.error(f"Erro ao chamar API signed URL: {e}")
                return JsonResponse(
                    {'status': 'error', 'message': 'Erro de conexão com serviço de upload.'},
                    status=500
                )
            
        except Exception as e:
            logger.exception(f"Erro ao obter signed URL: {e}")
            return JsonResponse(
                {'status': 'error', 'message': 'Erro interno.'},
                status=500
            )


@method_decorator(ratelimit(key='user', rate='20/m', method='POST'), name='dispatch')
class SalvarProtocoloView(LoginRequiredMixin, View):
    """
    Salva um novo protocolo no banco de dados.
    
    POST /operacao/protocolo/salvar/
    Body:
        {
            "unidade_id": 1,
            "portador_id": 1,
            "crm": "12345",
            "uf_crm": "SP",
            "nome_medico": "Dr. João Silva",
            "medico_validado": true,
            "arquivo_url": "https://s3.../arquivo.pdf",
            "arquivo_nome": "documento.pdf",
            "observacao": ""
        }
    
    Response:
        {
            "status": "success",
            "protocolo": {
                "id": 1,
                "codigo": "PROT-20241218-0001"
            }
        }
    """
    
    login_url = 'admin:login'
    
    def post(self, request, *args, **kwargs):
        try:
            data = json.loads(request.body)
            
            # Validações
            unidade_id = data.get('unidade_id')
            portador_id = data.get('portador_id')
            crm = data.get('crm', '').strip()
            uf_crm = data.get('uf_crm', '').strip().upper()
            nome_medico = data.get('nome_medico', '').strip()
            medico_validado = data.get('medico_validado', False)
            arquivo_url = data.get('arquivo_url', '').strip()
            arquivo_nome = data.get('arquivo_nome', '').strip()
            observacao = data.get('observacao', '').strip()
            
            # Validar campos obrigatórios
            erros = []
            
            if not unidade_id:
                erros.append('Unidade não selecionada.')
            
            if not portador_id:
                erros.append('Portador/Representante não selecionado.')
            
            if not crm:
                erros.append('CRM não informado.')
            
            if not uf_crm or len(uf_crm) != 2:
                erros.append('UF do CRM inválida.')
            
            if not nome_medico:
                erros.append('Nome do médico não informado.')
            
            if not arquivo_url:
                erros.append('Arquivo não enviado.')
            
            if erros:
                return JsonResponse({
                    'status': 'error',
                    'message': 'Campos obrigatórios não preenchidos.',
                    'erros': erros
                }, status=400)
            
            # Buscar unidade e portador
            try:
                unidade = Unidade.objects.get(id=unidade_id, ativo=True)
            except Unidade.DoesNotExist:
                return JsonResponse(
                    {'status': 'error', 'message': 'Unidade não encontrada.'},
                    status=404
                )
            
            try:
                portador = PortadorRepresentante.objects.get(id=portador_id, ativo=True)
            except PortadorRepresentante.DoesNotExist:
                return JsonResponse(
                    {'status': 'error', 'message': 'Portador/Representante não encontrado.'},
                    status=404
                )
            
            # Criar protocolo
            protocolo = Protocolo.objects.create(
                unidade=unidade,
                portador=portador,
                origem=portador.origem,
                crm=crm,
                uf_crm=uf_crm,
                nome_medico=nome_medico,
                medico_validado=medico_validado,
                arquivo_url=arquivo_url,
                arquivo_nome=arquivo_nome or 'documento.pdf',
                observacao=observacao,
                created_by=request.user,
                updated_by=request.user,
            )
            
            logger.info(f"Protocolo {protocolo.codigo} criado por {request.user.username}")
            
            return JsonResponse({
                'status': 'success',
                'message': 'Protocolo cadastrado com sucesso!',
                'protocolo': {
                    'id': protocolo.id,
                    'codigo': protocolo.codigo
                }
            })
            
        except json.JSONDecodeError:
            return JsonResponse(
                {'status': 'error', 'message': 'JSON inválido.'},
                status=400
            )
        except Exception as e:
            logger.exception(f"Erro ao salvar protocolo: {e}")
            return JsonResponse(
                {'status': 'error', 'message': 'Erro interno ao salvar protocolo.'},
                status=500
            )


@method_decorator(ratelimit(key='user', rate='30/m', method='GET'), name='dispatch')
class ObterTemplateEmailView(LoginRequiredMixin, View):
    """
    Obtém template de email para pré-preenchimento do modal.
    
    GET /operacao/protocolo/email-template/?tipo=medico_duplicado
    
    Response:
        {
            "status": "success",
            "template": {
                "destinatarios": ["email@example.com"],
                "assunto": "Assunto padrão",
                "corpo": "Corpo padrão com {placeholders}"
            }
        }
    """
    
    login_url = 'admin:login'
    
    def get(self, request, *args, **kwargs):
        try:
            tipo = request.GET.get('tipo', '')
            crm = request.GET.get('crm', '')
            uf = request.GET.get('uf', '')
            medicos_json = request.GET.get('medicos', '[]')
            
            if not tipo:
                return JsonResponse(
                    {'status': 'error', 'message': 'Tipo de email não informado.'},
                    status=400
                )
            
            # Buscar configuração
            config = ConfiguracaoEmail.objects.filter(tipo=tipo, ativo=True).first()
            
            if not config:
                return JsonResponse({
                    'status': 'error',
                    'message': f'Template de email não configurado para tipo: {tipo}'
                }, status=404)
            
            # Preparar contexto para renderização
            contexto = {
                'crm': crm,
                'uf': uf,
                'medicos': medicos_json,
                'usuario': request.user.get_full_name() or request.user.username,
                'data': datetime.now().strftime('%d/%m/%Y %H:%M')
            }
            
            # Renderizar template
            assunto = config.renderizar_assunto(contexto)
            corpo = config.renderizar_corpo(contexto)
            
            return JsonResponse({
                'status': 'success',
                'template': {
                    'destinatarios': config.get_emails_destino_list(),
                    'assunto': assunto,
                    'corpo': corpo
                }
            })
            
        except Exception as e:
            logger.exception(f"Erro ao obter template de email: {e}")
            return JsonResponse(
                {'status': 'error', 'message': 'Erro ao obter template.'},
                status=500
            )


@method_decorator(ratelimit(key='user', rate='10/m', method='POST'), name='dispatch')
class EnviarEmailMedicoView(LoginRequiredMixin, View):
    """
    Envia email sobre problema com médico (duplicado ou não encontrado).
    
    POST /operacao/protocolo/enviar-email/
    Body:
        {
            "tipo": "medico_duplicado",
            "destinatarios": ["email@example.com"],
            "assunto": "Assunto do email",
            "corpo": "Corpo do email",
            "crm": "12345",
            "uf": "SP"
        }
    
    Response:
        {
            "status": "success",
            "message": "Email enviado com sucesso.",
            "log_id": 123
        }
    """
    
    login_url = 'admin:login'
    
    def post(self, request, *args, **kwargs):
        try:
            data = json.loads(request.body)
            
            tipo = data.get('tipo', '')
            destinatarios = data.get('destinatarios', [])
            assunto = data.get('assunto', '').strip()
            corpo = data.get('corpo', '').strip()
            crm = data.get('crm', '')
            uf = data.get('uf', '')
            
            # Validações
            if not tipo:
                return JsonResponse(
                    {'status': 'error', 'message': 'Tipo de email não informado.'},
                    status=400
                )
            
            if not destinatarios:
                return JsonResponse(
                    {'status': 'error', 'message': 'Destinatário(s) não informado(s).'},
                    status=400
                )
            
            if not assunto:
                return JsonResponse(
                    {'status': 'error', 'message': 'Assunto não informado.'},
                    status=400
                )
            
            if not corpo:
                return JsonResponse(
                    {'status': 'error', 'message': 'Corpo do email não informado.'},
                    status=400
                )
            
            # Garantir que destinatarios é uma lista
            if isinstance(destinatarios, str):
                destinatarios = [d.strip() for d in destinatarios.split(',') if d.strip()]
            
            # Enviar email
            email_service = get_email_service()
            result = email_service.enviar_customizado(
                tipo='Cadastro Protocolo',
                descricao=tipo,
                destinatarios=destinatarios,
                assunto=assunto,
                corpo=corpo,
                usuario=request.user
            )
            
            if result['success']:
                logger.info(f"Email enviado: tipo={tipo}, crm={crm}, uf={uf}, user={request.user.username}")
                return JsonResponse({
                    'status': 'success',
                    'message': result['message'],
                    'log_id': result.get('log_id')
                })
            else:
                return JsonResponse({
                    'status': 'error',
                    'message': result['message'],
                    'log_id': result.get('log_id')
                }, status=500)
            
        except json.JSONDecodeError:
            return JsonResponse(
                {'status': 'error', 'message': 'JSON inválido.'},
                status=400
            )
        except Exception as e:
            logger.exception(f"Erro ao enviar email: {e}")
            return JsonResponse(
                {'status': 'error', 'message': 'Erro interno ao enviar email.'},
                status=500
            )
