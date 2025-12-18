/**
 * Cadastro Protocolo - JavaScript
 * 
 * Funcionalidades:
 * - Seleção de unidade
 * - Seleção de portador/representante com preenchimento automático de origem
 * - Validação de médico via API
 * - Upload de arquivo com conversão para PDF
 * - Salvamento do protocolo
 * 
 * @version 1.0.0
 * @date 2024-12-18
 */

(function() {
  'use strict';

  // ============================================
  // CONFIGURAÇÃO
  // ============================================
  
  const AppConfig = {
    baseUrl: window.location.origin,
    
    buildApiUrl: function(path) {
      return this.baseUrl + path;
    },
    
    getDefaultHeaders: function() {
      const csrfToken = document.querySelector('[name=csrfmiddlewaretoken]')?.value 
                     || document.getElementById('csrf_token_input')?.value;
      return {
        'Content-Type': 'application/json',
        'X-CSRFToken': csrfToken
      };
    }
  };

  // ============================================
  // ESTADO DA APLICAÇÃO
  // ============================================
  
  let state = {
    unidadeId: null,
    portadorId: null,
    origemId: null,
    crm: '',
    ufCrm: '',
    nomeMedico: '',
    medicoValidado: false,
    arquivoUrl: '',
    arquivoNome: '',
    arquivoFile: null,
    uploading: false
  };

  // ============================================
  // ELEMENTOS DOM
  // ============================================
  
  const elements = {
    // Unidade
    unidadeInputs: () => document.querySelectorAll('input[name="unidade_origem"]'),
    unidadeSelecionada: () => document.getElementById('unidadeSelecionada'),
    
    // Portador
    campoPortador: () => document.getElementById('campo_portador'),
    campoOrigem: () => document.getElementById('campo_origem'),
    
    // Médico
    crmMedico: () => document.getElementById('crm-medico'),
    ufCrm: () => document.getElementById('uf-crm'),
    ufCrmWrapper: () => document.getElementById('uf-crm-wrapper'),
    ufCrmDropdown: () => document.getElementById('uf-crm-dropdown'),
    btnValidaMedico: () => document.getElementById('btn-valida-medico'),
    nomeMedico: () => document.getElementById('nome-medico'),
    alertMedico: () => document.getElementById('protocolo_alert_medico'),
    alertMedicoMessage: () => document.getElementById('protocolo_alert_medico_message'),
    
    // Upload
    btnCarregarImagem: () => document.getElementById('btn-carregar-imagem'),
    inputUploadImagem: () => document.getElementById('input-upload-imagem'),
    uploadFilesContainer: () => document.getElementById('upload-files-container'),
    alertUpload: () => document.getElementById('protocolo_alert_upload'),
    alertUploadMessage: () => document.getElementById('protocolo_alert_upload_message'),
    
    // Alertas gerais
    alertGeral: () => document.getElementById('protocolo_alert_geral'),
    alertGeralMessage: () => document.getElementById('protocolo_alert_geral_message'),
    alertSucesso: () => document.getElementById('protocolo_alert_sucesso'),
    alertSucessoMessage: () => document.getElementById('protocolo_alert_sucesso_message'),
    
    // Ações
    btnCancelar: () => document.getElementById('btn-cancelar-protocolo'),
    btnSalvar: () => document.getElementById('btn-salvar-protocolo')
  };

  // ============================================
  // INICIALIZAÇÃO
  // ============================================
  
  function init() {
    console.log('[CadastroProtocolo] Inicializando...');
    
    setupUnidadeListeners();
    setupPortadorListeners();
    setupMedicoListeners();
    setupUploadListeners();
    setupActionListeners();
    
    // Inicializar estado com valores do DOM
    initializeState();
    
    console.log('[CadastroProtocolo] Inicializado com sucesso');
  }

  function initializeState() {
    // Verificar unidade já selecionada
    const unidadeChecked = document.querySelector('input[name="unidade_origem"]:checked');
    if (unidadeChecked) {
      state.unidadeId = unidadeChecked.value;
      elements.unidadeSelecionada().value = unidadeChecked.value;
    }
  }

  // ============================================
  // UNIDADE
  // ============================================
  
  function setupUnidadeListeners() {
    elements.unidadeInputs().forEach(input => {
      input.addEventListener('change', handleUnidadeChange);
    });
  }

  function handleUnidadeChange(e) {
    const unidadeId = e.target.value;
    state.unidadeId = unidadeId;
    elements.unidadeSelecionada().value = unidadeId;
    
    // Atualizar visual dos cards
    document.querySelectorAll('.unit-card').forEach(card => {
      card.classList.remove('unit-card--selected');
    });
    e.target.closest('.unit-card').classList.add('unit-card--selected');
    
    // Filtrar portadores pela unidade (opcional)
    filterPortadoresByUnidade(unidadeId);
  }

  function filterPortadoresByUnidade(unidadeId) {
    const select = elements.campoPortador();
    const options = select.querySelectorAll('option');
    
    options.forEach(option => {
      if (!option.value) return; // Skip placeholder
      
      const optionUnidadeId = option.dataset.unidadeId;
      if (unidadeId && optionUnidadeId !== unidadeId) {
        option.style.display = 'none';
      } else {
        option.style.display = '';
      }
    });
    
    // Reset seleção se portador atual não pertence à unidade
    if (select.value) {
      const selectedOption = select.options[select.selectedIndex];
      if (selectedOption.dataset.unidadeId !== unidadeId) {
        select.value = '';
        elements.campoOrigem().value = '';
        state.portadorId = null;
        state.origemId = null;
      }
    }
  }

  // ============================================
  // PORTADOR / REPRESENTANTE
  // ============================================
  
  function setupPortadorListeners() {
    const select = elements.campoPortador();
    if (select) {
      select.addEventListener('change', handlePortadorChange);
    }
  }

  function handlePortadorChange(e) {
    const selectedOption = e.target.options[e.target.selectedIndex];
    
    if (selectedOption && selectedOption.value) {
      state.portadorId = selectedOption.value;
      state.origemId = selectedOption.dataset.origemId;
      
      // Preencher campo origem
      elements.campoOrigem().value = selectedOption.dataset.origem || '';
    } else {
      state.portadorId = null;
      state.origemId = null;
      elements.campoOrigem().value = '';
    }
  }

  // ============================================
  // MÉDICO (CRM + UF + VALIDAÇÃO)
  // ============================================
  
  function setupMedicoListeners() {
    // Dropdown UF
    const ufInput = elements.ufCrm();
    const ufWrapper = elements.ufCrmWrapper();
    const ufDropdown = elements.ufCrmDropdown();
    
    if (ufInput && ufWrapper && ufDropdown) {
      // Abrir dropdown ao focar
      ufInput.addEventListener('focus', () => {
        ufWrapper.classList.add('open');
      });
      
      // Fechar dropdown ao clicar fora
      document.addEventListener('click', (e) => {
        if (!ufWrapper.contains(e.target)) {
          ufWrapper.classList.remove('open');
        }
      });
      
      // Filtrar ao digitar
      ufInput.addEventListener('input', (e) => {
        const value = e.target.value.toUpperCase();
        e.target.value = value;
        
        const items = ufDropdown.querySelectorAll('.custom-dropdown-item');
        items.forEach(item => {
          if (item.dataset.value.includes(value)) {
            item.style.display = '';
          } else {
            item.style.display = 'none';
          }
        });
      });
      
      // Selecionar item do dropdown
      ufDropdown.querySelectorAll('.custom-dropdown-item').forEach(item => {
        item.addEventListener('click', () => {
          ufInput.value = item.dataset.value;
          state.ufCrm = item.dataset.value;
          ufWrapper.classList.remove('open');
          
          // Marcar como selecionado
          ufDropdown.querySelectorAll('.custom-dropdown-item').forEach(i => i.classList.remove('selected'));
          item.classList.add('selected');
        });
      });
    }
    
    // Botão validar médico
    const btnValida = elements.btnValidaMedico();
    if (btnValida) {
      btnValida.addEventListener('click', handleValidarMedico);
    }
  }

  async function handleValidarMedico() {
    const crm = elements.crmMedico().value.trim();
    const uf = elements.ufCrm().value.trim().toUpperCase();
    
    // Validações
    if (!crm) {
      showAlertMedico('Informe o número do CRM.');
      return;
    }
    
    if (!uf || uf.length !== 2) {
      showAlertMedico('Selecione a UF do CRM.');
      return;
    }
    
    // Desabilitar botão durante a requisição
    const btn = elements.btnValidaMedico();
    btn.disabled = true;
    btn.textContent = 'Validando...';
    
    // Resetar estado do médico
    state.medicoValidado = false;
    state.nomeMedico = '';
    elements.nomeMedico().value = '';
    elements.crmMedico().style.borderColor = '';
    elements.ufCrm().style.borderColor = '';
    
    try {
      const response = await fetch(AppConfig.buildApiUrl('/operacao/protocolo/validar-medico/'), {
        method: 'POST',
        headers: AppConfig.getDefaultHeaders(),
        body: JSON.stringify({ crm, uf })
      });
      
      const data = await response.json();
      
      if (data.status === 'success' && data.medico) {
        // SUCESSO - 1 médico encontrado
        state.crm = crm;
        state.ufCrm = uf;
        state.nomeMedico = data.medico.nome;
        state.medicoValidado = true;
        
        elements.nomeMedico().value = data.medico.nome;
        hideAlertMedico();
        
        // Visual de sucesso
        elements.crmMedico().style.borderColor = 'var(--femme-green)';
        elements.ufCrm().style.borderColor = 'var(--femme-green)';
        
        console.log('[CadastroProtocolo] Médico validado:', data.medico.nome);
        
      } else if (data.code === 'multiple_found') {
        // ERRO - Múltiplos médicos encontrados
        console.warn('[CadastroProtocolo] Múltiplos médicos encontrados:', data.quantidade);
        
        // Salvar dados para uso no modal de email (futuro)
        state.crm = crm;
        state.ufCrm = uf;
        state.medicosEncontrados = data.medicos || [];
        
        // Visual de alerta
        elements.crmMedico().style.borderColor = 'var(--femme-orange, #ffc107)';
        elements.ufCrm().style.borderColor = 'var(--femme-orange, #ffc107)';
        
        // Mostrar mensagem com detalhes
        const medicosNomes = data.medicos?.map(m => m.nome).join(', ') || '';
        showAlertMedico(
          `${data.message} Médicos: ${medicosNomes}. ` +
          `Em breve será possível enviar email para resolver esta pendência.`
        );
        
      } else if (data.code === 'not_found') {
        // ERRO - Médico não encontrado
        console.warn('[CadastroProtocolo] Médico não encontrado');
        
        state.crm = crm;
        state.ufCrm = uf;
        
        // Visual de erro
        elements.crmMedico().style.borderColor = 'var(--femme-red, #dc3545)';
        elements.ufCrm().style.borderColor = 'var(--femme-red, #dc3545)';
        
        showAlertMedico(
          data.message || 'Médico não encontrado na base. ' +
          'Verifique os dados ou solicite o cadastro do médico.'
        );
        
      } else {
        // Outro erro
        showAlertMedico(data.message || 'Erro ao validar médico.');
      }
      
    } catch (error) {
      console.error('[CadastroProtocolo] Erro ao validar médico:', error);
      showAlertMedico('Erro de conexão ao validar médico. Tente novamente.');
    } finally {
      btn.disabled = false;
      btn.textContent = 'Valida Médico';
    }
  }

  function showAlertMedico(message) {
    const alert = elements.alertMedico();
    const messageEl = elements.alertMedicoMessage();
    if (alert && messageEl) {
      messageEl.textContent = message;
      alert.style.display = 'block';
    }
  }

  function hideAlertMedico() {
    const alert = elements.alertMedico();
    if (alert) {
      alert.style.display = 'none';
    }
  }

  // ============================================
  // UPLOAD DE ARQUIVO
  // ============================================
  
  function setupUploadListeners() {
    const btnCarregar = elements.btnCarregarImagem();
    const inputUpload = elements.inputUploadImagem();
    
    if (btnCarregar && inputUpload) {
      btnCarregar.addEventListener('click', () => {
        inputUpload.click();
      });
      
      inputUpload.addEventListener('change', handleFileSelect);
    }
  }

  async function handleFileSelect(e) {
    const file = e.target.files[0];
    if (!file) return;
    
    // Validar tipo de arquivo
    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'];
    if (!allowedTypes.includes(file.type)) {
      showAlertUpload('Formato de arquivo não permitido. Use PDF, JPG, JPEG ou PNG.');
      return;
    }
    
    // Validar tamanho (máx 10MB)
    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      showAlertUpload('Arquivo muito grande. Tamanho máximo: 10MB.');
      return;
    }
    
    hideAlertUpload();
    state.arquivoFile = file;
    state.arquivoNome = file.name;
    
    // Mostrar arquivo na lista
    renderUploadedFile(file, 'pending');
    
    // Se for imagem, converter para PDF
    if (file.type.startsWith('image/')) {
      await convertImageToPdf(file);
    }
  }

  function renderUploadedFile(file, status) {
    const container = elements.uploadFilesContainer();
    if (!container) return;
    
    const fileSize = formatFileSize(file.size);
    const statusClass = status === 'success' ? 'success' : status === 'error' ? 'error' : 'uploading';
    const statusText = status === 'success' ? '✓ Pronto' : status === 'error' ? '✗ Erro' : '⏳ Aguardando...';
    
    container.innerHTML = `
      <div class="upload-file-item" data-filename="${file.name}">
        <span class="file-icon">📄</span>
        <div class="file-info">
          <div class="file-name">${file.name}</div>
          <div class="file-size">${fileSize}</div>
        </div>
        <span class="file-status ${statusClass}">${statusText}</span>
        <button class="btn-remove-file" type="button" title="Remover arquivo">✕</button>
      </div>
    `;
    
    // Listener para remover
    container.querySelector('.btn-remove-file')?.addEventListener('click', () => {
      container.innerHTML = '';
      state.arquivoFile = null;
      state.arquivoNome = '';
      state.arquivoUrl = '';
      elements.inputUploadImagem().value = '';
    });
  }

  function updateFileStatus(status) {
    const container = elements.uploadFilesContainer();
    const statusEl = container?.querySelector('.file-status');
    if (statusEl) {
      statusEl.className = 'file-status ' + status;
      statusEl.textContent = status === 'success' ? '✓ Pronto' : status === 'error' ? '✗ Erro' : '⏳ Enviando...';
    }
  }

  async function convertImageToPdf(imageFile) {
    try {
      console.log('[CadastroProtocolo] Convertendo imagem para PDF...');
      
      // Usar jsPDF para converter
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
      
      state.arquivoFile = pdfFile;
      state.arquivoNome = pdfFileName;
      
      console.log('[CadastroProtocolo] Imagem convertida para PDF:', pdfFileName);
      
      // Atualizar visual
      renderUploadedFile(pdfFile, 'pending');
      
    } catch (error) {
      console.error('[CadastroProtocolo] Erro ao converter imagem:', error);
      showAlertUpload('Erro ao converter imagem para PDF.');
    }
  }

  function readFileAsDataURL(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  function formatFileSize(bytes) {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  }

  function showAlertUpload(message) {
    const alert = elements.alertUpload();
    const messageEl = elements.alertUploadMessage();
    if (alert && messageEl) {
      messageEl.textContent = message;
      alert.style.display = 'block';
    }
  }

  function hideAlertUpload() {
    const alert = elements.alertUpload();
    if (alert) {
      alert.style.display = 'none';
    }
  }

  // ============================================
  // UPLOAD PARA S3
  // ============================================
  
  async function uploadFileToS3() {
    if (!state.arquivoFile) {
      throw new Error('Nenhum arquivo selecionado.');
    }
    
    console.log('[CadastroProtocolo] Iniciando upload para S3...');
    updateFileStatus('uploading');
    
    try {
      // 1. Obter signed URL
      const signedUrlResponse = await fetch(
        AppConfig.buildApiUrl('/operacao/protocolo/signed-url/') + '?content_type=application/pdf',
        {
          method: 'GET',
          headers: AppConfig.getDefaultHeaders()
        }
      );
      
      const signedUrlData = await signedUrlResponse.json();
      
      if (signedUrlData.status !== 'success') {
        throw new Error(signedUrlData.message || 'Erro ao obter URL de upload.');
      }
      
      const { signed_url, file_url } = signedUrlData;
      
      // 2. Upload direto para S3
      const uploadResponse = await fetch(signed_url, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/pdf'
        },
        body: state.arquivoFile
      });
      
      if (!uploadResponse.ok) {
        throw new Error('Erro ao enviar arquivo para o servidor.');
      }
      
      // 3. Salvar URL do arquivo
      state.arquivoUrl = file_url || signed_url.split('?')[0];
      
      console.log('[CadastroProtocolo] Upload concluído:', state.arquivoUrl);
      updateFileStatus('success');
      
      return state.arquivoUrl;
      
    } catch (error) {
      console.error('[CadastroProtocolo] Erro no upload:', error);
      updateFileStatus('error');
      throw error;
    }
  }

  // ============================================
  // AÇÕES (CANCELAR / SALVAR)
  // ============================================
  
  function setupActionListeners() {
    const btnCancelar = elements.btnCancelar();
    const btnSalvar = elements.btnSalvar();
    
    if (btnCancelar) {
      btnCancelar.addEventListener('click', handleCancelar);
    }
    
    if (btnSalvar) {
      btnSalvar.addEventListener('click', handleSalvar);
    }
  }

  function handleCancelar() {
    // Confirmar antes de limpar
    if (!confirm('Deseja realmente cancelar? Todos os dados serão perdidos.')) {
      return;
    }
    
    // Resetar estado
    state = {
      unidadeId: null,
      portadorId: null,
      origemId: null,
      crm: '',
      ufCrm: '',
      nomeMedico: '',
      medicoValidado: false,
      arquivoUrl: '',
      arquivoNome: '',
      arquivoFile: null,
      uploading: false
    };
    
    // Resetar formulário
    document.querySelectorAll('.unit-card').forEach(card => {
      card.classList.remove('unit-card--selected');
      card.querySelector('input').checked = false;
    });
    elements.unidadeSelecionada().value = '';
    elements.campoPortador().value = '';
    elements.campoOrigem().value = '';
    elements.crmMedico().value = '';
    elements.ufCrm().value = '';
    elements.nomeMedico().value = '';
    elements.uploadFilesContainer().innerHTML = '';
    elements.inputUploadImagem().value = '';
    
    // Esconder alertas
    hideAlertMedico();
    hideAlertUpload();
    hideAlertGeral();
    hideAlertSucesso();
    
    // Resetar estilos
    elements.crmMedico().style.borderColor = '';
    elements.ufCrm().style.borderColor = '';
  }

  async function handleSalvar() {
    console.log('[CadastroProtocolo] Iniciando salvamento...');
    
    // Validar campos obrigatórios
    const erros = [];
    
    if (!state.unidadeId) {
      erros.push('Selecione uma unidade.');
    }
    
    if (!state.portadorId) {
      erros.push('Selecione um portador/representante.');
    }
    
    const crm = elements.crmMedico().value.trim();
    const uf = elements.ufCrm().value.trim().toUpperCase();
    const nomeMedico = elements.nomeMedico().value.trim();
    
    if (!crm) {
      erros.push('Informe o CRM do médico.');
    }
    
    if (!uf || uf.length !== 2) {
      erros.push('Selecione a UF do CRM.');
    }
    
    if (!nomeMedico) {
      erros.push('Valide o médico antes de salvar.');
    }
    
    if (!state.arquivoFile) {
      erros.push('Selecione um arquivo para upload.');
    }
    
    if (erros.length > 0) {
      showAlertGeral(erros.join(' '));
      return;
    }
    
    hideAlertGeral();
    
    // Desabilitar botão
    const btnSalvar = elements.btnSalvar();
    btnSalvar.disabled = true;
    btnSalvar.textContent = 'Salvando...';
    
    try {
      // 1. Fazer upload do arquivo
      await uploadFileToS3();
      
      // 2. Salvar protocolo
      const payload = {
        unidade_id: parseInt(state.unidadeId),
        portador_id: parseInt(state.portadorId),
        crm: crm,
        uf_crm: uf,
        nome_medico: nomeMedico,
        medico_validado: state.medicoValidado,
        arquivo_url: state.arquivoUrl,
        arquivo_nome: state.arquivoNome
      };
      
      const response = await fetch(AppConfig.buildApiUrl('/operacao/protocolo/salvar/'), {
        method: 'POST',
        headers: AppConfig.getDefaultHeaders(),
        body: JSON.stringify(payload)
      });
      
      const data = await response.json();
      
      if (data.status === 'success') {
        showAlertSucesso(`Protocolo ${data.protocolo.codigo} cadastrado com sucesso!`);
        
        // Limpar formulário após 2 segundos
        setTimeout(() => {
          handleCancelar();
        }, 2000);
        
      } else {
        showAlertGeral(data.message || 'Erro ao salvar protocolo.');
      }
      
    } catch (error) {
      console.error('[CadastroProtocolo] Erro ao salvar:', error);
      showAlertGeral('Erro ao salvar protocolo: ' + error.message);
    } finally {
      btnSalvar.disabled = false;
      btnSalvar.textContent = 'SALVAR PROTOCOLO';
    }
  }

  function showAlertGeral(message) {
    const alert = elements.alertGeral();
    const messageEl = elements.alertGeralMessage();
    if (alert && messageEl) {
      messageEl.textContent = message;
      alert.style.display = 'block';
    }
  }

  function hideAlertGeral() {
    const alert = elements.alertGeral();
    if (alert) {
      alert.style.display = 'none';
    }
  }

  function showAlertSucesso(message) {
    const alert = elements.alertSucesso();
    const messageEl = elements.alertSucessoMessage();
    if (alert && messageEl) {
      messageEl.textContent = message;
      alert.style.display = 'block';
    }
  }

  function hideAlertSucesso() {
    const alert = elements.alertSucesso();
    if (alert) {
      alert.style.display = 'none';
    }
  }

  // ============================================
  // INICIAR
  // ============================================
  
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
