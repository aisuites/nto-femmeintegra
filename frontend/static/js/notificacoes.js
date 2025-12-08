/**
 * NOTIFICAÇÕES - Sistema de Notificações em Tempo Real
 * 
 * Gerencia sininho no header, badge de contador e modal de notificações.
 * Atualiza ao fazer login e permite polling futuro.
 */

(function() {
  'use strict';

  // Elementos DOM
  const btnNotificacoes = document.getElementById('btn-notificacoes');
  const badgeNotificacoes = document.getElementById('notificacoes-badge');
  const modalNotificacoes = document.getElementById('modal-notificacoes');
  const modalOverlay = document.getElementById('modal-notificacoes-overlay');
  const modalClose = document.getElementById('modal-notificacoes-close');
  const modalBody = document.getElementById('modal-notificacoes-body');
  const btnMarcarTodasLidas = document.getElementById('btn-marcar-todas-lidas');

  // Estado
  let notificacoesCache = [];

  /**
   * Busca contador de notificações não lidas
   */
  async function atualizarContador() {
    try {
      const response = await fetch('/operacao/notificacoes/contador/');
      const data = await response.json();

      if (data.status === 'success') {
        const contador = data.contador;
        
        if (contador > 0) {
          badgeNotificacoes.textContent = contador > 99 ? '99+' : contador;
          badgeNotificacoes.style.display = 'flex';
        } else {
          badgeNotificacoes.style.display = 'none';
        }
      }
    } catch (error) {
      console.error('Erro ao buscar contador de notificações:', error);
    }
  }

  /**
   * Busca lista de notificações
   */
  async function carregarNotificacoes() {
    try {
      // Mostrar loading
      modalBody.innerHTML = `
        <div class="notificacoes-loading">
          <div class="spinner"></div>
          <p>Carregando notificações...</p>
        </div>
      `;

      const response = await fetch('/operacao/notificacoes/listar/');
      const data = await response.json();

      if (data.status === 'success') {
        notificacoesCache = data.notificacoes;
        renderizarNotificacoes(data.notificacoes);
      } else {
        mostrarErro('Erro ao carregar notificações.');
      }
    } catch (error) {
      console.error('Erro ao carregar notificações:', error);
      mostrarErro('Erro ao carregar notificações. Tente novamente.');
    }
  }

  /**
   * Renderiza lista de notificações no modal
   */
  function renderizarNotificacoes(notificacoes) {
    if (!notificacoes || notificacoes.length === 0) {
      modalBody.innerHTML = `
        <div class="notificacoes-vazio">
          <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
            <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
          </svg>
          <p>Nenhuma notificação</p>
        </div>
      `;
      btnMarcarTodasLidas.disabled = true;
      return;
    }

    const html = `
      <div class="notificacoes-lista">
        ${notificacoes.map(notif => `
          <div class="notificacao-item ${notif.lida ? 'lida' : ''}" data-id="${notif.id}">
            <div class="notificacao-header">
              <h4 class="notificacao-titulo">${notif.titulo}</h4>
              <span class="notificacao-data">${notif.created_at}</span>
            </div>
            <p class="notificacao-mensagem">${notif.mensagem}</p>
            <span class="notificacao-tipo ${notif.tipo}">${notif.tipo}</span>
          </div>
        `).join('')}
      </div>
    `;

    modalBody.innerHTML = html;
    
    // Habilitar/desabilitar botão de marcar todas como lidas
    const temNaoLidas = notificacoes.some(n => !n.lida);
    btnMarcarTodasLidas.disabled = !temNaoLidas;
  }

  /**
   * Mostra mensagem de erro
   */
  function mostrarErro(mensagem) {
    modalBody.innerHTML = `
      <div class="notificacoes-vazio">
        <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
          <circle cx="12" cy="12" r="10"></circle>
          <line x1="12" y1="8" x2="12" y2="12"></line>
          <line x1="12" y1="16" x2="12.01" y2="16"></line>
        </svg>
        <p>${mensagem}</p>
      </div>
    `;
  }

  /**
   * Abre modal de notificações
   */
  function abrirModal() {
    modalNotificacoes.style.display = 'flex';
    carregarNotificacoes();
  }

  /**
   * Fecha modal de notificações
   */
  function fecharModal() {
    modalNotificacoes.style.display = 'none';
  }

  /**
   * Marca todas as notificações como lidas
   */
  async function marcarTodasComoLidas() {
    try {
      btnMarcarTodasLidas.disabled = true;
      btnMarcarTodasLidas.textContent = 'Marcando...';

      const response = await fetch('/operacao/notificacoes/marcar-todas-lidas/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRFToken': getCookie('csrftoken'),
        },
      });

      const data = await response.json();

      if (data.status === 'success') {
        // Atualizar contador
        await atualizarContador();
        
        // Recarregar notificações
        await carregarNotificacoes();
      } else {
        alert(data.message || 'Erro ao marcar notificações como lidas.');
      }
    } catch (error) {
      console.error('Erro ao marcar notificações:', error);
      alert('Erro ao marcar notificações. Tente novamente.');
    } finally {
      btnMarcarTodasLidas.textContent = 'Marcar todas como lidas';
    }
  }

  /**
   * Obtém cookie CSRF
   */
  function getCookie(name) {
    const cookieValue = document.cookie
      .split('; ')
      .find(row => row.startsWith(name + '='))
      ?.split('=')[1];
    return cookieValue;
  }

  /**
   * Inicializa sistema de notificações
   */
  function init() {
    if (!btnNotificacoes) {
      console.warn('Botão de notificações não encontrado');
      return;
    }

    // Event listeners
    btnNotificacoes.addEventListener('click', abrirModal);
    modalClose.addEventListener('click', fecharModal);
    modalOverlay.addEventListener('click', fecharModal);
    btnMarcarTodasLidas.addEventListener('click', marcarTodasComoLidas);

    // Fechar modal com ESC
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && modalNotificacoes.style.display === 'flex') {
        fecharModal();
      }
    });

    // Atualizar contador ao carregar página
    atualizarContador();
  }

  // Inicializar quando DOM estiver pronto
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  // Exportar funções para uso global (se necessário)
  window.Notificacoes = {
    atualizarContador,
    abrirModal,
    fecharModal,
  };

})();
