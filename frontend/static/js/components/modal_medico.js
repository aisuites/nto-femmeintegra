/**
 * MODAL_MEDICO.JS - Componente Global para Validação de Médico
 * 
 * Fornece:
 * - Validação de médico via API unificada
 * - Modal de problema (médico não cadastrado / sem destino)
 * - Integração com ModalEmail para registro de pendência
 * - Salvamento automático dos dados do médico no banco
 * 
 * Uso:
 *   ModalMedico.validar(crm, uf, requisicaoId, callbacks);
 *   ModalMedico.abrirModalProblema(problema);
 *   ModalMedico.fecharModalProblema();
 */

window.ModalMedico = (function() {
  'use strict';

  // Estado
  let problemaMedicoAtual = null;
  let requisicaoAtual = null;
  let callbacks = {};
  let initialized = false;

  // Elementos DOM (cacheados após init)
  let modal = null;
  let mensagemDiv = null;
  let infoDiv = null;
  let btnRegistrarPendencia = null;
  let btnIgnorar = null;

  /**
   * Inicializa o componente
   */
  function init() {
    if (initialized) return;
    
    modal = document.getElementById('modal-problema-medico');
    if (modal) {
      mensagemDiv = document.getElementById('modal-medico-mensagem');
      infoDiv = document.getElementById('modal-medico-info');
      btnRegistrarPendencia = document.getElementById('btn-registrar-pendencia');
      btnIgnorar = document.getElementById('btn-ignorar-problema');
      
      configurarEventListeners();
    }
    
    initialized = true;
    console.log('[ModalMedico] Componente inicializado');
  }

  /**
   * Configura event listeners
   */
  function configurarEventListeners() {
    if (btnRegistrarPendencia) {
      btnRegistrarPendencia.addEventListener('click', registrarPendencia);
    }
    
    if (btnIgnorar) {
      btnIgnorar.addEventListener('click', fecharModalProblema);
    }
    
    // Clicar no overlay fecha o modal
    if (modal) {
      modal.addEventListener('click', function(e) {
        if (e.target === modal) {
          fecharModalProblema();
        }
      });
    }
  }

  /**
   * Valida médico via API unificada
   * @param {string} crm - CRM do médico
   * @param {string} uf - UF do CRM
   * @param {object} requisicao - Objeto da requisição atual
   * @param {object} opts - Callbacks: onSucesso, onProblema, onErro, elementos DOM
   */
  async function validar(crm, uf, requisicao, opts = {}) {
    init();
    
    if (!crm || !uf) {
      if (opts.onErro) opts.onErro('Informe CRM e UF');
      return;
    }
    
    requisicaoAtual = requisicao;
    callbacks = opts;
    
    // Mostrar loading no botão se fornecido
    if (opts.btnValidar) {
      opts.btnValidar.disabled = true;
      opts.btnValidar.innerHTML = '<span class="spinner"></span> Validando...';
    }
    
    // Zerar campos do médico na tela antes de consultar
    if (opts.camposLimpar) {
      opts.camposLimpar.forEach(campo => {
        if (campo) campo.value = '';
      });
    }
    
    // Zerar dados do médico no banco de dados
    if (requisicao && requisicao.id) {
      try {
        await fetch('/operacao/triagem/salvar-medico/', {
          method: 'POST',
          headers: FemmeUtils.getDefaultHeaders(),
          body: JSON.stringify({
            requisicao_id: requisicao.id,
            nome_medico: '',
            endereco_medico: '',
            destino_medico: '',
            crm: '',
            uf_crm: ''
          })
        });
        console.log('[ModalMedico] Dados do médico zerados no banco');
      } catch (e) {
        console.warn('[ModalMedico] Erro ao zerar dados do médico no banco:', e);
      }
    }
    
    try {
      const response = await fetch(
        `/operacao/triagem/validar-medico-completo/?crm=${encodeURIComponent(crm)}&uf_crm=${encodeURIComponent(uf)}`,
        {
          method: 'GET',
          headers: { 'X-CSRFToken': FemmeUtils.getCsrfToken() }
        }
      );
      
      const data = await response.json();
      console.log('[ModalMedico] Resposta validação:', data);
      
      if (data.status === 'success' && data.medico) {
        // Sucesso - médico validado com destino
        const medico = data.medico;
        
        // Salvar dados do médico no banco
        if (requisicao && requisicao.id) {
          await fetch('/operacao/triagem/salvar-medico/', {
            method: 'POST',
            headers: FemmeUtils.getDefaultHeaders(),
            body: JSON.stringify({
              requisicao_id: requisicao.id,
              nome_medico: medico.nome_medico || '',
              endereco_medico: medico.endereco || '',
              destino_medico: medico.destino || '',
              crm: medico.crm || crm,
              uf_crm: medico.uf_crm || uf
            })
          });
          console.log('[ModalMedico] Dados do médico salvos no banco');
        }
        
        if (opts.onSucesso) {
          opts.onSucesso(medico);
        }
        
      } else if (data.code === 'medico_sem_destino') {
        // Médico existe mas sem destino
        problemaMedicoAtual = {
          tipo: 'medico_sem_destino',
          crm: crm,
          uf_crm: uf,
          medico: data.medico || {},
          mensagem: data.message
        };
        abrirModalProblema(problemaMedicoAtual);
        
        if (opts.onProblema) {
          opts.onProblema(problemaMedicoAtual);
        }
        
      } else if (data.code === 'medico_nao_encontrado') {
        // Médico não encontrado
        problemaMedicoAtual = {
          tipo: 'medico_nao_encontrado',
          crm: crm,
          uf_crm: uf,
          medico: null,
          mensagem: data.message
        };
        abrirModalProblema(problemaMedicoAtual);
        
        if (opts.onProblema) {
          opts.onProblema(problemaMedicoAtual);
        }
        
      } else if (data.code === 'medico_duplicado') {
        // Múltiplos médicos encontrados
        if (opts.onErro) {
          opts.onErro(data.message || 'Múltiplos médicos encontrados. Verifique o CRM.');
        }
        
      } else {
        if (opts.onErro) {
          opts.onErro(data.message || 'Erro ao validar médico.');
        }
      }
      
    } catch (error) {
      console.error('[ModalMedico] Erro ao validar médico:', error);
      if (opts.onErro) {
        opts.onErro('Erro de conexão ao validar médico.');
      }
    } finally {
      // Restaurar botão
      if (opts.btnValidar) {
        opts.btnValidar.disabled = false;
        opts.btnValidar.innerHTML = opts.btnValidarTexto || 'Valida Médico';
      }
    }
  }

  /**
   * Abre o modal de problema com médico
   * @param {object} problema - Dados do problema
   */
  function abrirModalProblema(problema) {
    init();
    
    if (!modal) {
      console.error('[ModalMedico] Modal não encontrado no DOM');
      return;
    }
    
    problemaMedicoAtual = problema;
    
    // Preencher mensagem
    if (mensagemDiv) {
      if (problema.tipo === 'medico_sem_destino') {
        mensagemDiv.innerHTML = `
          <span class="badge badge-warning" style="font-size: 14px; padding: 8px 16px;">
            ⚠️ MÉDICO SEM DESTINO CADASTRADO
          </span>
          <p style="margin-top: 12px; color: #666;">
            O médico foi encontrado, mas não possui destino de laudo configurado.
          </p>
        `;
      } else {
        mensagemDiv.innerHTML = `
          <span class="badge badge-danger" style="font-size: 14px; padding: 8px 16px;">
            ❌ MÉDICO NÃO CADASTRADO
          </span>
          <p style="margin-top: 12px; color: #666;">
            O CRM informado não foi encontrado na base de dados.
          </p>
        `;
      }
    }
    
    // Preencher informações do médico
    if (infoDiv) {
      if (problema.medico && problema.medico.nome_medico) {
        infoDiv.innerHTML = `
          <div style="background: #f8f9fa; padding: 12px; border-radius: 8px; margin-top: 12px;">
            <p><strong>CRM:</strong> ${problema.crm}-${problema.uf_crm}</p>
            <p><strong>Nome:</strong> ${problema.medico.nome_medico}</p>
            ${problema.medico.endereco ? `<p><strong>Endereço:</strong> ${problema.medico.endereco}</p>` : ''}
          </div>
        `;
      } else {
        infoDiv.innerHTML = `
          <div style="background: #f8f9fa; padding: 12px; border-radius: 8px; margin-top: 12px;">
            <p><strong>CRM pesquisado:</strong> ${problema.crm}-${problema.uf_crm}</p>
          </div>
        `;
      }
    }
    
    modal.style.display = 'flex';
  }

  /**
   * Fecha o modal de problema
   */
  function fecharModalProblema() {
    if (modal) {
      modal.style.display = 'none';
    }
    problemaMedicoAtual = null;
  }

  /**
   * Registra pendência e abre modal de email
   */
  async function registrarPendencia() {
    if (!problemaMedicoAtual || !requisicaoAtual) {
      FemmeUtils.mostrarToastErro('Erro: dados insuficientes para registrar pendência.');
      fecharModalProblema();
      return;
    }
    
    // Verificar se ModalEmail está disponível
    if (typeof window.ModalEmail === 'undefined') {
      console.error('[ModalMedico] ModalEmail não está carregado!');
      FemmeUtils.mostrarToastErro('Erro: componente de email não carregado.');
      return;
    }
    
    // Salvar dados antes de fechar modal
    const tipoPendencia = problemaMedicoAtual.tipo === 'medico_sem_destino' 
      ? 'MÉDICO SEM DESTINO' 
      : 'MÉDICO NÃO CADASTRADO';
    const codReq = requisicaoAtual.cod_req;
    const tipoProblema = problemaMedicoAtual.tipo;
    
    const dadosParaPendencia = {
      tipo: tipoProblema,
      tipoPendenciaDescricao: tipoPendencia,
      crm: problemaMedicoAtual.crm,
      uf_crm: problemaMedicoAtual.uf_crm,
      nome_medico: problemaMedicoAtual.medico?.nome_medico || '',
      cod_req: codReq,
      requisicao_id: requisicaoAtual.id
    };
    
    // Fechar modal de problema
    fecharModalProblema();
    
    // Abrir modal de email - pendência será criada APÓS envio do email
    ModalEmail.abrir(
      tipoProblema, 
      `Notificar: ${tipoPendencia}`,
      dadosParaPendencia,
      {
        onEnviado: async (respostaEmail) => {
          // Email enviado com sucesso - AGORA criar a pendência
          console.log('[ModalMedico] Email enviado, criando pendência...');
          
          try {
            const response = await fetch('/operacao/triagem/registrar-pendencia-medico/', {
              method: 'POST',
              credentials: 'same-origin',
              headers: FemmeUtils.getDefaultHeaders(),
              body: JSON.stringify({
                requisicao_id: dadosParaPendencia.requisicao_id,
                tipo_pendencia: dadosParaPendencia.tipo,
                crm: dadosParaPendencia.crm,
                uf_crm: dadosParaPendencia.uf_crm,
                nome_medico: dadosParaPendencia.nome_medico,
              }),
            });
            
            if (!response.ok) {
              throw new Error(`Erro HTTP ${response.status}`);
            }
            
            const data = await response.json();
            console.log('[ModalMedico] Pendência criada:', data);
            
            if (data.status === 'success') {
              let mensagem = `✅ Email enviado e pendência registrada! Requisição ${codReq} enviada para PENDÊNCIAS.`;
              if (respostaEmail.tarefa_criada) {
                mensagem += ` Tarefa ${respostaEmail.tarefa_criada.codigo} criada.`;
              }
              FemmeUtils.mostrarToastSucesso(mensagem);
              
              if (callbacks.onPendenciaRegistrada) {
                callbacks.onPendenciaRegistrada(data);
              } else {
                setTimeout(() => window.location.reload(), 2000);
              }
            } else {
              FemmeUtils.mostrarToastErro('Email enviado, mas erro ao registrar pendência: ' + (data.message || 'Erro desconhecido'));
            }
          } catch (error) {
            console.error('[ModalMedico] Erro ao criar pendência:', error);
            FemmeUtils.mostrarToastErro('Email enviado, mas erro ao registrar pendência.');
          }
        },
        onCancelado: () => {
          console.log('[ModalMedico] Email cancelado, pendência NÃO foi criada.');
          FemmeUtils.mostrarToastAviso('Envio de email cancelado. Pendência não foi registrada.');
        }
      }
    );
  }

  // API Pública
  return {
    init: init,
    validar: validar,
    abrirModalProblema: abrirModalProblema,
    fecharModalProblema: fecharModalProblema,
    registrarPendencia: registrarPendencia,
    getProblemaAtual: function() { return problemaMedicoAtual; },
    setRequisicao: function(req) { requisicaoAtual = req; }
  };

})();

// Auto-inicializar quando DOM estiver pronto
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', function() {
    ModalMedico.init();
  });
} else {
  ModalMedico.init();
}
