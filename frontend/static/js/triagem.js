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
const step2Container = document.getElementById('triagem-step2-container');

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

// Botões Etapa 1
const btnCancelar = document.getElementById('btn-cancelar-triagem');
const btnSeguir = document.getElementById('btn-seguir-triagem');
const btnScanner = document.getElementById('btn-scanner');
const scannerFilesContainer = document.getElementById('scanner-files-container');

// Campos da Etapa 2
const reqIdE2 = document.getElementById('req-id-e2');
const reqCodBarrasE2 = document.getElementById('req-cod-barras-e2');
const reqDataRecebimentoE2 = document.getElementById('req-data-recebimento-e2');
const reqCodigoDisplayE2 = document.getElementById('req-codigo-display-e2');
const reqBarrasDisplayE2 = document.getElementById('req-barras-display-e2');
const pendenciasCheckboxes = document.getElementById('pendencias-checkboxes');
const btnCancelarE2 = document.getElementById('btn-cancelar-triagem2');
const btnFinalizarE2 = document.getElementById('btn-finalizar-triagem2');

// Campos da Etapa 3
const step3Container = document.getElementById('triagem-step3-container');
const reqCodigoDisplayE3 = document.getElementById('req-codigo-display-e3');
const reqBarrasDisplayE3 = document.getElementById('req-barras-display-e3');
const cpfPaciente = document.getElementById('cpf-paciente');
const nomePaciente = document.getElementById('nome-paciente');
const crmMedico = document.getElementById('crm-medico');
const ufCrm = document.getElementById('uf-crm');
const nomeMedico = document.getElementById('nome-medico');
const enderecoMedico = document.getElementById('endereco-medico');
const destinoMedico = document.getElementById('destino-medico');
const checkProblemaCpf = document.getElementById('check-problema-cpf');
const checkProblemaMedico = document.getElementById('check-problema-medico');
const amostrasGridE3 = document.getElementById('amostras-grid-e3');
const btnCancelarE3 = document.getElementById('btn-cancelar-triagem3');
const btnSeguirCadastro = document.getElementById('btn-seguir-cadastro');
const btnAdicionarFrasco = document.getElementById('btn-adicionar-frasco');
const btnCpfKorus = document.getElementById('btn-cpf-korus');
const btnCpfReceita = document.getElementById('btn-cpf-receita');
const btnVerImagemRequisicao = document.getElementById('btn-ver-imagem-requisicao');
const btnValidaMedico = document.getElementById('btn-valida-medico');

// Modais Etapa 3
const modalExcluirAmostra = document.getElementById('modal-excluir-amostra');
const modalAdicionarAmostra = document.getElementById('modal-adicionar-amostra');
const modalAvisoPendencias = document.getElementById('modal-aviso-pendencias');
const modalSelecaoMedicos = document.getElementById('modal-selecao-medicos');
const listaMedicosModal = document.getElementById('lista-medicos-modal');
const medicosContador = document.getElementById('medicos-contador');
const selectMotivoExclusao = document.getElementById('motivo-exclusao-amostra');
const selectMotivoAdicao = document.getElementById('motivo-adicao-amostra');
const inputNovaAmostraCodBarras = document.getElementById('nova-amostra-cod-barras');
const erroAdicionarAmostra = document.getElementById('erro-adicionar-amostra');
const erroAdicionarAmostraMsg = document.getElementById('erro-adicionar-amostra-msg');
const listaPendenciasModal = document.getElementById('lista-pendencias-modal');

// Navegação entre etapas
const btnVerEtapa1FromE2 = document.getElementById('btn-ver-etapa1-from-e2');
const btnVerEtapa1FromE3 = document.getElementById('btn-ver-etapa1-from-e3');
const btnVerEtapa2FromE3 = document.getElementById('btn-ver-etapa2-from-e3');
const modalVisualizarEtapa = document.getElementById('modal-visualizar-etapa');
const modalVisualizarEtapaTitulo = document.getElementById('modal-visualizar-etapa-titulo');
const modalVisualizarEtapaConteudo = document.getElementById('modal-visualizar-etapa-conteudo');
const btnFecharModalVisualizarEtapa = document.getElementById('btn-fechar-modal-visualizar-etapa');
const btnFecharVisualizarEtapa = document.getElementById('btn-fechar-visualizar-etapa');
const btnVoltarParaEtapa = document.getElementById('btn-voltar-para-etapa');
const modalConfirmarRetornoEtapa = document.getElementById('modal-confirmar-retorno-etapa');
const msgConfirmarRetorno = document.getElementById('msg-confirmar-retorno');
const msgDadosZerados = document.getElementById('msg-dados-zerados');
const btnCancelarRetornoEtapa = document.getElementById('btn-cancelar-retorno-etapa');
const btnConfirmarRetornoEtapa = document.getElementById('btn-confirmar-retorno-etapa');

// ============================================
// ESTADO GLOBAL
// ============================================

let requisicaoAtual = null;
let amostrasAtual = [];
let tiposPendencia = [];
let tiposAmostra = [];
let motivosExclusaoAmostra = [];
let motivosAdicaoAmostra = [];
let amostraParaExcluir = null;
let pendenciasIdentificadas = [];
let configTiposArquivoE3 = null; // Configuração de tipos de arquivo permitidos na Etapa 3
let etapaVisualizando = null; // Etapa sendo visualizada no modal (1 ou 2)

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
    
    // Inserir após o barcode-row (onde está o input e botão)
    const barcodeRow = inputCodBarras.closest('.barcode-row');
    if (barcodeRow) {
      barcodeRow.parentNode.insertBefore(erroDiv, barcodeRow.nextSibling);
    } else {
      // Fallback: inserir após o próprio input
      inputCodBarras.parentNode.insertBefore(erroDiv, inputCodBarras.nextSibling);
    }
  }
  
  erroDiv.innerHTML = `<strong>⚠️ Atenção:</strong> ${mensagem}`;
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
 * Limpa o formulário (Etapa 1 e Etapa 2)
 */
