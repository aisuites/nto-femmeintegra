/**
 * TRIAGEM.JS - Lógica da página de Triagem
 * 
 * Funcionalidades:
 * - Localizar requisição por código de barras
 * - Carregar etapa de triagem conforme status
 * - Validar e salvar dados da triagem
 */

// ============================================
// ELEMENTOS DO DOM
// ============================================

const inputCodBarras = document.getElementById('input-cod-barras-triagem');
const btnLocalizar = document.getElementById('btn-localizar-triagem');
const stepContainer = document.getElementById('triagem-step-container');

// Campos da etapa 1
const reqId = document.getElementById('req-id');
const reqCodBarras = document.getElementById('req-cod-barras');
const reqDataRecebimento = document.getElementById('req-data-recebimento');
const reqCodigoDisplay = document.getElementById('req-codigo-display');
const reqBarrasDisplay = document.getElementById('req-barras-display');

// Amostra
const selectAmostra = document.getElementById('select-amostra');
const amostraDataColeta = document.getElementById('amostra-data-coleta');
const amostraDataValidade = document.getElementById('amostra-data-validade');

// Checkboxes
const checkDataRasurada = document.getElementById('check-data-rasurada');
const checkSemValidade = document.getElementById('check-sem-validade');
const checkSemIdentificacao = document.getElementById('check-sem-identificacao');
const checkArmazenamentoInadequado = document.getElementById('check-armazenamento-inadequado');
const selectMotivoArmazenamento = document.getElementById('select-motivo-armazenamento');
const checkFrascoTrocado = document.getElementById('check-frasco-trocado');
const checkMaterialNaoAnalisado = document.getElementById('check-material-nao-analisado');

// Botões
const btnCancelar = document.getElementById('btn-cancelar-triagem');
const btnSeguir = document.getElementById('btn-seguir-triagem');
const btnScanner = document.getElementById('btn-scanner');
const scannerFilesContainer = document.getElementById('scanner-files-container');

// ============================================
// ESTADO GLOBAL
// ============================================

let requisicaoAtual = null;
let amostrasAtual = [];

// ============================================
// FUNÇÕES AUXILIARES
// ============================================

/**
 * Mostra mensagem de erro
 */
function mostrarErro(mensagem) {
  alert('❌ ' + mensagem);
}

/**
 * Mostra mensagem de sucesso
 */
function mostrarSucesso(mensagem) {
  alert('✅ ' + mensagem);
}

/**
 * Limpa o formulário
 */
function limparFormulario() {
  inputCodBarras.value = '';
  stepContainer.style.display = 'none';
  requisicaoAtual = null;
  amostrasAtual = [];
  
  // Limpar campos
  reqId.value = '';
  reqCodBarras.value = '';
  reqDataRecebimento.value = '';
  reqCodigoDisplay.textContent = '#---';
  reqBarrasDisplay.textContent = '---';
  
  // Limpar select de amostras
  selectAmostra.innerHTML = '<option value="">Selecione uma amostra...</option>';
  
  // Limpar campos de amostra
  amostraDataColeta.value = '';
  amostraDataValidade.value = '';
  
  // Desmarcar checkboxes
  checkDataRasurada.checked = false;
  checkSemValidade.checked = false;
  checkSemIdentificacao.checked = false;
  checkArmazenamentoInadequado.checked = false;
  checkFrascoTrocado.checked = false;
  checkMaterialNaoAnalisado.checked = false;
  
  // Desabilitar dropdown de motivo
  selectMotivoArmazenamento.disabled = true;
  selectMotivoArmazenamento.value = '';
}

/**
 * Carrega dados da requisição na interface
 */
