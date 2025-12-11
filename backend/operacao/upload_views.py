"""
Upload Views - APIs para upload de arquivos via scanner para AWS S3

Processo em 2 etapas:
1. GET signed URL - Gera URL pré-assinada para upload direto ao S3
2. POST confirmar upload - Registra arquivo no banco após upload bem-sucedido

@version 1.0.0
@date 2024-12-11
"""

import json
import logging
import uuid
from datetime import datetime, timedelta

from django.contrib.auth.mixins import LoginRequiredMixin
from django.http import JsonResponse
from django.utils.decorators import method_decorator
from django.views import View
from django_ratelimit.decorators import ratelimit

from core.config import get_aws_signed_url_api, get_file_url
from .models import DadosRequisicao, RequisicaoArquivo, TipoArquivo

logger = logging.getLogger(__name__)


@method_decorator(ratelimit(key='user', rate='30/m', method='GET'), name='dispatch')
class ObterSignedUrlView(LoginRequiredMixin, View):
    """
    Gera URL pré-assinada para upload direto ao S3.
    
    GET /operacao/upload/signed-url/
    Query params:
        - requisicao_id: ID da requisição
        - filename: Nome do arquivo
        - content_type: Tipo MIME (ex: image/jpeg)
    
    Response:
        {
            "status": "success",
            "signed_url": "https://s3...",
            "file_key": "requisicoes/REQ123/uuid-filename.jpg",
            "expires_in": 3600
        }
    """
    
    login_url = 'admin:login'
    
    def get(self, request, *args, **kwargs):
        try:
            # Obter parâmetros
            requisicao_id = request.GET.get('requisicao_id')
            content_type = request.GET.get('content_type', 'application/pdf')
            
            # Validações
            if not requisicao_id:
                return JsonResponse(
                    {'status': 'error', 'message': 'ID da requisição não informado.'},
                    status=400
                )
            
            # Filename será gerado automaticamente no padrão IDREQ_{cod_req}_{timestamp}.pdf
            
            # Verificar se requisição existe e usuário tem acesso
            try:
                requisicao = DadosRequisicao.objects.get(id=requisicao_id)
            except DadosRequisicao.DoesNotExist:
                return JsonResponse(
                    {'status': 'error', 'message': 'Requisição não encontrada.'},
                    status=404
                )
            
            # Gerar nome do arquivo no padrão estabelecido
            # Formato: IDREQ_{cod_req}_{YYYYMMDDHHMMSS}.pdf
            from datetime import datetime
            timestamp = datetime.now().strftime('%Y%m%d%H%M%S')
            filename_padrao = f"IDREQ_{requisicao.cod_req}_{timestamp}.pdf"
            
            # O file_key será gerado pela API Lambda usando process_id
            # Formato: processing/{process_id}/{filename}
            
            # Obter signed URL da API Lambda
            import requests
            
            aws_signed_url_api = get_aws_signed_url_api()
            
            if not aws_signed_url_api:
                logger.error("AWS_SIGNED_URL_API não configurada para o ambiente atual")
                return JsonResponse(
                    {'status': 'error', 'message': 'Configuração de upload não encontrada.'},
                    status=500
                )
            
            # Chamar API Lambda para obter signed URL
            # Formato esperado pela API conforme documentação
            # IMPORTANTE: process_id deve ser o ID numérico da tabela dados_requisicao
            
            # Preparar payload para API Lambda
            lambda_payload = {
                'process_id': str(requisicao.id),
                'files': [
                    {
                        'name': filename_padrao.replace('.pdf', ''),
                        'type': 'application/pdf',
                        'filename': filename_padrao
                    }
                ]
            }
            
            try:
                lambda_response = requests.post(
                    aws_signed_url_api,
                    json=lambda_payload,
                    headers={
                        'Content-Type': 'application/json',
                        'User-Agent': 'FEMME-Integra/1.0'
                    },
                    timeout=10
                )
                
                if lambda_response.status_code != 200:
                    logger.error(f"Erro ao obter signed URL: {lambda_response.text}")
                    return JsonResponse(
                        {'status': 'error', 'message': 'Erro ao gerar URL de upload.'},
                        status=500
                    )
                
                lambda_data = lambda_response.json()
                
                # A API retorna um objeto com o nome do arquivo como chave
                # Formato: { "filename": { "key": "...", "url": "...", "name": "..." } }
                if not lambda_data or len(lambda_data) == 0:
                    logger.error("Nenhum arquivo retornado pela API Lambda")
                    return JsonResponse(
                        {'status': 'error', 'message': 'Erro ao gerar URL de upload.'},
                        status=500
                    )
                
                # Extrair dados do primeiro arquivo
                file_name_key = list(lambda_data.keys())[0]
                file_data = lambda_data[file_name_key]
                signed_url = file_data.get('url')
                
                if not signed_url:
                    logger.error("URL não encontrada na resposta da API Lambda")
                    return JsonResponse(
                        {'status': 'error', 'message': 'Erro ao gerar URL de upload.'},
                        status=500
                    )
                
            except requests.exceptions.RequestException as e:
                logger.error(f"Erro ao chamar API Lambda: {str(e)}")
                return JsonResponse(
                    {'status': 'error', 'message': 'Erro ao conectar com serviço de upload.'},
                    status=500
                )
            
            # Extrair file_key da resposta (ou construir se não vier)
            file_key = file_data.get('key') or f"processing/{requisicao.id}/{filename_padrao}"
            
            logger.info(f"Signed URL gerada: {requisicao.cod_req} - {filename_padrao}")
            
            return JsonResponse({
                'status': 'success',
                'signed_url': signed_url,
                'file_key': file_key,
                'original_filename': filename_padrao,
                'expires_in': 3600,
                'requisicao_cod': requisicao.cod_req
            })
            
        except Exception as e:
            logger.error(f"Erro ao gerar signed URL: {str(e)}", exc_info=True)
            return JsonResponse(
                {'status': 'error', 'message': 'Erro ao gerar URL de upload.'},
                status=500
            )