function limparFormulario() {
  inputCodBarras.value = '';
  stepContainer.style.display = 'none';
  step2Container.style.display = 'none';
  requisicaoAtual = null;
  amostrasAtual = [];
  
  // Limpar campos Etapa 1
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
  
  // Desmarcar checkboxes Etapa 1
  checkDataRasurada.checked = false;
  checkSemValidade.checked = false;
  checkSemIdentificacao.checked = false;
  checkArmazenamentoInadequado.checked = false;
  checkFrascoTrocado.checked = false;
  checkMaterialNaoAnalisado.checked = false;
  
  // Desabilitar dropdown de motivo
  selectMotivoArmazenamento.disabled = true;
  selectMotivoArmazenamento.value = '';
  
  // Limpar campos Etapa 2
  if (reqIdE2) reqIdE2.value = '';
  if (reqCodBarrasE2) reqCodBarrasE2.value = '';
  if (reqDataRecebimentoE2) reqDataRecebimentoE2.value = '';
  if (reqCodigoDisplayE2) reqCodigoDisplayE2.textContent = '#---';
  if (reqBarrasDisplayE2) reqBarrasDisplayE2.textContent = '---';
  if (pendenciasCheckboxes) pendenciasCheckboxes.innerHTML = '';
  
  // Limpar campos Etapa 3
  if (step3Container) step3Container.style.display = 'none';
  if (reqCodigoDisplayE3) reqCodigoDisplayE3.textContent = '#---';
  if (reqBarrasDisplayE3) reqBarrasDisplayE3.textContent = '---';
  if (cpfPaciente) cpfPaciente.value = '';
  if (nomePaciente) nomePaciente.value = '';
  if (crmMedico) crmMedico.value = '';
  if (ufCrm) ufCrm.value = '';
  if (nomeMedico) nomeMedico.value = '';
  if (enderecoMedico) enderecoMedico.value = '';
  if (destinoMedico) destinoMedico.value = '';
  if (checkProblemaCpf) checkProblemaCpf.checked = false;
  if (checkProblemaMedico) checkProblemaMedico.checked = false;
  if (amostrasGridE3) amostrasGridE3.innerHTML = '';
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
    
    // Log para debug
    console.log('Resposta localizar:', response.status, data);
    
    if (data.status === 'success') {
      ocultarMensagemErroLocalizacao();
      
      // Verificar qual etapa carregar
      if (data.etapa === 3) {
        // Carregar Etapa 3 diretamente (status TRIAGEM2-OK)
        carregarEtapa3(data.requisicao);
      } else if (data.etapa === 2) {
        // Carregar Etapa 2 diretamente (status TRIAGEM1-OK)
        carregarEtapa2(data.requisicao);
      } else {
        // Carregar Etapa 1 (padrão - status RECEBIDO)
        carregarRequisicao(data.requisicao);
      }
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
 * Mostra alerta visual na área apropriada
 * @param {string} mensagem - Mensagem a exibir
 * @param {string} contexto - Contexto do alerta: 'cpf', 'medico', 'geral' (padrão: 'geral')
 */
let alertTimeout = null;

function mostrarAlerta(mensagem, contexto = 'geral') {
  // Esconder alertas anteriores
  esconderAlerta();
  
  // Determinar qual área de alerta usar baseado na etapa visível e contexto
  let alert, alertMessage;
  
  const step3Container = document.getElementById('triagem-step3-container');
  const step2Container = document.getElementById('triagem-step2-container');
  
  if (step3Container && step3Container.style.display !== 'none') {
    // Etapa 3 visível - usar contexto específico
    if (contexto === 'cpf') {
      alert = document.getElementById('triagem3_alert_cpf');
      alertMessage = document.getElementById('triagem3_alert_cpf_message');
    } else if (contexto === 'medico') {
      alert = document.getElementById('triagem3_alert_medico');
      alertMessage = document.getElementById('triagem3_alert_medico_message');
    } else {
      // Geral (acima dos botões)
      alert = document.getElementById('triagem3_alert_geral');
      alertMessage = document.getElementById('triagem3_alert_geral_message');
    }
  } else if (step2Container && step2Container.style.display !== 'none') {
    // Etapa 2 visível
    alert = document.getElementById('triagem2_alert_validacao');
    alertMessage = document.getElementById('triagem2_alert_validacao_message');
  } else {
    // Etapa 1 (padrão)
    alert = document.getElementById('triagem_alert_validacao');
    alertMessage = document.getElementById('triagem_alert_validacao_message');
  }
  
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
 * Esconde alerta visual de todas as etapas
 */
function esconderAlerta() {
  // Esconder alertas de todas as etapas e contextos
  const alertIds = [
    'triagem_alert_validacao',
    'triagem2_alert_validacao',
    'triagem3_alert_cpf',
    'triagem3_alert_medico',
    'triagem3_alert_geral'
  ];
  
  alertIds.forEach(id => {
    const alert = document.getElementById(id);
    if (alert) {
      alert.classList.remove('alert--visible');
    }
  });
  
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
        // TODAS AMOSTRAS VALIDADAS - Carregar Etapa 2!
        mostrarMensagemSucesso('✅ Etapa 1 concluída! Carregando etapa 2...');
        
        // Aguardar 1.5 segundos e carregar Etapa 2
        setTimeout(() => {
          carregarEtapa2(result.requisicao || requisicaoAtual);
        }, 1500);
        
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
 * Carrega Etapa 2 - Conferência de Pendências
 */
async function carregarEtapa2(dados) {
  // Esconder Etapa 1
  stepContainer.style.display = 'none';
  
  // Guardar dados da requisição
  if (dados) {
    requisicaoAtual = dados;
  }
  
  // Preencher campos informativos
  if (reqIdE2) reqIdE2.value = requisicaoAtual.id || '';
  if (reqCodBarrasE2) reqCodBarrasE2.value = requisicaoAtual.cod_barras_req || '';
  if (reqCodigoDisplayE2) reqCodigoDisplayE2.textContent = '#' + (requisicaoAtual.cod_req || '---');
  if (reqBarrasDisplayE2) reqBarrasDisplayE2.textContent = requisicaoAtual.cod_barras_req || '---';
  
  // Data de recebimento
  if (reqDataRecebimentoE2) {
    if (requisicaoAtual.data_recebimento_nto) {
      reqDataRecebimentoE2.value = requisicaoAtual.data_recebimento_nto;
    } else {
      const hoje = new Date().toISOString().split('T')[0];
      reqDataRecebimentoE2.value = hoje;
    }
  }
  
  // Carregar tipos de pendência se ainda não carregados
  if (tiposPendencia.length === 0) {
    await carregarTiposPendencia();
  }
  
  // Renderizar checkboxes de pendências
  renderizarCheckboxesPendencias();
  
  // Mostrar Etapa 2
  step2Container.style.display = 'block';
}

/**
 * Carrega tipos de pendência do backend
 */
async function carregarTiposPendencia() {
  try {
    const response = await fetch('/operacao/triagem/tipos-pendencia/', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'X-CSRFToken': getCsrfToken()
      }
    });
    
    const data = await response.json();
    
    if (data.status === 'success') {
      tiposPendencia = data.tipos;
    } else {
      console.error('Erro ao carregar tipos de pendência:', data.message);
    }
  } catch (error) {
    console.error('Erro ao carregar tipos de pendência:', error);
  }
}

/**
 * Renderiza checkboxes de pendências
 */
function renderizarCheckboxesPendencias() {
  if (!pendenciasCheckboxes) return;
  
  pendenciasCheckboxes.innerHTML = '';
  
  tiposPendencia.forEach(tipo => {
    const label = document.createElement('label');
    label.className = 'pendencia-item';
    label.innerHTML = `
      <input type="checkbox" name="pendencia" value="${tipo.codigo}" data-id="${tipo.id}" />
      <span>${tipo.descricao}</span>
    `;
    
    // Toggle classe checked ao clicar
    const checkbox = label.querySelector('input[type="checkbox"]');
    checkbox.addEventListener('change', () => {
      label.classList.toggle('checked', checkbox.checked);
    });
    
    pendenciasCheckboxes.appendChild(label);
  });
}

/**
 * Coleta pendências selecionadas
 */
function coletarPendenciasSelecionadas() {
  const checkboxes = pendenciasCheckboxes.querySelectorAll('input[type="checkbox"]:checked');
  return Array.from(checkboxes).map(cb => ({
    tipo_pendencia_id: parseInt(cb.dataset.id),
    codigo: parseInt(cb.value)
  }));
}

/**
 * Salva Etapa 2 - Verifica pendências e mostra modal de confirmação se necessário
 */
async function salvarEtapa2() {
  const pendencias = coletarPendenciasSelecionadas();
  
  // Se há pendências selecionadas, mostrar modal de confirmação
  if (pendencias.length > 0) {
    mostrarModalConfirmarPendencias(pendencias);
    return;
  }
  
  // Sem pendências - finalizar diretamente
  await finalizarEtapa2Confirmado([]);
}

/**
 * Mostra modal de confirmação de pendências
 */
function mostrarModalConfirmarPendencias(pendencias) {
  const modal = document.getElementById('modal-confirmar-pendencias');
  const listaPendencias = document.getElementById('lista-pendencias-confirmacao');
  
  // Montar lista de pendências selecionadas
  const pendenciasDescricoes = pendencias.map(p => {
    const tipo = tiposPendencia.find(t => t.id === p.tipo_pendencia_id);
    return tipo ? tipo.descricao : `Código ${p.codigo}`;
  });
  
  listaPendencias.innerHTML = pendenciasDescricoes.map(desc => 
    `<li style="color: #e65100;">• ${desc}</li>`
  ).join('');
  
  // Armazenar pendências para uso posterior
  modal.dataset.pendencias = JSON.stringify(pendencias);
  
  // Exibir modal
  modal.style.display = 'flex';
}

/**
 * Fecha modal de confirmação de pendências
 */
function fecharModalConfirmarPendencias() {
  const modal = document.getElementById('modal-confirmar-pendencias');
  modal.style.display = 'none';
}

/**
 * Confirma pendências e finaliza Etapa 2
 */
async function confirmarPendenciasEtapa2() {
  const modal = document.getElementById('modal-confirmar-pendencias');
  const pendencias = JSON.parse(modal.dataset.pendencias || '[]');
  
  fecharModalConfirmarPendencias();
  await finalizarEtapa2Confirmado(pendencias);
}

/**
 * Finaliza Etapa 2 após confirmação
 */
async function finalizarEtapa2Confirmado(pendencias) {
  try {
    btnFinalizarE2.disabled = true;
    btnFinalizarE2.textContent = '⏳ Finalizando...';
    
    const response = await fetch('/operacao/triagem/finalizar/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-CSRFToken': getCsrfToken()
      },
      body: JSON.stringify({
        requisicao_id: requisicaoAtual.id,
        pendencias: pendencias
      })
    });
    
    const result = await response.json();
    
    if (result.status === 'success') {
      // Verificar se tem pendências - se não tiver, carregar Etapa 3
      if (result.pendencias_count === 0) {
        mostrarMensagemSucesso('✅ Etapa 2 concluída! Carregando etapa 3...');
        
        // Aguardar 1.5 segundos e carregar Etapa 3
        setTimeout(() => {
          carregarEtapa3(requisicaoAtual);
        }, 1500);
      } else {
        // Tem pendências - finalizar triagem
        mostrarMensagemSucesso(result.message || 'Triagem finalizada com pendências.');
        
        setTimeout(() => {
          limparFormulario();
          inputCodBarras.focus();
        }, 2000);
      }
      
    } else {
      mostrarAlerta(result.message || 'Erro ao finalizar triagem.');
    }
    
  } catch (error) {
    console.error('Erro ao finalizar triagem:', error);
    mostrarAlerta('Erro ao finalizar triagem. Tente novamente.');
  } finally {
    btnFinalizarE2.disabled = false;
    btnFinalizarE2.textContent = 'SEGUIR';
  }
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
// ETAPA 3 - CADASTRO
// ============================================

/**
 * Carrega Etapa 3 - Cadastro
 */
async function carregarEtapa3(dados) {
  // Esconder Etapas 1 e 2
  stepContainer.style.display = 'none';
  step2Container.style.display = 'none';
  
  // Guardar dados da requisição
  if (dados) {
    requisicaoAtual = dados;
  }
  
  // Preencher campos informativos
  if (reqCodigoDisplayE3) reqCodigoDisplayE3.textContent = '#' + (requisicaoAtual.cod_req || '---');
  if (reqBarrasDisplayE3) reqBarrasDisplayE3.textContent = requisicaoAtual.cod_barras_req || '---';
  
  // Preencher campos existentes da requisição (se houver)
  if (cpfPaciente) {
    cpfPaciente.value = requisicaoAtual.cpf_paciente ? formatarCPF(requisicaoAtual.cpf_paciente) : '';
  }
  if (nomePaciente) {
    nomePaciente.value = requisicaoAtual.nome_paciente || '';
  }
  if (crmMedico) {
    crmMedico.value = requisicaoAtual.crm || '';
  }
  if (ufCrm) {
    // Se tem UF salva, usa ela; senão, usa SP como padrão
    ufCrm.value = requisicaoAtual.uf_crm || 'SP';
  }
  if (nomeMedico) {
    nomeMedico.value = requisicaoAtual.nome_medico || '';
  }
  if (enderecoMedico) {
    enderecoMedico.value = requisicaoAtual.end_medico || '';
  }
  if (destinoMedico) {
    destinoMedico.value = requisicaoAtual.dest_medico || '';
  }
  
  // Preencher checkboxes de problema
  if (checkProblemaCpf) {
    checkProblemaCpf.checked = requisicaoAtual.flag_problema_cpf || false;
  }
  if (checkProblemaMedico) {
    checkProblemaMedico.checked = requisicaoAtual.flag_problema_medico || false;
    // Desabilitar botão Valida se checkbox estiver marcado
    if (btnValidaMedico) {
      btnValidaMedico.disabled = checkProblemaMedico.checked;
    }
  }
  
  // Carregar tipos de amostra se ainda não carregados
  if (tiposAmostra.length === 0) {
    await carregarTiposAmostra();
  }
  
  // Carregar motivos de exclusão de amostra se ainda não carregados
  if (motivosExclusaoAmostra.length === 0) {
    await carregarMotivosExclusaoAmostra();
  }
  
  // Carregar motivos de adição de amostra se ainda não carregados
  if (motivosAdicaoAmostra.length === 0) {
    await carregarMotivosAdicaoAmostra();
  }
  
  // Carregar configuração de tipos de arquivo permitidos
  if (!configTiposArquivoE3) {
    await carregarConfigTiposArquivoE3();
  }
  
  // Carregar amostras da requisição
  await carregarAmostrasEtapa3();
  
  // Mostrar Etapa 3
  step3Container.style.display = 'block';
}

/**
 * Carrega tipos de amostra do backend
 */
async function carregarTiposAmostra() {
  try {
    const response = await fetch('/operacao/triagem/tipos-amostra/', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'X-CSRFToken': getCsrfToken()
      }
    });
    
    const data = await response.json();
    
    if (data.status === 'success') {
      tiposAmostra = data.tipos;
    } else {
      console.error('Erro ao carregar tipos de amostra:', data.message);
    }
  } catch (error) {
    console.error('Erro ao carregar tipos de amostra:', error);
  }
}

