/**
 * ALERTS.JS - Utilitários Globais de Alertas e Toast
 * 
 * Fornece funções para exibir alertas, mensagens de sucesso e toast.
 * Inclua este arquivo no base_app.html para disponibilizar globalmente.
 * 
 * Uso:
 *   FemmeUtils.mostrarAlerta(elemento, mensagemElemento, 'Erro!', 'error');
 *   FemmeUtils.mostrarToastSucesso('Operação realizada!');
 */

window.FemmeUtils = window.FemmeUtils || {};

(function(FemmeUtils) {
  'use strict';

  /**
   * Mostra um alerta em um elemento específico.
   * 
   * @param {HTMLElement} elemento - Elemento container do alerta
   * @param {HTMLElement} mensagemElemento - Elemento onde a mensagem será inserida
   * @param {string} mensagem - Texto da mensagem
   * @param {string} tipo - Tipo do alerta: 'error', 'success', 'warning', 'info'
   */
  FemmeUtils.mostrarAlerta = function(elemento, mensagemElemento, mensagem, tipo = 'error') {
    if (!elemento || !mensagemElemento) {
      console.warn('[FemmeUtils] Elementos de alerta não encontrados');
      return;
    }
    
    // Remove classes anteriores
    elemento.classList.remove('alert--success', 'alert--error', 'alert--warning', 'alert--info');
    
    // Adiciona classe do tipo
    if (tipo === 'success') {
      elemento.classList.add('alert--success');
    } else if (tipo === 'warning') {
      elemento.classList.add('alert--warning');
    } else if (tipo === 'info') {
      elemento.classList.add('alert--info');
    } else {
      elemento.classList.add('alert--error');
    }
    
    // Define mensagem e exibe
    mensagemElemento.textContent = mensagem;
    elemento.classList.add('alert--visible');
    elemento.style.display = 'flex';
  };

  /**
   * Oculta um alerta.
   * 
   * @param {HTMLElement} elemento - Elemento container do alerta
   */
  FemmeUtils.ocultarAlerta = function(elemento) {
    if (!elemento) return;
    elemento.classList.remove('alert--visible');
    elemento.style.display = 'none';
  };

  /**
   * Oculta todos os alertas da página.
   */
  FemmeUtils.ocultarTodosAlertas = function() {
    document.querySelectorAll('.alert').forEach(function(alerta) {
      alerta.classList.remove('alert--visible');
      alerta.style.display = 'none';
    });
  };

  /**
   * Mostra um toast de sucesso no canto superior direito.
   * O toast desaparece automaticamente após alguns segundos.
   * 
   * @param {string} mensagem - Texto da mensagem
   * @param {number} duracao - Duração em ms (padrão: 4000)
   */
  FemmeUtils.mostrarToastSucesso = function(mensagem, duracao = 4000) {
    // Remove toast existente se houver
    const toastExistente = document.querySelector('.toast-global');
    if (toastExistente) {
      toastExistente.remove();
    }
    
    // Cria o toast
    const toast = document.createElement('div');
    toast.className = 'toast toast-success toast-global';
    toast.innerHTML = `
      <span class="toast-message">${mensagem}</span>
      <button class="toast-close" onclick="this.parentElement.remove()">×</button>
    `;
    
    document.body.appendChild(toast);
    
    // Anima entrada
    requestAnimationFrame(function() {
      toast.classList.add('toast-visible');
    });
    
    // Remove após duração
    setTimeout(function() {
      toast.classList.remove('toast-visible');
      setTimeout(function() {
        if (toast.parentElement) {
          toast.remove();
        }
      }, 300);
    }, duracao);
  };

  /**
   * Mostra um toast de erro no canto superior direito.
   * 
   * @param {string} mensagem - Texto da mensagem
   * @param {number} duracao - Duração em ms (padrão: 5000)
   */
  FemmeUtils.mostrarToastErro = function(mensagem, duracao = 5000) {
    // Remove toast existente se houver
    const toastExistente = document.querySelector('.toast-global');
    if (toastExistente) {
      toastExistente.remove();
    }
    
    // Cria o toast
    const toast = document.createElement('div');
    toast.className = 'toast toast-error toast-global';
    toast.innerHTML = `
      <span class="toast-message">${mensagem}</span>
      <button class="toast-close" onclick="this.parentElement.remove()">×</button>
    `;
    
    document.body.appendChild(toast);
    
    // Anima entrada
    requestAnimationFrame(function() {
      toast.classList.add('toast-visible');
    });
    
    // Remove após duração
    setTimeout(function() {
      toast.classList.remove('toast-visible');
      setTimeout(function() {
        if (toast.parentElement) {
          toast.remove();
        }
      }, 300);
    }, duracao);
  };

  /**
   * Mostra um toast de aviso no canto superior direito.
   * 
   * @param {string} mensagem - Texto da mensagem
   * @param {number} duracao - Duração em ms (padrão: 4000)
   */
  FemmeUtils.mostrarToastAviso = function(mensagem, duracao = 4000) {
    // Remove toast existente se houver
    const toastExistente = document.querySelector('.toast-global');
    if (toastExistente) {
      toastExistente.remove();
    }
    
    // Cria o toast
    const toast = document.createElement('div');
    toast.className = 'toast toast-warning toast-global';
    toast.innerHTML = `
      <span class="toast-message">${mensagem}</span>
      <button class="toast-close" onclick="this.parentElement.remove()">×</button>
    `;
    
    document.body.appendChild(toast);
    
    // Anima entrada
    requestAnimationFrame(function() {
      toast.classList.add('toast-visible');
    });
    
    // Remove após duração
    setTimeout(function() {
      toast.classList.remove('toast-visible');
      setTimeout(function() {
        if (toast.parentElement) {
          toast.remove();
        }
      }, 300);
    }, duracao);
  };

})(window.FemmeUtils);
