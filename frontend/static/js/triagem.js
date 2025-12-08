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
  
  // Preencher campos principais
  reqId.value = dados.cod_req || '';
  reqCodBarras.value = dados.cod_barras_req || '';
  reqCodigoDisplay.textContent = '#' + (dados.cod_req || '---');
  reqBarrasDisplay.textContent = dados.cod_barras_req || '---';
  
  // Data de recebimento (se disponível)
  if (dados.data_recebimento_nto) {
    reqDataRecebimento.value = dados.data_recebimento_nto;
  } else {
    // Usar data atual como padrão
    const hoje = new Date().toISOString().split('T')[0];
    reqDataRecebimento.value = hoje;
  }
  
  // Carregar amostras
  if (dados.amostras && dados.amostras.length > 0) {
    amostrasAtual = dados.amostras;
    selectAmostra.innerHTML = '<option value="">Selecione uma amostra...</option>';
    
    dados.amostras.forEach((amostra, index) => {
      const option = document.createElement('option');
      option.value = amostra.id || index;
      option.textContent = `Amostra ${index + 1} - ${amostra.cod_barras_amostra}`;
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
    // TODO: Implementar chamada à API para buscar requisição
    // Por enquanto, simular dados
    
    // Simulação temporária
    setTimeout(() => {
      // Dados mockados para teste
      const dadosMock = {
        id: 1,
        cod_req: '2025A01021',
        cod_barras_req: codBarras,
        data_recebimento_nto: '2025-12-07',
        amostras: [
          { id: 1, cod_barras_amostra: codBarras },
          { id: 2, cod_barras_amostra: codBarras }
        ]
      };
      
      carregarRequisicao(dadosMock);
      
      btnLocalizar.disabled = false;
      btnLocalizar.textContent = '🔍 Localizar';
    }, 500);
    
  } catch (error) {
    console.error('Erro ao localizar requisição:', error);
    mostrarErro('Erro ao localizar requisição. Tente novamente.');
    
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
  console.log('Dados da triagem:', {
    requisicao_id: requisicaoAtual.id,
    data_recebimento: reqDataRecebimento.value,
    amostra_selecionada: selectAmostra.value,
    data_coleta: amostraDataColeta.value,
    data_validade: amostraDataValidade.value,
    flags: {
      data_rasurada: checkDataRasurada.checked,
      sem_validade: checkSemValidade.checked,
      sem_identificacao: checkSemIdentificacao.checked,
      armazenamento_inadequado: checkArmazenamentoInadequado.checked,
      motivo_armazenamento: selectMotivoArmazenamento.value,
      frasco_trocado: checkFrascoTrocado.checked,
      material_nao_analisado: checkMaterialNaoAnalisado.checked
    }
  });
});

/**
 * Scanner (placeholder)
 */
btnScanner.addEventListener('click', () => {
  mostrarSucesso('Funcionalidade de scanner em desenvolvimento.');
  // TODO: Integrar com scanner
});

// ============================================
// INICIALIZAÇÃO
// ============================================

// Focar no input ao carregar a página
inputCodBarras.focus();

console.log('✅ Triagem.js carregado com sucesso!');
