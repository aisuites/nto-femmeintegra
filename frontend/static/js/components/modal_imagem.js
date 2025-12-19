/**
 * MODAL_IMAGEM.JS - Componente Global para Visualização de Imagens/PDFs
 * 
 * Fornece modal reutilizável para visualizar imagens e PDFs.
 * Inclua o HTML do modal e este JS na página para usar.
 * 
 * Uso:
 *   ModalImagem.abrir(url, titulo);
 *   ModalImagem.abrirPorRequisicao(requisicaoId);
 *   ModalImagem.fechar();
 */

window.ModalImagem = (function() {
  'use strict';

  // Elementos DOM (cacheados após init)
  let modal = null;
  let imgContainer = null;
  let pdfContainer = null;
  let loading = null;
  let erro = null;
  let img = null;
  let pdf = null;
  let titulo = null;
  let initialized = false;

  /**
   * Inicializa o componente (cacheia elementos DOM)
   */
  function init() {
    if (initialized) return;
    
    modal = document.getElementById('modal-ver-imagem');
    if (!modal) {
      console.warn('[ModalImagem] Modal não encontrado no DOM. Criando dinamicamente...');
      criarModalDinamico();
      modal = document.getElementById('modal-ver-imagem');
    }
    
    imgContainer = document.getElementById('imagem-requisicao-container');
    pdfContainer = document.getElementById('pdf-requisicao-container');
    loading = document.getElementById('imagem-requisicao-loading');
    erro = document.getElementById('imagem-requisicao-erro');
    img = document.getElementById('imagem-requisicao');
    pdf = document.getElementById('pdf-requisicao');
    titulo = modal ? modal.querySelector('.modal-header h3') : null;
    
    // Configurar event listeners
    configurarEventListeners();
    
    initialized = true;
    console.log('[ModalImagem] Componente inicializado');
  }

  /**
   * Cria o modal dinamicamente se não existir no DOM
   */
  function criarModalDinamico() {
    const modalHTML = `
      <div class="modal-overlay" id="modal-ver-imagem" style="display: none;">
        <div class="modal-content modal-lg">
          <div class="modal-header">
            <h3>📄 Visualizar Arquivo</h3>
            <button class="modal-close" id="btn-fechar-modal-imagem" title="Fechar">×</button>
          </div>
          <div class="modal-body" style="padding: 0; min-height: 400px; display: flex; align-items: center; justify-content: center;">
            <!-- Loading -->
            <div id="imagem-requisicao-loading" style="text-align: center; padding: 40px;">
              <div class="spinner" style="width: 40px; height: 40px; margin: 0 auto 16px;"></div>
              <p style="color: #666;">Carregando arquivo...</p>
            </div>
            
            <!-- Container da Imagem -->
            <div id="imagem-requisicao-container" style="display: none; width: 100%; text-align: center;">
              <img id="imagem-requisicao" src="" alt="Imagem da requisição" 
                   style="max-width: 100%; max-height: 70vh; object-fit: contain;">
            </div>
            
            <!-- Container do PDF -->
            <div id="pdf-requisicao-container" style="display: none; width: 100%; height: 70vh;">
              <iframe id="pdf-requisicao" src="" style="width: 100%; height: 100%; border: none;"></iframe>
            </div>
            
            <!-- Erro -->
            <div id="imagem-requisicao-erro" style="display: none; text-align: center; padding: 40px;">
              <p style="color: #dc3545; font-size: 18px;">❌ Arquivo não encontrado</p>
              <p style="color: #666;">Não foi possível carregar o arquivo desta requisição.</p>
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn btn-secondary" id="btn-fechar-imagem">Fechar</button>
          </div>
        </div>
      </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', modalHTML);
  }

  /**
   * Configura event listeners do modal
   */
  function configurarEventListeners() {
    if (!modal) return;
    
    // Botão X no header
    const btnFecharHeader = document.getElementById('btn-fechar-modal-imagem');
    if (btnFecharHeader) {
      btnFecharHeader.addEventListener('click', fechar);
    }
    
    // Botão Fechar no footer
    const btnFecharFooter = document.getElementById('btn-fechar-imagem');
    if (btnFecharFooter) {
      btnFecharFooter.addEventListener('click', fechar);
    }
    
    // Clicar no overlay fecha o modal
    modal.addEventListener('click', function(e) {
      if (e.target === modal) {
        fechar();
      }
    });
    
    // ESC fecha o modal
    document.addEventListener('keydown', function(e) {
      if (e.key === 'Escape' && modal && modal.style.display !== 'none') {
        fechar();
      }
    });
  }

  /**
   * Abre o modal com uma URL específica
   * @param {string} url - URL da imagem ou PDF
   * @param {string} tituloModal - Título opcional do modal
   */
  function abrir(url, tituloModal) {
    init();
    
    if (!modal) {
      console.error('[ModalImagem] Modal não disponível');
      return;
    }
    
    // Atualizar título se fornecido
    if (titulo && tituloModal) {
      titulo.textContent = tituloModal;
    }
    
    // Mostrar modal com loading
    modal.style.display = 'flex';
    if (imgContainer) imgContainer.style.display = 'none';
    if (pdfContainer) pdfContainer.style.display = 'none';
    if (loading) loading.style.display = 'block';
    if (erro) erro.style.display = 'none';
    
    if (!url) {
      if (loading) loading.style.display = 'none';
      if (erro) erro.style.display = 'block';
      return;
    }
    
    const isPdf = url.toLowerCase().endsWith('.pdf');
    
    if (isPdf) {
      // Carregar PDF no iframe
      if (pdf) {
        pdf.src = url;
        pdf.onload = function() {
          if (loading) loading.style.display = 'none';
          if (pdfContainer) pdfContainer.style.display = 'block';
        };
        // Fallback: mostrar após 1 segundo caso onload não dispare
        setTimeout(function() {
          if (loading && loading.style.display !== 'none') {
            loading.style.display = 'none';
            if (pdfContainer) pdfContainer.style.display = 'block';
          }
        }, 1000);
      }
    } else {
      // Carregar imagem
      if (img) {
        img.src = url;
        img.onload = function() {
          if (loading) loading.style.display = 'none';
          if (imgContainer) imgContainer.style.display = 'block';
        };
        img.onerror = function() {
          if (loading) loading.style.display = 'none';
          if (erro) erro.style.display = 'block';
          console.error('[ModalImagem] Erro ao carregar imagem:', url);
        };
      }
    }
  }

  /**
   * Abre o modal buscando o arquivo de uma requisição
   * @param {number} requisicaoId - ID da requisição
   * @param {string} tituloModal - Título opcional do modal
   */
  async function abrirPorRequisicao(requisicaoId, tituloModal) {
    init();
    
    if (!modal) {
      console.error('[ModalImagem] Modal não disponível');
      return;
    }
    
    if (!requisicaoId) {
      FemmeUtils.mostrarToastErro('Nenhuma requisição selecionada');
      return;
    }
    
    // Atualizar título se fornecido
    if (titulo && tituloModal) {
      titulo.textContent = tituloModal;
    }
    
    // Mostrar modal com loading
    modal.style.display = 'flex';
    if (imgContainer) imgContainer.style.display = 'none';
    if (pdfContainer) pdfContainer.style.display = 'none';
    if (loading) loading.style.display = 'block';
    if (erro) erro.style.display = 'none';
    
    try {
      // Usar ArquivoManager se disponível
      if (typeof ArquivoManager !== 'undefined') {
        const result = await ArquivoManager.verificarArquivoExistente(requisicaoId);
        
        if (result.existe && result.arquivo && result.arquivo.url_arquivo) {
          const url = result.arquivo.url_arquivo;
          abrir(url, tituloModal);
          return;
        }
      } else {
        // Fallback: buscar diretamente
        const response = await fetch(`/operacao/upload/verificar-existente/?requisicao_id=${requisicaoId}`);
        const result = await response.json();
        
        if (result.existe && result.arquivo && result.arquivo.url_arquivo) {
          const url = result.arquivo.url_arquivo;
          abrir(url, tituloModal);
          return;
        }
      }
      
      // Sem arquivo encontrado
      if (loading) loading.style.display = 'none';
      if (erro) erro.style.display = 'block';
      
    } catch (error) {
      console.error('[ModalImagem] Erro ao buscar arquivo:', error);
      if (loading) loading.style.display = 'none';
      if (erro) erro.style.display = 'block';
    }
  }

  /**
   * Fecha o modal
   */
  function fechar() {
    if (!modal) return;
    
    modal.style.display = 'none';
    
    // Limpar src para liberar memória
    if (img) img.src = '';
    if (pdf) pdf.src = '';
  }

  // API Pública
  return {
    init: init,
    abrir: abrir,
    abrirPorRequisicao: abrirPorRequisicao,
    fechar: fechar
  };

})();

// Auto-inicializar quando DOM estiver pronto
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', function() {
    ModalImagem.init();
  });
} else {
  ModalImagem.init();
}
