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
const multiselectMotivo = document.getElementById('multiselect-motivo-armazenamento');
const multiselectBtn = multiselectMotivo.querySelector('.multiselect-btn');
const multiselectText = multiselectMotivo.querySelector('.multiselect-text');
const multiselectOptions = multiselectMotivo.querySelector('.multiselect-options');
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

// Funções de alerta removidas - usar mostrarAlerta() e mostrarMensagemSucesso()

/**
 * Mostra mensagem de erro abaixo do campo de código de barras
 */
function mostrarMensagemErroLocalizacao(mensagem) {
  let erroDiv = document.getElementById('erro-localizacao');
  
  if (!erroDiv) {
    // Criar div de erro se não existir
    erroDiv = document.createElement('div');
    erroDiv.id = 'erro-localizacao';
    erroDiv.className = 'erro-localizacao';
    
    // Inserir após o help-text do código de barras
    const helpText = document.querySelector('.help-text');
    if (helpText) {
      helpText.parentNode.insertBefore(erroDiv, helpText.nextSibling);
    } else {
      // Fallback: inserir após o input-group
      const inputGroup = inputCodBarras.closest('.input-group');
      if (inputGroup) {
        inputGroup.parentNode.insertBefore(erroDiv, inputGroup.nextSibling);
      }
    }
  }
  
  erroDiv.innerHTML = `<strong>Ops!</strong> ${mensagem}`;
  erroDiv.style.display = 'block';
}

/**
 * Oculta mensagem de erro de localização
 */