@method_decorator(ratelimit(key='user', rate='30/m', method='POST'), name='dispatch')
class ConfirmarUploadView(LoginRequiredMixin, View):
    """
    Confirma upload e registra arquivo no banco de dados.
    
    POST /operacao/upload/confirmar/
    Body:
        {
            "requisicao_id": 123,
            "file_key": "requisicoes/REQ123/uuid-file.jpg",
            "filename": "documento.jpg",
            "tipo_arquivo_id": 1,
            "file_size": 1024000
        }
    
    Response:
        {
            "status": "success",
            "message": "Arquivo registrado com sucesso.",
            "arquivo": {
                "id": 456,
                "nome": "documento.jpg",
                "url": "https://s3.../",
                "data_upload": "2024-12-11T14:30:00Z"
            }
        }
    """
    
    login_url = 'admin:login'
    
    def post(self, request, *args, **kwargs):
        try:
            data = json.loads(request.body)
            
            # Obter parâmetros
            requisicao_id = data.get('requisicao_id')
            file_key = data.get('file_key')
            filename = data.get('filename')
            tipo_arquivo_id = data.get('tipo_arquivo_id')
            file_size = data.get('file_size', 0)
            
            # Validações
            if not requisicao_id:
                return JsonResponse(
                    {'status': 'error', 'message': 'ID da requisição não informado.'},
                    status=400
                )
            
            if not file_key or not filename:
                return JsonResponse(
                    {'status': 'error', 'message': 'Informações do arquivo incompletas.'},
                    status=400
                )
            
            # Verificar requisição
            try:
                requisicao = DadosRequisicao.objects.get(id=requisicao_id)
            except DadosRequisicao.DoesNotExist:
                return JsonResponse(
                    {'status': 'error', 'message': 'Requisição não encontrada.'},
                    status=404
                )
            
            # Obter tipo de arquivo REQUISICAO (codigo=1)
            try:
                tipo_arquivo = TipoArquivo.objects.get(codigo=1, ativo=True)
            except TipoArquivo.DoesNotExist:
                logger.error("Tipo de arquivo REQUISICAO (codigo=1) não encontrado")
                return JsonResponse(
                    {'status': 'error', 'message': 'Tipo de arquivo não configurado.'},
                    status=500
                )
            
            # Construir URL do arquivo usando CloudFront
            file_url = get_file_url(file_key)
            
            if not file_url or file_url == f"/{file_key}":
                logger.error("Erro ao construir URL do arquivo no CloudFront")
                return JsonResponse(
                    {'status': 'error', 'message': 'Configuração de armazenamento não encontrada.'},
                    status=500
                )
            
            # Criar registro do arquivo
            arquivo = RequisicaoArquivo.objects.create(
                requisicao=requisicao,
                cod_req=requisicao.cod_req,
                tipo_arquivo=tipo_arquivo,
                cod_tipo_arquivo=1,  # REQUISICAO
                nome_arquivo=filename,
                url_arquivo=file_url,
                created_by=request.user,
                updated_by=request.user
            )
            
            logger.info(
                f"Arquivo registrado: {filename} para requisição {requisicao.cod_req} "
                f"(ID: {arquivo.id})"
            )
            
            return JsonResponse({
                'status': 'success',
                'message': 'Arquivo enviado e registrado com sucesso!',
                'arquivo': {
                    'id': arquivo.id,
                    'nome': arquivo.nome_arquivo,
                    'url': arquivo.url_arquivo,
                    'data_upload': arquivo.data_upload.isoformat(),
                    'tipo': tipo_arquivo.descricao
                }
            })
            
        except json.JSONDecodeError:
            return JsonResponse(
                {'status': 'error', 'message': 'JSON inválido.'},
                status=400
            )
        except Exception as e:
            logger.error(f"Erro ao confirmar upload: {str(e)}", exc_info=True)
            return JsonResponse(
                {'status': 'error', 'message': 'Erro ao registrar arquivo.'},
                status=500
            )


