/**
 * CADASTRO_REQUISICAO.JS
 * JavaScript para a página de Cadastro de Requisição
 * Segue o padrão da página de Triagem Etapa 3
 */

// ============================================
// VARIÁVEIS GLOBAIS
// ============================================

// Elementos DOM
const inputCodBarras = document.getElementById('input-cod-barras-cadastro');
const btnLocalizar = document.getElementById('btn-localizar-cadastro');
const cadastroContainer = document.getElementById('cadastro-container');

// Displays
const reqCodigoDisplay = document.getElementById('req-codigo-display');
const reqBarrasDisplay = document.getElementById('req-barras-display');
const unidadeNomeDisplay = document.getElementById('unidade-nome-display');

// Campos CPF
const cpfPaciente = document.getElementById('cpf-paciente');
const nomePaciente = document.getElementById('nome-paciente');
const btnCpfKorus = document.getElementById('btn-cpf-korus');
const btnRodarOcr = document.getElementById('btn-rodar-ocr');
const btnCpfReceita = document.getElementById('btn-cpf-receita');
const checkProblemaCpf = document.getElementById('check-problema-cpf');
const btnVerImagemRequisicao = document.getElementById('btn-ver-imagem-requisicao');

// Campos Paciente
const dataDum = document.getElementById('data-dum');
const dataNascimento = document.getElementById('data-nascimento');
const emailPaciente = document.getElementById('email-paciente');
const telefonePaciente = document.getElementById('telefone-paciente');
const sexoPaciente = document.getElementById('sexo-paciente');
const checkSexoAConfirmar = document.getElementById('check-sexo-a-confirmar');

// Campos Médico
const crmMedico = document.getElementById('crm-medico');
const ufCrm = document.getElementById('uf-crm');
const ufCrmWrapper = document.getElementById('uf-crm-wrapper');
const ufCrmDropdown = document.getElementById('uf-crm-dropdown');
const btnValidaMedico = document.getElementById('btn-valida-medico');
const checkProblemaMedico = document.getElementById('check-problema-medico');
const nomeMedico = document.getElementById('nome-medico');
const enderecoMedico = document.getElementById('endereco-medico');
const destinoMedico = document.getElementById('destino-medico');

// Campos Exames
const selectTipoAtendimento = document.getElementById('select-tipo-atendimento');
const btnAdicionarExame = document.getElementById('btn-adicionar-exame');
const examesGridBody = document.getElementById('exames-grid-body');
const examesEmpty = document.getElementById('exames-empty');

// Upload
const btnCarregarImagem = document.getElementById('btn-carregar-imagem');
const inputUploadImagem = document.getElementById('input-upload-imagem');
const uploadFilesContainer = document.getElementById('upload-files-container');

// Botões de ação
const btnCancelar = document.getElementById('btn-cancelar-cadastro');
const btnAutorizar = document.getElementById('btn-autorizar');

// Alertas
const alertCpf = document.getElementById('cadastro_alert_cpf');
const alertCpfMessage = document.getElementById('cadastro_alert_cpf_message');
const alertMedico = document.getElementById('cadastro_alert_medico');
const alertMedicoMessage = document.getElementById('cadastro_alert_medico_message');
const alertGeral = document.getElementById('cadastro_alert_geral');
const alertGeralMessage = document.getElementById('cadastro_alert_geral_message');

// Estado
let requisicaoAtual = null;
let examesSelecionados = [];
let arquivosParaUpload = [];
let medicoValidado = false;

// ============================================
// FUNÇÕES UTILITÁRIAS
// ============================================

function getCookie(name) {
  const cookieValue = document.cookie
    .split('; ')
    .find(row => row.startsWith(name + '='))
    ?.split('=')[1];
  return cookieValue;
}

const csrfToken = getCookie('csrftoken');