function ocultarMensagemErroLocalizacao() {
  const erroDiv = document.getElementById('erro-localizacao');
  if (erroDiv) {
    erroDiv.style.display = 'none';
  }
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
  
  // Esconder alerta de arquivo obrigatório se estava visível
  esconderAlerta();
  
  // Carregar arquivos digitalizados
  carregarArquivos();
  
  // Carregar amostras para triagem etapa 1
  carregarAmostrasTriagem(dados.id);
  
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
    mostrarAlerta('Informe o código de barras da requisição.');
    inputCodBarras.focus();
    return;
  }
  
  btnLocalizar.disabled = true;
  btnLocalizar.textContent = '🔄 Localizando...';
  
  try {
    const response = await fetch('/operacao/triagem/localizar/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-CSRFToken': getCsrfToken()
      },
      body: JSON.stringify({ cod_barras: codBarras })
    });
    
    const data = await response.json();
    
    if (data.status === 'success') {
      ocultarMensagemErroLocalizacao();
      carregarRequisicao(data.requisicao);
    } else if (data.status === 'not_found') {
      mostrarMensagemErroLocalizacao(data.message || 'Requisição não encontrada no sistema.');
      limparFormulario();
    } else if (data.status === 'not_eligible') {
      mostrarMensagemErroLocalizacao(data.message);
      limparFormulario();
    } else {
      mostrarMensagemErroLocalizacao(data.message || 'Erro ao localizar requisição.');
    }
    
  } catch (error) {
    console.error('Erro ao localizar requisição:', error);
    mostrarAlerta('Erro ao localizar requisição. Tente novamente.');
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

// Event listener do botão Seguir movido para o final do arquivo (linha ~920)

/**
 * Scanner - Abrir modal com iframe
 */
if (btnScanner) {
  btnScanner.addEventListener('click', async () => {
    if (!requisicaoAtual) {
      mostrarAlerta('Localize uma requisição primeiro.');
      return;
    }
    
    // Verificar se ArquivoManager está disponível
    if (!window.ArquivoManager) {
      abrirScanner();
      return;
    }
    
    try {
      // Verificar se já existe arquivo tipo REQUISICAO
      const resultado = await window.ArquivoManager.verificarArquivoExistente(requisicaoAtual.id);
      
      if (resultado.existe) {
        // Mostrar modal de confirmação de substituição
        window.ArquivoManager.mostrarModalSubstituicao(
          resultado.arquivo,
          async () => {
            // Recarregar lista de arquivos após deletar
            await carregarArquivos();
            // Depois abrir o scanner
            abrirScanner();
          },
          () => {}
        );
      } else {
        abrirScanner();
      }
    } catch (error) {
      console.error('Erro ao verificar arquivo:', error);
      abrirScanner();
    }
  });
}

/**
 * Abre o modal do scanner com inicialização do Dynamsoft
 */
function abrirScanner() {
  if (typeof DynamosoftScanner !== 'undefined' && DynamosoftScanner.open) {
    DynamosoftScanner.open();
  } else {
    console.error('❌ DynamosoftScanner não disponível');
    mostrarAlerta('Erro ao abrir o scanner. Recarregue a página.');
  }
}

// Fechar modal do scanner usando DynamosoftScanner.close()
const btnFecharModal = document.getElementById('btn-fechar-modal');
const btnFecharModalFooter = document.getElementById('btn-fechar-modal-footer');

if (btnFecharModal) {
  btnFecharModal.addEventListener('click', () => {
    if (typeof DynamosoftScanner !== 'undefined' && DynamosoftScanner.close) {
      DynamosoftScanner.close();
    }
  });
}

if (btnFecharModalFooter) {
  btnFecharModalFooter.addEventListener('click', () => {
    if (typeof DynamosoftScanner !== 'undefined' && DynamosoftScanner.close) {
      DynamosoftScanner.close();
    }
  });
}

// ============================================
// ARQUIVOS DIGITALIZADOS
// ============================================

/**
 * Carrega arquivos já digitalizados da requisição
 */
async function carregarArquivos() {
  if (!requisicaoAtual || !requisicaoAtual.id) {
    return;
  }
  
  try {
    const url = AppConfig.buildApiUrl('/operacao/upload/listar/');
    const params = new URLSearchParams({ requisicao_id: requisicaoAtual.id });
    
    const response = await fetch(`${url}?${params}`, {
      method: 'GET',
      headers: AppConfig.getDefaultHeaders()
    });
    
    if (!response.ok) {
      console.error('Erro ao carregar arquivos');
      return;
    }
    
    const data = await response.json();
    
    if (data.status === 'success' && data.arquivos) {
      atualizarListaArquivos(data.arquivos);
    }
    
  } catch (error) {
    console.error('Erro ao carregar arquivos:', error);
  }
}

/**
 * Atualiza a exibição da lista de arquivos
 * @param {Array} arquivos - Lista de arquivos
 */
function atualizarListaArquivos(arquivos) {
  const container = document.getElementById('scanner-files-container');
  
  if (!container) {
    return;
  }
  
  if (!arquivos || arquivos.length === 0) {
    container.innerHTML = `
      <p style="color: var(--femme-gray); font-size: 13px; margin: 0;">
        Nenhum documento digitalizado ainda.
      </p>
    `;
    return;
  }
  
  // Limpar container
  container.innerHTML = '';
  
  // Criar elementos de arquivo com botão de exclusão
  arquivos.forEach(arquivo => {
    const arquivoDiv = document.createElement('div');
    arquivoDiv.className = 'arquivo-item';
    arquivoDiv.style.cssText = `
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 10px 12px;
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 6px;
      margin-bottom: 8px;
      position: relative;
    `;
    
    arquivoDiv.innerHTML = `
      <span style="font-size: 20px;">📄</span>
      <div style="flex: 1; min-width: 0;">
        <a 
          href="${arquivo.url}" 
          target="_blank" 
          rel="noopener noreferrer"
          style="
            color: var(--femme-purple);
            text-decoration: none;
            font-size: 13px;
            font-weight: 500;
            display: block;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
          "
          onmouseover="this.style.textDecoration='underline'"
          onmouseout="this.style.textDecoration='none'"
        >
          ${arquivo.nome}
        </a>
        <span style="font-size: 11px; color: var(--femme-gray);">
          ${formatarDataUpload(arquivo.data_upload)}
        </span>
      </div>
    `;
    
    // Adicionar botão de exclusão (se ArquivoManager estiver disponível)
    if (window.ArquivoManager) {
      window.ArquivoManager.adicionarBotaoExclusao(arquivoDiv, arquivo, () => {
        // Callback após exclusão: recarregar lista de arquivos
        carregarArquivos();
      });
    }
    
    container.appendChild(arquivoDiv);
  });
}

/**
 * Formata data de upload para exibição
 * @param {string} dataISO - Data em formato ISO
 * @returns {string} Data formatada
 */
function formatarDataUpload(dataISO) {
  try {
    const data = new Date(dataISO);
    const dia = String(data.getDate()).padStart(2, '0');
    const mes = String(data.getMonth() + 1).padStart(2, '0');
    const ano = data.getFullYear();
    const hora = String(data.getHours()).padStart(2, '0');
    const min = String(data.getMinutes()).padStart(2, '0');
    
    return `Enviado em ${dia}/${mes}/${ano} às ${hora}:${min}`;
  } catch (e) {
    return 'Data não disponível';
  }
}

// Expor função globalmente para o scanner.js
window.atualizarListaArquivos = atualizarListaArquivos;

// ============================================
// TRIAGEM ETAPA 1 - VALIDAÇÃO DE AMOSTRAS
// ============================================

// Cache de dados
let motivosInadequadosCache = [];
let amostrasCache = [];
let amostraAtualId = null;

/**
 * Carrega motivos de armazenamento inadequado do backend
 */
async function carregarMotivosInadequados() {
  try {
    const response = await fetch('/operacao/triagem/motivos-inadequados/');
    const data = await response.json();
    
    if (data.status === 'success') {
      motivosInadequadosCache = data.motivos;
      popularMultiselectMotivos();
    }
  } catch (error) {
    console.error('Erro ao carregar motivos inadequados:', error);
  }
}

/**
 * Popula multiselect dropdown com checkboxes
 */
function popularMultiselectMotivos() {
  multiselectOptions.innerHTML = '';
  
  motivosInadequadosCache.forEach(motivo => {
    const div = document.createElement('div');
    div.className = 'multiselect-option';
    div.innerHTML = `
      <input type="checkbox" id="motivo-${motivo.id}" value="${motivo.id}" data-codigo="${motivo.codigo}">
      <label for="motivo-${motivo.id}">${motivo.descricao}</label>
    `;
    
    // Event listener para checkbox
    const checkbox = div.querySelector('input[type="checkbox"]');
    checkbox.addEventListener('change', () => {
      div.classList.toggle('selected', checkbox.checked);
      atualizarTextoMultiselect();
    });
    
    // Click na div também marca o checkbox
    div.addEventListener('click', (e) => {
      if (e.target.tagName !== 'INPUT') {
        checkbox.checked = !checkbox.checked;
        div.classList.toggle('selected', checkbox.checked);
        atualizarTextoMultiselect();
      }
    });
    
    multiselectOptions.appendChild(div);
  });
}

/**
 * Atualiza texto do botão multiselect
 */
function atualizarTextoMultiselect() {
  const selecionados = getMotivosInadequadosSelecionados();
  
  if (selecionados.length === 0) {
    multiselectText.textContent = 'Selecione o motivo...';
  } else if (selecionados.length === 1) {
    const motivo = motivosInadequadosCache.find(m => m.id === selecionados[0]);
    multiselectText.textContent = motivo ? motivo.descricao : '1 selecionado';
  } else {
    multiselectText.textContent = `${selecionados.length} selecionados`;
  }
}

/**
 * Obtém IDs dos motivos selecionados
 */
function getMotivosInadequadosSelecionados() {
  const checkboxes = multiselectOptions.querySelectorAll('input[type="checkbox"]:checked');
  return Array.from(checkboxes).map(cb => parseInt(cb.value));
}

/**
 * Limpa seleção de motivos
 */
function limparMultiselectMotivos() {
  const checkboxes = multiselectOptions.querySelectorAll('input[type="checkbox"]');
  checkboxes.forEach(cb => {
    cb.checked = false;
    cb.closest('.multiselect-option').classList.remove('selected');
  });
  multiselectText.textContent = 'Selecione o motivo...';
}

/**
 * Abre/fecha o dropdown multiselect
 */
function toggleMultiselect() {
  if (!multiselectBtn.disabled) {
    multiselectMotivo.classList.toggle('open');
  }
}

/**
 * Fecha o dropdown multiselect
 */
function fecharMultiselect() {
  multiselectMotivo.classList.remove('open');
}

/**
 * Habilita/desabilita o multiselect
 */
function setMultiselectDisabled(disabled) {
  multiselectBtn.disabled = disabled;
  if (disabled) {
    fecharMultiselect();
  }
}

/**
 * Carrega amostras da requisição com status de validação
 */
async function carregarAmostrasTriagem(requisicaoId) {
  try {
    const response = await fetch(`/operacao/triagem/amostras/?requisicao_id=${requisicaoId}`);
    const data = await response.json();
    
    if (data.status === 'success') {
      amostrasCache = data.amostras;
      
      // Filtrar apenas amostras não validadas
      const amostrasPendentes = data.amostras.filter(a => !a.triagem1_validada);
      
      if (amostrasPendentes.length === 0) {
        // Todas validadas - prosseguir para Etapa 2
        mostrarMensagemSucesso('Todas as amostras foram validadas!');
        carregarEtapa2();
        return;
      }
      
      // Popular select com amostras pendentes
      popularSelectAmostras(amostrasPendentes);
      
      // SEMPRE selecionar primeira amostra automaticamente
      if (amostrasPendentes.length > 0) {
        selectAmostra.value = amostrasPendentes[0].id;
        aoSelecionarAmostra(amostrasPendentes[0].id);
      }
      
      // Atualizar contador
      atualizarContadorAmostras(data.validadas, data.total);
    }
  } catch (error) {
    console.error('Erro ao carregar amostras:', error);
    mostrarAlerta('Erro ao carregar amostras da requisição.');
  }
}

/**
 * Popula select de amostras
 */
function popularSelectAmostras(amostras) {
  selectAmostra.innerHTML = '<option value="">Selecione uma amostra...</option>';
  
  amostras.forEach(amostra => {
    const option = document.createElement('option');
    option.value = amostra.id;
    option.textContent = `Amostra ${amostra.ordem} - ${amostra.cod_barras_amostra}`;
    selectAmostra.appendChild(option);
  });
}

/**
 * Atualiza contador de amostras validadas
 */
function atualizarContadorAmostras(validadas, total) {
  const contador = document.getElementById('contador-amostras');
  
  if (contador) {
    contador.textContent = `${validadas} de ${total} amostras validadas`;
  }
}

/**
 * Ao selecionar amostra no select
 */
function aoSelecionarAmostra(amostraId) {
  const amostra = amostrasCache.find(a => a.id == amostraId);
  
  if (!amostra) {
    limparCamposAmostra();
    return;
  }
  
  amostraAtualId = amostraId;
  
  // Preencher campos com dados existentes
  amostraDataColeta.value = amostra.data_coleta || '';
  amostraDataValidade.value = amostra.data_validade || '';
  
  // Preencher checkboxes
  checkDataRasurada.checked = amostra.flags.data_coleta_rasurada;
  checkSemValidade.checked = amostra.flags.sem_data_validade;
  checkSemIdentificacao.checked = amostra.flags.amostra_sem_identificacao;
  checkArmazenamentoInadequado.checked = amostra.flags.armazenamento_inadequado;
  checkFrascoTrocado.checked = amostra.flags.frasco_trocado;
  checkMaterialNaoAnalisado.checked = amostra.flags.material_nao_analisado;
  
  // Motivos inadequados - habilitar multiselect se flag marcada
  setMultiselectDisabled(!amostra.flags.armazenamento_inadequado);
  limparMultiselectMotivos();
  // TODO: Carregar motivos já associados à amostra se existirem
}

/**
 * Limpa campos de amostra
 */
function limparCamposAmostra() {
  amostraDataColeta.value = '';
  amostraDataValidade.value = '';
  checkDataRasurada.checked = false;
  checkSemValidade.checked = false;
  checkSemIdentificacao.checked = false;
  checkArmazenamentoInadequado.checked = false;
  checkFrascoTrocado.checked = false;
  checkMaterialNaoAnalisado.checked = false;
  setMultiselectDisabled(true);
  limparMultiselectMotivos();
  amostraAtualId = null;
}

/**
 * Mostra alerta visual na área fixa acima dos botões
 */
let alertTimeout = null;

function mostrarAlerta(mensagem) {
  // Usar área de validação fixa acima dos botões
  const alert = document.getElementById('triagem_alert_validacao');
  const alertMessage = document.getElementById('triagem_alert_validacao_message');
  
  if (alert && alertMessage) {
    alertMessage.textContent = mensagem;
    alert.classList.add('alert--visible');
    
    // Scroll suave até o alerta
    alert.scrollIntoView({ behavior: 'smooth', block: 'center' });
    
    // Auto-hide após 5 segundos
    if (alertTimeout) {
      clearTimeout(alertTimeout);
    }
    alertTimeout = setTimeout(() => {
      esconderAlerta();
    }, 5000);
  }
}

/**
 * Esconde alerta visual
 */
function esconderAlerta() {
  const alert = document.getElementById('triagem_alert_validacao');
  if (alert) {
    alert.classList.remove('alert--visible');
  }
  
  // Limpar timeout se existir
  if (alertTimeout) {
    clearTimeout(alertTimeout);
    alertTimeout = null;
  }
}

/**
 * Valida formulário de amostra - ORDEM ESPECÍFICA DE VALIDAÇÕES
 */
async function validarFormularioAmostra() {
  // Limpar alerta anterior
  esconderAlerta();
  
  // 1. CRÍTICO: Verificar se existe arquivo digitalizado NO BANCO (não no DOM)
  try {
    const response = await fetch(`/operacao/triagem/verificar-arquivo/?requisicao_id=${requisicaoAtual.id}`);
    const data = await response.json();
    
    if (data.status === 'success' && !data.tem_arquivo) {
      mostrarAlerta('É obrigatório digitalizar a requisição antes de validar as amostras.');
      return false;
    }
  } catch (error) {
    console.error('Erro ao verificar arquivo:', error);
    mostrarAlerta('Erro ao verificar arquivo digitalizado. Tente novamente.');
    return false;
  }
  
  // 2. Amostra selecionada obrigatória
  if (!selectAmostra.value) {
    mostrarAlerta('Selecione uma amostra');
    return false;
  }
  
  // 3. Verificar se flag data rasurada está selecionado (apenas verificação, não bloqueia)
  // Este é um impeditivo que será tratado no backend
  
  // 4. Data de validade obrigatória APENAS SE checkbox "sem data de validade" NÃO estiver marcado
  // Se checkbox estiver marcado, segue como impeditivo (tratado no backend)
  if (!amostraDataValidade.value && !checkSemValidade.checked) {
    mostrarAlerta('Informe a data de validade ou marque "Sem data de validade"');
    return false;
  }
  
  // 5. Flag sem data de validade (impeditivo - será tratado no backend)
  // 6. Flag amostra sem identificação (impeditivo - será tratado no backend)
  // 7. Data de validade > 90 dias (impeditivo - será tratado no backend)
  
  // 8. Se armazenamento inadequado está selecionado, pelo menos um motivo é obrigatório
  if (checkArmazenamentoInadequado.checked && getMotivosInadequadosSelecionados().length === 0) {
    mostrarAlerta('Selecione pelo menos um motivo de armazenamento inadequado');
    return false;
  }
  
  // 8. Flag frasco trocado (impeditivo - será tratado no backend)
  // 9. Flag material não analisado (impeditivo - será tratado no backend)
  
  return true;
}

/**
 * Coleta dados do formulário de amostra
 */
function coletarDadosAmostra() {
  return {
    amostra_id: selectAmostra.value,
    data_coleta: amostraDataColeta.value || null,
    data_validade: amostraDataValidade.value || null,
    flag_data_coleta_rasurada: checkDataRasurada.checked,
    flag_sem_data_validade: checkSemValidade.checked,
    flag_amostra_sem_identificacao: checkSemIdentificacao.checked,
    flag_armazenamento_inadequado: checkArmazenamentoInadequado.checked,
    motivos_inadequados_ids: getMotivosInadequadosSelecionados(),
    flag_frasco_trocado: checkFrascoTrocado.checked,
    flag_material_nao_analisado: checkMaterialNaoAnalisado.checked,
    descricao: ''
  };
}

/**
 * Salva amostra com validação de impeditivos
 */
async function salvarAmostraTriagem() {
  const validacaoOk = await validarFormularioAmostra();
  if (!validacaoOk) return;
  
  const dados = coletarDadosAmostra();
  
  try {
    const response = await fetch('/operacao/triagem/salvar-amostra/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-CSRFToken': getCsrfToken()
      },
      body: JSON.stringify(dados)
    });
    
    const result = await response.json();
    
    if (result.status === 'impeditivo') {
      // Há impeditivos - mostrar modal de rejeição
      mostrarModalRejeicao(result);
      
    } else if (result.status === 'success') {
      // Validada com sucesso
      
      if (result.todas_validadas) {
        // TODAS AMOSTRAS VALIDADAS - Requisição completa!
        mostrarMensagemSucesso('✅ Requisição validada com sucesso! Status atualizado para TRIAGEM1-OK.');
        
        // Aguardar 2 segundos e limpar formulário
        setTimeout(() => {
          limparFormulario();
          inputCodBarras.focus();
        }, 2000);
        
      } else {
        // Ainda há amostras pendentes
        mostrarMensagemSucesso('Amostra validada com sucesso!');
        await carregarAmostrasTriagem(requisicaoAtual.id);
      }
      
    } else if (result.status === 'error') {
      mostrarAlerta(result.message);
    }
    
  } catch (error) {
    console.error('Erro ao salvar amostra:', error);
    mostrarAlerta('Erro ao salvar amostra. Tente novamente.');
  }
}

