"""
Serviço para integração com APIs externas.

Este módulo fornece classes reutilizáveis para autenticação e comunicação
com APIs externas como Korus, facilitando a adição de novas integrações.

@version 1.0.0
@date 2024-12-16
"""

import logging
import os
from abc import ABC, abstractmethod
from dataclasses import dataclass
from typing import Any, Dict, Optional

import requests
from requests.exceptions import RequestException, Timeout

logger = logging.getLogger(__name__)


@dataclass
class APIResponse:
    """Resposta padronizada de APIs externas."""
    success: bool
    data: Optional[Dict[str, Any]] = None
    error: Optional[str] = None
    status_code: Optional[int] = None


class ExternalAPIClient(ABC):
    """
    Classe base abstrata para clientes de APIs externas.
    
    Fornece estrutura comum para autenticação e requisições HTTP.
    Subclasses devem implementar os métodos abstratos.
    """
    
    def __init__(self, base_url: str, timeout: int = 20):
        self.base_url = base_url.rstrip('/')
        self.timeout = timeout
        self._token: Optional[str] = None
    
    @abstractmethod
    def authenticate(self) -> bool:
        """Realiza autenticação na API e armazena token."""
        pass
    
    def _make_request(
        self,
        method: str,
        endpoint: str,
        data: Optional[Dict] = None,
        params: Optional[Dict] = None,
        headers: Optional[Dict] = None,
        require_auth: bool = True
    ) -> APIResponse:
        """
        Realiza requisição HTTP para a API.
        
        Args:
            method: Método HTTP (GET, POST, PUT, DELETE)
            endpoint: Endpoint da API (sem base_url)
            data: Dados para enviar no body (JSON)
            params: Query parameters
            headers: Headers adicionais
            require_auth: Se True, adiciona token de autenticação
        
        Returns:
            APIResponse com resultado da requisição
        """
        url = f"{self.base_url}/{endpoint.lstrip('/')}"
        
        request_headers = {
            'Content-Type': 'application/json',
            'User-Agent': 'FEMME-Integra/1.0'
        }
        
        if headers:
            request_headers.update(headers)
        
        if require_auth:
            if not self._token:
                if not self.authenticate():
                    return APIResponse(
                        success=False,
                        error='Falha na autenticação com a API externa.'
                    )
            request_headers['Authorization'] = self._token
        
        try:
            response = requests.request(
                method=method.upper(),
                url=url,
                json=data,
                params=params,
                headers=request_headers,
                timeout=self.timeout
            )
            
            # Tentar parsear JSON
            try:
                response_data = response.json()
            except ValueError:
                response_data = {'raw': response.text}
            
            if response.ok:
                return APIResponse(
                    success=True,
                    data=response_data,
                    status_code=response.status_code
                )
            else:
                return APIResponse(
                    success=False,
                    data=response_data,
                    error=f'Erro na API: HTTP {response.status_code}',
                    status_code=response.status_code
                )
                
        except Timeout:
            logger.error(f"Timeout ao acessar {url}")
            return APIResponse(
                success=False,
                error='Tempo limite excedido ao acessar a API externa.'
            )
        except RequestException as e:
            logger.error(f"Erro de conexão com {url}: {str(e)}")
            return APIResponse(
                success=False,
                error='Erro de conexão com a API externa.'
            )
        except Exception as e:
            logger.error(f"Erro inesperado ao acessar {url}: {str(e)}", exc_info=True)
            return APIResponse(
                success=False,
                error='Erro inesperado ao acessar a API externa.'
            )