function formatarCPF(cpf) {
  if (!cpf) return '';
  cpf = cpf.replace(/\D/g, '');
  if (cpf.length <= 3) return cpf;
  if (cpf.length <= 6) return cpf.replace(/(\d{3})(\d+)/, '$1.$2');
  if (cpf.length <= 9) return cpf.replace(/(\d{3})(\d{3})(\d+)/, '$1.$2.$3');
  return cpf.replace(/(\d{3})(\d{3})(\d{3})(\d+)/, '$1.$2.$3-$4').substring(0, 14);
}

function formatarTelefone(tel) {
  tel = tel.replace(/\D/g, '');
  if (tel.length <= 2) return tel;
  if (tel.length <= 7) return tel.replace(/(\d{2})(\d+)/, '($1) $2');
  if (tel.length <= 11) return tel.replace(/(\d{2})(\d{5})(\d+)/, '($1) $2-$3');
  return tel.substring(0, 15);
}

function formatarData(dataInput) {
  if (!dataInput) return '';
  
  let data;
  
  // Se já está no formato yyyy-mm-dd, retornar diretamente
  if (/^\d{4}-\d{2}-\d{2}$/.test(dataInput)) {
    return dataInput;
  }
  
  // Se está no formato dd/mm/yyyy (Receita Federal)
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(dataInput)) {
    const partes = dataInput.split('/');
    return `${partes[2]}-${partes[1]}-${partes[0]}`;
  }
  
  // Tentar parsear como ISO
  try {
    data = new Date(dataInput + 'T00:00:00');
    if (isNaN(data.getTime())) {
      return '';
    }
    return data.toISOString().split('T')[0];
  } catch (e) {
    console.warn('Erro ao formatar data:', dataInput, e);
    return '';
  }
}

// Variável para controlar timeout dos alertas
let alertaTimeouts = {};

function mostrarAlerta(elemento, mensagemElemento, mensagem, tipo = 'error') {
  mensagemElemento.textContent = mensagem;
  elemento.classList.add('alert--visible');
  
  // Aplicar cor baseada no tipo
  if (tipo === 'success') {
    elemento.style.background = 'linear-gradient(135deg, #d4edda 0%, #c3e6cb 100%)';
    elemento.style.borderLeftColor = '#28a745';
    elemento.style.color = '#155724';
  } else {
    // error ou not_found
    elemento.style.background = 'linear-gradient(135deg, #f8d7da 0%, #f5c6cb 100%)';
    elemento.style.borderLeftColor = '#dc3545';
    elemento.style.color = '#721c24';
  }
  
  // Limpar timeout anterior se existir
  const elementoId = elemento.id;
  if (alertaTimeouts[elementoId]) {
    clearTimeout(alertaTimeouts[elementoId]);
  }
  
  // Auto-ocultar após 4 segundos
  alertaTimeouts[elementoId] = setTimeout(() => {
    ocultarAlerta(elemento);
  }, 4000);
}

function ocultarAlerta(elemento) {
  elemento.classList.remove('alert--visible');
  // Limpar timeout se existir
  const elementoId = elemento.id;
  if (alertaTimeouts[elementoId]) {
    clearTimeout(alertaTimeouts[elementoId]);
    delete alertaTimeouts[elementoId];
  }
}

function ocultarTodosAlertas() {
  ocultarAlerta(alertCpf);
  ocultarAlerta(alertMedico);
  ocultarAlerta(alertGeral);
}

function mostrarMensagemErroLocalizacao(mensagem) {
  let erroDiv = document.getElementById('erro-localizacao');
  if (!erroDiv) {
    erroDiv = document.createElement('div');
    erroDiv.id = 'erro-localizacao';
    erroDiv.className = 'erro-localizacao';
    const barcodeRow = document.querySelector('.barcode-row');
    if (barcodeRow) {
      barcodeRow.parentNode.insertBefore(erroDiv, barcodeRow.nextSibling);
    }
  }
  erroDiv.innerHTML = `<strong>⚠️ Atenção:</strong> ${mensagem}`;
  erroDiv.style.display = 'block';
}

function ocultarMensagemErroLocalizacao() {
  const erroDiv = document.getElementById('erro-localizacao');
  if (erroDiv) {
    erroDiv.style.display = 'none';
  }
}