/**
 * Carrega amostras da requisição para Etapa 3
 */
async function carregarAmostrasEtapa3() {
  if (!requisicaoAtual || !amostrasGridE3) return;
  
  try {
    const response = await fetch(`/operacao/triagem/amostras/?requisicao_id=${requisicaoAtual.id}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'X-CSRFToken': getCsrfToken()
      }
    });
    
    const data = await response.json();
    
    if (data.status === 'success') {
      amostrasAtual = data.amostras;
      renderizarAmostrasEtapa3();
    } else {
      console.error('Erro ao carregar amostras:', data.message);
    }
  } catch (error) {
    console.error('Erro ao carregar amostras:', error);
  }
}

/**
 * Renderiza grid de amostras na Etapa 3
 */
function renderizarAmostrasEtapa3() {
  if (!amostrasGridE3) return;
  
  amostrasGridE3.innerHTML = '';
  
  // Encontrar o tipo padrão "Citologia em meio liquido"
  const tipoPadrao = tiposAmostra.find(t => t.descricao.toLowerCase() === 'citologia em meio liquido');
  
  amostrasAtual.forEach((amostra, index) => {
    const card = document.createElement('div');
    card.className = 'amostra-card';
    card.dataset.amostraId = amostra.id;
    
    // Determinar valor atual do tipo de amostra
    let valorTipoAmostra = '';
    let tipoAmostraId = amostra.tipo_amostra_id;
    
    if (tipoAmostraId) {
      // Amostra já tem tipo definido
      const tipoAtual = tiposAmostra.find(t => t.id === tipoAmostraId);
      valorTipoAmostra = tipoAtual ? tipoAtual.descricao : '';
    } else if (tipoPadrao) {
      // Usar tipo padrão e salvar automaticamente
      valorTipoAmostra = tipoPadrao.descricao;
      tipoAmostraId = tipoPadrao.id;
      // Salvar tipo padrão no banco (async, não bloqueia renderização)
      salvarTipoAmostraSilencioso(amostra.id, tipoPadrao.id);
    }
    
    // Criar lista de opções para dropdown customizado
    let opcoesHtml = '';
    tiposAmostra.forEach(tipo => {
      const selected = tipo.id === tipoAmostraId ? 'selected' : '';
      opcoesHtml += `<div class="custom-dropdown-item ${selected}" data-id="${tipo.id}" data-value="${tipo.descricao}">${tipo.descricao}</div>`;
    });
    
    card.innerHTML = `
      <div class="amostra-info">
        <span class="amostra-codigo">${amostra.cod_barras_amostra}</span>
        <span class="amostra-ordem">Frasco ${amostra.ordem}</span>
      </div>
      <div class="custom-dropdown-wrapper">
        <input type="text" class="input-tipo-amostra" 
               data-amostra-id="${amostra.id}" data-tipo-id="${tipoAmostraId || ''}"
               value="${valorTipoAmostra}" placeholder="Digite para filtrar..." autocomplete="off" />
        <div class="custom-dropdown-list">${opcoesHtml}</div>
      </div>
      <button type="button" class="btn-excluir-amostra" data-amostra-id="${amostra.id}" data-cod-barras="${amostra.cod_barras_amostra}" title="Excluir amostra">
        🗑️
      </button>
    `;
    
    amostrasGridE3.appendChild(card);
  });
  
  // Adicionar event listeners para dropdowns customizados
  amostrasGridE3.querySelectorAll('.custom-dropdown-wrapper').forEach(wrapper => {
    const input = wrapper.querySelector('.input-tipo-amostra');
    const dropdown = wrapper.querySelector('.custom-dropdown-list');
    const items = dropdown.querySelectorAll('.custom-dropdown-item');
    
    // Abrir dropdown ao focar/clicar no input
    input.addEventListener('focus', function(e) {
      // Fechar outros dropdowns abertos
      document.querySelectorAll('.custom-dropdown-wrapper.open').forEach(w => {
        if (w !== wrapper) {
          w.classList.remove('open');
          w.querySelector('.custom-dropdown-list').classList.remove('show');
        }
      });
      wrapper.classList.add('open');
      dropdown.classList.add('show');
      // Mostrar todos os itens ao abrir
      items.forEach(item => item.classList.remove('hidden'));
    });
    
    // Filtrar itens ao digitar
    input.addEventListener('input', function(e) {
      const filtro = this.value.toLowerCase().trim();
      let temResultado = false;
      
      items.forEach(item => {
        const texto = item.dataset.value.toLowerCase();
        if (texto.includes(filtro)) {
          item.classList.remove('hidden');
          temResultado = true;
        } else {
          item.classList.add('hidden');
        }
      });
      
      // Mostrar dropdown se não estiver visível
      if (!dropdown.classList.contains('show')) {
        wrapper.classList.add('open');
        dropdown.classList.add('show');
      }
    });
    
    // Selecionar item do dropdown
    items.forEach(item => {
      item.addEventListener('click', function(e) {
        e.stopPropagation();
        const tipoId = this.dataset.id;
        const tipoValue = this.dataset.value;
        
        // Atualizar input
        input.value = tipoValue;
        input.dataset.tipoId = tipoId;
        
        // Marcar como selecionado
        items.forEach(i => i.classList.remove('selected'));
        this.classList.add('selected');
        
        // Fechar dropdown
        wrapper.classList.remove('open');
        dropdown.classList.remove('show');
        
        // Disparar evento de mudança
        onTipoAmostraChangeCustom(input.dataset.amostraId, tipoId);
      });
    });
  });
  
  // Fechar dropdown ao clicar fora
  document.addEventListener('click', function(e) {
    if (!e.target.closest('.custom-dropdown-wrapper')) {
      document.querySelectorAll('.custom-dropdown-wrapper.open').forEach(w => {
        w.classList.remove('open');
        w.querySelector('.custom-dropdown-list').classList.remove('show');
      });
    }
  });
  
  amostrasGridE3.querySelectorAll('.btn-excluir-amostra').forEach(btn => {
    btn.addEventListener('click', onExcluirAmostraClick);
  });
}

/**
 * Handler para mudança de tipo de amostra
 */
async function onTipoAmostraChange(e) {
  const amostraId = e.target.dataset.amostraId;
  const valorDigitado = e.target.value.trim();
  
  // Buscar o ID do tipo de amostra pelo texto digitado
  const tipoEncontrado = tiposAmostra.find(t => 
    t.descricao.toLowerCase() === valorDigitado.toLowerCase()
  );
  
  const tipoAmostraId = tipoEncontrado ? tipoEncontrado.id : null;
  
  // Atualizar o data-tipo-id do input
  e.target.dataset.tipoId = tipoAmostraId || '';
  
  // Se digitou algo que não existe na lista, avisar
  if (valorDigitado && !tipoEncontrado) {
    mostrarAlerta('Tipo de amostra não encontrado. Selecione um item da lista.');
    return;
  }
  
  try {
    const response = await fetch('/operacao/triagem/amostras/atualizar/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-CSRFToken': getCsrfToken()
      },
      body: JSON.stringify({
        amostra_id: amostraId,
        tipo_amostra_id: tipoAmostraId
      })
    });
    
    const result = await response.json();
    
    if (result.status !== 'success') {
      mostrarAlerta(result.message || 'Erro ao atualizar tipo de amostra.');
      // Reverter seleção
      await carregarAmostrasEtapa3();
    }
  } catch (error) {
    console.error('Erro ao atualizar tipo de amostra:', error);
    mostrarAlerta('Erro ao atualizar tipo de amostra.');
  }
}

/**
 * Handler para mudança de tipo de amostra (dropdown customizado)
 */
async function onTipoAmostraChangeCustom(amostraId, tipoAmostraId) {
  try {
    const response = await fetch('/operacao/triagem/amostras/atualizar/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-CSRFToken': getCsrfToken()
      },
      body: JSON.stringify({
        amostra_id: amostraId,
        tipo_amostra_id: tipoAmostraId
      })
    });
    
    const result = await response.json();
    
    if (result.status !== 'success') {
      mostrarAlerta(result.message || 'Erro ao atualizar tipo de amostra.');
      await carregarAmostrasEtapa3();
    }
  } catch (error) {
    console.error('Erro ao atualizar tipo de amostra:', error);
    mostrarAlerta('Erro ao atualizar tipo de amostra.');
  }
}

/**
 * Salva tipo de amostra silenciosamente (sem feedback visual)
 * Usado para salvar tipo padrão automaticamente
 */
async function salvarTipoAmostraSilencioso(amostraId, tipoAmostraId) {
  try {
    const response = await fetch('/operacao/triagem/amostras/atualizar/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-CSRFToken': getCsrfToken()
      },
      body: JSON.stringify({
        amostra_id: amostraId,
        tipo_amostra_id: tipoAmostraId
      })
    });
    
    const result = await response.json();
    
    if (result.status === 'success') {
      console.log(`Tipo padrão salvo para amostra ${amostraId}: tipo_id=${tipoAmostraId}`);
    } else {
      console.warn(`Erro ao salvar tipo padrão para amostra ${amostraId}:`, result.message);
    }
  } catch (error) {
    console.error('Erro ao salvar tipo de amostra silencioso:', error);
  }
}

/**
 * Carrega motivos de exclusão de amostra do backend
 */
async function carregarMotivosExclusaoAmostra() {
  try {
    const response = await fetch('/operacao/triagem/motivos-exclusao-amostra/', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'X-CSRFToken': getCsrfToken()
      }
    });
    
    const data = await response.json();
    
    if (data.status === 'success') {
      motivosExclusaoAmostra = data.motivos;
      
      // Popular select de motivos
      if (selectMotivoExclusao) {
        selectMotivoExclusao.innerHTML = '<option value="">Selecione o motivo...</option>';
        motivosExclusaoAmostra.forEach(motivo => {
          selectMotivoExclusao.innerHTML += `<option value="${motivo.id}">${motivo.descricao}</option>`;
        });
      }
    } else {
      console.error('Erro ao carregar motivos de exclusão:', data.message);
    }
  } catch (error) {
    console.error('Erro ao carregar motivos de exclusão:', error);
  }
}

/**
 * Carrega motivos de adição de amostra do backend
 */
async function carregarMotivosAdicaoAmostra() {
  try {
    const response = await fetch('/operacao/triagem/motivos-exclusao-amostra/?tipo=ADICAO', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'X-CSRFToken': getCsrfToken()
      }
    });
    
    const data = await response.json();
    
    if (data.status === 'success') {
      motivosAdicaoAmostra = data.motivos;
      
      // Popular select de motivos
      if (selectMotivoAdicao) {
        selectMotivoAdicao.innerHTML = '<option value="">Selecione o motivo...</option>';
        motivosAdicaoAmostra.forEach(motivo => {
          selectMotivoAdicao.innerHTML += `<option value="${motivo.id}">${motivo.descricao}</option>`;
        });
      }
    } else {
      console.error('Erro ao carregar motivos de adição:', data.message);
    }
  } catch (error) {
    console.error('Erro ao carregar motivos de adição:', error);
  }
}

/**
 * Carrega configuração de tipos de arquivo permitidos para Etapa 3
 */
async function carregarConfigTiposArquivoE3() {
  try {
    const response = await fetch('/operacao/upload/tipos-permitidos/?contexto=TRIAGEM_IMAGEM', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'X-CSRFToken': getCsrfToken()
      }
    });
    
    const data = await response.json();
    
    if (data.status === 'success') {
      configTiposArquivoE3 = data.config;
      
      // Atualizar atributo accept do input de upload
      const inputUpload = document.getElementById('input-upload-imagem-e3');
      if (inputUpload && configTiposArquivoE3.accept) {
        inputUpload.setAttribute('accept', configTiposArquivoE3.accept);
      }
      
      // Atualizar texto informativo
      const infoFormatos = document.getElementById('info-formatos-aceitos-e3');
      if (infoFormatos && configTiposArquivoE3.description) {
        infoFormatos.textContent = `Selecione um ou mais arquivos. Formatos aceitos: ${configTiposArquivoE3.description}.`;
      }
    } else {
      console.error('Erro ao carregar config de tipos de arquivo:', data.message);
    }
  } catch (error) {
    console.error('Erro ao carregar config de tipos de arquivo:', error);
  }
}

/**
 * Valida se um arquivo é permitido para upload na Etapa 3
 */
function validarArquivoPermitidoE3(file) {
  if (!configTiposArquivoE3) {
    // Fallback: aceitar PDF e imagens
    const tiposPermitidos = ['application/pdf', 'image/jpeg', 'image/png'];
    return tiposPermitidos.includes(file.type);
  }
  
  // Validar MIME type
  if (configTiposArquivoE3.mime_types && !configTiposArquivoE3.mime_types.includes(file.type)) {
    return false;
  }
  
  // Validar extensão
  if (configTiposArquivoE3.extensions) {
    const ext = '.' + file.name.split('.').pop().toLowerCase();
    if (!configTiposArquivoE3.extensions.includes(ext)) {
      return false;
    }
  }
  
  // Validar tamanho
  if (configTiposArquivoE3.max_size_mb) {
    const maxBytes = configTiposArquivoE3.max_size_mb * 1024 * 1024;
    if (file.size > maxBytes) {
      return false;
    }
  }
  
  return true;
}

/**
 * Abre modal para visualizar imagem/PDF da requisição
 */
async function abrirModalVerImagem() {
  const modal = document.getElementById('modal-ver-imagem');
  const imgContainer = document.getElementById('imagem-requisicao-container');
  const pdfContainer = document.getElementById('pdf-requisicao-container');
  const loading = document.getElementById('imagem-requisicao-loading');
  const erro = document.getElementById('imagem-requisicao-erro');
  const img = document.getElementById('imagem-requisicao');
  const pdf = document.getElementById('pdf-requisicao');
  
  if (!requisicaoAtual || !requisicaoAtual.id) {
    mostrarAlerta('Nenhuma requisição selecionada.');
    return;
  }
  
  // Mostrar modal com loading
  modal.style.display = 'flex';
  imgContainer.style.display = 'none';
  pdfContainer.style.display = 'none';
  loading.style.display = 'block';
  erro.style.display = 'none';
  
  try {
    // Usar ArquivoManager para buscar arquivo existente
    const result = await ArquivoManager.verificarArquivoExistente(requisicaoAtual.id);
    
    if (result.existe && result.arquivo && result.arquivo.url_arquivo) {
      const url = result.arquivo.url_arquivo;
      const isPdf = url.toLowerCase().endsWith('.pdf');
      
      if (isPdf) {
        // Carregar PDF no iframe
        pdf.src = url;
        pdf.onload = () => {
          loading.style.display = 'none';
          pdfContainer.style.display = 'block';
        };
        // Fallback: mostrar após 1 segundo caso onload não dispare
        setTimeout(() => {
          if (loading.style.display !== 'none') {
            loading.style.display = 'none';
            pdfContainer.style.display = 'block';
          }
        }, 1000);
      } else {
        // Carregar imagem
        img.src = url;
        img.onload = () => {
          loading.style.display = 'none';
          imgContainer.style.display = 'block';
        };
        img.onerror = () => {
          loading.style.display = 'none';
          erro.style.display = 'block';
          console.error('Erro ao carregar imagem:', url);
        };
      }
    } else {
      // Sem arquivo
      loading.style.display = 'none';
      erro.style.display = 'block';
    }
  } catch (error) {
    console.error('Erro ao buscar arquivo:', error);
    loading.style.display = 'none';
    erro.style.display = 'block';
  }
}

/**
 * Fecha modal de visualização de imagem/PDF
 */
function fecharModalVerImagem() {
  const modal = document.getElementById('modal-ver-imagem');
  const img = document.getElementById('imagem-requisicao');
  const pdf = document.getElementById('pdf-requisicao');
  modal.style.display = 'none';
  img.src = ''; // Limpar src para liberar memória
  pdf.src = ''; // Limpar iframe
}

/**
 * Consulta CPF na API Korus e preenche dados do paciente
 */
async function consultarCpfKorus() {
  const cpf = cpfPaciente ? cpfPaciente.value.trim() : '';
  
  if (!cpf) {
    mostrarAlerta('Informe o CPF do paciente.', 'cpf');
    if (cpfPaciente) cpfPaciente.focus();
    return;
  }
  
  // Limpar CPF (apenas números)
  const cpfLimpo = cpf.replace(/\D/g, '');
  
  if (cpfLimpo.length !== 11) {
    mostrarAlerta('CPF inválido. Informe 11 dígitos.', 'cpf');
    if (cpfPaciente) cpfPaciente.focus();
    return;
  }
  
  if (!requisicaoAtual) {
    mostrarAlerta('Nenhuma requisição selecionada.', 'cpf');
    return;
  }
  
  // Desabilitar botão e mostrar loading
  if (btnCpfKorus) {
    btnCpfKorus.disabled = true;
    btnCpfKorus.innerHTML = '<span class="upload-spinner" style="width:14px;height:14px;border-width:2px;"></span> Consultando...';
  }
  
  // Zerar campos na tela antes de consultar (evita dados antigos se API falhar)
  if (nomePaciente) nomePaciente.value = '';
  
  try {
    const response = await fetch(`/operacao/triagem/consultar-cpf-korus/?cpf=${cpfLimpo}&requisicao_id=${requisicaoAtual.id}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'X-CSRFToken': getCsrfToken()
      }
    });
    
    const data = await response.json();
    
    // Log para debug
    console.log('Resposta API Korus:', response.status, data);
    
    // Verificar se houve erro (HTTP não OK ou status error no JSON)
    if (!response.ok || data.status === 'error') {
      mostrarAlerta(data.message || 'Erro ao consultar CPF.', 'cpf');
      return;
    }
    
    if (data.status === 'success' && data.paciente) {
      // Preencher campos com dados retornados
      if (data.paciente.nome && nomePaciente) {
        nomePaciente.value = data.paciente.nome;
      }
      
      mostrarMensagemSucesso('Dados do paciente carregados com sucesso!');
      
      // Log dos dados recebidos para debug
      console.log('Dados do paciente Korus:', data.paciente);
      
    } else {
      mostrarAlerta(data.message || 'Erro ao consultar CPF.', 'cpf');
    }
    
  } catch (error) {
    console.error('Erro ao consultar CPF Korus:', error);
    mostrarAlerta('Erro ao consultar CPF. Tente novamente.', 'cpf');
  } finally {
    // Restaurar botão
    if (btnCpfKorus) {
      btnCpfKorus.disabled = false;
      btnCpfKorus.textContent = 'CPF Korus';
    }
  }
}