/**
 * Mostra modal de rejeição com impeditivos
 */
function mostrarModalRejeicao(data) {
  const modal = document.getElementById('modal-rejeicao');
  const listaImpeditivos = document.getElementById('lista-impeditivos');
  const statusRejeicao = document.getElementById('status-rejeicao-nome');
  
  // Montar lista de impeditivos
  listaImpeditivos.innerHTML = data.impeditivos.map(imp => 
    `<li style="color: #d32f2f;">• ${imp}</li>`
  ).join('');
  
  // Mostrar status de destino
  statusRejeicao.textContent = data.status_rejeicao.nome;
  
  // Guardar dados para uso nos botões
  modal.dataset.statusRejeicaoId = data.status_rejeicao.id;
  
  // Exibir modal
  modal.style.display = 'flex';
}

/**
 * Confirma rejeição da requisição
 */
async function confirmarRejeicao() {
  const modal = document.getElementById('modal-rejeicao');
  const statusRejeicaoId = modal.dataset.statusRejeicaoId;
  
  try {
    const response = await fetch('/operacao/triagem/rejeitar-requisicao/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-CSRFToken': getCsrfToken()
      },
      body: JSON.stringify({
        requisicao_id: requisicaoAtual.id,
        status_rejeicao_id: statusRejeicaoId
      })
    });
    
    const result = await response.json();
    
    if (result.status === 'success') {
      modal.style.display = 'none';
      mostrarMensagemSucesso(result.message);
      
      // Limpar formulário e voltar para busca
      limparFormulario();
      inputCodBarras.focus();
    } else {
      mostrarAlerta(result.message);
    }
    
  } catch (error) {
    console.error('Erro ao rejeitar requisição:', error);
    mostrarAlerta('Erro ao rejeitar requisição. Tente novamente.');
  }
}

