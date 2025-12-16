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
        
        if response.success and response.data:
            # Verificar se retornou dados do paciente
            # A API pode retornar lista vazia ou objeto vazio se não encontrar
            if isinstance(response.data, list) and len(response.data) == 0:
                return APIResponse(
                    success=False,
                    error='CPF não encontrado na base FEMME.'
                )
            elif isinstance(response.data, dict) and not response.data:
                return APIResponse(
                    success=False,
                    error='CPF não encontrado na base FEMME.'
                )
        
        return response


# Instância singleton para uso em views
_korus_client: Optional[KorusAPIClient] = None


def get_korus_client() -> KorusAPIClient:
    """
    Retorna instância do cliente Korus.
    
    Returns:
        KorusAPIClient configurado
    """
    global _korus_client
    if _korus_client is None:
        _korus_client = KorusAPIClient()
    return _korus_client
