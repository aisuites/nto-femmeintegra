"""
Middleware customizado para o projeto Femme Integra.
"""
from django.conf import settings


class DevelopmentCacheMiddleware:
    """
    Middleware para adicionar headers de cache específicos do Cloudflare.
    
    Em desenvolvimento (DEBUG=True):
    - Adiciona CDN-Cache-Control para Cloudflare fazer bypass
    - NÃO sobrescreve Cache-Control do WhiteNoise (permite cache do navegador)
    
    Em produção (DEBUG=False):
    - Não interfere nos headers de cache
    """
    
    def __init__(self, get_response):
        self.get_response = get_response
    
    def __call__(self, request):
        response = self.get_response(request)
        
        # Apenas em desenvolvimento
        if settings.DEBUG:
            # Header específico para Cloudflare fazer bypass do cache
            # Mas permite que o navegador cachei conforme WhiteNoise configurou
            response['CDN-Cache-Control'] = 'no-cache'
            
            # Não sobrescrever Cache-Control do WhiteNoise
            # WhiteNoise já configurou corretamente com max-age=60
        
        return response
