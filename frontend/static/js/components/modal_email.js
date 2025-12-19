/**
 * Modal de Email - Componente Reutilizável
 * 
 * Uso:
 * 1. Incluir o HTML: {% include 'includes/modal_email.html' %}
 * 2. Incluir este JS: <script src="{% static 'js/components/modal_email.js' %}"></script>
 * 3. Chamar: ModalEmail.abrir(tipo, titulo, contexto, callbacks)
 * 
 * Exemplo:
 * ModalEmail.abrir('medico_nao_encontrado', 'Notificar: Médico Não Encontrado', {
 *   crm: '12345',
 *   uf: 'SP',
 *   nome_medico: 'Dr. Teste',
 *   cod_req: 'REQ123'
 * }, {
 *   onEnviado: () => { console.log('Email enviado!'); },
 *   onCancelado: () => { console.log('Cancelado'); }
 * });
 */

window.ModalEmail = (function() {
  'use strict';
  
  // Elementos do DOM
  let elementos = null;
  
  // Estado
  let estado = {
    tipo: '',
    contexto: {},
    emailResposta: '',
    callbacks: {
      onEnviado: null,
      onCancelado: null
    }
  };
  
  /**
   * Inicializa o componente (chamado automaticamente)
   */
  function init() {
    elementos = {
      overlay: document.getElementById('modal-email-overlay'),
      titulo: document.getElementById('modal-email-titulo'),
      destinatarios: document.getElementById('email-destinatarios'),
      assunto: document.getElementById('email-assunto'),
      corpo: document.getElementById('email-corpo'),
      alert: document.getElementById('modal-email-alert'),
      alertMessage: document.getElementById('modal-email-alert-message'),
      btnFechar: document.getElementById('btn-fechar-modal-email'),
      btnCancelar: document.getElementById('btn-cancelar-email'),
      btnEnviar: document.getElementById('btn-enviar-email')
    };
    
    if (!elementos.overlay) {
      console.warn('[ModalEmail] Modal não encontrado no DOM. Certifique-se de incluir modal_email.html');
      return;
    }
    
    // Event listeners
    elementos.btnFechar?.addEventListener('click', fechar);
    elementos.btnCancelar?.addEventListener('click', cancelar);
    elementos.btnEnviar?.addEventListener('click', enviar);
    
    // Fechar ao clicar fora
    elementos.overlay?.addEventListener('click', (e) => {
      if (e.target === elementos.overlay) {
        cancelar();
      }
    });
    
    // Fechar com ESC
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && elementos.overlay?.style.display !== 'none') {
        cancelar();
      }
    });
    
    console.log('[ModalEmail] Componente inicializado');
  }
  
  /**
   * Obtém o CSRF token
   */
  function getCsrfToken() {
    const csrfInput = document.querySelector('input[name="csrfmiddlewaretoken"]');
    if (csrfInput) return csrfInput.value;
    
    const cookieValue = document.cookie
      .split('; ')
      .find(row => row.startsWith('csrftoken='))
      ?.split('=')[1];
    return cookieValue || '';
  }
  
  /**
   * Abre o modal de email
   * @param {string} tipo - Tipo do email (ex: 'medico_nao_encontrado', 'medico_sem_destino')
   * @param {string} titulo - Título do modal
   * @param {object} contexto - Dados de contexto (crm, uf, nome_medico, cod_req, etc)
   * @param {object} callbacks - { onEnviado: fn, onCancelado: fn }
   */
  async function abrir(tipo, titulo, contexto = {}, callbacks = {}) {
    if (!elementos?.overlay) {
      console.error('[ModalEmail] Modal não inicializado');
      return;
    }
    
    console.log('[ModalEmail] Abrindo modal:', tipo, contexto);
    
    estado.tipo = tipo;
    estado.contexto = contexto;
    estado.callbacks = callbacks;
    
    // Atualizar título
    if (elementos.titulo) {
      elementos.titulo.textContent = titulo || 'Enviar Email';
    }
    
    // Buscar template do backend
    try {
      const params = new URLSearchParams({
        tipo: tipo,
        crm: contexto.crm || '',
        uf: contexto.uf || contexto.uf_crm || '',
        medicos: JSON.stringify(contexto.medicos || [])
      });
      
      const response = await fetch(`/operacao/protocolo/email-template/?${params.toString()}`, {
        method: 'GET',
        credentials: 'same-origin',
        headers: {
          'X-CSRFToken': getCsrfToken(),
        },
      });
      
      const data = await response.json();
      
      if (data.status === 'success' && data.template) {
        elementos.destinatarios.value = data.template.destinatarios?.join(', ') || '';
        elementos.assunto.value = data.template.assunto || '';
        elementos.corpo.value = data.template.corpo || '';
        estado.emailResposta = data.template.email_resposta || '';
      } else {
        console.warn('[ModalEmail] Template não encontrado:', data.message);
        preencherPadrao(tipo, contexto);
      }
      
    } catch (error) {
      console.error('[ModalEmail] Erro ao buscar template:', error);
      preencherPadrao(tipo, contexto);
    }
    
    // Esconder alerta
    esconderAlerta();
    
    // Mostrar modal
    elementos.overlay.style.display = 'flex';
  }
  
  /**
   * Preenche o email com valores padrão
   */
  function preencherPadrao(tipo, contexto) {
    estado.emailResposta = '';
    elementos.destinatarios.value = '';
    
    const crm = contexto.crm || '';
    const uf = contexto.uf || contexto.uf_crm || '';
    const nomeMed = contexto.nome_medico || 'Não informado';
    const codReq = contexto.cod_req || '';
    
    if (tipo === 'medico_sem_destino') {
      elementos.assunto.value = `[FEMME Integra] Médico Sem Destino - CRM ${crm}/${uf}`;
      elementos.corpo.value = `Prezados,

Foi identificado um problema no cadastro de médico:

CRM: ${crm}
UF: ${uf}
Nome: ${nomeMed}
Requisição: ${codReq}

O médico existe na base, porém não possui destino de entrega configurado.

Por favor, verifiquem e configurem o destino do médico.

Atenciosamente.`;
    } else if (tipo === 'medico_nao_encontrado') {
      elementos.assunto.value = `[FEMME Integra] Médico Não Encontrado - CRM ${crm}/${uf}`;
      elementos.corpo.value = `Prezados,

Foi identificado um problema no cadastro de médico:

CRM: ${crm}
UF: ${uf}
Requisição: ${codReq}

O médico não foi encontrado na base de dados.

Por favor, verifiquem se o médico precisa ser cadastrado ou se os dados estão corretos.

Atenciosamente.`;
    } else if (tipo === 'medico_duplicado') {
      const medicos = contexto.medicos || [];
      elementos.assunto.value = `[FEMME Integra] Médico Duplicado - CRM ${crm}/${uf}`;
      elementos.corpo.value = `Prezados,

Foi identificado um problema no cadastro de médico:

CRM: ${crm}
UF: ${uf}

Existem múltiplos médicos cadastrados com este CRM/UF.

Médicos encontrados:
${medicos.map(m => `- ${m.nome || m.nome_medico}`).join('\n') || 'N/A'}

Por favor, verifiquem e corrijam o cadastro.

Atenciosamente.`;
    } else {
      elementos.assunto.value = `[FEMME Integra] Notificação - ${tipo}`;
      elementos.corpo.value = `Prezados,

${contexto.mensagem || 'Uma notificação foi gerada pelo sistema.'}

Atenciosamente.`;
    }
  }
  
  /**
   * Fecha o modal
   */
  function fechar() {
    if (elementos?.overlay) {
      elementos.overlay.style.display = 'none';
    }
    esconderAlerta();
  }
  
  /**
   * Cancela e executa callback
   */
  function cancelar() {
    fechar();
    if (typeof estado.callbacks.onCancelado === 'function') {
      estado.callbacks.onCancelado();
    }
  }
  
  /**
   * Envia o email
   */
  async function enviar() {
    const destinatarios = elementos.destinatarios.value.trim();
    const assunto = elementos.assunto.value.trim();
    const corpo = elementos.corpo.value.trim();
    
    // Validações
    if (!destinatarios) {
      mostrarAlerta('Informe pelo menos um destinatário.');
      return;
    }
    
    if (!assunto) {
      mostrarAlerta('Informe o assunto do email.');
      return;
    }
    
    if (!corpo) {
      mostrarAlerta('Informe o corpo do email.');
      return;
    }
    
    // Desabilitar botão
    elementos.btnEnviar.disabled = true;
    elementos.btnEnviar.innerHTML = '<span class="spinner"></span> Enviando...';
    
    try {
      const response = await fetch('/operacao/protocolo/enviar-email/', {
        method: 'POST',
        credentials: 'same-origin',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRFToken': getCsrfToken(),
        },
        body: JSON.stringify({
          tipo: estado.tipo,
          destinatarios: destinatarios.split(',').map(e => e.trim()),
          assunto: assunto,
          corpo: corpo,
          crm: estado.contexto.crm || '',
          uf: estado.contexto.uf || estado.contexto.uf_crm || '',
          reply_to: estado.emailResposta || ''
        })
      });
      
      const data = await response.json();
      
      if (data.status === 'success') {
        console.log('[ModalEmail] Email enviado com sucesso');
        fechar();
        
        if (typeof estado.callbacks.onEnviado === 'function') {
          estado.callbacks.onEnviado(data);
        }
        
      } else {
        mostrarAlerta(data.message || 'Erro ao enviar email.');
      }
      
    } catch (error) {
      console.error('[ModalEmail] Erro ao enviar email:', error);
      mostrarAlerta('Erro de conexão ao enviar email.');
    } finally {
      elementos.btnEnviar.disabled = false;
      elementos.btnEnviar.innerHTML = 'Enviar Email';
    }
  }
  
  /**
   * Mostra alerta de erro no modal
   */
  function mostrarAlerta(message) {
    if (elementos.alert && elementos.alertMessage) {
      elementos.alertMessage.textContent = message;
      elementos.alert.style.display = 'block';
    }
  }
  
  /**
   * Esconde alerta do modal
   */
  function esconderAlerta() {
    if (elementos.alert) {
      elementos.alert.style.display = 'none';
    }
  }
  
  // Inicializar quando DOM estiver pronto
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
  
  // API pública
  return {
    abrir: abrir,
    fechar: fechar,
    cancelar: cancelar
  };
  
})();