// ============================================
// FUNÇÕES DE LIMPEZA
// ============================================

function limparFormulario() {
  // Ocultar container
  cadastroContainer.style.display = 'none';
  
  // Limpar estado
  requisicaoAtual = null;
  examesSelecionados = [];
  arquivosParaUpload = [];
  medicoValidado = false;
  
  // Limpar displays
  reqCodigoDisplay.textContent = '#---';
  reqBarrasDisplay.textContent = '---';
  unidadeNomeDisplay.textContent = '---';
  
  // Limpar campos CPF
  cpfPaciente.value = '';
  nomePaciente.value = '';
  checkProblemaCpf.checked = false;
  
  // Limpar campos paciente
  dataDum.value = '';
  dataNascimento.value = '';
  emailPaciente.value = '';
  telefonePaciente.value = '';
  sexoPaciente.value = '';
  checkSexoAConfirmar.checked = false;
  
  // Limpar campos médico
  crmMedico.value = '';
  ufCrm.value = '';
  nomeMedico.value = '';
  enderecoMedico.value = '';
  destinoMedico.value = '';
  checkProblemaMedico.checked = false;
  
  // Limpar exames
  selectTipoAtendimento.value = '';
  examesGridBody.innerHTML = '';
  examesEmpty.style.display = 'block';
  
  // Limpar upload
  uploadFilesContainer.innerHTML = '';
  
  // Ocultar alertas
  ocultarTodosAlertas();
  
  // Limpar input de busca
  inputCodBarras.value = '';
}

// ============================================
// FUNÇÕES DE CARREGAMENTO
// ============================================

function carregarDadosRequisicao(data) {
  requisicaoAtual = data;
  
  // Preencher displays
  reqCodigoDisplay.textContent = `#${data.cod_req}`;
  reqBarrasDisplay.textContent = data.cod_barras_req;
  unidadeNomeDisplay.textContent = data.unidade_nome || '---';
  
  // Preencher campos CPF (com máscara)
  cpfPaciente.value = formatarCPF(data.cpf_paciente);
  nomePaciente.value = data.nome_paciente || '';
  checkProblemaCpf.checked = data.flag_problema_cpf || false;
  
  // Preencher campos paciente
  dataDum.value = formatarData(data.data_um);
  dataNascimento.value = formatarData(data.data_nasc_paciente);
  emailPaciente.value = data.email_paciente || '';
  telefonePaciente.value = data.telefone_paciente || '';
  sexoPaciente.value = data.sexo_paciente || '';
  checkSexoAConfirmar.checked = data.flag_sexo_a_confirmar || false;
  
  // Preencher campos médico
  crmMedico.value = data.crm || '';
  ufCrm.value = data.uf_crm || '';
  nomeMedico.value = data.nome_medico || '';
  enderecoMedico.value = data.end_medico || '';
  destinoMedico.value = data.dest_medico || '';
  checkProblemaMedico.checked = data.flag_problema_medico || false;
  
  // Se já tem dados do médico preenchidos, considerar como validado
  if (data.nome_medico && data.crm && data.uf_crm) {
    medicoValidado = true;
  }
  
  // Carregar exames existentes
  if (data.exames && data.exames.length > 0) {
    examesSelecionados = data.exames;
    renderizarExames();
  }
  
  // Mostrar container
  cadastroContainer.style.display = 'block';
}

// ============================================
// FUNÇÕES DE EXAMES
// ============================================

function renderizarExames() {
  examesGridBody.innerHTML = '';
  
  if (examesSelecionados.length === 0) {
    examesEmpty.style.display = 'block';
    return;
  }
  
  examesEmpty.style.display = 'none';
  
  examesSelecionados.forEach((exame, index) => {
    const row = document.createElement('div');
    row.className = 'exame-row';
    row.innerHTML = `
      <div class="exame-actions">
        <button type="button" class="btn-edit" title="Editar" data-index="${index}">✏️</button>
        <button type="button" class="btn-delete" title="Excluir" data-index="${index}">🗑️</button>
      </div>
      <div class="exame-nome">${exame.tipo_amostra_descricao || exame.descricao || '---'}</div>
      <div class="exame-tipo-atendimento">${exame.tipo_atendimento_descricao || '---'}</div>
    `;
    examesGridBody.appendChild(row);
  });
  
  // Adicionar eventos aos botões
  examesGridBody.querySelectorAll('.btn-delete').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const index = parseInt(e.target.dataset.index);
      confirmarExclusaoExame(index);
    });
  });
  
  examesGridBody.querySelectorAll('.btn-edit').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const index = parseInt(e.target.dataset.index);
      editarExame(index);
    });
  });
}