/**
 * Consulta CPF na Receita Federal e preenche dados do paciente
 */
async function consultarCpfReceita() {
  const cpf = cpfPaciente ? cpfPaciente.value.trim() : '';
  
  if (!cpf) {
    mostrarAlerta('Informe o CPF do paciente.', 'cpf');
    if (cpfPaciente) cpfPaciente.focus();
    return;
  }
  
  // Limpar CPF (apenas números)
  const cpfLimpo = cpf.replace(/\D/g, '');
  
  if (cpfLimpo.length !== 11) {
    mostrarAlerta('CPF inválido. Informe 11 dígitos.', 'cpf');
    if (cpfPaciente) cpfPaciente.focus();
    return;
  }
  
  if (!requisicaoAtual) {
    mostrarAlerta('Nenhuma requisição selecionada.', 'cpf');
    return;
  }
  
  // Desabilitar botão e mostrar loading
  if (btnCpfReceita) {
    btnCpfReceita.disabled = true;
    btnCpfReceita.innerHTML = '<span class="upload-spinner" style="width:14px;height:14px;border-width:2px;"></span> Consultando...';
  }
  
  // Zerar campos na tela antes de consultar (evita dados antigos se API falhar)
  if (nomePaciente) nomePaciente.value = '';
  
  try {
    const response = await fetch(`/operacao/triagem/consultar-cpf-receita/?cpf=${cpfLimpo}&requisicao_id=${requisicaoAtual.id}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'X-CSRFToken': getCsrfToken()
      }
    });
    
    const data = await response.json();
    
    // Log para debug
    console.log('Resposta API Receita:', response.status, data);
    
    // Verificar se houve erro (HTTP não OK ou status error no JSON)
    if (!response.ok || data.status === 'error') {
      mostrarAlerta(data.message || 'Erro ao consultar CPF.', 'cpf');
      return;
    }
    
    if (data.status === 'success' && data.paciente) {
      // Preencher campos com dados retornados
      if (data.paciente.nome && nomePaciente) {
        nomePaciente.value = data.paciente.nome;
      }
      
      mostrarMensagemSucesso('Dados do paciente carregados com sucesso!');
      
      // Log dos dados recebidos para debug
      console.log('Dados do paciente Receita:', data.paciente);
      
    } else {
      mostrarAlerta(data.message || 'Erro ao consultar CPF.', 'cpf');
    }
    
  } catch (error) {
    console.error('Erro ao consultar CPF Receita:', error);
    mostrarAlerta('Erro ao consultar CPF. Tente novamente.', 'cpf');
  } finally {
    // Restaurar botão
    if (btnCpfReceita) {
      btnCpfReceita.disabled = false;
      btnCpfReceita.textContent = 'CPF Receita';
    }
  }
}

/**
 * Valida médico por CRM e UF na API FEMME
 */
async function validarMedico() {
  const crm = crmMedico ? crmMedico.value.trim() : '';
  const uf = ufCrm ? ufCrm.value.trim() : '';
  
  if (!crm) {
    mostrarAlerta('Informe o CRM do médico.', 'medico');
    if (crmMedico) crmMedico.focus();
    return;
  }
  
  if (!uf) {
    mostrarAlerta('Informe a UF do CRM.', 'medico');
    if (ufCrm) ufCrm.focus();
    return;
  }
  
  if (!requisicaoAtual) {
    mostrarAlerta('Nenhuma requisição selecionada.', 'medico');
    return;
  }
  
  // Desabilitar botão e mostrar loading
  if (btnValidaMedico) {
    btnValidaMedico.disabled = true;
    btnValidaMedico.innerHTML = '<span class="upload-spinner" style="width:14px;height:14px;border-width:2px;"></span> Validando...';
  }
  
  // Zerar campos na tela antes de consultar
  if (nomeMedico) nomeMedico.value = '';
  if (enderecoMedico) enderecoMedico.value = '';
  if (destinoMedico) destinoMedico.value = '';
  
  try {
    const response = await fetch(`/operacao/triagem/validar-medico/?crm=${encodeURIComponent(crm)}&uf_crm=${encodeURIComponent(uf)}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'X-CSRFToken': getCsrfToken()
      }
    });
    
    const data = await response.json();
    
    console.log('Resposta API Médico:', response.status, data);
    
    if (!response.ok || data.status === 'error') {
      mostrarAlerta(data.message || 'Erro ao validar médico.', 'medico');
      return;
    }
    
    if (data.status === 'success' && data.medicos && data.medicos.length > 0) {
      if (data.total === 1) {
        // Apenas 1 endereço: salvar direto
        const medico = data.medicos[0];
        await salvarMedico(medico);
      } else {
        // Múltiplos endereços: abrir modal para seleção
        abrirModalSelecaoMedicos(data.medicos);
      }
    } else {
      mostrarAlerta('Médico não encontrado.', 'medico');
    }
    
  } catch (error) {
    console.error('Erro ao validar médico:', error);
    mostrarAlerta('Erro ao validar médico. Tente novamente.', 'medico');
  } finally {
    // Restaurar botão
    if (btnValidaMedico) {
      btnValidaMedico.disabled = false;
      btnValidaMedico.textContent = 'Valida';
    }
  }
}

