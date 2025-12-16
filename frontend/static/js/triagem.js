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

// Modais Etapa 3
const modalExcluirAmostra = document.getElementById('modal-excluir-amostra');
const modalAdicionarAmostra = document.getElementById('modal-adicionar-amostra');
const modalAvisoPendencias = document.getElementById('modal-aviso-pendencias');
const selectMotivoExclusao = document.getElementById('motivo-exclusao-amostra');
const inputNovaAmostraCodBarras = document.getElementById('nova-amostra-cod-barras');
const erroAdicionarAmostra = document.getElementById('erro-adicionar-amostra');
const erroAdicionarAmostraMsg = document.getElementById('erro-adicionar-amostra-msg');
const listaPendenciasModal = document.getElementById('lista-pendencias-modal');

// ============================================
// ESTADO GLOBAL
// ============================================

let requisicaoAtual = null;
let amostrasAtual = [];
let tiposPendencia = [];
let tiposAmostra = [];
let motivosExclusaoAmostra = [];
let amostraParaExcluir = null;
let pendenciasIdentificadas = [];

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
 * Salva Etapa 2 - Finaliza triagem
 */
async function salvarEtapa2() {
  const pendencias = coletarPendenciasSelecionadas();
  
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
    btnFinalizarE2.textContent = 'FINALIZAR TRIAGEM';
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
  if (cpfPaciente && requisicaoAtual.cpf_paciente) {
    cpfPaciente.value = formatarCPF(requisicaoAtual.cpf_paciente);
  }
  if (nomePaciente && requisicaoAtual.nome_paciente) {
    nomePaciente.value = requisicaoAtual.nome_paciente;
  }
  if (crmMedico && requisicaoAtual.crm) {
    crmMedico.value = requisicaoAtual.crm;
  }
  if (ufCrm && requisicaoAtual.uf_crm) {
    ufCrm.value = requisicaoAtual.uf_crm;
  }
  if (nomeMedico && requisicaoAtual.nome_medico) {
    nomeMedico.value = requisicaoAtual.nome_medico;
  }
  if (enderecoMedico && requisicaoAtual.end_medico) {
    enderecoMedico.value = requisicaoAtual.end_medico;
  }
  if (destinoMedico && requisicaoAtual.dest_medico) {
    destinoMedico.value = requisicaoAtual.dest_medico;
  }
  
  // Carregar tipos de amostra se ainda não carregados
  if (tiposAmostra.length === 0) {
    await carregarTiposAmostra();
  }
  
  // Carregar motivos de exclusão de amostra se ainda não carregados
  if (motivosExclusaoAmostra.length === 0) {
    await carregarMotivosExclusaoAmostra();
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
      // Usar tipo padrão
      valorTipoAmostra = tipoPadrao.descricao;
      tipoAmostraId = tipoPadrao.id;
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
               value="${valorTipoAmostra}" placeholder="Clique para selecionar..." autocomplete="off" readonly />
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
    
    // Abrir/fechar dropdown ao clicar no input
    input.addEventListener('click', function(e) {
      e.stopPropagation();
      // Fechar outros dropdowns abertos
      document.querySelectorAll('.custom-dropdown-list.show').forEach(d => {
        if (d !== dropdown) d.classList.remove('show');
      });
      dropdown.classList.toggle('show');
    });
    
    // Selecionar item do dropdown
    dropdown.querySelectorAll('.custom-dropdown-item').forEach(item => {
      item.addEventListener('click', function(e) {
        e.stopPropagation();
        const tipoId = this.dataset.id;
        const tipoValue = this.dataset.value;
        
        // Atualizar input
        input.value = tipoValue;
        input.dataset.tipoId = tipoId;
        
        // Marcar como selecionado
        dropdown.querySelectorAll('.custom-dropdown-item').forEach(i => i.classList.remove('selected'));
        this.classList.add('selected');
        
        // Fechar dropdown
        dropdown.classList.remove('show');
        
        // Disparar evento de mudança
        onTipoAmostraChangeCustom(input.dataset.amostraId, tipoId);
      });
    });
  });
  
  // Fechar dropdown ao clicar fora
  document.addEventListener('click', function() {
    document.querySelectorAll('.custom-dropdown-list.show').forEach(d => {
      d.classList.remove('show');
    });
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
  
  // Esconder erro anterior
  if (erroAdicionarAmostra) {
    erroAdicionarAmostra.style.display = 'none';
  }
  
  modalAdicionarAmostra.style.display = 'flex';
  
  if (inputNovaAmostraCodBarras) {
    inputNovaAmostraCodBarras.focus();
  }
}

/**
 * Confirma adição de nova amostra (com validação de código de barras)
 */
async function confirmarAdicionarAmostra() {
  const codBarras = inputNovaAmostraCodBarras ? inputNovaAmostraCodBarras.value.trim() : '';
  
  if (!codBarras) {
    mostrarAlerta('Informe o código de barras da nova amostra.');
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

// Dropdown customizado UF-CRM
const ufCrmInput = document.getElementById('uf-crm');
const ufCrmDropdown = document.getElementById('uf-crm-dropdown');

if (ufCrmInput && ufCrmDropdown) {
  // Abrir/fechar dropdown ao clicar no input
  ufCrmInput.addEventListener('click', function(e) {
    e.stopPropagation();
    document.querySelectorAll('.custom-dropdown-list.show').forEach(d => {
      if (d !== ufCrmDropdown) d.classList.remove('show');
    });
    ufCrmDropdown.classList.toggle('show');
  });
  
  // Selecionar item do dropdown
  ufCrmDropdown.querySelectorAll('.custom-dropdown-item').forEach(item => {
    item.addEventListener('click', function(e) {
      e.stopPropagation();
      ufCrmInput.value = this.dataset.value;
      ufCrmDropdown.querySelectorAll('.custom-dropdown-item').forEach(i => i.classList.remove('selected'));
      this.classList.add('selected');
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
 * Processa upload de múltiplas imagens na Etapa 3
 */
async function processarUploadImagensE3(files) {
  if (!requisicaoAtual) {
    mostrarAlerta('Nenhuma requisição selecionada.');
    return;
  }
  
  for (const file of files) {
    // Validar tipo de arquivo (apenas imagens)
    if (!file.type.startsWith('image/')) {
      mostrarAlerta(`Arquivo "${file.name}" não é uma imagem válida.`);
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
        atualizarStatusArquivoE3(file.name, 'success', confirmarData.arquivo.id);
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
  
  let statusIcon = '⏳';
  if (status === 'success') statusIcon = '✅';
  if (status === 'error') statusIcon = '❌';
  
  fileItem.innerHTML = `
    <span class="file-status">${statusIcon}</span>
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
function atualizarStatusArquivoE3(filename, status, arquivoId = null) {
  const fileId = `upload-file-${filename.replace(/[^a-zA-Z0-9]/g, '_')}`;
  const fileItem = document.getElementById(fileId);
  
  if (!fileItem) return;
  
  let statusIcon = '⏳';
  if (status === 'success') statusIcon = '✅';
  if (status === 'error') statusIcon = '❌';
  
  fileItem.querySelector('.file-status').textContent = statusIcon;
  
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