class KorusAPIClient(ExternalAPIClient):
    """
    Cliente para API Korus (consulta de pacientes por CPF).
    
    Uso:
        client = KorusAPIClient()
        response = client.buscar_paciente_por_cpf('12345678900')
        if response.success:
            print(response.data)
    """
    
    def __init__(self):
        base_url = os.getenv('KORUS_API_URL', 'https://agendamento-digital-b3-rw-femme.pixeon.cloud/api/femme')
        timeout = int(os.getenv('KORUS_API_TIMEOUT', '20'))
        super().__init__(base_url, timeout)
        
        self._login = os.getenv('KORUS_API_LOGIN', '')
        self._password = os.getenv('KORUS_API_PASSWORD', '')
    
    def authenticate(self) -> bool:
        """
        Autentica na API Korus e obtém token Bearer.
        
        Returns:
            True se autenticação bem-sucedida, False caso contrário
        """
        if not self._login or not self._password:
            logger.error("Credenciais da API Korus não configuradas")
            return False
        
        try:
            response = requests.post(
                f"{self.base_url}/Autenticacao",
                json={
                    'login': self._login,
                    'senha': self._password
                },
                headers={
                    'Content-Type': 'application/json',
                    'User-Agent': 'FEMME-Integra/1.0'
                },
                timeout=self.timeout
            )
            
            if response.ok:
                data = response.json()
                access_token = data.get('access_token')
                
                if access_token:
                    self._token = f'Bearer {access_token}'
                    logger.info("Autenticação Korus bem-sucedida")
                    return True
                else:
                    logger.error("Token não encontrado na resposta da API Korus")
                    return False
            else:
                logger.error(f"Erro na autenticação Korus: HTTP {response.status_code}")
                return False
                
        except Timeout:
            logger.error("Timeout na autenticação Korus")
            return False
        except RequestException as e:
            logger.error(f"Erro de conexão na autenticação Korus: {str(e)}")
            return False
        except Exception as e:
            logger.error(f"Erro inesperado na autenticação Korus: {str(e)}", exc_info=True)
            return False
    
    def buscar_paciente_por_cpf(self, cpf: str) -> APIResponse:
        """
        Busca dados de paciente por CPF na API Korus.
        
        Args:
            cpf: CPF do paciente (apenas números ou formatado)
        
        Returns:
            APIResponse com dados do paciente ou erro
        """
        # Limpar CPF (remover pontos e traços)
        cpf_limpo = cpf.replace('.', '').replace('-', '').strip()
        
        if not cpf_limpo or len(cpf_limpo) != 11:
            return APIResponse(
                success=False,
                error='CPF inválido. Informe 11 dígitos.'
            )
        
        logger.info(f"Buscando paciente por CPF: {cpf_limpo[:3]}***{cpf_limpo[-2:]}")
        
        response = self._make_request(
            method='GET',
            endpoint=f'/paciente/cpf?cpf={cpf_limpo}',
            require_auth=True
        )
        
        # Log da resposta para debug
        logger.info(f"Resposta Korus - success={response.success}, status={response.status_code}, data={response.data}, error={response.error}")
        
        # Tratar caso de CPF não encontrado (pode vir como 404 ou lista/objeto vazio)
        if response.status_code == 404:
            return APIResponse(
                success=False,
                error='CPF não encontrado na base FEMME.'
            )
        
        if response.success and response.data:
            # Verificar se retornou dados do paciente
            # A API pode retornar lista vazia ou objeto vazio se não encontrar
            if isinstance(response.data, list) and len(response.data) == 0:
                return APIResponse(
                    success=False,
                    error='CPF não encontrado na base FEMME.'
                )
            elif isinstance(response.data, dict):
                # Verificar se é objeto vazio ou tem mensagem de erro
                if not response.data:
                    return APIResponse(
                        success=False,
                        error='CPF não encontrado na base FEMME.'
                    )
                # Verificar se a API retornou mensagem de erro no corpo
                if response.data.get('erro') or response.data.get('error') or response.data.get('message'):
                    msg = response.data.get('erro') or response.data.get('error') or response.data.get('message')
                    return APIResponse(
                        success=False,
                        error=str(msg) if 'não encontrado' not in str(msg).lower() else 'CPF não encontrado na base FEMME.'
                    )
        
        return response


def get_korus_client() -> KorusAPIClient:
    """
    Retorna nova instância do cliente Korus.
    Sempre gera novo token a cada requisição conforme especificado.
    
    Returns:
        KorusAPIClient configurado
    """
    return KorusAPIClient()