function confirmarExclusaoExame(index) {
  const exame = examesSelecionados[index];
  const modal = document.getElementById('modal-excluir-exame');
  const info = document.getElementById('exame-excluir-info');
  
  info.textContent = `Exame: ${exame.tipo_amostra_descricao || exame.descricao || '---'}`;
  modal.style.display = 'flex';
  
  // Armazenar índice para exclusão
  modal.dataset.indexExcluir = index;
}

function excluirExame(index) {
  examesSelecionados.splice(index, 1);
  renderizarExames();
}

function editarExame(index) {
  // TODO: Implementar modal de edição
  console.log('Editar exame:', index);
  alert('Funcionalidade de edição será implementada nos modais.');
}

// ============================================
// FUNÇÕES DE UPLOAD
// ============================================

function renderizarArquivos() {
  uploadFilesContainer.innerHTML = '';
  
  arquivosParaUpload.forEach((arquivo, index) => {
    const pill = document.createElement('div');
    pill.className = 'file-pill';
    pill.innerHTML = `
      <span>📄 ${arquivo.name}</span>
      <button type="button" class="file-remove" data-index="${index}" title="Remover">✕</button>
    `;
    uploadFilesContainer.appendChild(pill);
  });
  
  // Adicionar eventos de remoção
  uploadFilesContainer.querySelectorAll('.file-remove').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const index = parseInt(e.target.dataset.index);
      arquivosParaUpload.splice(index, 1);
      renderizarArquivos();
    });
  });
}

// ============================================
// FUNÇÕES DE VALIDAÇÃO DE MÉDICO
// ============================================

async function validarMedico() {
  const crm = crmMedico.value.trim();
  const uf = ufCrm.value.trim().toUpperCase();
  
  if (!crm) {
    mostrarAlerta(alertMedico, alertMedicoMessage, 'Informe o número do CRM.');
    return;
  }
  
  if (!uf || uf.length !== 2) {
    mostrarAlerta(alertMedico, alertMedicoMessage, 'Informe a UF do CRM (2 caracteres).');
    return;
  }
  
  ocultarAlerta(alertMedico);
  btnValidaMedico.disabled = true;
  btnValidaMedico.textContent = 'Validando...';
  
  try {
    // API usa GET com query params
    const response = await fetch(`/operacao/triagem/validar-medico/?crm=${encodeURIComponent(crm)}&uf_crm=${encodeURIComponent(uf)}`, {
      method: 'GET',
      headers: {
        'X-CSRFToken': csrfToken,
      },
    });
    
    const data = await response.json();
    
    if (data.status === 'success' && data.medicos && data.medicos.length > 0) {
      const medico = data.medicos[0];
      nomeMedico.value = medico.nome_medico || '';
      enderecoMedico.value = medico.endereco || '';
      destinoMedico.value = medico.destino || '';
      medicoValidado = true;
      mostrarAlerta(alertMedico, alertMedicoMessage, '✅ Médico validado com sucesso!', 'success');
    } else if (data.status === 'not_found') {
      mostrarAlerta(alertMedico, alertMedicoMessage, data.message || 'Médico não encontrado.', 'error');
      medicoValidado = false;
    } else if (data.status === 'multiple') {
      mostrarAlerta(alertMedico, alertMedicoMessage, data.message || 'Múltiplos médicos encontrados.', 'error');
      medicoValidado = false;
    } else {
      mostrarAlerta(alertMedico, alertMedicoMessage, data.message || 'Erro ao validar médico.', 'error');
      medicoValidado = false;
    }
  } catch (error) {
    console.error('Erro ao validar médico:', error);
    mostrarAlerta(alertMedico, alertMedicoMessage, 'Erro de conexão ao validar médico.', 'error');
    medicoValidado = false;
  } finally {
    btnValidaMedico.disabled = false;
    btnValidaMedico.textContent = 'Valida';
  }
}