@method_decorator(ratelimit(key='user', rate='60/m', method='GET'), name='dispatch')
class ListarArquivosRequisicaoView(LoginRequiredMixin, View):
    """
    Lista arquivos de uma requisição.
    
    GET /operacao/upload/listar/?requisicao_id=123
    
    Response:
        {
            "status": "success",
            "arquivos": [
                {
                    "id": 1,
                    "nome": "documento.jpg",
                    "url": "https://...",
                    "tipo": "Documento Digitalizado",
                    "data_upload": "2024-12-11T14:30:00Z"
                }
            ]
        }
    """
    
    login_url = 'admin:login'
    
    def get(self, request, *args, **kwargs):
        try:
            requisicao_id = request.GET.get('requisicao_id')
            
            if not requisicao_id:
                return JsonResponse(
                    {'status': 'error', 'message': 'ID da requisição não informado.'},
                    status=400
                )
            
            # Buscar arquivos
            arquivos = RequisicaoArquivo.objects.filter(
                requisicao_id=requisicao_id
            ).select_related('tipo_arquivo').order_by('-data_upload')
            
            arquivos_data = [
                {
                    'id': arq.id,
                    'nome': arq.nome_arquivo,
                    'url': arq.url_arquivo,
                    'tipo': arq.tipo_arquivo.descricao,
                    'data_upload': arq.data_upload.isoformat()
                }
                for arq in arquivos
            ]
            
            return JsonResponse({
                'status': 'success',
                'arquivos': arquivos_data,
                'total': len(arquivos_data)
            })
            
        except Exception as e:
            logger.error(f"Erro ao listar arquivos: {str(e)}", exc_info=True)
            return JsonResponse(
                {'status': 'error', 'message': 'Erro ao listar arquivos.'},
                status=500
            )