/**
 * Abre modal de seleção de médicos (múltiplos endereços)
 */
function abrirModalSelecaoMedicos(medicos) {
  if (!modalSelecaoMedicos || !listaMedicosModal) return;
  
  // Limpar lista
  listaMedicosModal.innerHTML = '';
  
  // Preencher lista de médicos
  medicos.forEach((medico, index) => {
    const tr = document.createElement('tr');
    tr.dataset.index = index;
    tr.dataset.medico = JSON.stringify(medico);
    tr.innerHTML = `
      <td class="icone-selecao">✓</td>
      <td>${medico.crm} - ${medico.uf_crm}</td>
      <td>${medico.nome_medico}</td>
      <td>${medico.endereco}</td>
    `;
    tr.addEventListener('click', () => selecionarMedico(medico));
    listaMedicosModal.appendChild(tr);
  });
  
  // Atualizar contador
  if (medicosContador) {
    medicosContador.textContent = `1 a ${medicos.length} de ${medicos.length} registros`;
  }
  
  // Mostrar modal
  modalSelecaoMedicos.style.display = 'flex';
}

/**
 * Fecha modal de seleção de médicos
 */
function fecharModalSelecaoMedicos() {
  if (modalSelecaoMedicos) {
    modalSelecaoMedicos.style.display = 'none';
  }
}

/**
 * Seleciona médico do modal e salva
 */
async function selecionarMedico(medico) {
  fecharModalSelecaoMedicos();
  await salvarMedico(medico);
}

/**
 * Salva dados do médico na requisição
 */
async function salvarMedico(medico) {
  if (!requisicaoAtual) {
    mostrarAlerta('Nenhuma requisição selecionada.', 'medico');
    return;
  }
  
  try {
    const response = await fetch('/operacao/triagem/salvar-medico/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-CSRFToken': getCsrfToken()
      },
      body: JSON.stringify({
        requisicao_id: requisicaoAtual.id,
        nome_medico: medico.nome_medico || '',
        endereco_medico: medico.endereco || '',
        destino_medico: medico.destino || '',
        crm: medico.crm || '',
        uf_crm: medico.uf_crm || ''
      })
    });
    
    const data = await response.json();
    
    if (!response.ok || data.status === 'error') {
      mostrarAlerta(data.message || 'Erro ao salvar dados do médico.', 'medico');
      return;
    }
    
    // Preencher campos na tela
    if (nomeMedico) nomeMedico.value = medico.nome_medico || '';
    if (enderecoMedico) enderecoMedico.value = medico.endereco || '';
    if (destinoMedico) destinoMedico.value = medico.destino || '';
    
    mostrarMensagemSucesso('Dados do médico carregados com sucesso!');
    
  } catch (error) {
    console.error('Erro ao salvar médico:', error);
    mostrarAlerta('Erro ao salvar dados do médico. Tente novamente.', 'medico');
  }
}

// ============================================
// NAVEGAÇÃO ENTRE ETAPAS
// ============================================

/**
 * Visualiza dados de uma etapa anterior (somente leitura)
 */
