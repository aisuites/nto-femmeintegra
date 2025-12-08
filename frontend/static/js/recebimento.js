/**
 * ============================================
 * MÓDULO DE RECEBIMENTO DE REQUISIÇÕES
 * ============================================
 * 
 * Gerencia todo o fluxo de recebimento, validação e finalização de requisições.
 * Utiliza padrão Module (IIFE) para encapsulamento e organização.
 * 
 * @author FEMME Integra
 * @version 2.0
 * @date 2025-12-08
 */

// ============================================
// FUNÇÕES UTILITÁRIAS GLOBAIS
// ============================================

/**
 * Obtém valor de cookie por nome
 * @param {string} name - Nome do cookie
 * @returns {string|null} Valor do cookie ou null
 */
function getCookie(name) {
  const cookieValue = document.cookie
    .split(';')
    .map(cookie => cookie.trim())
    .find(cookie => cookie.startsWith(`${name}=`));
  return cookieValue ? decodeURIComponent(cookieValue.split('=')[1]) : null;
}

/**
 * Mostra alerta na página
 * @param {string} mensagem - Mensagem a ser exibida
 */
function mostrarAlerta(mensagem) {
  const alertaBox = document.getElementById('recebimento_alert');
  const alertaMsg = document.getElementById('alert_message');
  if (alertaBox && alertaMsg) {
    alertaMsg.textContent = mensagem;
    alertaBox.style.display = 'block';
    setTimeout(() => {
      alertaBox.style.display = 'none';
    }, 5000);
  } else {
    alert(mensagem);
  }
}

/**
 * Mostra toast de sucesso
 * @param {string} mensagem - Mensagem a ser exibida
 */
function mostrarToastSucesso(mensagem) {
  const toast = document.createElement('div');
  toast.style.cssText = 'position: fixed; top: 20px; right: 20px; background: #00bca4; color: white; padding: 16px 24px; border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.15); z-index: 10000;';
  toast.textContent = mensagem;
  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), 3000);
}

// ============================================
// MÓDULO PRINCIPAL
// ============================================