class ReceitaAPIClient:
    """
    Cliente para API de consulta de CPF na Receita Federal.
    Utiliza o serviço Hub do Desenvolvedor.
    
    Endpoint: GET https://ws.hubdodesenvolvedor.com.br/v2/cpf/?cpf={cpf}&token={token}
    
    Resposta esperada:
    {
        "status": true,
        "return": "OK",
        "result": {
            "numero_de_cpf": "005.392.877-68",
            "nome_da_pf": "NOME DA PESSOA",
            "data_nascimento": "26/08/1939",
            "situacao_cadastral": "REGULAR"
        }
    }
    """
    
    def __init__(self):
        self.base_url = os.environ.get('RECEITA_API_URL', 'https://ws.hubdodesenvolvedor.com.br/v2/cpf/')
        self.token = os.environ.get('RECEITA_API_TOKEN', '')
        self.timeout = int(os.environ.get('RECEITA_API_TIMEOUT', '20'))
        
        if not self.token:
            logger.warning("RECEITA_API_TOKEN não configurado no ambiente")
    
    def buscar_cpf(self, cpf: str) -> APIResponse:
        """
        Busca dados de CPF na Receita Federal.
        
        Args:
            cpf: CPF a ser consultado (apenas números)
            
        Returns:
            APIResponse com dados do CPF ou erro
        """
        # Limpar CPF
        cpf_limpo = cpf.replace('.', '').replace('-', '').strip()
        
        if not cpf_limpo or len(cpf_limpo) != 11:
            return APIResponse(
                success=False,
                error='CPF inválido. Informe 11 dígitos.'
            )
        
        if not self.token:
            return APIResponse(
                success=False,
                error='Token da API Receita não configurado.'
            )
        
        try:
            url = f"{self.base_url}?cpf={cpf_limpo}&token={self.token}"
            
            logger.info(f"Consultando CPF na Receita: {cpf_limpo[:3]}***{cpf_limpo[-2:]}")
            
            response = requests.get(
                url,
                timeout=self.timeout,
                headers={
                    'Content-Type': 'application/json'
                }
            )
            
            logger.info(f"Resposta Receita - status_code={response.status_code}")
            
            if response.status_code != 200:
                return APIResponse(
                    success=False,
                    status_code=response.status_code,
                    error=f'Erro na API Receita: HTTP {response.status_code}'
                )
            
            data = response.json()
            
            # Verificar se a consulta foi bem-sucedida
            if not data.get('status'):
                error_msg = data.get('message') or data.get('return') or 'CPF não encontrado na Receita Federal.'
                logger.warning(f"CPF não encontrado na Receita: {error_msg}")
                return APIResponse(
                    success=False,
                    error='CPF não encontrado na Receita Federal.'
                )
            
            result = data.get('result', {})
            
            if not result:
                return APIResponse(
                    success=False,
                    error='CPF não encontrado na Receita Federal.'
                )
            
            logger.info(f"CPF encontrado na Receita: {result.get('nome_da_pf', 'N/A')[:20]}...")
            
            return APIResponse(
                success=True,
                status_code=200,
                data=result
            )
            
        except requests.exceptions.Timeout:
            logger.error("Timeout ao consultar API Receita")
            return APIResponse(
                success=False,
                error='Timeout ao consultar Receita Federal. Tente novamente.'
            )
        except requests.exceptions.RequestException as e:
            logger.error(f"Erro de conexão com API Receita: {str(e)}")
            return APIResponse(
                success=False,
                error='Erro ao conectar com a Receita Federal. Tente novamente.'
            )
        except Exception as e:
            logger.error(f"Erro inesperado ao consultar API Receita: {str(e)}", exc_info=True)
            return APIResponse(
                success=False,
                error='Erro inesperado ao consultar CPF.'
            )


def get_receita_client() -> ReceitaAPIClient:
    """
    Retorna nova instância do cliente Receita.
    
    Returns:
        ReceitaAPIClient configurado
    """
    return ReceitaAPIClient()


