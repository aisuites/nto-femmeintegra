/**
 * CSRF.JS - Utilitário Global para Token CSRF
 * 
 * Fornece função única para obter o token CSRF do Django.
 * Inclua este arquivo no base_app.html para disponibilizar globalmente.
 * 
 * Uso:
 *   const token = FemmeUtils.getCsrfToken();
 */

window.FemmeUtils = window.FemmeUtils || {};

(function(FemmeUtils) {
  'use strict';

  /**
   * Obtém o token CSRF do Django.
   * Tenta primeiro o input hidden, depois o cookie.
   * 
   * @returns {string} Token CSRF ou string vazia se não encontrado
   */
  FemmeUtils.getCsrfToken = function() {
    // Primeiro tenta pegar do input hidden gerado pelo {% csrf_token %}
    const csrfInput = document.querySelector('input[name="csrfmiddlewaretoken"]');
    if (csrfInput) {
      return csrfInput.value;
    }
    
    // Fallback: pegar do cookie
    const cookies = document.cookie.split(';');
    for (let cookie of cookies) {
      const [name, value] = cookie.trim().split('=');
      if (name === 'csrftoken') {
        return value;
      }
    }
    
    console.warn('[FemmeUtils] Token CSRF não encontrado');
    return '';
  };

  /**
   * Retorna headers padrão para requisições fetch com CSRF.
   * 
   * @returns {Object} Headers com Content-Type e X-CSRFToken
   */
  FemmeUtils.getDefaultHeaders = function() {
    return {
      'Content-Type': 'application/json',
      'X-CSRFToken': FemmeUtils.getCsrfToken()
    };
  };

})(window.FemmeUtils);
