/**
 * CONFIG.JS - Gerenciador de Configurações e Ambiente
 * 
 * Centraliza configurações do frontend incluindo URLs de API
 * e detecção automática de ambiente (DEV/PROD).
 * 
 * USO:
 * import { API_BASE_URL, ENVIRONMENT } from './config.js';
 * 
 * ou em HTML:
 * <script src="{% static 'js/config.js' %}"></script>
 * 
 * @version 1.0.0
 * @date 2024-12-11
 */

const AppConfig = (function() {
  'use strict';
  
  // ============================================
  // DETECÇÃO AUTOMÁTICA DE AMBIENTE
  // ============================================
  
  /**
   * Detecta ambiente baseado na URL atual
   * @returns {'dev'|'prod'} Ambiente atual
   */
  function detectEnvironment() {
    const hostname = window.location.hostname;
    
    // Desenvolvimento
    if (hostname === 'localhost' || 
        hostname === '127.0.0.1' || 
        hostname.includes('192.168.') ||
        hostname.includes('.local')) {
      return 'dev';
    }
    
    // Produção
    return 'prod';
  }
  
  // ============================================
  // CONFIGURAÇÕES POR AMBIENTE
  // ============================================
  
  const ENVIRONMENTS = {
    dev: {
      name: 'Desenvolvimento',
      apiBaseUrl: 'http://127.0.0.1:8000',
      awsSignedUrlApi: 'https://a5xel8q8ld.execute-api.us-east-1.amazonaws.com/dev/signed-url',
      cloudfrontUrl: 'https://d3fdwvz6ilbr80.cloudfront.net',
      debug: true,
    },
    prod: {
      name: 'Produção',
      apiBaseUrl: 'https://api.femme.com.br',  // TODO: Ajustar quando tiver domínio prod
      awsSignedUrlApi: 'https://a5xel8q8ld.execute-api.us-east-1.amazonaws.com/prod/signed-url',  // TODO: Ajustar para prod
      cloudfrontUrl: 'https://d62ucrzqdbxhj.cloudfront.net',
      debug: false,
    }
  };
  
  // Detectar ambiente atual
  const CURRENT_ENV = detectEnvironment();
  const CONFIG = ENVIRONMENTS[CURRENT_ENV];
  
  // ============================================
  // UTILITÁRIOS
  // ============================================
  
  /**
   * Obtém CSRF token do cookie
   */
  function getCsrfToken() {
    let cookieValue = null;
    if (document.cookie && document.cookie !== '') {
      const cookies = document.cookie.split(';');
      for (let i = 0; i < cookies.length; i++) {
        const cookie = cookies[i].trim();
        if (cookie.substring(0, 10) === 'csrftoken=') {
          cookieValue = decodeURIComponent(cookie.substring(10));
          break;
        }
      }
    }
    return cookieValue;
  }
  
  /**
   * Monta URL completa da API
   * @param {string} endpoint - Endpoint da API (ex: '/operacao/upload/')
   * @returns {string} URL completa
   */
  function buildApiUrl(endpoint) {
    // Se o endpoint já for uma URL completa, retorna ela
    if (endpoint.startsWith('http://') || endpoint.startsWith('https://')) {
      return endpoint;
    }
    
    // Remove barra inicial duplicada se houver
    const cleanEndpoint = endpoint.startsWith('/') ? endpoint : '/' + endpoint;
    
    return CONFIG.apiBaseUrl + cleanEndpoint;
  }
  
  /**
   * Cria headers padrão para requisições
   * @param {boolean} includeAuth - Incluir token de autenticação
   * @returns {Object} Headers
   */
  function getDefaultHeaders(includeAuth = true) {
    const headers = {
      'Content-Type': 'application/json',
    };
    
    if (includeAuth) {
      const csrfToken = getCsrfToken();
      if (csrfToken) {
        headers['X-CSRFToken'] = csrfToken;
      }
    }
    
    return headers;
  }
  
  /**
   * Log condicional baseado no ambiente
   */
  function log(...args) {
    if (CONFIG.debug) {
      console.log('[AppConfig]', ...args);
    }
  }
  
  // Log inicial
  log('Ambiente detectado:', CURRENT_ENV.toUpperCase(), CONFIG);
  
  // ============================================
  // API PÚBLICA
  // ============================================
  
  return {
    // Configurações
    ENVIRONMENT: CURRENT_ENV,
    API_BASE_URL: CONFIG.apiBaseUrl,
    AWS_SIGNED_URL_API: CONFIG.awsSignedUrlApi,
    CLOUDFRONT_URL: CONFIG.cloudfrontUrl,
    DEBUG: CONFIG.debug,
    ENV_NAME: CONFIG.name,
    
    // Métodos utilitários
    getCsrfToken,
    buildApiUrl,
    getDefaultHeaders,
    log,
    
    /**
     * Verifica se está em desenvolvimento
     */
    isDev: () => CURRENT_ENV === 'dev',
    
    /**
     * Verifica se está em produção
     */
    isProd: () => CURRENT_ENV === 'prod',
    
    /**
     * Obtém configuração específica
     * @param {string} key - Chave da configuração
     */
    get: (key) => CONFIG[key],
  };
  
})();

// Expor globalmente
window.AppConfig = AppConfig;

// Log de inicialização
if (AppConfig.DEBUG) {
  console.log('🌍 AppConfig inicializado:', {
    ambiente: AppConfig.ENVIRONMENT,
    nome: AppConfig.ENV_NAME,
    apiBaseUrl: AppConfig.API_BASE_URL,
    debug: AppConfig.DEBUG
  });
}
