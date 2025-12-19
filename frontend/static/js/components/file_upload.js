/**
 * FILE_UPLOAD.JS - Componente Global para Upload de Arquivos
 * 
 * Fornece funcionalidades de upload de arquivos com:
 * - Validação de tipo e tamanho
 * - Conversão de imagem para PDF
 * - Upload para S3 via signed URL
 * - Preview de arquivo
 * 
 * Uso:
 *   FileUpload.init(config);
 *   FileUpload.handleFile(file, callbacks);
 *   FileUpload.uploadToS3(file, callbacks);
 */

window.FileUpload = (function() {
  'use strict';

  // Configuração padrão
  const defaultConfig = {
    allowedTypes: ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'],
    maxSize: 10 * 1024 * 1024, // 10MB
    convertImageToPdf: true,
    signedUrlEndpoint: '/operacao/protocolo/signed-url/'
  };

  let config = { ...defaultConfig };

  /**
   * Inicializa o componente com configuração personalizada
   * @param {object} customConfig - Configuração personalizada
   */
  function init(customConfig = {}) {
    config = { ...defaultConfig, ...customConfig };
    console.log('[FileUpload] Componente inicializado');
  }

  /**
   * Valida um arquivo
   * @param {File} file - Arquivo a validar
   * @returns {object} { valid: boolean, error: string }
   */
  function validarArquivo(file) {
    if (!file) {
      return { valid: false, error: 'Nenhum arquivo selecionado.' };
    }

    // Validar tipo
    if (!config.allowedTypes.includes(file.type)) {
      return { 
        valid: false, 
        error: 'Formato de arquivo não permitido. Use PDF, JPG, JPEG ou PNG.' 
      };
    }

    // Validar tamanho
    if (file.size > config.maxSize) {
      const maxMB = (config.maxSize / (1024 * 1024)).toFixed(0);
      return { 
        valid: false, 
        error: `Arquivo muito grande. Tamanho máximo: ${maxMB}MB.` 
      };
    }

    return { valid: true, error: null };
  }

  /**
   * Processa um arquivo (valida e converte se necessário)
   * @param {File} file - Arquivo a processar
   * @param {object} callbacks - Callbacks: onSucesso, onErro, onProgresso
   * @returns {Promise<File>} Arquivo processado (pode ser PDF convertido)
   */
  async function handleFile(file, callbacks = {}) {
    // Validar
    const validacao = validarArquivo(file);
    if (!validacao.valid) {
      if (callbacks.onErro) {
        callbacks.onErro(validacao.error);
      }
      return null;
    }

    // Se for imagem e conversão estiver habilitada, converter para PDF
    if (config.convertImageToPdf && file.type.startsWith('image/')) {
      try {
        if (callbacks.onProgresso) {
          callbacks.onProgresso('Convertendo imagem para PDF...');
        }
        
        const pdfFile = await convertImageToPdf(file);
        
        if (callbacks.onSucesso) {
          callbacks.onSucesso(pdfFile);
        }
        
        return pdfFile;
      } catch (error) {
        console.error('[FileUpload] Erro ao converter imagem:', error);
        if (callbacks.onErro) {
          callbacks.onErro('Erro ao converter imagem para PDF.');
        }
        return null;
      }
    }

    // Arquivo já é PDF ou não precisa conversão
    if (callbacks.onSucesso) {
      callbacks.onSucesso(file);
    }
    
    return file;
  }

  /**
   * Converte imagem para PDF usando jsPDF
   * @param {File} imageFile - Arquivo de imagem
   * @returns {Promise<File>} Arquivo PDF
   */
  async function convertImageToPdf(imageFile) {
    // Verificar se jsPDF está disponível
    if (!window.jspdf || !window.jspdf.jsPDF) {
      throw new Error('jsPDF não está carregado.');
    }

    const { jsPDF } = window.jspdf;

    // Criar nova instância do PDF
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });

    // Ler imagem como base64
    const imageData = await readFileAsDataURL(imageFile);

    // Criar imagem para obter dimensões
    const img = new Image();
    await new Promise((resolve, reject) => {
      img.onload = resolve;
      img.onerror = reject;
      img.src = imageData;
    });

    // Calcular dimensões para caber na página A4
    const pageWidth = 210; // mm
    const pageHeight = 297; // mm
    const margin = 10; // mm

    const maxWidth = pageWidth - (margin * 2);
    const maxHeight = pageHeight - (margin * 2);

    let imgWidth = img.width;
    let imgHeight = img.height;

    // Escalar proporcionalmente
    const ratio = Math.min(maxWidth / imgWidth, maxHeight / imgHeight);
    imgWidth = imgWidth * ratio;
    imgHeight = imgHeight * ratio;

    // Centralizar na página
    const x = (pageWidth - imgWidth) / 2;
    const y = (pageHeight - imgHeight) / 2;

    // Adicionar imagem ao PDF
    const imageType = imageFile.type === 'image/png' ? 'PNG' : 'JPEG';
    pdf.addImage(imageData, imageType, x, y, imgWidth, imgHeight);

    // Converter PDF para Blob
    const pdfBlob = pdf.output('blob');

    // Criar novo File com o PDF
    const pdfFileName = imageFile.name.replace(/\.(jpg|jpeg|png)$/i, '.pdf');
    const pdfFile = new File([pdfBlob], pdfFileName, { type: 'application/pdf' });

    console.log('[FileUpload] Imagem convertida para PDF:', pdfFileName);

    return pdfFile;
  }

  /**
   * Faz upload de arquivo para S3 via signed URL
   * @param {File} file - Arquivo a enviar
   * @param {object} callbacks - Callbacks: onSucesso, onErro, onProgresso
   * @returns {Promise<string>} URL do arquivo no S3
   */
  async function uploadToS3(file, callbacks = {}) {
    if (!file) {
      if (callbacks.onErro) {
        callbacks.onErro('Nenhum arquivo selecionado.');
      }
      return null;
    }

    console.log('[FileUpload] Iniciando upload para S3...');
    console.log('[FileUpload] Arquivo:', file.name, file.size, 'bytes');

    if (callbacks.onProgresso) {
      callbacks.onProgresso('Enviando arquivo...');
    }

    try {
      // 1. Obter signed URL
      const contentType = file.type || 'application/pdf';
      const signedUrlResponse = await fetch(
        `${config.signedUrlEndpoint}?content_type=${encodeURIComponent(contentType)}`,
        {
          method: 'GET',
          headers: FemmeUtils.getDefaultHeaders()
        }
      );

      const signedUrlData = await signedUrlResponse.json();

      if (signedUrlData.status !== 'success') {
        throw new Error(signedUrlData.message || 'Erro ao obter URL de upload.');
      }

      const { signed_url, file_url } = signedUrlData;
      console.log('[FileUpload] Signed URL obtida');

      // 2. Upload direto para S3
      const uploadResponse = await fetch(signed_url, {
        method: 'PUT',
        headers: {
          'Content-Type': contentType
        },
        body: file
      });

      if (!uploadResponse.ok) {
        const errorText = await uploadResponse.text();
        console.error('[FileUpload] Erro S3:', errorText);
        throw new Error('Erro ao enviar arquivo para o servidor.');
      }

      // 3. Retornar URL do arquivo
      const finalUrl = file_url || signed_url.split('?')[0];
      console.log('[FileUpload] Upload concluído:', finalUrl);

      if (callbacks.onSucesso) {
        callbacks.onSucesso(finalUrl);
      }

      return finalUrl;

    } catch (error) {
      console.error('[FileUpload] Erro no upload:', error);
      if (callbacks.onErro) {
        callbacks.onErro(error.message || 'Erro ao enviar arquivo.');
      }
      return null;
    }
  }

  /**
   * Lê arquivo como Data URL (base64)
   * @param {File} file - Arquivo a ler
   * @returns {Promise<string>} Data URL
   */
  function readFileAsDataURL(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  /**
   * Formata tamanho de arquivo para exibição
   * @param {number} bytes - Tamanho em bytes
   * @returns {string} Tamanho formatado
   */
  function formatFileSize(bytes) {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  }

  /**
   * Renderiza preview de arquivo em um container
   * @param {File} file - Arquivo
   * @param {HTMLElement} container - Container para o preview
   * @param {function} onRemove - Callback quando remover arquivo
   */
  function renderPreview(file, container, onRemove) {
    if (!file || !container) return;

    const fileSize = formatFileSize(file.size);

    container.innerHTML = `
      <div class="upload-file-item" data-filename="${file.name}">
        <span class="file-icon">📄</span>
        <div class="file-info">
          <div class="file-name">${file.name}</div>
          <div class="file-size">${fileSize}</div>
        </div>
        <button class="btn-remove-file" type="button" title="Remover arquivo">✕</button>
      </div>
    `;

    // Listener para remover
    const btnRemove = container.querySelector('.btn-remove-file');
    if (btnRemove && onRemove) {
      btnRemove.addEventListener('click', () => {
        container.innerHTML = '';
        onRemove();
      });
    }
  }

  /**
   * Configura input de arquivo com drag & drop
   * @param {HTMLElement} dropZone - Elemento da zona de drop
   * @param {HTMLInputElement} inputFile - Input de arquivo
   * @param {function} onFileSelect - Callback quando arquivo é selecionado
   */
  function setupDragDrop(dropZone, inputFile, onFileSelect) {
    if (!dropZone) return;

    // Prevenir comportamento padrão
    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
      dropZone.addEventListener(eventName, (e) => {
        e.preventDefault();
        e.stopPropagation();
      });
    });

    // Highlight ao arrastar
    ['dragenter', 'dragover'].forEach(eventName => {
      dropZone.addEventListener(eventName, () => {
        dropZone.classList.add('drag-over');
      });
    });

    ['dragleave', 'drop'].forEach(eventName => {
      dropZone.addEventListener(eventName, () => {
        dropZone.classList.remove('drag-over');
      });
    });

    // Processar drop
    dropZone.addEventListener('drop', (e) => {
      const files = e.dataTransfer.files;
      if (files.length > 0 && onFileSelect) {
        onFileSelect(files[0]);
      }
    });

    // Processar seleção via input
    if (inputFile) {
      inputFile.addEventListener('change', (e) => {
        if (e.target.files.length > 0 && onFileSelect) {
          onFileSelect(e.target.files[0]);
        }
      });
    }
  }

  // API Pública
  return {
    init: init,
    validarArquivo: validarArquivo,
    handleFile: handleFile,
    convertImageToPdf: convertImageToPdf,
    uploadToS3: uploadToS3,
    readFileAsDataURL: readFileAsDataURL,
    formatFileSize: formatFileSize,
    renderPreview: renderPreview,
    setupDragDrop: setupDragDrop
  };

})();