/**
 * Cancela rejeição
 */
function cancelarRejeicao() {
  const modal = document.getElementById('modal-rejeicao');
  modal.style.display = 'none';
  // Usuário pode corrigir dados e tentar novamente
}

/**
 * Carrega Etapa 2 (placeholder)
 */
function carregarEtapa2() {
  stepContainer.innerHTML = `
    <div style="padding: 40px; text-align: center;">
      <h2 style="color: var(--femme-purple);">🎉 Etapa 1 Concluída!</h2>
      <p>Etapa 2 será implementada em breve.</p>
      <button class="btn btn-primary" onclick="limparFormulario(); inputCodBarras.focus();">
        Nova Triagem
      </button>
    </div>
  `;
}

/**
 * Mostra mensagem de sucesso com barra verde
 */
function mostrarMensagemSucesso(mensagem) {
  // Criar toast de sucesso
  const toast = document.createElement('div');
  toast.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    background: linear-gradient(135deg, #4caf50 0%, #45a049 100%);
    color: white;
    padding: 16px 24px;
    border-radius: 8px;
    border-left: 4px solid #2e7d32;
    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    z-index: 10000;
    font-weight: 500;
    max-width: 400px;
    animation: slideIn 0.3s ease-out;
  `;
  toast.textContent = '✅ ' + mensagem;
  
  document.body.appendChild(toast);
  
  // Remover após 3 segundos
  setTimeout(() => {
    toast.style.animation = 'slideOut 0.3s ease-out';
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

/**
 * Obtém CSRF token
 */
function getCsrfToken() {
  const name = 'csrftoken';
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

// ============================================
// EVENT LISTENERS - TRIAGEM ETAPA 1
// ============================================

// Habilitar/desabilitar multiselect de motivos ao marcar checkbox
checkArmazenamentoInadequado.addEventListener('change', function() {
  setMultiselectDisabled(!this.checked);
  if (!this.checked) {
    limparMultiselectMotivos();
  }
});

// Toggle do dropdown multiselect
multiselectBtn.addEventListener('click', toggleMultiselect);

// Fechar dropdown ao clicar fora
document.addEventListener('click', function(e) {
  if (!multiselectMotivo.contains(e.target)) {
    fecharMultiselect();
  }
});

// Ao selecionar amostra
selectAmostra.addEventListener('change', function() {
  if (this.value) {
    aoSelecionarAmostra(this.value);
  } else {
    limparCamposAmostra();
  }
});

// Botão Seguir
btnSeguir.addEventListener('click', salvarAmostraTriagem);

// Botões do modal de rejeição
document.getElementById('btn-confirmar-rejeicao').addEventListener('click', confirmarRejeicao);
document.getElementById('btn-cancelar-rejeicao').addEventListener('click', cancelarRejeicao);

// ============================================
// INICIALIZAÇÃO
// ============================================

// Carregar dados iniciais
carregarMotivosInadequados();

// Focar no input ao carregar a página
inputCodBarras.focus();