// ============================================
// FUNÇÕES DE CPF
// ============================================

async function consultarCpfKorus() {
  const cpf = cpfPaciente.value.replace(/\D/g, '');
  
  if (!cpf || cpf.length !== 11) {
    mostrarAlerta(alertCpf, alertCpfMessage, 'Informe um CPF válido (11 dígitos).');
    return;
  }
  
  ocultarAlerta(alertCpf);
  btnCpfKorus.disabled = true;
  btnCpfKorus.textContent = 'Consultando...';
  
  // Zerar campos na tela antes de consultar (evita dados antigos se API falhar)
  nomePaciente.value = '';
  dataNascimento.value = '';
  emailPaciente.value = '';
  sexoPaciente.value = '';
  
  try {
    // API usa GET com query params - incluir requisicao_id para salvar no banco
    const reqId = requisicaoAtual ? requisicaoAtual.id : '';
    const response = await fetch(`/operacao/triagem/consultar-cpf-korus/?cpf=${encodeURIComponent(cpf)}&requisicao_id=${reqId}`, {
      method: 'GET',
      headers: {
        'X-CSRFToken': csrfToken,
      },
    });
    
    const data = await response.json();
    
    if (data.status === 'success' && data.paciente) {
      const pac = data.paciente;
      nomePaciente.value = pac.nome || '';
      if (pac.data_nascimento) {
        dataNascimento.value = formatarData(pac.data_nascimento);
      }
      if (pac.email) {
        emailPaciente.value = pac.email;
      }
      if (pac.sexo) {
        sexoPaciente.value = pac.sexo;
      }
      mostrarAlerta(alertCpf, alertCpfMessage, '✅ CPF encontrado na base Korus!', 'success');
    } else {
      mostrarAlerta(alertCpf, alertCpfMessage, data.message || 'CPF não encontrado na base Korus.', 'error');
    }
  } catch (error) {
    console.error('Erro ao consultar CPF Korus:', error);
    mostrarAlerta(alertCpf, alertCpfMessage, 'Erro de conexão ao consultar CPF.', 'error');
  } finally {
    btnCpfKorus.disabled = false;
    btnCpfKorus.textContent = 'CPF Korus';
  }
}

async function consultarCpfReceita() {
  const cpf = cpfPaciente.value.replace(/\D/g, '');
  
  if (!cpf || cpf.length !== 11) {
    mostrarAlerta(alertCpf, alertCpfMessage, 'Informe um CPF válido (11 dígitos).');
    return;
  }
  
  ocultarAlerta(alertCpf);
  btnCpfReceita.disabled = true;
  btnCpfReceita.textContent = 'Consultando...';
  
  // Zerar campos na tela antes de consultar (evita dados antigos se API falhar)
  nomePaciente.value = '';
  dataNascimento.value = '';
  
  try {
    // API usa GET com query params - incluir requisicao_id para salvar no banco
    const reqId = requisicaoAtual ? requisicaoAtual.id : '';
    const response = await fetch(`/operacao/triagem/consultar-cpf-receita/?cpf=${encodeURIComponent(cpf)}&requisicao_id=${reqId}`, {
      method: 'GET',
      headers: {
        'X-CSRFToken': csrfToken,
      },
    });
    
    const data = await response.json();
    
    if (data.status === 'success' && data.paciente) {
      const pac = data.paciente;
      nomePaciente.value = pac.nome || '';
      if (pac.data_nascimento) {
        dataNascimento.value = formatarData(pac.data_nascimento);
      }
      mostrarAlerta(alertCpf, alertCpfMessage, '✅ CPF encontrado na Receita Federal!', 'success');
    } else {
      mostrarAlerta(alertCpf, alertCpfMessage, data.message || 'CPF não encontrado na Receita Federal.', 'error');
    }
  } catch (error) {
    console.error('Erro ao consultar CPF Receita:', error);
    mostrarAlerta(alertCpf, alertCpfMessage, 'Erro de conexão ao consultar CPF.', 'error');
  } finally {
    btnCpfReceita.disabled = false;
    btnCpfReceita.textContent = 'CPF Receita';
  }
}