function carregarRequisicao(dados) {
  requisicaoAtual = dados;
  
  // Preencher campos principais (ID da requisição = id da tabela dados_requisicao)
  reqId.value = dados.id || '';
  reqCodBarras.value = dados.cod_barras_req || '';
  reqCodigoDisplay.textContent = '#' + (dados.cod_req || '---');
  reqBarrasDisplay.textContent = dados.cod_barras_req || '---';
  
  // Data de recebimento (campo data_recebimento_nto da tabela dados_requisicao)
  if (dados.data_recebimento_nto) {
    reqDataRecebimento.value = dados.data_recebimento_nto;
  } else {
    // Usar data atual como padrão
    const hoje = new Date().toISOString().split('T')[0];
    reqDataRecebimento.value = hoje;
  }
  
  // Carregar amostras vinculadas (da tabela requisicao_amostras)
  if (dados.amostras && dados.amostras.length > 0) {
    amostrasAtual = dados.amostras;
    selectAmostra.innerHTML = '<option value="">Selecione uma amostra...</option>';
    
    dados.amostras.forEach((amostra, index) => {
      const option = document.createElement('option');
      option.value = amostra.id;
      option.textContent = `Amostra ${amostra.ordem} - ${amostra.cod_barras_amostra}`;
      selectAmostra.appendChild(option);
    });
  }
  
  // Mostrar seção de triagem
  stepContainer.style.display = 'block';
  
  // Scroll suave para a seção
  stepContainer.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

// ============================================
// EVENTOS
// ============================================

/**
 * Obtém CSRF token
 */
function getCookie(name) {
  let cookieValue = null;
  if (document.cookie && document.cookie !== '') {
    const cookies = document.cookie.split(';');
    for (let i = 0; i < cookies.length; i++) {
      const cookie = cookies[i].trim();
      if (cookie.substring(0, name.length + 1) === (name + '=')) {
        cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
        break;
      }
    }
  }
  return cookieValue;
}

/**
 * Localizar requisição
 */
btnLocalizar.addEventListener('click', async () => {
  const codBarras = inputCodBarras.value.trim();
  
  if (!codBarras) {
    mostrarErro('Informe o código de barras da requisição.');
    inputCodBarras.focus();
    return;
  }
  
  btnLocalizar.disabled = true;
  btnLocalizar.textContent = '🔄 Localizando...';
  
  try {
    const csrftoken = getCookie('csrftoken');
    
    const response = await fetch('/operacao/triagem/localizar/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-CSRFToken': csrftoken,
      },
      body: JSON.stringify({ cod_barras: codBarras })
    });
    
    const data = await response.json();
    
    if (data.status === 'success') {
      carregarRequisicao(data.requisicao);
    } else if (data.status === 'not_found') {
      mostrarErro('Requisição não encontrada ou não está na etapa de triagem.');
      limparFormulario();
    } else {
      mostrarErro(data.message || 'Erro ao localizar requisição.');
    }
    
  } catch (error) {
    console.error('Erro ao localizar requisição:', error);
    mostrarErro('Erro ao localizar requisição. Tente novamente.');
  } finally {
    btnLocalizar.disabled = false;
    btnLocalizar.textContent = '🔍 Localizar';
  }
});

/**
 * Enter no input de código de barras
 */
inputCodBarras.addEventListener('keypress', (e) => {
  if (e.key === 'Enter') {
    btnLocalizar.click();
  }
});

/**
 * Habilitar/desabilitar dropdown de motivo de armazenamento
 */
checkArmazenamentoInadequado.addEventListener('change', () => {
  selectMotivoArmazenamento.disabled = !checkArmazenamentoInadequado.checked;
  if (!checkArmazenamentoInadequado.checked) {
    selectMotivoArmazenamento.value = '';
  }
});

/**
 * Cancelar triagem
 */
btnCancelar.addEventListener('click', () => {
  if (confirm('Deseja cancelar a triagem desta requisição?')) {
    limparFormulario();
    inputCodBarras.focus();
  }
});

/**
 * Seguir para próxima etapa
 */
btnSeguir.addEventListener('click', async () => {
  // Validações básicas
  if (!requisicaoAtual) {
    mostrarErro('Nenhuma requisição carregada.');
    return;
  }
  
  if (!reqDataRecebimento.value) {
    mostrarErro('Informe a data de recebimento.');
    reqDataRecebimento.focus();
    return;
  }
  
  // TODO: Implementar validações completas e envio para API
  
  // Por enquanto, apenas mostrar mensagem
  mostrarSucesso('Funcionalidade em desenvolvimento. Dados validados com sucesso!');
});

/**
 * Scanner - Abrir modal com iframe
 */
btnScanner.addEventListener('click', () => {
  if (!requisicaoAtual) {
    mostrarErro('Localize uma requisição primeiro.');
    return;
  }
  
  // Chamar função global definida no template
  if (typeof abrirModalScanner === 'function') {
    abrirModalScanner();
  } else {
    console.error('Função abrirModalScanner não encontrada.');
    mostrarErro('Erro ao abrir o scanner. Recarregue a página.');
  }
});

// ============================================
// INICIALIZAÇÃO
// ============================================

// Focar no input ao carregar a página
inputCodBarras.focus();