class FemmeAPIClient:
    """
    Cliente para API FEMME de validação de médicos.
    
    Fluxo:
    1. Gerar token: POST /token (client_credentials)
    2. Consultar médico: GET /medicos?uf_crm={uf}&crm={crm}
    
    Resposta esperada:
    {
        "data": {
            "medicos": [
                {
                    "id_medico": "273709",
                    "nome_medico": "NOME DO MÉDICO",
                    "crm": "185442",
                    "uf_crm": "SE",
                    "logradouro": "FREI CANECA",
                    "destino": "INTERNET"
                }
            ]
        }
    }
    """
    
    def __init__(self):
        self.base_url = os.environ.get('FEMME_API_URL', 'https://bi14ljafz0.execute-api.us-east-1.amazonaws.com/dev')
        self.client_id = os.environ.get('FEMME_API_CLIENT_ID', '')
        self.client_secret = os.environ.get('FEMME_API_CLIENT_SECRET', '')
        self.timeout = int(os.environ.get('FEMME_API_TIMEOUT', '20'))
        
        if not self.client_id or not self.client_secret:
            logger.warning("FEMME_API_CLIENT_ID ou FEMME_API_CLIENT_SECRET não configurados")
    
    def _gerar_token(self) -> str | None:
        """
        Gera token de autenticação via client_credentials.
        
        Returns:
            Token de acesso ou None em caso de erro
        """
        try:
            url = f"{self.base_url}/token"
            
            logger.info("Gerando token FEMME API...")
            
            response = requests.post(
                url,
                data={
                    'grant_type': 'client_credentials',
                    'client_id': self.client_id,
                    'client_secret': self.client_secret
                },
                headers={
                    'Content-Type': 'application/x-www-form-urlencoded'
                },
                timeout=self.timeout
            )
            
            if response.status_code != 200:
                logger.error(f"Erro ao gerar token FEMME: HTTP {response.status_code}")
                return None
            
            data = response.json()
            token = data.get('access_token')
            
            if token:
                logger.info("Token FEMME gerado com sucesso")
                return token
            else:
                logger.error("Token não encontrado na resposta")
                return None
                
        except Exception as e:
            logger.error(f"Exceção ao gerar token FEMME: {str(e)}", exc_info=True)
            return None
    
    def buscar_medico(self, crm: str, uf_crm: str) -> APIResponse:
        """
        Busca médico por CRM e UF.
        
        Args:
            crm: Número do CRM
            uf_crm: UF do CRM (ex: SP, RJ)
            
        Returns:
            APIResponse com lista de médicos ou erro
        """
        # Validar parâmetros
        crm_limpo = crm.strip()
        uf_limpo = uf_crm.strip().upper()
        
        if not crm_limpo:
            return APIResponse(
                success=False,
                error='CRM não informado.'
            )
        
        if not uf_limpo or len(uf_limpo) != 2:
            return APIResponse(
                success=False,
                error='UF do CRM inválida. Informe 2 caracteres.'
            )
        
        if not self.client_id or not self.client_secret:
            return APIResponse(
                success=False,
                error='Credenciais da API FEMME não configuradas.'
            )
        
        # Gerar token
        token = self._gerar_token()
        if not token:
            return APIResponse(
                success=False,
                error='Erro ao autenticar na API FEMME.'
            )
        
        try:
            url = f"{self.base_url}/medicos"
            
            logger.info(f"Consultando médico na API FEMME: CRM={crm_limpo}, UF={uf_limpo}")
            
            response = requests.get(
                url,
                params={
                    'crm': crm_limpo,
                    'uf_crm': uf_limpo.lower()  # API espera UF em minúsculo
                },
                headers={
                    'Authorization': f'Bearer {token}',
                    'Accept': 'application/json'
                },
                timeout=self.timeout
            )
            
            logger.info(f"Resposta FEMME API - status_code={response.status_code}")
            
            if response.status_code == 401:
                return APIResponse(
                    success=False,
                    status_code=401,
                    error='Token expirado ou inválido.'
                )
            
            if response.status_code != 200:
                return APIResponse(
                    success=False,
                    status_code=response.status_code,
                    error=f'Erro na API FEMME: HTTP {response.status_code}'
                )
            
            data = response.json()
            
            # Extrair lista de médicos
            medicos = data.get('data', {}).get('medicos', [])
            
            if not medicos:
                logger.warning(f"Médico não encontrado: CRM={crm_limpo}, UF={uf_limpo}")
                return APIResponse(
                    success=False,
                    error='Médico não encontrado.'
                )
            
            logger.info(f"Médico(s) encontrado(s): {len(medicos)} registro(s)")
            
            return APIResponse(
                success=True,
                status_code=200,
                data=medicos
            )
            
        except requests.exceptions.Timeout:
            logger.error("Timeout ao consultar API FEMME")
            return APIResponse(
                success=False,
                error='Timeout ao consultar API. Tente novamente.'
            )
        except requests.exceptions.RequestException as e:
            logger.error(f"Erro de conexão com API FEMME: {str(e)}")
            return APIResponse(
                success=False,
                error='Erro ao conectar com a API. Tente novamente.'
            )
        except Exception as e:
            logger.error(f"Erro inesperado ao consultar API FEMME: {str(e)}", exc_info=True)
            return APIResponse(
                success=False,
                error='Erro inesperado ao consultar médico.'
            )


def get_femme_client() -> FemmeAPIClient:
    """
    Retorna nova instância do cliente FEMME.
    
    Returns:
        FemmeAPIClient configurado
    """
    return FemmeAPIClient()
