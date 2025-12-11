"""
Configuração centralizada de ambiente (DEV/PROD)

Este módulo gerencia automaticamente as URLs e configurações baseadas
no ambiente definido na variável ENVIRONMENT do .env

Para trocar de ambiente, basta alterar no .env:
    ENVIRONMENT=dev  # ou 'prod'

@version 1.0.0
@date 2024-12-11
"""

import os
import logging

logger = logging.getLogger(__name__)


class EnvironmentConfig:
    """
    Gerenciador de configuração de ambiente.
    
    Detecta automaticamente o ambiente (DEV/PROD) e retorna
    as URLs corretas para AWS Lambda e CloudFront.
    """
    
    # Ambientes válidos
    VALID_ENVIRONMENTS = ['dev', 'prod']
    
    def __init__(self):
        """Inicializa e valida a configuração de ambiente."""
        self._environment = self._detect_environment()
        self._validate_config()
        self._log_environment()
    
    def _detect_environment(self) -> str:
        """
        Detecta o ambiente atual baseado em DJANGO_DEBUG.
        
        Returns:
            str: 'dev' ou 'prod'
        """
        # Se ENVIRONMENT existe, usar ela
        env = os.getenv('ENVIRONMENT', '').lower().strip()
        if env in self.VALID_ENVIRONMENTS:
            return env
        
        # Caso contrário, detectar por DJANGO_DEBUG
        debug = os.getenv('DJANGO_DEBUG', 'true').lower() == 'true'
        return 'dev' if debug else 'prod'
    
    def _validate_config(self):
        """Valida se todas as variáveis necessárias estão configuradas."""
        # Verificar se existe AWS_SIGNED_URL_API (sem sufixo) ou com sufixo
        aws_api = os.getenv('AWS_SIGNED_URL_API') or os.getenv(f'AWS_SIGNED_URL_API_{self._environment.upper()}')
        cloudfront = os.getenv(f'CLOUDFRONT_URL_{self._environment.upper()}')
        
        missing_vars = []
        if not aws_api:
            missing_vars.append('AWS_SIGNED_URL_API ou AWS_SIGNED_URL_API_[ENV]')
        if not cloudfront:
            missing_vars.append(f'CLOUDFRONT_URL_{self._environment.upper()}')
        
        if missing_vars:
            logger.error(
                f"Variáveis de ambiente faltando: {', '.join(missing_vars)}"
            )
    
    def _log_environment(self):
        """Loga informações sobre o ambiente atual."""
        logger.info("=" * 80)
        logger.info(f"🌍 AMBIENTE: {self._environment.upper()}")
        logger.info(f"   AWS Signed URL API: {self.aws_signed_url_api}")
        logger.info(f"   CloudFront URL: {self.cloudfront_url}")
        logger.info("=" * 80)
    
    @property
    def environment(self) -> str:
        """Retorna o ambiente atual ('dev' ou 'prod')."""
        return self._environment
    
    @property
    def is_dev(self) -> bool:
        """Retorna True se estiver em desenvolvimento."""
        return self._environment == 'dev'
    
    @property
    def is_prod(self) -> bool:
        """Retorna True se estiver em produção."""
        return self._environment == 'prod'
    
    @property
    def aws_signed_url_api(self) -> str:
        """
        Retorna a URL da API Lambda de signed URL para o ambiente atual.
        Suporta tanto AWS_SIGNED_URL_API quanto AWS_SIGNED_URL_API_[ENV].
        
        Returns:
            str: URL da API Lambda
        """
        # Primeiro tentar variável sem sufixo (compatibilidade)
        url = os.getenv('AWS_SIGNED_URL_API')
        
        # Se não existir, tentar com sufixo do ambiente
        if not url:
            var_name = f'AWS_SIGNED_URL_API_{self._environment.upper()}'
            url = os.getenv(var_name, '')
            
            if not url:
                logger.error(f"Variável AWS_SIGNED_URL_API ou {var_name} não configurada no .env")
        
        return url
    
    @property
    def cloudfront_url(self) -> str:
        """
        Retorna a URL do CloudFront para o ambiente atual.
        
        Returns:
            str: URL do CloudFront
        """
        var_name = f'CLOUDFRONT_URL_{self._environment.upper()}'
        url = os.getenv(var_name, '')
        
        if not url:
            logger.error(f"Variável {var_name} não configurada no .env")
        
        return url
    
    def get_file_url(self, file_key: str) -> str:
        """
        Constrói a URL completa do arquivo no CloudFront.
        
        Args:
            file_key: Chave do arquivo no S3 (ex: 'processing/2/arquivo.pdf')
        
        Returns:
            str: URL completa do arquivo
        """
        cloudfront = self.cloudfront_url
        
        # Garantir que não há barras duplicadas
        if cloudfront.endswith('/'):
            cloudfront = cloudfront[:-1]
        
        if file_key.startswith('/'):
            file_key = file_key[1:]
        
        return f"{cloudfront}/{file_key}"


# Instância global singleton
_config_instance = None


def get_environment_config() -> EnvironmentConfig:
    """
    Retorna a instância singleton de EnvironmentConfig.
    
    Returns:
        EnvironmentConfig: Instância de configuração
    """
    global _config_instance
    
    if _config_instance is None:
        _config_instance = EnvironmentConfig()
    
    return _config_instance


# Atalhos para uso direto
def get_aws_signed_url_api() -> str:
    """Retorna a URL da API Lambda para o ambiente atual."""
    return get_environment_config().aws_signed_url_api


def get_cloudfront_url() -> str:
    """Retorna a URL do CloudFront para o ambiente atual."""
    return get_environment_config().cloudfront_url


def get_file_url(file_key: str) -> str:
    """Constrói a URL completa do arquivo no CloudFront."""
    return get_environment_config().get_file_url(file_key)


def is_production() -> bool:
    """Retorna True se estiver em produção."""
    return get_environment_config().is_prod


def is_development() -> bool:
    """Retorna True se estiver em desenvolvimento."""
    return get_environment_config().is_dev