const RecebimentoModule = (() => {
  'use strict';
  
  // ============================================
  // VARIÁVEIS PRIVADAS
  // ============================================
  
  let elements = {};
  let csrfToken = '';
  let portadoresData = [];
  
  // ============================================
  // CACHE DE ELEMENTOS DOM
  // ============================================
  
  function cacheElements() {
    elements = {
      // Formulário
      hiddenField: document.getElementById('unidadeSelecionada'),
      radioInputs: document.querySelectorAll('.unit-card input[type="radio"]'),
      portadorSelect: document.getElementById('campo_portador'),
      origemInput: document.getElementById('campo_origem'),
      quantidadeInput: document.getElementById('campo_qtd_amostras'),
      barcodeInput: document.getElementById('campo_cod_barras'),
      
      // Botões
      localizarBtn: document.getElementById('btn_localizar'),
      btnQtyMenos: document.getElementById('btn_qty_menos'),
      btnQtyMais: document.getElementById('btn_qty_mais'),
      btnFinalizarRecebimento: document.getElementById('btn_finalizar_recebimento'),
      
      // Modal
      modalOverlay: document.getElementById('modal_bipagem'),
      modalClose: document.getElementById('modal_close'),
      modalCancelar: document.getElementById('modal_btn_cancelar'),
      modalValidar: document.getElementById('modal_btn_validar'),
      modalQtd: document.getElementById('modal_qtd_amostras'),
      modalCodBarras: document.getElementById('modal_cod_barras_req'),
      modalCodReq: document.getElementById('modal_cod_req'),
      modalSamplesList: document.getElementById('modal_samples_list'),
      
      // Alertas
      alertaBox: document.getElementById('recebimento_alert'),
      alertaMsg: document.getElementById('alert_message')
    };
    
    // Obter CSRF token
    csrfToken = getCookie('csrftoken');
    
    // Obter dados de portadores
    portadoresData = window.FEMME_DATA?.portadores || [];
  }
  
  // ============================================
  // VALIDAÇÃO
  // ============================================
  
  const Validator = {
    /**
     * Valida se todos os códigos de barras são iguais
     */
    validarCodigosIguais(codBarrasReq, codBarrasAmostras) {
      if (!codBarrasAmostras || codBarrasAmostras.length === 0) {
        return false;
      }
      const todosIguais = codBarrasAmostras.every(cod => cod === codBarrasReq);
      return todosIguais;
    },
    
    /**
     * Valida pré-condições antes de localizar código
     */
    validarPreCondicoes() {
      if (!elements.hiddenField?.value) {
        return { ok: false, message: 'Selecione uma unidade antes de localizar.' };
      }
      if (!elements.portadorSelect?.value) {
        return { ok: false, message: 'Escolha um portador/representante.' };
      }
      const quantidade = Number(elements.quantidadeInput?.value || 0);
      if (!quantidade || quantidade < 1) {
        return { ok: false, message: 'Informe uma quantidade válida de amostras.' };
      }
      const codigo = (elements.barcodeInput?.value || '').trim();
      if (!codigo) {
        return { ok: false, message: 'Digite ou bipe o código de barras da requisição.' };
      }
      return { ok: true, quantidade, codigo };
    },
    
    /**
     * Valida divergências entre dados selecionados e cadastrados
     */
    validarDivergencias(data, validacao) {
      const divergencias = [];
      
      try {
        // Validar portador/representante
        const portadorSelecionado = elements.portadorSelect?.value;
        if (portadorSelecionado && data.portador_representante_id && 
            parseInt(portadorSelecionado) !== data.portador_representante_id) {
          const portadorNome = elements.portadorSelect.options[elements.portadorSelect.selectedIndex]?.text || 'Desconhecido';
          divergencias.push({
            campo: 'Portador/Representante',
            selecionado: portadorNome,
            cadastrado: data.portador_representante_nome || 'Não informado'
          });
        }
        
        // Validar quantidade de amostras
        const qtdSelecionada = parseInt(elements.quantidadeInput?.value || 0);
        if (qtdSelecionada && data.qtd_amostras && qtdSelecionada !== data.qtd_amostras) {
          divergencias.push({
            campo: 'Quantidade de Amostras',
            selecionado: qtdSelecionada.toString(),
            cadastrado: data.qtd_amostras.toString()
          });
        }
      } catch (error) {
        console.error('Erro ao validar divergências:', error);
      }
      
      return divergencias;
    }
  };
  
  // ============================================
  // API
  // ============================================
  
  const API = {
    /**
     * Localiza código de barras no sistema
     */
    async localizar(codigo) {
      const url = elements.localizarBtn?.dataset?.url;
      if (!url) {
        throw new Error('Endpoint de localização não configurado.');
      }
      
      console.log('Localizando código:', codigo);
      
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRFToken': csrfToken,
        },
        body: JSON.stringify({ cod_barras: codigo }),
      });
      
      console.log('Response status:', response.status);
      console.log('Response ok:', response.ok);
      
      const data = await response.json();
      console.log('Data recebida:', data);
      
      if (!response.ok || data.status === 'error') {
        throw new Error(data.message || 'Falha ao localizar o código.');
      }
      
      return data;
    },
    
    /**
     * Valida e cria/atualiza requisição
     */
    async validar(payload) {
      const url = window.FEMME_DATA?.urlValidar;
      if (!url) {
        throw new Error('Endpoint de validação não configurado.');
      }
      
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRFToken': csrfToken,
        },
        body: JSON.stringify(payload),
      });
      
      const data = await response.json();
      
      if (!response.ok || data.status === 'error') {
        throw new Error(data.message || 'Erro ao validar requisição.');
      }
      
      return data;
    },
    
    /**
     * Finaliza kit de recebimento
     */
    async finalizar() {
      const url = window.FEMME_DATA?.urlFinalizar;
      if (!url) {
        throw new Error('Endpoint de finalização não configurado.');
      }
      
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRFToken': csrfToken,
        },
      });
      
      const data = await response.json();
      
      if (!response.ok || data.status === 'error') {
        throw new Error(data.message || 'Erro ao finalizar recebimento.');
      }
      
      return data;
    },
    
    /**
     * Transfere requisição para outro usuário
     */
    async transferir(requisicaoId) {
      const response = await fetch('/operacao/requisicao/transferir/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRFToken': csrfToken,
        },
        body: JSON.stringify({ requisicao_id: requisicaoId }),
      });
      
      const data = await response.json();
      
      if (!response.ok || data.status === 'error') {
        throw new Error(data.message || 'Erro ao transferir requisição.');
      }
      
      return data;
    }
  };
  
  // ============================================
  // UI - MODAL
  // ============================================
  
  const Modal = {
    /**
     * Abre modal de bipagem
     */
    abrir(qtdAmostras, codBarrasReq, dadosTransito = null) {
      if (!elements.modalOverlay) return;
      
      elements.modalQtd.textContent = qtdAmostras;
      elements.modalCodBarras.textContent = codBarrasReq;
      
      if (dadosTransito) {
        elements.modalCodReq.textContent = dadosTransito.cod_req || '';
        elements.modalValidar.dataset.requisicaoId = dadosTransito.requisicao_id || '';
        elements.modalValidar.dataset.isTransit = 'true';
        elements.modalValidar.dataset.unidadeId = dadosTransito.unidade_id || '';
        elements.modalValidar.dataset.origemId = dadosTransito.origem_id || '';
        elements.modalValidar.dataset.portadorRepresentanteId = dadosTransito.portador_representante_id || '';
      } else {
        elements.modalCodReq.textContent = '';
        elements.modalValidar.dataset.requisicaoId = '';
        elements.modalValidar.dataset.isTransit = 'false';
        elements.modalValidar.dataset.unidadeId = elements.hiddenField?.value || '';
        elements.modalValidar.dataset.origemId = elements.origemInput?.value || '';
        elements.modalValidar.dataset.portadorRepresentanteId = elements.portadorSelect?.value || '';
      }
      
      // Limpar lista de amostras
      if (elements.modalSamplesList) {
        elements.modalSamplesList.innerHTML = '';
        for (let i = 1; i <= qtdAmostras; i++) {
          const div = document.createElement('div');
          div.className = 'sample-input-group';
          div.innerHTML = `
            <label for="sample_${i}">Amostra ${i}:</label>
            <input type="text" id="sample_${i}" class="sample-input" placeholder="Bipe ou digite o código" autocomplete="off" />
          `;
          elements.modalSamplesList.appendChild(div);
        }
      }
      
      elements.modalOverlay.setAttribute('aria-hidden', 'false');
      
      // Focar no primeiro input
      setTimeout(() => {
        const primeiroInput = elements.modalSamplesList?.querySelector('input[type="text"]');
        primeiroInput?.focus();
      }, 100);
    },
    
    /**
     * Fecha modal de bipagem
     */
    fechar() {
      if (!elements.modalOverlay) return;
      elements.modalOverlay.setAttribute('aria-hidden', 'true');
    },
    
    /**
     * Mostra modal de divergências
     */
    mostrarDivergencias(divergencias, data, validacao) {
      const divergenciasHtml = `
        <table style="width: 100%; border-collapse: collapse; margin: 20px 0; background: rgba(255, 193, 7, 0.05); border-radius: 8px; overflow: hidden;">
          <thead>
            <tr style="background: rgba(255, 193, 7, 0.15);">
              <th style="padding: 12px; text-align: left; color: #7a3d8a; font-weight: 600; border-bottom: 2px solid #ffc107;">Campo</th>
              <th style="padding: 12px; text-align: left; color: #7a3d8a; font-weight: 600; border-bottom: 2px solid #ffc107;">Selecionado</th>
              <th style="padding: 12px; text-align: left; color: #00bca4; font-weight: 600; border-bottom: 2px solid #ffc107;">Cadastrado ✓</th>
            </tr>
          </thead>
          <tbody>
            ${divergencias.map(div => `
              <tr style="border-bottom: 1px solid rgba(255, 193, 7, 0.2);">
                <td style="padding: 12px; color: #34343a; font-weight: 500;">${div.campo}</td>
                <td style="padding: 12px; color: #77767c;">${div.selecionado}</td>
                <td style="padding: 12px; color: #00bca4; font-weight: 600;">${div.cadastrado}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      `;
      
      const modalHtml = `
        <div class="modal-divergencias" id="modal-divergencias" style="position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index: 10000;">
          <div style="background: white; border-radius: 18px; padding: 32px; max-width: 550px; width: 90%; box-shadow: 0 20px 60px rgba(0,0,0,0.3);">
            <h3 style="margin: 0 0 16px; color: #ffc107; font-size: 20px;">⚠️ Divergências Detectadas</h3>
            <p style="margin: 0 0 20px; color: #34343a; line-height: 1.6;">
              Os dados selecionados <strong>não correspondem</strong> aos dados cadastrados para esta requisição em trânsito:
            </p>
            
            ${divergenciasHtml}
            
            <p style="margin: 20px 0 24px; color: #77767c; font-size: 14px; line-height: 1.5;">
              <strong>Os dados cadastrados serão preservados.</strong> Deseja continuar com o recebimento usando os dados originais?
            </p>
            
            <div style="display: flex; gap: 12px; justify-content: flex-end;">
              <button id="btn-cancelar-divergencias" style="padding: 10px 20px; border: 1px solid #ddd; background: white; color: #77767c; border-radius: 8px; cursor: pointer; font-weight: 500;">
                Cancelar
              </button>
              <button id="btn-continuar-divergencias" style="padding: 10px 20px; border: none; background: #00bca4; color: white; border-radius: 8px; cursor: pointer; font-weight: 600;">
                Continuar Mesmo Assim
              </button>
            </div>
          </div>
        </div>
      `;
      
      document.body.insertAdjacentHTML('beforeend', modalHtml);
      
      const modal = document.getElementById('modal-divergencias');
      const btnCancelar = document.getElementById('btn-cancelar-divergencias');
      const btnContinuar = document.getElementById('btn-continuar-divergencias');
      
      const fecharModalDiv = () => modal?.remove();
      
      btnCancelar?.addEventListener('click', fecharModalDiv);
      btnContinuar?.addEventListener('click', () => {
        fecharModalDiv();
        Modal.abrir(data.qtd_amostras, validacao.codigo, data);
      });
    },
    
    /**
     * Mostra modal de transferência
     */
    mostrarTransferencia(data) {
      const modalHtml = `
        <div class="modal-transferencia" id="modal-transferencia" style="position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index: 10000;">
          <div style="background: white; border-radius: 18px; padding: 32px; max-width: 500px; width: 90%; box-shadow: 0 20px 60px rgba(0,0,0,0.3);">
            <h3 style="margin: 0 0 16px; color: #7a3d8a; font-size: 20px;">⚠️ Requisição Já Iniciada</h3>
            <p style="margin: 0 0 20px; color: #34343a; line-height: 1.6;">
              Esta requisição foi iniciada por <strong>${data.usuario_anterior_nome}</strong> em ${data.created_at}.
            </p>
            <p style="margin: 0 0 24px; color: #77767c; font-size: 14px;">
              Deseja assumir esta requisição? O usuário anterior será notificado.
            </p>
            
            <div style="display: flex; gap: 12px; justify-content: flex-end;">
              <button id="btn-cancelar-transferencia" style="padding: 10px 20px; border: 1px solid #ddd; background: white; color: #77767c; border-radius: 8px; cursor: pointer; font-weight: 500;">
                Cancelar
              </button>
              <button id="btn-confirmar-transferencia" style="padding: 10px 20px; border: none; background: #7a3d8a; color: white; border-radius: 8px; cursor: pointer; font-weight: 600;">
                Assumir Requisição
              </button>
            </div>
          </div>
        </div>
      `;
      
      document.body.insertAdjacentHTML('beforeend', modalHtml);
      
      const modal = document.getElementById('modal-transferencia');
      const btnCancelar = document.getElementById('btn-cancelar-transferencia');
      const btnConfirmar = document.getElementById('btn-confirmar-transferencia');
      
      const fecharModalTransf = () => modal?.remove();
      
      btnCancelar?.addEventListener('click', fecharModalTransf);
      
      btnConfirmar?.addEventListener('click', async () => {
        btnConfirmar.disabled = true;
        btnConfirmar.textContent = 'Transferindo...';
        
        try {
          console.log('Transferindo requisição ID:', data.requisicao_id);
          
          const result = await API.transferir(data.requisicao_id);
          
          fecharModalTransf();
          mostrarToastSucesso('Requisição transferida com sucesso!');
          
          // Atualizar contador de notificações
          if (window.Notificacoes) {
            window.Notificacoes.atualizarContador();
          }
          
          setTimeout(() => location.reload(), 1500);
        } catch (error) {
          console.error('Erro ao transferir requisição:', error);
          mostrarAlerta(`Erro ao transferir: ${error.message}`);
          btnConfirmar.disabled = false;
          btnConfirmar.textContent = 'Assumir Requisição';
        }
      });
    }
  };
  
  // ============================================
  // UI - TABELA
  // ============================================
  
  const Tabela = {
    /**
     * Adiciona requisição na tabela
     */
    adicionarRequisicao(requisicao) {
      const tableWrapper = document.querySelector('.kit-table-wrapper');
      if (!tableWrapper) return;
      
      let tbody = tableWrapper.querySelector('tbody');
      
      // Se não houver tabela, criar estrutura
      if (!tbody) {
        const headerDiv = tableWrapper.querySelector('.kit-table-header');
        if (headerDiv) {
          headerDiv.innerHTML = `
            <span style="font-weight:600; color:var(--femme-purple);">Requisições bipadas neste kit:</span>
            <span style="color:var(--femme-gray); font-size:13px;">1 requisição</span>
          `;
        }
        
        const table = document.createElement('table');
        table.className = 'kit-table';
        table.innerHTML = `
          <thead>
            <tr>
              <th>CÓD. REQ.</th>
              <th>CÓD. BARRAS</th>
              <th>UNIDADE</th>
              <th>ORIGEM</th>
              <th>DATA/HORA BIPAGEM</th>
            </tr>
          </thead>
          <tbody></tbody>
        `;
        tableWrapper.appendChild(table);
        tbody = table.querySelector('tbody');
      } else {
        // Atualizar contador
        const headerDiv = tableWrapper.querySelector('.kit-table-header');
        if (headerDiv) {
          const count = tbody.querySelectorAll('tr').length + 1;
          headerDiv.innerHTML = `
            <span style="font-weight:600; color:var(--femme-purple);">Requisições bipadas neste kit:</span>
            <span style="color:var(--femme-gray); font-size:13px;">${count} requisição${count > 1 ? 'ões' : ''}</span>
          `;
        }
      }
      
      // Adicionar linha
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${requisicao.cod_req}</td>
        <td>${requisicao.cod_barras_req}</td>
        <td>${requisicao.unidade_nome || '-'}</td>
        <td>${requisicao.origem_descricao || '-'}</td>
        <td>${new Date().toLocaleString('pt-BR')}</td>
      `;
      tbody.appendChild(tr);
    }
  };
  
  // ============================================
  // EVENT HANDLERS
  // ============================================
  
  const EventHandlers = {
    /**
     * Handler para localizar código
     */
    async onLocalizarClick() {
      const validacao = Validator.validarPreCondicoes();
      if (!validacao.ok) {
        mostrarAlerta(validacao.message);
        return;
      }
      
      elements.localizarBtn?.setAttribute('aria-busy', 'true');
      elements.localizarBtn?.setAttribute('disabled', 'disabled');
      
      try {
        const data = await API.localizar(validacao.codigo);
        
        if (data.status === 'found') {
          mostrarAlerta('Já existe registro para este código de barras.');
          return;
        }
        
        if (data.status === 'not_found') {
          Modal.abrir(validacao.quantidade, validacao.codigo);
          return;
        }
        
        if (data.status === 'in_transit') {
          const divergencias = Validator.validarDivergencias(data, validacao);
          if (divergencias.length > 0) {
            Modal.mostrarDivergencias(divergencias, data, validacao);
          } else {
            Modal.abrir(data.qtd_amostras, validacao.codigo, data);
          }
          return;
        }
        
        if (data.status === 'already_started') {
          Modal.mostrarTransferencia(data);
          return;
        }
        
        if (data.status === 'already_yours') {
          mostrarAlerta('Você já iniciou esta requisição. Finalize o recebimento para continuar.');
          return;
        }
        
        mostrarAlerta('Retorno inesperado do servidor.');
      } catch (error) {
        console.error(error);
        mostrarAlerta('Erro de comunicação com o servidor. Tente novamente.');
      } finally {
        elements.localizarBtn?.removeAttribute('aria-busy');
        elements.localizarBtn?.removeAttribute('disabled');
      }
    },
    
    /**
     * Handler para validar amostras
     */
    async onValidarClick() {
      const sampleInputs = elements.modalSamplesList?.querySelectorAll('.sample-input');
      if (!sampleInputs || sampleInputs.length === 0) {
        mostrarAlerta('Nenhuma amostra para validar.');
        return;
      }
      
      const codBarrasAmostras = Array.from(sampleInputs).map(input => input.value.trim());
      const codBarrasReq = elements.modalCodBarras?.textContent?.trim();
      
      // Validar se todos os campos foram preenchidos
      if (codBarrasAmostras.some(cod => !cod)) {
        mostrarAlerta('Preencha todos os códigos de barras das amostras.');
        return;
      }
      
      // Validar se todos os códigos são iguais
      if (!Validator.validarCodigosIguais(codBarrasReq, codBarrasAmostras)) {
        mostrarAlerta('Todos os códigos de barras devem ser iguais ao código da requisição.');
        return;
      }
      
      elements.modalValidar?.setAttribute('aria-busy', 'true');
      elements.modalValidar?.setAttribute('disabled', 'disabled');
      
      try {
        const payload = {
          cod_barras_req: codBarrasReq,
          cod_barras_amostras: codBarrasAmostras,
          unidade_id: elements.modalValidar.dataset.unidadeId,
          portador_representante_id: elements.modalValidar.dataset.portadorRepresentanteId,
          origem_id: elements.modalValidar.dataset.origemId || null,
          requisicao_id: elements.modalValidar.dataset.requisicaoId || null,
          is_transit: elements.modalValidar.dataset.isTransit === 'true',
        };
        
        const data = await API.validar(payload);
        
        if (data.status === 'success') {
          Modal.fechar();
          mostrarToastSucesso(data.message || 'Requisição validada com sucesso!');
          
          // Adicionar na tabela
          Tabela.adicionarRequisicao({
            cod_req: data.cod_req,
            cod_barras_req: codBarrasReq,
            unidade_nome: elements.hiddenField?.selectedOptions?.[0]?.text || '',
            origem_descricao: elements.origemInput?.value || ''
          });
          
          // Limpar formulário
          elements.barcodeInput.value = '';
          elements.barcodeInput.focus();
        } else {
          mostrarAlerta(data.message || 'Erro ao validar requisição.');
        }
      } catch (error) {
        console.error(error);
        mostrarAlerta(error.message || 'Erro ao validar requisição.');
      } finally {
        elements.modalValidar?.removeAttribute('aria-busy');
        elements.modalValidar?.removeAttribute('disabled');
      }
    },
    
    /**
     * Handler para finalizar recebimento
     */
    async onFinalizarClick() {
      const tbody = document.querySelector('.kit-table tbody');
      if (!tbody || tbody.querySelectorAll('tr').length === 0) {
        mostrarAlerta('Não há requisições para finalizar.');
        return;
      }
      
      if (!confirm('Deseja finalizar o recebimento de todas as requisições bipadas?')) {
        return;
      }
      
      elements.btnFinalizarRecebimento?.setAttribute('aria-busy', 'true');
      elements.btnFinalizarRecebimento?.setAttribute('disabled', 'disabled');
      
      try {
        const data = await API.finalizar();
        
        if (data.status === 'success') {
          mostrarToastSucesso(data.message || 'Recebimento finalizado com sucesso!');
          setTimeout(() => location.reload(), 1500);
        } else {
          mostrarAlerta(data.message || 'Erro ao finalizar recebimento.');
        }
      } catch (error) {
        console.error(error);
        mostrarAlerta('Erro de comunicação ao finalizar recebimento.');
      } finally {
        elements.btnFinalizarRecebimento?.removeAttribute('aria-busy');
        elements.btnFinalizarRecebimento?.removeAttribute('disabled');
      }
    },
    
    /**
     * Handler para quantidade menos
     */
    onQtyMenosClick() {
      if (!elements.quantidadeInput) return;
      const atual = parseInt(elements.quantidadeInput.value, 10) || 1;
      if (atual > 1) {
        elements.quantidadeInput.value = atual - 1;
      }
    },
    
    /**
     * Handler para quantidade mais
     */
    onQtyMaisClick() {
      if (!elements.quantidadeInput) return;
      const atual = parseInt(elements.quantidadeInput.value, 10) || 1;
      elements.quantidadeInput.value = atual + 1;
    },
    
    /**
     * Handler para Enter no input de código
     */
    onBarcodeKeydown(event) {
      if (event.key === 'Enter') {
        event.preventDefault();
        EventHandlers.onLocalizarClick();
      }
    },
    
    /**
     * Handler para fechar modal ao clicar fora
     */
    onModalOverlayClick(event) {
      if (event.target === elements.modalOverlay) {
        Modal.fechar();
      }
    }
  };
  
  // ============================================
  // UNIDADE - SELEÇÃO
  // ============================================
  
  const UnidadeSelector = {
    /**
     * Atualiza estado visual da unidade selecionada
     */
    updateSelectedState(radio) {
      document.querySelectorAll('.unit-card').forEach(card => {
        card.classList.remove('selected');
      });
      
      const card = radio.closest('.unit-card');
      if (card) {
        card.classList.add('selected');
      }
      
      if (elements.hiddenField) {
        elements.hiddenField.value = radio.value;
      }
      
      // Atualizar portadores
      UnidadeSelector.atualizarPortadores(radio.value);
      
      // Salvar no sessionStorage
      sessionStorage.setItem('unidadeSelecionada', radio.value);
    },
    
    /**
     * Atualiza lista de portadores baseado na unidade
     */
    atualizarPortadores(unidadeId) {
      if (!elements.portadorSelect) return;
      
      elements.portadorSelect.innerHTML = '<option value="">Selecione...</option>';
      
      const portadoresFiltrados = portadoresData.filter(
        p => p.unidade_id === parseInt(unidadeId)
      );
      
      portadoresFiltrados.forEach(item => {
        const opt = document.createElement('option');
        opt.value = item.id;
        opt.dataset.origem = item.origem || '';
        opt.dataset.origemId = item.origem_id || '';
        opt.dataset.tipo = item.tipo;
        opt.textContent = `${item.nome} (${item.tipo})`;
        elements.portadorSelect.appendChild(opt);
      });
      
      elements.portadorSelect.value = '';
      if (elements.origemInput) {
        elements.origemInput.value = '';
      }
    },
    
    /**
     * Atualiza origem baseado no portador selecionado
     */
    atualizarOrigemFromSelect() {
      if (!elements.portadorSelect || !elements.origemInput) return;
      
      const selectedOption = elements.portadorSelect.options[elements.portadorSelect.selectedIndex];
      if (selectedOption && selectedOption.dataset.origem) {
        elements.origemInput.value = selectedOption.dataset.origem;
      } else {
        elements.origemInput.value = '';
      }
    },
    
    /**
     * Restaura estado salvo
     */
    restaurarEstado() {
      const savedUnidadeId = sessionStorage.getItem('unidadeSelecionada');
      const savedPortadorRepresentanteId = sessionStorage.getItem('portadorRepresentanteSelecionado');
      
      if (savedUnidadeId) {
        const radioToCheck = Array.from(elements.radioInputs).find(r => r.value === savedUnidadeId);
        if (radioToCheck) {
          radioToCheck.checked = true;
          UnidadeSelector.updateSelectedState(radioToCheck);
          
          // Restaurar portador após carregar lista
          if (savedPortadorRepresentanteId) {
            setTimeout(() => {
              if (elements.portadorSelect) {
                elements.portadorSelect.value = savedPortadorRepresentanteId;
                UnidadeSelector.atualizarOrigemFromSelect();
              }
            }, 100);
          }
        }
      } else {
        // Comportamento padrão
        const initiallyChecked = document.querySelector('.unit-card input[type="radio"]:checked');
        if (initiallyChecked) {
          UnidadeSelector.updateSelectedState(initiallyChecked);
        } else if (elements.radioInputs.length) {
          UnidadeSelector.updateSelectedState(elements.radioInputs[0]);
        }
      }
    }
  };
  
  // ============================================
  // SETUP EVENT LISTENERS
  // ============================================
  
  function setupEventListeners() {
    // Botões principais
    elements.localizarBtn?.addEventListener('click', EventHandlers.onLocalizarClick);
    elements.btnFinalizarRecebimento?.addEventListener('click', EventHandlers.onFinalizarClick);
    
    // Quantidade
    elements.btnQtyMenos?.addEventListener('click', EventHandlers.onQtyMenosClick);
    elements.btnQtyMais?.addEventListener('click', EventHandlers.onQtyMaisClick);
    
    // Input de código
    elements.barcodeInput?.addEventListener('keydown', EventHandlers.onBarcodeKeydown);
    
    // Modal
    elements.modalClose?.addEventListener('click', Modal.fechar);
    elements.modalCancelar?.addEventListener('click', Modal.fechar);
    elements.modalValidar?.addEventListener('click', EventHandlers.onValidarClick);
    elements.modalOverlay?.addEventListener('click', EventHandlers.onModalOverlayClick);
    
    // Unidades
    elements.radioInputs.forEach(radio => {
      radio.addEventListener('change', () => UnidadeSelector.updateSelectedState(radio));
    });
    
    // Portador
    elements.portadorSelect?.addEventListener('change', () => {
      UnidadeSelector.atualizarOrigemFromSelect();
      sessionStorage.setItem('portadorRepresentanteSelecionado', elements.portadorSelect.value);
    });
  }
  
  // ============================================
  // INICIALIZAÇÃO
  // ============================================
  
  function init() {
    console.log('🚀 RecebimentoModule v2.0 - Inicializando...');
    
    cacheElements();
    setupEventListeners();
    UnidadeSelector.restaurarEstado();
    
    console.log('✅ RecebimentoModule inicializado com sucesso!');
  }
  
  // ============================================
  // API PÚBLICA
  // ============================================
  
  return {
    init: init,
    // Expor para testes (opcional)
    _test: {
      Validator,
      API,
      Modal,
      Tabela
    }
  };
})();

// ============================================
// INICIALIZAR QUANDO DOM ESTIVER PRONTO
// ============================================

document.addEventListener('DOMContentLoaded', RecebimentoModule.init);