// ============================================
// FUNÇÕES DE LOCALIZAÇÃO
// ============================================

async function localizarRequisicao() {
  const codBarras = inputCodBarras.value.trim();
  
  console.log('[Cadastro] Iniciando localização, código:', codBarras);
  
  if (!codBarras) {
    mostrarMensagemErroLocalizacao('Digite ou bipe o código de barras da requisição.');
    return;
  }
  
  ocultarMensagemErroLocalizacao();
  btnLocalizar.disabled = true;
  btnLocalizar.textContent = '🔄 Localizando...';
  
  console.log('[Cadastro] CSRF Token:', csrfToken);
  
  try {
    console.log('[Cadastro] Fazendo fetch para /operacao/cadastro/localizar/');
    const response = await fetch('/operacao/cadastro/localizar/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-CSRFToken': csrfToken,
      },
      body: JSON.stringify({ cod_barras: codBarras }),
    });
    
    console.log('[Cadastro] Response status:', response.status);
    const data = await response.json();
    console.log('[Cadastro] Response data:', data);
    
    if (data.status === 'success') {
      ocultarMensagemErroLocalizacao();
      carregarDadosRequisicao(data.requisicao);
    } else if (data.status === 'not_found') {
      limparFormulario();
      mostrarMensagemErroLocalizacao(data.message || 'Requisição não encontrada.');
    } else if (data.status === 'not_eligible') {
      limparFormulario();
      mostrarMensagemErroLocalizacao(data.message || 'Requisição não elegível para cadastro.');
    } else {
      mostrarMensagemErroLocalizacao(data.message || 'Erro ao localizar requisição.');
    }
  } catch (error) {
    console.error('Erro ao localizar requisição:', error);
    mostrarMensagemErroLocalizacao('Erro de conexão. Tente novamente.');
  } finally {
    btnLocalizar.disabled = false;
    btnLocalizar.textContent = '🔍 Localizar';
  }
}

// ============================================
// FUNÇÕES DE AUTORIZAÇÃO
// ============================================

async function autorizarRequisicao() {
  if (!requisicaoAtual) {
    mostrarAlerta(alertGeral, alertGeralMessage, 'Nenhuma requisição carregada.');
    return;
  }
  
  // Validações básicas
  if (!nomePaciente.value.trim()) {
    mostrarAlerta(alertGeral, alertGeralMessage, 'Informe o nome do paciente.');
    return;
  }
  
  if (examesSelecionados.length === 0) {
    mostrarAlerta(alertGeral, alertGeralMessage, 'Adicione pelo menos um exame.');
    return;
  }
  
  ocultarAlerta(alertGeral);
  btnAutorizar.disabled = true;
  btnAutorizar.textContent = 'Autorizando...';
  
  // Preparar dados
  const dados = {
    requisicao_id: requisicaoAtual.id,
    cpf_paciente: cpfPaciente.value.replace(/\D/g, ''),
    nome_paciente: nomePaciente.value.trim(),
    data_um: dataDum.value || null,
    data_nasc_paciente: dataNascimento.value || null,
    email_paciente: emailPaciente.value.trim(),
    telefone_paciente: telefonePaciente.value.trim(),
    sexo_paciente: sexoPaciente.value,
    flag_sexo_a_confirmar: checkSexoAConfirmar.checked,
    flag_problema_cpf: checkProblemaCpf.checked,
    crm: crmMedico.value.trim(),
    uf_crm: ufCrm.value.trim().toUpperCase(),
    nome_medico: nomeMedico.value.trim(),
    end_medico: enderecoMedico.value.trim(),
    dest_medico: destinoMedico.value.trim(),
    flag_problema_medico: checkProblemaMedico.checked,
    exames: examesSelecionados,
  };
  
  try {
    const response = await fetch('/operacao/cadastro/autorizar/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-CSRFToken': csrfToken,
      },
      body: JSON.stringify(dados),
    });
    
    const data = await response.json();
    
    if (data.status === 'success') {
      mostrarToastSucesso('Requisição autorizada com sucesso!');
      setTimeout(() => {
        limparFormulario();
        inputCodBarras.focus();
      }, 2000);
    } else {
      mostrarAlerta(alertGeral, alertGeralMessage, data.message || 'Erro ao autorizar requisição.');
    }
  } catch (error) {
    console.error('Erro ao autorizar requisição:', error);
    mostrarAlerta(alertGeral, alertGeralMessage, 'Erro de conexão. Tente novamente.');
  } finally {
    btnAutorizar.disabled = false;
    btnAutorizar.textContent = 'AUTORIZAR';
  }
}

