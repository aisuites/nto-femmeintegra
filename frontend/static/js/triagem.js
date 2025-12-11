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
if (btnScanner) {
  btnScanner.addEventListener('click', async () => {
    if (!requisicaoAtual) {
      mostrarErro('Localize uma requisição primeiro.');
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
    mostrarErro('Erro ao abrir o scanner. Recarregue a página.');
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
      popularSelectMotivos();
    }
  } catch (error) {
    console.error('Erro ao carregar motivos inadequados:', error);
  }
}

/**
 * Popula select de motivos inadequados
 */
function popularSelectMotivos() {
  selectMotivoArmazenamento.innerHTML = '<option value="">Selecione o motivo…</option>';
  
  motivosInadequadosCache.forEach(motivo => {
    const option = document.createElement('option');
    option.value = motivo.id;
    option.textContent = motivo.descricao;
    selectMotivoArmazenamento.appendChild(option);
  });
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
      
      // Selecionar primeira amostra automaticamente
      if (amostrasPendentes.length > 0) {
        selectAmostra.value = amostrasPendentes[0].id;
        aoSelecionarAmostra(amostrasPendentes[0].id);
      }
      
      // Atualizar contador
      atualizarContadorAmostras(data.validadas, data.total);
    }
  } catch (error) {
    console.error('Erro ao carregar amostras:', error);
    mostrarErro('Erro ao carregar amostras da requisição.');
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
  // Criar ou atualizar elemento de contador
  let contador = document.getElementById('contador-amostras');
  
  if (!contador) {
    contador = document.createElement('div');
    contador.id = 'contador-amostras';
    contador.style.cssText = `
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 8px 16px;
      border-radius: 20px;
      font-size: 13px;
      font-weight: 600;
      text-align: center;
      margin-bottom: 16px;
    `;
    
    // Inserir antes do select de amostras
    const selectField = selectAmostra.closest('.field');
    if (selectField) {
      selectField.parentElement.insertBefore(contador, selectField);
    }
  }
  
  contador.textContent = `${validadas} de ${total} amostras validadas`;
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
  
  // Motivo inadequado
  selectMotivoArmazenamento.value = amostra.motivo_inadequado_id || '';
  selectMotivoArmazenamento.disabled = !amostra.flags.armazenamento_inadequado;
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
  selectMotivoArmazenamento.value = '';
  selectMotivoArmazenamento.disabled = true;
  amostraAtualId = null;
}

/**
 * Valida formulário de amostra
 */
function validarFormularioAmostra() {
  const erros = [];
  
  // CRÍTICO: Verificar se existe arquivo digitalizado da requisição
  const containerArquivos = document.getElementById('scanner-files-container');
  const temArquivo = containerArquivos && containerArquivos.children.length > 0;
  
  if (!temArquivo) {
    erros.push('É obrigatório digitalizar a requisição antes de validar as amostras.\nClique no botão "📠 SCANNER" para digitalizar.');
  }
  
  // Amostra selecionada obrigatória
  if (!selectAmostra.value) {
    erros.push('Selecione uma amostra');
  }
  
  // Data de validade obrigatória
  if (!amostraDataValidade.value) {
    erros.push('Informe a data de validade');
  }
  
  // Se armazenamento inadequado, motivo é obrigatório
  if (checkArmazenamentoInadequado.checked && !selectMotivoArmazenamento.value) {
    erros.push('Selecione o motivo do armazenamento inadequado');
  }
  
  if (erros.length > 0) {
    mostrarErro(erros.join('\n'));
    return false;
  }
  
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
    motivo_inadequado_id: selectMotivoArmazenamento.value || null,
    flag_frasco_trocado: checkFrascoTrocado.checked,
    flag_material_nao_analisado: checkMaterialNaoAnalisado.checked,
    descricao: ''
  };
}

/**
 * Salva amostra com validação de impeditivos
 */
async function salvarAmostraTriagem() {
  if (!validarFormularioAmostra()) return;
  
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
      mostrarMensagemSucesso('Amostra validada com sucesso!');
      
      if (result.proxima_amostra.existe) {
        // Há mais amostras pendentes
        await carregarAmostrasTriagem(requisicaoAtual.id);
        
      } else {
        // Todas validadas - prosseguir para Etapa 2
        mostrarMensagemSucesso('Todas as amostras foram validadas! Prosseguindo para Etapa 2...');
        setTimeout(() => carregarEtapa2(), 1500);
      }
    } else if (result.status === 'error') {
      mostrarErro(result.message);
    }
    
  } catch (error) {
    console.error('Erro ao salvar amostra:', error);
    mostrarErro('Erro ao salvar amostra. Tente novamente.');
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
      mostrarErro(result.message);
    }
    
  } catch (error) {
    console.error('Erro ao rejeitar requisição:', error);
    mostrarErro('Erro ao rejeitar requisição. Tente novamente.');
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

// Habilitar/desabilitar select de motivo ao marcar checkbox
checkArmazenamentoInadequado.addEventListener('change', function() {
  selectMotivoArmazenamento.disabled = !this.checked;
  if (!this.checked) {
    selectMotivoArmazenamento.value = '';
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