async function visualizarEtapa(etapa) {
  if (!requisicaoAtual) {
    mostrarAlerta('Nenhuma requisição selecionada.', 'geral');
    return;
  }
  
  etapaVisualizando = etapa;
  
  try {
    const response = await fetch(`/operacao/triagem/visualizar-etapa/?requisicao_id=${requisicaoAtual.id}&etapa=${etapa}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'X-CSRFToken': getCsrfToken()
      }
    });
    
    const data = await response.json();
    
    if (!response.ok || data.status === 'error') {
      mostrarAlerta(data.message || 'Erro ao carregar dados da etapa.', 'geral');
      return;
    }
    
    // Montar conteúdo do modal
    let html = '<div class="etapa-visualizacao">';
    
    if (etapa === 1) {
      modalVisualizarEtapaTitulo.textContent = 'Visualizar Etapa 1 - Conferência de Amostras';
      
      html += '<h4>Amostras Validadas</h4>';
      
      if (data.amostras && data.amostras.length > 0) {
        data.amostras.forEach(amostra => {
          const statusClass = amostra.validada ? 'validada' : '';
          const statusIcon = amostra.validada ? '✅' : '⏳';
          const dataColeta = amostra.data_coleta ? new Date(amostra.data_coleta).toLocaleDateString('pt-BR') : 'N/A';
          const dataValidade = amostra.data_validade ? new Date(amostra.data_validade).toLocaleDateString('pt-BR') : 'N/A';
          
          html += `
            <div class="amostra-item ${statusClass}">
              <span class="amostra-status">${statusIcon}</span>
              <div class="amostra-info">
                <span class="amostra-codigo">Frasco ${amostra.ordem}: ${amostra.cod_barras}</span>
                <div class="amostra-detalhes">
                  Coleta: ${amostra.flag_data_coleta_rasurada ? 'Rasurada' : dataColeta} | 
                  Validade: ${amostra.flag_sem_data_validade ? 'Sem validade' : dataValidade}
                </div>
              </div>
            </div>
          `;
        });
      } else {
        html += '<p class="text-muted">Nenhuma amostra encontrada.</p>';
      }
      
      // Amostras excluídas
      if (data.amostras_excluidas && data.amostras_excluidas.length > 0) {
        html += '<h4 style="margin-top: 20px;">Amostras Excluídas</h4>';
        data.amostras_excluidas.forEach(amostra => {
          html += `
            <div class="amostra-item excluida">
              <span class="amostra-status">❌</span>
              <div class="amostra-info">
                <span class="amostra-codigo">Frasco ${amostra.ordem}: ${amostra.cod_barras}</span>
                <div class="amostra-detalhes">
                  Motivo: ${amostra.motivo} | Por: ${amostra.usuario} em ${amostra.data}
                </div>
              </div>
            </div>
          `;
        });
      }
      
      // Mensagem para voltar
      msgDadosZerados.textContent = 'Os dados de validação das amostras serão zerados e você precisará refazer as etapas 2 e 3.';
      
    } else if (etapa === 2) {
      modalVisualizarEtapaTitulo.textContent = 'Visualizar Etapa 2 - Conferência de Pendências';
      
      html += '<h4>Pendências Identificadas</h4>';
      
      if (data.tem_pendencias && data.pendencias.length > 0) {
        data.pendencias.forEach(p => {
          html += `
            <div class="pendencia-item">
              <span>⚠️</span>
              <span>${p.tipo}</span>
              ${p.observacao ? `<span class="text-muted">(${p.observacao})</span>` : ''}
            </div>
          `;
        });
      } else {
        html += '<div class="sem-pendencias">✅ Nenhuma pendência identificada nesta requisição.</div>';
      }
      
      // Mensagem para voltar
      msgDadosZerados.textContent = 'Você poderá identificar pendências que não foram marcadas anteriormente.';
    }
    
    html += '</div>';
    
    modalVisualizarEtapaConteudo.innerHTML = html;
    modalVisualizarEtapa.style.display = 'flex';
    
  } catch (error) {
    console.error('Erro ao visualizar etapa:', error);
    mostrarAlerta('Erro ao carregar dados da etapa.', 'geral');
  }
}

/**
 * Fecha o modal de visualização de etapa
 */
function fecharModalVisualizarEtapa() {
  if (modalVisualizarEtapa) {
    modalVisualizarEtapa.style.display = 'none';
  }
  etapaVisualizando = null;
}

/**
 * Abre o modal de confirmação para retornar a uma etapa
 */
function abrirModalConfirmarRetorno() {
  if (!etapaVisualizando) return;
  
  msgConfirmarRetorno.textContent = `Tem certeza que deseja voltar para a Etapa ${etapaVisualizando}?`;
  
  modalVisualizarEtapa.style.display = 'none';
  modalConfirmarRetornoEtapa.style.display = 'flex';
}

/**
 * Fecha o modal de confirmação de retorno
 */
function fecharModalConfirmarRetorno() {
  if (modalConfirmarRetornoEtapa) {
    modalConfirmarRetornoEtapa.style.display = 'none';
  }
}

/**
 * Confirma o retorno para uma etapa anterior
 */
async function confirmarRetornoEtapa() {
  if (!requisicaoAtual || !etapaVisualizando) {
    mostrarAlerta('Erro: dados insuficientes para retornar.', 'geral');
    return;
  }
  
  // Desabilitar botão durante processamento
  if (btnConfirmarRetornoEtapa) {
    btnConfirmarRetornoEtapa.disabled = true;
    btnConfirmarRetornoEtapa.textContent = 'Processando...';
  }
  
  try {
    const response = await fetch('/operacao/triagem/retornar-etapa/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-CSRFToken': getCsrfToken()
      },
      body: JSON.stringify({
        requisicao_id: requisicaoAtual.id,
        etapa_destino: etapaVisualizando
      })
    });
    
    const data = await response.json();
    
    if (!response.ok || data.status === 'error') {
      mostrarAlerta(data.message || 'Erro ao retornar para etapa.', 'geral');
      return;
    }
    
    // Fechar modais
    fecharModalConfirmarRetorno();
    
    // Mostrar mensagem de sucesso
    mostrarMensagemSucesso(data.message || `Requisição retornada para Etapa ${etapaVisualizando}.`);
    
    // Recarregar a requisição para mostrar a etapa correta
    setTimeout(() => {
      localizarRequisicao(requisicaoAtual.cod_barras);
    }, 500);
    
  } catch (error) {
    console.error('Erro ao retornar etapa:', error);
    mostrarAlerta('Erro ao retornar para etapa anterior.', 'geral');
  } finally {
    // Restaurar botão
    if (btnConfirmarRetornoEtapa) {
      btnConfirmarRetornoEtapa.disabled = false;
      btnConfirmarRetornoEtapa.textContent = 'Confirmar Retorno';
    }
  }
}

/**
 * Handler para clique no botão excluir amostra
 */
function onExcluirAmostraClick(e) {
  const btn = e.target.closest('.btn-excluir-amostra');
  const amostraId = btn.dataset.amostraId;
  const codBarras = btn.dataset.codBarras;
  
  amostraParaExcluir = { id: amostraId, codBarras: codBarras };
  
  // Atualizar modal com info da amostra
  document.getElementById('amostra-excluir-info').textContent = `Código: ${codBarras}`;
  
  // Resetar select de motivo
  if (selectMotivoExclusao) {
    selectMotivoExclusao.value = '';
  }
  
  // Mostrar modal
  modalExcluirAmostra.style.display = 'flex';
}

/**
 * Confirma exclusão de amostra (com motivo obrigatório)
 */
async function confirmarExcluirAmostra() {
  if (!amostraParaExcluir) return;
  
  // Validar motivo obrigatório
  const motivoId = selectMotivoExclusao ? selectMotivoExclusao.value : null;
  if (!motivoId) {
    mostrarAlerta('Selecione o motivo da exclusão.');
    return;
  }
  
  try {
    const response = await fetch('/operacao/triagem/amostras/excluir/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-CSRFToken': getCsrfToken()
      },
      body: JSON.stringify({
        amostra_id: amostraParaExcluir.id,
        motivo_exclusao_id: motivoId,
        etapa: 'TRIAGEM3'
      })
    });
    
    const result = await response.json();
    
    if (result.status === 'success') {
      mostrarMensagemSucesso('Amostra excluída com sucesso!');
      modalExcluirAmostra.style.display = 'none';
      amostraParaExcluir = null;
      
      // Recarregar amostras
      await carregarAmostrasEtapa3();
    } else {
      mostrarAlerta(result.message || 'Erro ao excluir amostra.');
    }
  } catch (error) {
    console.error('Erro ao excluir amostra:', error);
    mostrarAlerta('Erro ao excluir amostra.');
  }
}

/**
 * Cancela exclusão de amostra
 */
function cancelarExcluirAmostra() {
  modalExcluirAmostra.style.display = 'none';
  amostraParaExcluir = null;
}

/**
 * Abre modal para adicionar nova amostra
 */
function abrirModalAdicionarAmostra() {
  if (inputNovaAmostraCodBarras) {
    inputNovaAmostraCodBarras.value = '';
  }
  
  // Resetar select de motivo
  if (selectMotivoAdicao) {
    selectMotivoAdicao.value = '';
  }
  
  // Esconder erro anterior
  if (erroAdicionarAmostra) {
    erroAdicionarAmostra.style.display = 'none';
  }
  
  modalAdicionarAmostra.style.display = 'flex';
  
  if (selectMotivoAdicao) {
    selectMotivoAdicao.focus();
  }
}

/**
 * Confirma adição de nova amostra (com validação de código de barras e motivo obrigatório)
 */
async function confirmarAdicionarAmostra() {
  const motivoId = selectMotivoAdicao ? selectMotivoAdicao.value : '';
  const codBarras = inputNovaAmostraCodBarras ? inputNovaAmostraCodBarras.value.trim() : '';
  
  // Validar motivo obrigatório
  if (!motivoId) {
    if (erroAdicionarAmostra && erroAdicionarAmostraMsg) {
      erroAdicionarAmostraMsg.textContent = 'Selecione o motivo da adição.';
      erroAdicionarAmostra.style.display = 'block';
    } else {
      mostrarAlerta('Selecione o motivo da adição.');
    }
    return;
  }
  
  if (!codBarras) {
    if (erroAdicionarAmostra && erroAdicionarAmostraMsg) {
      erroAdicionarAmostraMsg.textContent = 'Informe o código de barras da nova amostra.';
      erroAdicionarAmostra.style.display = 'block';
    } else {
      mostrarAlerta('Informe o código de barras da nova amostra.');
    }
    return;
  }
  
  // Esconder erro anterior
  if (erroAdicionarAmostra) {
    erroAdicionarAmostra.style.display = 'none';
  }
  
  try {
    const response = await fetch('/operacao/triagem/amostras/adicionar/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-CSRFToken': getCsrfToken()
      },
      body: JSON.stringify({
        requisicao_id: requisicaoAtual.id,
        cod_barras_amostra: codBarras,
        motivo_adicao_id: motivoId,
        etapa: 'TRIAGEM3'
      })
    });
    
    const result = await response.json();
    
    if (result.status === 'success') {
      mostrarMensagemSucesso('Amostra adicionada com sucesso!');
      modalAdicionarAmostra.style.display = 'none';
      
      // Recarregar amostras
      await carregarAmostrasEtapa3();
    } else {
      // Mostrar erro no modal
      if (erroAdicionarAmostra && erroAdicionarAmostraMsg) {
        erroAdicionarAmostraMsg.textContent = result.message || 'Erro ao adicionar amostra.';
        erroAdicionarAmostra.style.display = 'block';
      } else {
        mostrarAlerta(result.message || 'Erro ao adicionar amostra.');
      }
    }
  } catch (error) {
    console.error('Erro ao adicionar amostra:', error);
    if (erroAdicionarAmostra && erroAdicionarAmostraMsg) {
      erroAdicionarAmostraMsg.textContent = 'Erro ao adicionar amostra.';
      erroAdicionarAmostra.style.display = 'block';
    } else {
      mostrarAlerta('Erro ao adicionar amostra.');
    }
  }
}

/**
 * Cancela adição de amostra
 */
function cancelarAdicionarAmostra() {
  modalAdicionarAmostra.style.display = 'none';
}

/**
 * Formata CPF com máscara
 */
function formatarCPF(cpf) {
  if (!cpf) return '';
  cpf = cpf.replace(/\D/g, '');
  if (cpf.length <= 3) return cpf;
  if (cpf.length <= 6) return cpf.replace(/(\d{3})(\d+)/, '$1.$2');
  if (cpf.length <= 9) return cpf.replace(/(\d{3})(\d{3})(\d+)/, '$1.$2.$3');
  return cpf.replace(/(\d{3})(\d{3})(\d{3})(\d+)/, '$1.$2.$3-$4').substring(0, 14);
}

/**
 * Aplica máscara de CPF ao digitar
 */
function aplicarMascaraCPF(e) {
  e.target.value = formatarCPF(e.target.value);
}

/**
 * Valida campos obrigatórios da Etapa 3
 * Retorna array de pendências identificadas
 */
function validarCamposEtapa3() {
  const pendencias = [];
  
  const problemaCpfMarcado = checkProblemaCpf && checkProblemaCpf.checked;
  const problemaMedicoMarcado = checkProblemaMedico && checkProblemaMedico.checked;
  
  // Validar CPF (obrigatório, exceto se checkbox marcado)
  const cpfValor = cpfPaciente ? cpfPaciente.value.replace(/\D/g, '') : '';
  if (!cpfValor && !problemaCpfMarcado) {
    pendencias.push({ tipo: 'CPF', mensagem: 'CPF do paciente não informado' });
  }
  
  // Validar Nome Paciente (obrigatório, exceto se checkbox CPF marcado)
  const nomeValor = nomePaciente ? nomePaciente.value.trim() : '';
  if (!nomeValor && !problemaCpfMarcado) {
    pendencias.push({ tipo: 'CPF', mensagem: 'Nome do paciente não informado' });
  }
  
  // Validar CRM (obrigatório, exceto se checkbox médico marcado)
  const crmValor = crmMedico ? crmMedico.value.trim() : '';
  if (!crmValor && !problemaMedicoMarcado) {
    pendencias.push({ tipo: 'MEDICO', mensagem: 'CRM não informado' });
  }
  
  // Validar UF-CRM (obrigatório, exceto se checkbox médico marcado)
  const ufCrmValor = ufCrm ? ufCrm.value.trim().toUpperCase() : '';
  if (!ufCrmValor && !problemaMedicoMarcado) {
    pendencias.push({ tipo: 'MEDICO', mensagem: 'UF do CRM não informada' });
  }
  
  // Validar Nome Médico (obrigatório, exceto se checkbox médico marcado)
  const nomeMedicoValor = nomeMedico ? nomeMedico.value.trim() : '';
  if (!nomeMedicoValor && !problemaMedicoMarcado) {
    pendencias.push({ tipo: 'MEDICO', mensagem: 'Nome do médico não informado' });
  }
  
  // Validar Endereço Médico (obrigatório, exceto se checkbox médico marcado)
  const enderecoValor = enderecoMedico ? enderecoMedico.value.trim() : '';
  if (!enderecoValor && !problemaMedicoMarcado) {
    pendencias.push({ tipo: 'MEDICO', mensagem: 'Endereço do médico não informado' });
  }
  
  // Validar Destino (obrigatório, exceto se checkbox médico marcado)
  const destinoValor = destinoMedico ? destinoMedico.value.trim() : '';
  if (!destinoValor && !problemaMedicoMarcado) {
    pendencias.push({ tipo: 'MEDICO', mensagem: 'Destino não informado' });
  }
  
  return pendencias;
}

/**
 * Salva Etapa 3 - Seguir para Cadastro
 */
async function salvarEtapa3() {
  // Verificar se há checkboxes de problema marcados (gera pendência)
  const problemaCpfMarcado = checkProblemaCpf && checkProblemaCpf.checked;
  const problemaMedicoMarcado = checkProblemaMedico && checkProblemaMedico.checked;
  
  // Validar campos obrigatórios
  const pendenciasValidacao = validarCamposEtapa3();
  
  // Se há pendências de validação (campos não preenchidos e checkbox não marcado)
  if (pendenciasValidacao.length > 0) {
    // Mostrar alerta com campos faltantes
    const mensagens = pendenciasValidacao.map(p => p.mensagem).join(', ');
    mostrarAlerta(`Campos obrigatórios não preenchidos: ${mensagens}`);
    return;
  }
  
  // Se checkbox de problema está marcado, mostrar modal de aviso
  if (problemaCpfMarcado || problemaMedicoMarcado) {
    pendenciasIdentificadas = [];
    
    if (problemaCpfMarcado) {
      pendenciasIdentificadas.push({ tipo: 'CPF', mensagem: 'Problema com CPF do paciente' });
    }
    if (problemaMedicoMarcado) {
      pendenciasIdentificadas.push({ tipo: 'MEDICO', mensagem: 'Problema com dados do médico' });
    }
    
    // Popular lista de pendências no modal
    if (listaPendenciasModal) {
      listaPendenciasModal.innerHTML = '';
      pendenciasIdentificadas.forEach(p => {
        listaPendenciasModal.innerHTML += `<li>${p.mensagem}</li>`;
      });
    }
    
    // Mostrar modal de aviso
    if (modalAvisoPendencias) {
      modalAvisoPendencias.style.display = 'flex';
    }
    return;
  }
  
  // Sem pendências - cadastrar normalmente
  await enviarCadastroEtapa3(false);
}

/**
 * Envia cadastro da Etapa 3 para o backend
 * @param {boolean} comPendencia - Se true, envia para fila de pendências
 */
async function enviarCadastroEtapa3(comPendencia = false) {
  // Coletar dados do formulário
  const dados = {
    requisicao_id: requisicaoAtual.id,
    cpf_paciente: cpfPaciente ? cpfPaciente.value.replace(/\D/g, '') : '',
    nome_paciente: nomePaciente ? nomePaciente.value.trim() : '',
    crm: crmMedico ? crmMedico.value.trim() : '',
    uf_crm: ufCrm ? ufCrm.value.trim().toUpperCase() : '',
    nome_medico: nomeMedico ? nomeMedico.value.trim() : '',
    end_medico: enderecoMedico ? enderecoMedico.value.trim() : '',
    dest_medico: destinoMedico ? destinoMedico.value.trim() : '',
    flag_problema_cpf: checkProblemaCpf ? checkProblemaCpf.checked : false,
    flag_problema_medico: checkProblemaMedico ? checkProblemaMedico.checked : false,
    enviar_para_pendencia: comPendencia
  };
  
  try {
    btnSeguirCadastro.disabled = true;
    btnSeguirCadastro.textContent = '⏳ Processando...';
    
    const response = await fetch('/operacao/triagem/cadastrar/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-CSRFToken': getCsrfToken()
      },
      body: JSON.stringify(dados)
    });
    
    const result = await response.json();
    
    if (result.status === 'success') {
      const mensagem = comPendencia 
        ? 'Requisição enviada para fila de pendências!' 
        : 'Requisição cadastrada com sucesso!';
      mostrarMensagemSucesso(result.message || mensagem);
      
      // Limpar formulário e voltar para busca
      setTimeout(() => {
        limparFormulario();
        inputCodBarras.focus();
      }, 2000);
      
    } else {
      mostrarAlerta(result.message || 'Erro ao cadastrar requisição.');
    }
    
  } catch (error) {
    console.error('Erro ao cadastrar requisição:', error);
    mostrarAlerta('Erro ao cadastrar requisição. Tente novamente.');
  } finally {
    btnSeguirCadastro.disabled = false;
    btnSeguirCadastro.textContent = 'SEGUIR PARA CADASTRO';
  }
}

/**
 * Fecha modal de pendências e volta para corrigir
 */
function voltarCorrigirPendencias() {
  if (modalAvisoPendencias) {
    modalAvisoPendencias.style.display = 'none';
  }
}

/**
 * Confirma envio para fila de pendências
 */
async function confirmarEnviarPendencia() {
  if (modalAvisoPendencias) {
    modalAvisoPendencias.style.display = 'none';
  }
  await enviarCadastroEtapa3(true);
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
// EVENT LISTENERS - TRIAGEM ETAPA 2
// ============================================

// Botão Cancelar Etapa 2
if (btnCancelarE2) {
  btnCancelarE2.addEventListener('click', () => {
    if (confirm('Deseja cancelar a triagem desta requisição?')) {
      limparFormulario();
      inputCodBarras.focus();
    }
  });
}

// Botão Finalizar Etapa 2
if (btnFinalizarE2) {
  btnFinalizarE2.addEventListener('click', salvarEtapa2);
}

// Modal Confirmar Pendências (Etapa 2) - Botões
const btnConfirmarPendencias = document.getElementById('btn-confirmar-pendencias');
const btnCancelarPendencias = document.getElementById('btn-cancelar-pendencias');

if (btnConfirmarPendencias) {
  btnConfirmarPendencias.addEventListener('click', confirmarPendenciasEtapa2);
}

if (btnCancelarPendencias) {
  btnCancelarPendencias.addEventListener('click', fecharModalConfirmarPendencias);
}

// ============================================
// EVENT LISTENERS - TRIAGEM ETAPA 3
// ============================================

// Botão Cancelar Etapa 3
if (btnCancelarE3) {
  btnCancelarE3.addEventListener('click', () => {
    if (confirm('Deseja cancelar o cadastro desta requisição?')) {
      limparFormulario();
      inputCodBarras.focus();
    }
  });
}

// Botão Seguir para Cadastro
if (btnSeguirCadastro) {
  btnSeguirCadastro.addEventListener('click', salvarEtapa3);
}

// Botão Adicionar Frasco
if (btnAdicionarFrasco) {
  btnAdicionarFrasco.addEventListener('click', abrirModalAdicionarAmostra);
}

// Botão CPF Korus
if (btnCpfKorus) {
  btnCpfKorus.addEventListener('click', consultarCpfKorus);
}

// Botão CPF Receita
if (btnCpfReceita) {
  btnCpfReceita.addEventListener('click', consultarCpfReceita);
}

// Botão Valida Médico
if (btnValidaMedico) {
  btnValidaMedico.addEventListener('click', validarMedico);
}

// Checkbox Problema com Médico - desabilita botão Valida quando marcado
if (checkProblemaMedico) {
  checkProblemaMedico.addEventListener('change', () => {
    if (btnValidaMedico) {
      btnValidaMedico.disabled = checkProblemaMedico.checked;
    }
  });
}

// Modal Seleção de Médicos - Botão fechar
const btnFecharModalMedicos = document.getElementById('btn-fechar-modal-medicos');
if (btnFecharModalMedicos) {
  btnFecharModalMedicos.addEventListener('click', fecharModalSelecaoMedicos);
}

// Botão Ver Imagem Requisição
if (btnVerImagemRequisicao) {
  btnVerImagemRequisicao.addEventListener('click', abrirModalVerImagem);
}

// Modal Ver Imagem - Botões
const btnFecharModalImagem = document.getElementById('btn-fechar-modal-imagem');
const btnFecharImagem = document.getElementById('btn-fechar-imagem');

if (btnFecharModalImagem) {
  btnFecharModalImagem.addEventListener('click', fecharModalVerImagem);
}

if (btnFecharImagem) {
  btnFecharImagem.addEventListener('click', fecharModalVerImagem);
}

// Modal Excluir Amostra - Botões
const btnConfirmarExcluir = document.getElementById('btn-confirmar-excluir-amostra');
const btnCancelarExcluir = document.getElementById('btn-cancelar-excluir-amostra');

if (btnConfirmarExcluir) {
  btnConfirmarExcluir.addEventListener('click', confirmarExcluirAmostra);
}

if (btnCancelarExcluir) {
  btnCancelarExcluir.addEventListener('click', cancelarExcluirAmostra);
}

// Modal Adicionar Amostra - Botões
const btnConfirmarAdicionar = document.getElementById('btn-confirmar-adicionar-amostra');
const btnCancelarAdicionar = document.getElementById('btn-cancelar-adicionar-amostra');

if (btnConfirmarAdicionar) {
  btnConfirmarAdicionar.addEventListener('click', confirmarAdicionarAmostra);
}

if (btnCancelarAdicionar) {
  btnCancelarAdicionar.addEventListener('click', cancelarAdicionarAmostra);
}

// Máscara de CPF
if (cpfPaciente) {
  cpfPaciente.addEventListener('input', aplicarMascaraCPF);
}

// Modal Aviso Pendências - Botões
const btnVoltarCorrigir = document.getElementById('btn-voltar-corrigir');
const btnConfirmarPendencia = document.getElementById('btn-confirmar-pendencia');

if (btnVoltarCorrigir) {
  btnVoltarCorrigir.addEventListener('click', voltarCorrigirPendencias);
}

if (btnConfirmarPendencia) {
  btnConfirmarPendencia.addEventListener('click', confirmarEnviarPendencia);
}

// ============================================
// EVENT LISTENERS - NAVEGAÇÃO ENTRE ETAPAS
// ============================================

// Botão Ver Etapa 1 (da Etapa 2)
if (btnVerEtapa1FromE2) {
  btnVerEtapa1FromE2.addEventListener('click', () => visualizarEtapa(1));
}

// Botão Ver Etapa 1 (da Etapa 3)
if (btnVerEtapa1FromE3) {
  btnVerEtapa1FromE3.addEventListener('click', () => visualizarEtapa(1));
}

// Botão Ver Etapa 2 (da Etapa 3)
if (btnVerEtapa2FromE3) {
  btnVerEtapa2FromE3.addEventListener('click', () => visualizarEtapa(2));
}

// Modal Visualizar Etapa - Botões fechar
if (btnFecharModalVisualizarEtapa) {
  btnFecharModalVisualizarEtapa.addEventListener('click', fecharModalVisualizarEtapa);
}

if (btnFecharVisualizarEtapa) {
  btnFecharVisualizarEtapa.addEventListener('click', fecharModalVisualizarEtapa);
}

// Modal Visualizar Etapa - Botão voltar para etapa
if (btnVoltarParaEtapa) {
  btnVoltarParaEtapa.addEventListener('click', abrirModalConfirmarRetorno);
}

// Modal Confirmar Retorno - Botões
if (btnCancelarRetornoEtapa) {
  btnCancelarRetornoEtapa.addEventListener('click', fecharModalConfirmarRetorno);
}

if (btnConfirmarRetornoEtapa) {
  btnConfirmarRetornoEtapa.addEventListener('click', confirmarRetornoEtapa);
}

// Dropdown customizado UF-CRM
const ufCrmWrapper = document.getElementById('uf-crm-wrapper');
const ufCrmInput = document.getElementById('uf-crm');
const ufCrmDropdown = document.getElementById('uf-crm-dropdown');

if (ufCrmWrapper && ufCrmInput && ufCrmDropdown) {
  const ufCrmItems = ufCrmDropdown.querySelectorAll('.custom-dropdown-item');
  
  // Abrir dropdown ao focar no input
  ufCrmInput.addEventListener('focus', function(e) {
    // Fechar outros dropdowns abertos
    document.querySelectorAll('.custom-dropdown-wrapper.open').forEach(w => {
      if (w !== ufCrmWrapper) {
        w.classList.remove('open');
        const dd = w.querySelector('.custom-dropdown-list');
        if (dd) dd.classList.remove('show');
      }
    });
    ufCrmWrapper.classList.add('open');
    ufCrmDropdown.classList.add('show');
    // Mostrar todos os itens ao abrir
    ufCrmItems.forEach(item => item.classList.remove('hidden'));
  });
  
  // Filtrar itens ao digitar
  ufCrmInput.addEventListener('input', function(e) {
    const filtro = this.value.toUpperCase().trim();
    
    ufCrmItems.forEach(item => {
      const texto = item.dataset.value.toUpperCase();
      if (texto.includes(filtro)) {
        item.classList.remove('hidden');
      } else {
        item.classList.add('hidden');
      }
    });
    
    // Mostrar dropdown se não estiver visível
    if (!ufCrmDropdown.classList.contains('show')) {
      ufCrmWrapper.classList.add('open');
      ufCrmDropdown.classList.add('show');
    }
  });
  
  // Selecionar item do dropdown
  ufCrmItems.forEach(item => {
    item.addEventListener('click', function(e) {
      e.stopPropagation();
      ufCrmInput.value = this.dataset.value;
      ufCrmItems.forEach(i => i.classList.remove('selected'));
      this.classList.add('selected');
      ufCrmWrapper.classList.remove('open');
      ufCrmDropdown.classList.remove('show');
    });
  });
}

// Botão Upload Etapa 3 - abrir seletor de arquivos
const btnCarregarImagemE3 = document.getElementById('btn-carregar-imagem-e3');
const inputUploadImagemE3 = document.getElementById('input-upload-imagem-e3');
const uploadFilesContainerE3 = document.getElementById('upload-files-container-e3');

// Array para armazenar arquivos enviados na Etapa 3
let arquivosUploadE3 = [];

if (btnCarregarImagemE3 && inputUploadImagemE3) {
  btnCarregarImagemE3.addEventListener('click', () => {
    inputUploadImagemE3.click();
  });
  
  inputUploadImagemE3.addEventListener('change', async (e) => {
    if (e.target.files && e.target.files.length > 0) {
      await processarUploadImagensE3(e.target.files);
      // Limpar input para permitir selecionar os mesmos arquivos novamente
      inputUploadImagemE3.value = '';
    }
  });
}

/**
 * Processa upload de múltiplos arquivos na Etapa 3
 */
async function processarUploadImagensE3(files) {
  if (!requisicaoAtual) {
    mostrarAlerta('Nenhuma requisição selecionada.');
    return;
  }
  
  const descricaoPermitidos = configTiposArquivoE3?.description || 'PDF, JPEG, JPG ou PNG';
  const maxSizeMb = configTiposArquivoE3?.max_size_mb || 10;
  
  for (const file of files) {
    // Validar tipo de arquivo usando configuração dinâmica
    if (!validarArquivoPermitidoE3(file)) {
      // Verificar se é problema de tamanho
      if (configTiposArquivoE3?.max_size_mb && file.size > configTiposArquivoE3.max_size_mb * 1024 * 1024) {
        mostrarAlerta(`Arquivo "${file.name}" excede o tamanho máximo de ${maxSizeMb}MB.`);
      } else {
        mostrarAlerta(`Arquivo "${file.name}" não é permitido. Tipos aceitos: ${descricaoPermitidos}.`);
      }
      continue;
    }
    
    try {
      // Mostrar indicador de progresso
      adicionarArquivoUploadE3(file.name, 'uploading');
      
      // 1. Obter signed URL
      const signedUrlResponse = await fetch(`/operacao/upload/signed-url/?requisicao_id=${requisicaoAtual.id}&content_type=${encodeURIComponent(file.type)}`, {
        method: 'GET',
        headers: {
          'X-CSRFToken': getCsrfToken()
        }
      });
      
      const signedUrlData = await signedUrlResponse.json();
      
      if (signedUrlData.status !== 'success') {
        atualizarStatusArquivoE3(file.name, 'error');
        mostrarAlerta(`Erro ao preparar upload: ${signedUrlData.message}`);
        continue;
      }
      
      // 2. Upload para S3
      const uploadResponse = await fetch(signedUrlData.signed_url, {
        method: 'PUT',
        body: file,
        headers: {
          'Content-Type': file.type
        }
      });
      
      if (!uploadResponse.ok) {
        atualizarStatusArquivoE3(file.name, 'error');
        mostrarAlerta(`Erro ao enviar arquivo "${file.name}".`);
        continue;
      }
      
      // 3. Confirmar upload no backend (tipo OUTROS = código 2)
      const confirmarResponse = await fetch('/operacao/upload/confirmar/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRFToken': getCsrfToken()
        },
        body: JSON.stringify({
          requisicao_id: requisicaoAtual.id,
          file_key: signedUrlData.file_key,
          filename: file.name,
          tipo_arquivo_codigo: 2  // OUTROS
        })
      });
      
      const confirmarData = await confirmarResponse.json();
      
      if (confirmarData.status === 'success') {
        atualizarStatusArquivoE3(file.name, 'success', confirmarData.arquivo.id, confirmarData.arquivo.url);
        arquivosUploadE3.push(confirmarData.arquivo);
      } else {
        atualizarStatusArquivoE3(file.name, 'error');
        mostrarAlerta(`Erro ao registrar arquivo: ${confirmarData.message}`);
      }
      
    } catch (error) {
      console.error('Erro no upload:', error);
      atualizarStatusArquivoE3(file.name, 'error');
      mostrarAlerta(`Erro ao enviar arquivo "${file.name}".`);
    }
  }
}

/**
 * Adiciona item de arquivo na lista de uploads da Etapa 3
 */
function adicionarArquivoUploadE3(filename, status) {
  if (!uploadFilesContainerE3) return;
  
  const fileId = `upload-file-${filename.replace(/[^a-zA-Z0-9]/g, '_')}`;
  
  // Verificar se já existe
  if (document.getElementById(fileId)) {
    return;
  }
  
  const fileItem = document.createElement('div');
  fileItem.id = fileId;
  fileItem.className = 'scanner-file-item';
  fileItem.dataset.filename = filename;
  
  // Usar spinner para status de upload em andamento
  let statusHtml = '<span class="upload-spinner"></span>';
  if (status === 'success') statusHtml = '<span class="file-status">✅</span>';
  if (status === 'error') statusHtml = '<span class="file-status">❌</span>';
  
  fileItem.innerHTML = `
    <span class="file-status-container">${statusHtml}</span>
    <span class="file-name">${filename}</span>
    <button type="button" class="btn-remove-file" data-filename="${filename}" title="Remover">✕</button>
  `;
  
  uploadFilesContainerE3.appendChild(fileItem);
  
  // Adicionar event listener para remover
  fileItem.querySelector('.btn-remove-file').addEventListener('click', () => {
    removerArquivoUploadE3(filename);
  });
}

/**
 * Atualiza status de um arquivo na lista
 */
function atualizarStatusArquivoE3(filename, status, arquivoId = null, fileUrl = null) {
  const fileId = `upload-file-${filename.replace(/[^a-zA-Z0-9]/g, '_')}`;
  const fileItem = document.getElementById(fileId);
  
  if (!fileItem) return;
  
  const statusContainer = fileItem.querySelector('.file-status-container');
  const fileNameSpan = fileItem.querySelector('.file-name');
  
  // Atualizar ícone de status
  if (status === 'success') {
    statusContainer.innerHTML = '<span class="file-status">✅</span>';
  } else if (status === 'error') {
    statusContainer.innerHTML = '<span class="file-status">❌</span>';
  } else {
    statusContainer.innerHTML = '<span class="upload-spinner"></span>';
  }
  
  // Se sucesso e tem URL, transformar nome em link
  if (status === 'success' && fileUrl) {
    fileNameSpan.innerHTML = `<a href="${fileUrl}" target="_blank" title="Clique para visualizar">${filename}</a>`;
    fileItem.dataset.fileUrl = fileUrl;
  }
  
  if (arquivoId) {
    fileItem.dataset.arquivoId = arquivoId;
  }
}

/**
 * Remove arquivo da lista de uploads
 */
async function removerArquivoUploadE3(filename) {
  const fileId = `upload-file-${filename.replace(/[^a-zA-Z0-9]/g, '_')}`;
  const fileItem = document.getElementById(fileId);
  
  if (!fileItem) return;
  
  const arquivoId = fileItem.dataset.arquivoId;
  
  // Se tem ID, excluir do backend
  if (arquivoId) {
    try {
      const response = await fetch('/operacao/upload/deletar/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRFToken': getCsrfToken()
        },
        body: JSON.stringify({ arquivo_id: arquivoId })
      });
      
      const result = await response.json();
      
      if (result.status !== 'success') {
        mostrarAlerta('Erro ao excluir arquivo.');
        return;
      }
    } catch (error) {
      console.error('Erro ao excluir arquivo:', error);
      mostrarAlerta('Erro ao excluir arquivo.');
      return;
    }
  }
  
  // Remover da lista visual
  fileItem.remove();
  
  // Remover do array
  arquivosUploadE3 = arquivosUploadE3.filter(a => a.nome !== filename);
}

// ============================================
// INICIALIZAÇÃO
// ============================================

// Carregar dados iniciais
carregarMotivosInadequados();

// Focar no input ao carregar a página
inputCodBarras.focus();