function mostrarToastSucesso(mensagem) {
  const toast = document.createElement('div');
  toast.className = 'toast-sucesso';
  toast.innerHTML = `
    <span class="toast-icon">✅</span>
    <span class="toast-message">${mensagem}</span>
  `;
  toast.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    background: linear-gradient(135deg, #00bca4 0%, #00a08c 100%);
    color: white;
    padding: 16px 24px;
    border-radius: 10px;
    box-shadow: 0 8px 30px rgba(0, 188, 164, 0.4);
    display: flex;
    align-items: center;
    gap: 12px;
    font-weight: 600;
    font-size: 14px;
    z-index: 9999;
    animation: slideIn 0.3s ease;
  `;
  document.body.appendChild(toast);
  
  setTimeout(() => {
    toast.style.animation = 'slideOut 0.3s ease';
    setTimeout(() => toast.remove(), 300);
  }, 4000);
}

// ============================================
// EVENT LISTENERS
// ============================================

document.addEventListener('DOMContentLoaded', () => {
  console.log('[Cadastro] DOMContentLoaded - Inicializando...');
  console.log('[Cadastro] btnLocalizar:', btnLocalizar);
  console.log('[Cadastro] inputCodBarras:', inputCodBarras);
  
  if (!btnLocalizar) {
    console.error('[Cadastro] ERRO: btnLocalizar não encontrado!');
    return;
  }
  
  // Localizar requisição
  btnLocalizar.addEventListener('click', localizarRequisicao);
  console.log('[Cadastro] Event listener adicionado ao btnLocalizar');
  
  inputCodBarras.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      localizarRequisicao();
    }
  });
  
  // CPF
  cpfPaciente.addEventListener('input', (e) => {
    e.target.value = formatarCPF(e.target.value);
  });
  
  btnCpfKorus.addEventListener('click', consultarCpfKorus);
  btnCpfReceita.addEventListener('click', consultarCpfReceita);
  
  // Telefone
  telefonePaciente.addEventListener('input', (e) => {
    e.target.value = formatarTelefone(e.target.value);
  });
  
  // CRM - apenas números
  crmMedico.addEventListener('input', (e) => {
    e.target.value = e.target.value.replace(/\D/g, '');
  });
  
  // UF-CRM Dropdown
  ufCrm.addEventListener('focus', () => {
    ufCrmWrapper.classList.add('open');
  });
  
  ufCrm.addEventListener('blur', () => {
    setTimeout(() => {
      ufCrmWrapper.classList.remove('open');
    }, 200);
  });
  
  ufCrm.addEventListener('input', (e) => {
    e.target.value = e.target.value.toUpperCase().replace(/[^A-Z]/g, '').substring(0, 2);
  });
  
  ufCrmDropdown.querySelectorAll('.custom-dropdown-item').forEach(item => {
    item.addEventListener('click', () => {
      ufCrm.value = item.dataset.value;
      ufCrmWrapper.classList.remove('open');
    });
  });
  
  // Validar médico
  btnValidaMedico.addEventListener('click', validarMedico);
  
  // Adicionar exame
  btnAdicionarExame.addEventListener('click', () => {
    const tipoAtendimentoId = selectTipoAtendimento.value;
    if (!tipoAtendimentoId) {
      alert('Selecione um tipo de atendimento.');
      return;
    }
    
    // TODO: Abrir modal de seleção de exame
    alert('Modal de seleção de exame será implementado em breve.');
  });
  
  // Upload de imagem
  btnCarregarImagem.addEventListener('click', () => {
    inputUploadImagem.click();
  });
  
  inputUploadImagem.addEventListener('change', (e) => {
    const files = Array.from(e.target.files);
    arquivosParaUpload = [...arquivosParaUpload, ...files];
    renderizarArquivos();
    inputUploadImagem.value = '';
  });
  
  // Ver imagem requisição
  btnVerImagemRequisicao.addEventListener('click', () => {
    if (!requisicaoAtual) {
      alert('Nenhuma requisição carregada.');
      return;
    }
    
    const modal = document.getElementById('modal-ver-imagem');
    const container = document.getElementById('imagem-requisicao-container');
    
    if (requisicaoAtual.arquivos && requisicaoAtual.arquivos.length > 0) {
      const arquivo = requisicaoAtual.arquivos[0];
      const url = arquivo.url_arquivo || arquivo.url;
      const nome = arquivo.nome_arquivo || 'arquivo';
      const isPdf = nome.toLowerCase().endsWith('.pdf');
      
      if (isPdf) {
        // Para PDF, usar embed ou object para melhor compatibilidade
        container.innerHTML = `
          <object data="${url}" type="application/pdf" style="width:100%;height:600px;">
            <p>Não foi possível exibir o PDF. <a href="${url}" target="_blank">Clique aqui para abrir em nova aba</a>.</p>
          </object>
        `;
      } else {
        // Para imagens
        container.innerHTML = `<img src="${url}" style="max-width:100%;max-height:600px;" alt="Imagem da requisição" />`;
      }
    } else {
      container.innerHTML = '<p class="text-muted">Nenhuma imagem disponível para esta requisição.</p>';
    }
    
    modal.style.display = 'flex';
  });
  
  // Fechar modal de imagem
  document.getElementById('btn-fechar-modal-imagem')?.addEventListener('click', () => {
    document.getElementById('modal-ver-imagem').style.display = 'none';
  });
  
  document.getElementById('btn-fechar-modal-imagem-footer')?.addEventListener('click', () => {
    document.getElementById('modal-ver-imagem').style.display = 'none';
  });
  
  // Modal excluir exame
  document.getElementById('btn-cancelar-excluir-exame')?.addEventListener('click', () => {
    document.getElementById('modal-excluir-exame').style.display = 'none';
  });
  
  document.getElementById('btn-confirmar-excluir-exame')?.addEventListener('click', () => {
    const modal = document.getElementById('modal-excluir-exame');
    const index = parseInt(modal.dataset.indexExcluir);
    excluirExame(index);
    modal.style.display = 'none';
  });
  
  // Cancelar
  btnCancelar.addEventListener('click', () => {
    if (confirm('Deseja cancelar o cadastro? Os dados não salvos serão perdidos.')) {
      limparFormulario();
      inputCodBarras.focus();
    }
  });
  
  // Autorizar
  btnAutorizar.addEventListener('click', autorizarRequisicao);
  
  // Fechar modais ao clicar fora
  document.querySelectorAll('.modal-overlay').forEach(modal => {
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        modal.style.display = 'none';
      }
    });
  });
  
  // Focus inicial
  inputCodBarras.focus();
});

// Adicionar estilos de animação
const style = document.createElement('style');
style.textContent = `
  @keyframes slideIn {
    from { transform: translateX(100%); opacity: 0; }
    to { transform: translateX(0); opacity: 1; }
  }
  @keyframes slideOut {
    from { transform: translateX(0); opacity: 1; }
    to { transform: translateX(100%); opacity: 0; }
  }
`;
document.head.appendChild(style);
