/**
 * SCANNER.JS - Módulo do Scanner Dynamsoft
 * 
 * Gerencia toda lógica de integração com Dynamsoft Web TWAIN SDK:
 * - Carregamento dinâmico de scripts
 * - Inicialização do scanner
 * - Detecção e seleção de scanners
 * - Digitalização de imagens
 * - Manipulação de imagens (zoom, rotação, etc)
 * 
 * Padrão: Module (IIFE) para encapsulamento
 * 
 * API Pública:
 * - DynamosoftScanner.init(license) - Inicializar com licença
 * - DynamosoftScanner.open() - Abrir modal do scanner
 * 
 * @version 1.0.1
 * @date 2024-12-11
 */

const DynamosoftScanner = (function() {
  'use strict';
  
  // ============================================
  // CONSTANTES
  // ============================================
  
  const CONFIG = {
    resourcesPath: '/static/dynamsoft',
    appVersion: '1.0.2',  // Incrementado para forçar reload após mudanças
    license: null,
    debug: false  // Será configurado externamente
  };
  
  const SCANNER_CONFIG = {
    timeout: 10000,
    pixelType: 2, // COLOR
    resolution: 300,
    errorCodeTimeout: -2322
  };
  
  // ============================================
  // VARIÁVEIS PRIVADAS
  // ============================================
  
  let DWTObject = null;
  let scriptsCarregados = false;
  let eventListenersConfigurados = false;
  let inicializacaoEmAndamento = false;
  let inicializacaoPromise = null;
  
  // ============================================
  // UTILITÁRIOS PRIVADOS
  // ============================================
  
  function log(...args) {
    if (CONFIG.debug) {
      console.log('[Scanner]', ...args);
    }
  }
  
  function logError(...args) {
    console.error('[Scanner]', ...args);
  }
  
  // ============================================
  // CARREGAMENTO DE SCRIPTS
  // ============================================
  
  /**
   * Carrega scripts do Dynamsoft dinamicamente
   * @private
   */
  function carregarScriptsDynamsoft() {
    return new Promise((resolve, reject) => {
      log('Carregando scripts Dynamsoft...');
      
      // Configurar Dynamsoft globalmente
      window.Dynamsoft = window.Dynamsoft || {};
      Dynamsoft.DWT = Dynamsoft.DWT || {};
      Dynamsoft.DWT.ResourcesPath = CONFIG.resourcesPath;
      Dynamsoft.DWT.ProductKey = CONFIG.license;
      
      // Outras configurações estão em dynamsoft.webtwain.config.js
      // (AutoLoad, UseLocalService, IfCheckDWTVersion, IfUpdateService)
      
      log('ProductKey configurada:', CONFIG.license ? 
        CONFIG.license.substring(0, 30) + '... (tamanho: ' + CONFIG.license.length + ')' : 
        '❌ VAZIA');
      
      // Scripts a carregar
      const scripts = [
        CONFIG.resourcesPath + '/dynamsoft.webtwain.initiate.js?v=' + CONFIG.appVersion,
        CONFIG.resourcesPath + '/dynamsoft.webtwain.config.js?v=' + CONFIG.appVersion
      ];
      
      let carregados = 0;
      
      scripts.forEach((src, index) => {
        const script = document.createElement('script');
        script.src = src;
        
        script.onload = () => {
          carregados++;
          log(`Script ${carregados}/${scripts.length} carregado`);
          
          if (carregados === scripts.length) {
            scriptsCarregados = true;
            log('Todos os scripts carregados!');
            resolve();
          }
        };
        
        script.onerror = () => {
          logError('Erro ao carregar script:', src);
          reject(new Error('Falha ao carregar scripts Dynamsoft'));
        };
        
        document.head.appendChild(script);
      });
    });
  }
  
  // ============================================
  // INICIALIZAÇÃO DO DYNAMSOFT
  // ============================================
  
  /**
   * Inicializa o Dynamsoft Web TWAIN
   * @private
   */
  function inicializarDynamsoft() {
    return new Promise((resolve, reject) => {
      if (typeof Dynamsoft === 'undefined' || !Dynamsoft.DWT) {
        reject(new Error('Dynamsoft não está disponível'));
        return;
      }
      
      // Registrar eventos
      Dynamsoft.DWT.RegisterEvent('OnWebTwainNotFound', function() {
        logError('Serviço Dynamsoft não encontrado');
        
        // Verificar se o serviço está instalado mas não rodando
        alert('⚠️ SERVIÇO DO SCANNER NÃO DETECTADO\n\n' +
              'O serviço do Dynamsoft está instalado mas pode não estar rodando.\n\n' +
              'SOLUÇÃO:\n' +
              '1. Abra "Aplicações" no Mac\n' +
              '2. Procure por "Dynamic Web TWAIN Service"\n' +
              '3. Execute o serviço\n' +
              '4. Recarregue esta página (CMD+R)\n\n' +
              'Se o problema persistir, ignore o popup de download que aparecer.');
      });
      
      Dynamsoft.DWT.RegisterEvent('OnWebTwainReady', function() {
        log('Dynamsoft Web TWAIN pronto!');
        
        DWTObject = Dynamsoft.DWT.GetWebTwain('dwtcontrolContainer');
        
        if (DWTObject) {
          log('Scanner inicializado. Versão:', DWTObject.VersionInfo);
          
          // Configurar viewer
          DWTObject.Viewer.width = '100%';
          DWTObject.Viewer.height = '450px';
          DWTObject.Viewer.show();
          DWTObject.Viewer.singlePageMode = true;
          
          // Inicializar contadores
          inicializarContadores();
          
          // Listener para atualizar contador quando buffer mudar
          DWTObject.RegisterEvent('OnBufferChanged', atualizarContadores);
          
          // Carregar lista de scanners
          carregarListaScanners().then(() => {
            resolve(DWTObject);
          }).catch(error => {
            logError('Erro ao carregar scanners:', error);
            resolve(DWTObject); // Continua mesmo sem scanners
          });
        } else {
          reject(new Error('Falha ao criar DWTObject'));
        }
      });
      
      // Como AutoLoad = false, precisamos carregar explicitamente
      log('Carregando Dynamsoft explicitamente...');
      Dynamsoft.DWT.Load();
    });
  }
  
  // ============================================
  // GERENCIAMENTO DE CONTADORES
  // ============================================
  
  function inicializarContadores() {
    const zoomEl = document.getElementById("DW_spanZoom");
    const currentEl = document.getElementById("DW_CurrentImage");
    const totalEl = document.getElementById("DW_TotalImage");
    
    if (zoomEl && DWTObject.Viewer?.zoom) {
      const zoomInicial = Math.round(DWTObject.Viewer.zoom * 100);
      zoomEl.value = zoomInicial + "%";
    }
    
    if (currentEl) currentEl.value = "0";
    if (totalEl) totalEl.value = "0";
  }
  
  function atualizarContadores(changedIndex, changeType) {
    if (!DWTObject) return;
    
    const total = DWTObject.HowManyImagesInBuffer;
    const current = total > 0 ? DWTObject.CurrentImageIndexInBuffer + 1 : 0;
    
    const currentEl = document.getElementById("DW_CurrentImage");
    const totalEl = document.getElementById("DW_TotalImage");
    
    if (currentEl) currentEl.value = current;
    if (totalEl) totalEl.value = total;
  }
  
  // ============================================
  // GERENCIAMENTO DE SCANNERS
  // ============================================
  
  /**
   * Carrega lista de scanners disponíveis
   * @private
   */
  function carregarListaScanners() {
    return new Promise((resolve, reject) => {
      if (!DWTObject) {
        reject(new Error('DWTObject não disponível'));
        return;
      }
      
      DWTObject.GetDevicesAsync().then(devices => {
        const select = document.getElementById('scanner-select');
        if (!select) {
          reject(new Error('Elemento scanner-select não encontrado'));
          return;
        }
        
        // Limpar opções
        select.replaceChildren();
        
        if (devices.length === 0) {
          const option = document.createElement('option');
          option.textContent = 'Nenhum scanner encontrado';
          select.appendChild(option);
          log('Nenhum scanner encontrado');
          resolve(devices);
          return;
        }
        
        // Adicionar scanners
        devices.forEach((device, index) => {
          const option = document.createElement('option');
          option.value = index;
          option.textContent = device.displayName || device.name || 'Scanner desconhecido';
          select.appendChild(option);
        });
        
        log('Scanners carregados:', devices.length);
        resolve(devices);
        
      }).catch(error => {
        logError('Erro ao carregar scanners:', error);
        
        const select = document.getElementById('scanner-select');
        if (select) {
          select.replaceChildren();
          const option = document.createElement('option');
          option.textContent = 'Erro ao carregar scanners';
          select.appendChild(option);
        }
        
        reject(error);
      });
    });
  }
  
  // ============================================
  // AÇÕES DO SCANNER
  // ============================================
  
  /**
   * Carregar imagem de arquivo
   */
  function carregarImagem() {
    if (!DWTObject) {
      alert('⚠️ Scanner ainda não está pronto! Aguarde alguns segundos...');
      return;
    }
    
    DWTObject.IfShowFileDialog = true;
    DWTObject.LoadImageEx('', 5);
  }
  
  /**
   * Digitalizar imagem do scanner selecionado
   */
  function digitalizar() {
    if (!DWTObject) {
      alert('⚠️ Scanner ainda não está pronto! Aguarde alguns segundos...');
      return;
    }
    
    const select = document.getElementById('scanner-select');
    if (!select || select.selectedIndex < 0) {
      alert('⚠️ Por favor, selecione um scanner primeiro!');
      return;
    }
    
    const scannerIndex = parseInt(select.value);
    
    // Selecionar scanner e digitalizar
    DWTObject.GetDevicesAsync().then(devices => {
      if (scannerIndex >= devices.length) {
        throw new Error('Scanner selecionado não encontrado');
      }
      
      const selectedDevice = devices[scannerIndex];
      return DWTObject.SelectDeviceAsync(selectedDevice);
      
    }).then(() => {
      // Configurar e capturar
      DWTObject.Timeout = SCANNER_CONFIG.timeout;
      
      return DWTObject.AcquireImageAsync({ 
        IfCloseSourceAfterAcquire: true,
        IfShowUI: false,
        IfFeederEnabled: false,
        IfDuplexEnabled: false,  // Apenas frente (verso sempre em branco)
        PixelType: SCANNER_CONFIG.pixelType,
        Resolution: SCANNER_CONFIG.resolution
      });
      
    }).then(() => {
      log('Imagem digitalizada com sucesso');
      
    }).catch(error => {
      // Verificar se é timeout mas a imagem foi capturada
      if (error.code === SCANNER_CONFIG.errorCodeTimeout && 
          DWTObject.HowManyImagesInBuffer > 0) {
        // Timeout mas imagem capturada - ignorar erro
        log('Timeout mas imagem capturada com sucesso');
        return;
      }
      
      // Erro real
      logError('Erro na digitalização:', error);
      alert('❌ Erro ao digitalizar: ' + error.message);
    });
  }
  
  /**
   * Enviar imagens para AWS S3
   * Processo em 2 etapas:
   * 1. Obter signed URL do backend
   * 2. Upload direto para S3
   * 3. Confirmar upload no backend
   */
  async function enviarParaAWS() {
    if (!DWTObject) {
      alert('⚠️ Scanner ainda não está pronto!');
      return;
    }
    
    if (DWTObject.HowManyImagesInBuffer === 0) {
      alert('⚠️ Nenhuma imagem para enviar! Por favor, digitalize primeiro.');
      return;
    }
    
    // Verificar se há requisição selecionada
    if (typeof requisicaoAtual === 'undefined' || !requisicaoAtual || !requisicaoAtual.id) {
      alert('⚠️ Nenhuma requisição selecionada!');
      return;
    }
    
    // Desabilitar botão e adicionar spinner durante envio
    const btnEnviar = document.getElementById('btn-enviar-aws');
    if (btnEnviar) {
      btnEnviar.disabled = true;
      btnEnviar.classList.add('btn-loading');
      btnEnviar.innerHTML = '<span class="btn-spinner"></span> Enviando...';
    }
    
    try {
      const totalImagens = DWTObject.HowManyImagesInBuffer;
      log(`Iniciando envio de ${totalImagens} imagem(ns)...`);
      
      const arquivosEnviados = [];
      
      // Processar cada imagem
      for (let i = 0; i < totalImagens; i++) {
        try {
          // Atualizar progresso no botão
          if (btnEnviar && totalImagens > 1) {
            btnEnviar.innerHTML = `<span class="btn-spinner"></span> Enviando ${i + 1}/${totalImagens}...`;
          }
          
          log(`Processando imagem ${i + 1}/${totalImagens}...`);
          
          // Converter imagem para PDF
          const blob = await obterImagemComoBlob(i);
          
          // Etapa 1: Obter signed URL
          const signedUrlData = await obterSignedUrl(
            requisicaoAtual.id,
            blob.type
          );
          
          // Etapa 2: Upload para S3
          await uploadParaS3(signedUrlData.signed_url, blob, blob.type);
          
          // Etapa 3: Confirmar no backend
          const arquivo = await confirmarUpload({
            requisicao_id: requisicaoAtual.id,
            file_key: signedUrlData.file_key,
            filename: signedUrlData.original_filename,
            file_size: blob.size
          });
          
          arquivosEnviados.push(arquivo);
          log(`✅ Imagem ${i + 1} enviada com sucesso!`);
          
        } catch (error) {
          logError(`Erro ao enviar imagem ${i + 1}:`, error);
          throw new Error(`Falha ao enviar imagem ${i + 1}: ${error.message}`);
        }
      }
      
      log(`✅ Todas as ${totalImagens} imagens enviadas com sucesso!`);
      
      // Fechar modal
      fecharModal();
      
      // Exibir mensagem de sucesso
      mostrarMensagemSucesso(
        `${totalImagens} ${totalImagens === 1 ? 'imagem enviada' : 'imagens enviadas'} com sucesso!`
      );
      
      // Atualizar lista de arquivos na página
      if (typeof atualizarListaArquivos === 'function') {
        atualizarListaArquivos(arquivosEnviados);
      }
      
      // Limpar buffer após envio bem-sucedido
      DWTObject.RemoveAllImages();
      
    } catch (error) {
      logError('Erro no envio para AWS:', error);
      alert(`❌ Erro ao enviar imagens:\n${error.message}`);
      
    } finally {
      // Reabilitar botão e remover spinner
      if (btnEnviar) {
        btnEnviar.disabled = false;
        btnEnviar.classList.remove('btn-loading');
        btnEnviar.innerHTML = '📤 Enviar';
      }
    }
  }
  
  /**
   * Converte imagem do buffer do Dynamsoft para PDF
   * @param {number} index - Índice da imagem no buffer
   * @returns {Promise<Blob>}
   */
  function obterImagemComoBlob(index) {
    return new Promise((resolve, reject) => {
      // Converter para PDF (não JPG)
      DWTObject.ConvertToBlob(
        [index],
        Dynamsoft.DWT.EnumDWT_ImageType.IT_PDF,
        (result, indices, type) => {
          resolve(result);
        },
        (errorCode, errorString) => {
          reject(new Error(`Erro ao converter imagem para PDF: ${errorString}`));
        }
      );
    });
  }
  
  /**
   * Obtém signed URL do backend
   * @param {number} requisicaoId - ID da requisição
   * @param {string} contentType - Tipo MIME
   * @returns {Promise<Object>}
   */
  async function obterSignedUrl(requisicaoId, contentType) {
    const url = AppConfig.buildApiUrl('/operacao/upload/signed-url/');
    const params = new URLSearchParams({
      requisicao_id: requisicaoId,
      content_type: contentType
    });
    
    const response = await fetch(`${url}?${params}`, {
      method: 'GET',
      headers: AppConfig.getDefaultHeaders()
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Erro ao obter URL de upload');
    }
    
    return await response.json();
  }
  
  /**
   * Faz upload do arquivo para S3 usando signed URL
   * @param {string} signedUrl - URL pré-assinada
   * @param {Blob} blob - Arquivo a enviar
   * @param {string} contentType - Tipo MIME
   * @returns {Promise<void>}
   */
  async function uploadParaS3(signedUrl, blob, contentType) {
    const response = await fetch(signedUrl, {
      method: 'PUT',
      headers: {
        'Content-Type': contentType
      },
      body: blob
    });
    
    if (!response.ok) {
      throw new Error('Erro ao fazer upload para S3');
    }
  }
  
  /**
   * Confirma upload no backend e registra no banco
   * @param {Object} data - Dados do arquivo
   * @returns {Promise<Object>}
   */
  async function confirmarUpload(data) {
    const url = AppConfig.buildApiUrl('/operacao/upload/confirmar/');
    
    const response = await fetch(url, {
      method: 'POST',
      headers: AppConfig.getDefaultHeaders(),
      body: JSON.stringify(data)
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Erro ao confirmar upload');
    }
    
    const result = await response.json();
    return result.arquivo;
  }
  
  /**
   * Exibe mensagem de sucesso (similar ao sistema de notificações)
   * @param {string} mensagem - Mensagem a exibir
   */
  function mostrarMensagemSucesso(mensagem) {
    // Criar elemento de notificação
    const notificacao = document.createElement('div');
    notificacao.className = 'notificacao-sucesso';
    notificacao.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: #10b981;
      color: white;
      padding: 16px 24px;
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
      z-index: 10000;
      font-size: 14px;
      font-weight: 500;
      display: flex;
      align-items: center;
      gap: 12px;
      animation: slideInRight 0.3s ease-out;
    `;
    
    notificacao.innerHTML = `
      <span style="font-size: 20px;">✅</span>
      <span>${mensagem}</span>
    `;
    
    // Adicionar ao body
    document.body.appendChild(notificacao);
    
    // Remover após 4 segundos
    setTimeout(() => {
      notificacao.style.animation = 'slideOutRight 0.3s ease-out';
      setTimeout(() => {
        document.body.removeChild(notificacao);
      }, 300);
    }, 4000);
  }
  
  // ============================================
  // MANIPULAÇÃO DE IMAGENS
  // ============================================
  
  function zoomIn() {
    if (!DWTObject || DWTObject.HowManyImagesInBuffer === 0) return;
    
    DWTObject.Viewer.singlePageMode = true;
    const zoomAtual = DWTObject.Viewer.zoom;
    DWTObject.Viewer.zoom = zoomAtual * 1.1;
    DWTObject.Viewer.render();
    
    const zoomEl = document.getElementById("DW_spanZoom");
    if (zoomEl) {
      const displayZoom = Math.round(DWTObject.Viewer.zoom * 100);
      zoomEl.value = displayZoom + "%";
    }
  }
  
  function zoomOut() {
    if (!DWTObject || DWTObject.HowManyImagesInBuffer === 0) return;
    
    DWTObject.Viewer.singlePageMode = true;
    const zoomAtual = DWTObject.Viewer.zoom;
    DWTObject.Viewer.zoom = zoomAtual * 0.9;
    DWTObject.Viewer.render();
    
    const zoomEl = document.getElementById("DW_spanZoom");
    if (zoomEl) {
      const displayZoom = Math.round(DWTObject.Viewer.zoom * 100);
      zoomEl.value = displayZoom + "%";
    }
  }
  
  function tamanhoOriginal() {
    if (!DWTObject || DWTObject.HowManyImagesInBuffer === 0) return;
    
    DWTObject.Viewer.singlePageMode = true;
    DWTObject.Viewer.zoom = 1;
    DWTObject.Viewer.render();
    
    const zoomEl = document.getElementById("DW_spanZoom");
    if (zoomEl) {
      zoomEl.value = "100%";
    }
  }
  
  function removerImagemAtual() {
    if (!DWTObject || DWTObject.HowManyImagesInBuffer === 0) return;
    
    const currentIndex = DWTObject.CurrentImageIndexInBuffer;
    DWTObject.RemoveImage(currentIndex);
  }
  
  function removerTodasImagens() {
    if (!DWTObject || DWTObject.HowManyImagesInBuffer === 0) return;
    
    DWTObject.RemoveAllImages();
  }
  
  function rotacionarEsquerda() {
    if (!DWTObject || DWTObject.HowManyImagesInBuffer === 0) return;
    
    const currentIndex = DWTObject.CurrentImageIndexInBuffer;
    DWTObject.RotateLeft(currentIndex);
  }
  
  function alternarModoArrastar() {
    if (!DWTObject || DWTObject.HowManyImagesInBuffer === 0) return;
    
    const cursorAtual = DWTObject.Viewer.cursor;
    
    if (cursorAtual === 'grab' || cursorAtual === 'grabbing') {
      DWTObject.Viewer.cursor = 'crosshair';
    } else {
      DWTObject.Viewer.cursor = 'grab';
    }
  }
  
  // ============================================
  // GERENCIAMENTO DO MODAL
  // ============================================
  
  function abrirModal() {
    const modal = document.getElementById('modal-scanner-teste');
    if (!modal) {
      logError('Modal scanner-teste não encontrado');
      return;
    }
    
    modal.style.display = 'flex';
    
    // Configurar event listeners apenas uma vez
    if (!eventListenersConfigurados) {
      configurarEventListeners();
      eventListenersConfigurados = true;
    }
    
    // Se já está inicializado, não fazer nada
    if (DWTObject) {
      log('Scanner já inicializado');
      return;
    }
    
    // Se já está em andamento, aguardar
    if (inicializacaoEmAndamento && inicializacaoPromise) {
      log('Inicialização já em andamento, aguardando...');
      return;
    }
    
    // Iniciar carregamento se ainda não foi feito
    if (!scriptsCarregados) {
      inicializarScanner();
    }
  }
  
  /**
   * Inicializa o scanner de forma assíncrona
   * Pode ser chamado no carregamento da página para pré-carregar
   */
  function inicializarScanner() {
    if (inicializacaoEmAndamento || DWTObject) {
      return inicializacaoPromise || Promise.resolve();
    }
    
    inicializacaoEmAndamento = true;
    log('Iniciando carregamento do scanner...');
    
    inicializacaoPromise = carregarScriptsDynamsoft()
      .then(() => inicializarDynamsoft())
      .then(() => {
        log('Scanner pronto para uso');
        inicializacaoEmAndamento = false;
      })
      .catch(error => {
        logError('Erro ao inicializar Dynamsoft:', error);
        inicializacaoEmAndamento = false;
        inicializacaoPromise = null;
      });
    
    return inicializacaoPromise;
  }
  
  function fecharModal() {
    const modal = document.getElementById('modal-scanner-teste');
    if (modal) {
      modal.style.display = 'none';
    }
  }
  
  function handleEscKey(event) {
    const modal = document.getElementById('modal-scanner-teste');
    if (modal && modal.style.display === 'flex' && event.key === 'Escape') {
      fecharModal();
    }
  }
  
  // ============================================
  // EVENT LISTENERS
  // ============================================
  
  function configurarEventListeners() {
    // Botões de fechar
    const btnFecharHeader = document.getElementById('btn-fechar-modal');
    const btnFecharFooter = document.getElementById('btn-fechar-modal-footer');
    if (btnFecharHeader) btnFecharHeader.addEventListener('click', fecharModal);
    if (btnFecharFooter) btnFecharFooter.addEventListener('click', fecharModal);
    
    // Botões da toolbar
    const buttons = {
      'btn-remove-current': removerImagemAtual,
      'btn-remove-all': removerTodasImagens,
      'btn-zoom-out': zoomOut,
      'btn-zoom-in': zoomIn,
      'btn-rotate': rotacionarEsquerda,
      'btn-original-size': tamanhoOriginal,
      'btn-hand': alternarModoArrastar
    };
    
    Object.entries(buttons).forEach(([id, handler]) => {
      const btn = document.getElementById(id);
      if (btn) btn.addEventListener('click', handler);
    });
    
    // Botões de ação
    const btnCarregar = document.getElementById('btn-carregar-imagem');
    const btnDigitalizar = document.getElementById('btn-digitalizar');
    const btnEnviar = document.getElementById('btn-enviar-aws');
    
    if (btnCarregar) btnCarregar.addEventListener('click', carregarImagem);
    if (btnDigitalizar) btnDigitalizar.addEventListener('click', digitalizar);
    if (btnEnviar) btnEnviar.addEventListener('click', enviarParaAWS);
    
    // ESC global
    document.addEventListener('keydown', handleEscKey);
    
    log('Event listeners configurados');
  }
  
  // ============================================
  // API PÚBLICA
  // ============================================
  
  return {
    /**
     * Inicializa o módulo do scanner
     * @param {string} license - Chave de licença do Dynamsoft
     * @param {boolean} debug - Habilitar logs de debug
     */
    init: function(license, debug = false) {
      CONFIG.license = license;
      CONFIG.debug = debug;
      
      log('Scanner inicializado', {
        license: license ? license.substring(0, 30) + '...' : 'VAZIA',
        debug: debug
      });
      // Scripts serão carregados apenas quando o modal for aberto
    },
    
    /**
     * Abre o modal do scanner
     * Verifica se há requisição selecionada antes de abrir
     */
    open: function() {
      // Verificar se há requisição (variável global do triagem.js)
      if (typeof requisicaoAtual !== 'undefined' && requisicaoAtual) {
        abrirModal();
      } else {
        alert('⚠️ Por favor, localize uma requisição primeiro.');
      }
    },
    
    /**
     * Fecha o modal do scanner
     */
    close: function() {
      fecharModal();
    },
    
    /**
     * Retorna informações sobre o estado atual
     */
    getInfo: function() {
      return {
        scriptsCarregados: scriptsCarregados,
        dynamosoftPronto: DWTObject !== null,
        imagensNoBuffer: DWTObject ? DWTObject.HowManyImagesInBuffer : 0
      };
    }
  };
  
})(); // Fim do IIFE

// Expor globalmente para retrocompatibilidade
window.DynamosoftScanner = DynamosoftScanner;
window.abrirModalScanner = DynamosoftScanner.open;
