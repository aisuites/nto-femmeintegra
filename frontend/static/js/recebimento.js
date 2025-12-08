  // Funções utilitárias globais
  function getCookie(name) {
    const cookieValue = document.cookie
      .split(';')
      .map(cookie => cookie.trim())
      .find(cookie => cookie.startsWith(`${name}=`));
    if (cookieValue) {
      return decodeURIComponent(cookieValue.split('=')[1]);
    }
    return null;
  }

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

  function mostrarToastSucesso(mensagem) {
    // Implementação simples de toast
    const toast = document.createElement('div');
    toast.style.cssText = 'position: fixed; top: 20px; right: 20px; background: #00bca4; color: white; padding: 16px 24px; border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.15); z-index: 10000; animation: slideIn 0.3s ease;';
    toast.textContent = mensagem;
    document.body.appendChild(toast);
    setTimeout(() => {
      toast.remove();
    }, 3000);
  }

  document.addEventListener('DOMContentLoaded', () => {
    const hiddenField = document.getElementById('unidadeSelecionada');
    const radioInputs = document.querySelectorAll('.unit-card input[type="radio"]');
    const portadorSelect = document.getElementById('campo_portador');
    const origemInput = document.getElementById('campo_origem');
    const quantidadeInput = document.getElementById('campo_qtd_amostras');
    const barcodeInput = document.getElementById('campo_cod_barras');
    const localizarBtn = document.getElementById('btn_localizar');
    const alertaBox = document.getElementById('recebimento_alert');
    const alertaMsg = document.getElementById('alert_message');
    const modalOverlay = document.getElementById('modal_bipagem');
    const modalClose = document.getElementById('modal_close');
    const modalCancelar = document.getElementById('modal_btn_cancelar');
    const modalValidar = document.getElementById('modal_btn_validar');
    const modalQtd = document.getElementById('modal_qtd_amostras');
    const modalCodBarras = document.getElementById('modal_cod_barras_req');
    const modalCodReq = document.getElementById('modal_cod_req');
    const modalSamplesList = document.getElementById('modal_samples_list');
    const portadoresData = window.FEMME_DATA?.portadores || [];

    const csrfToken = getCookie('csrftoken');
    const btnQtyMenos = document.getElementById('btn_qty_menos');
    const btnQtyMais = document.getElementById('btn_qty_mais');
    const btnFinalizarRecebimento = document.getElementById('btn_finalizar_recebimento');

    // Controle de quantidade de amostras
    btnQtyMenos?.addEventListener('click', () => {
      if (!quantidadeInput) return;
      const atual = parseInt(quantidadeInput.value, 10) || 1;
      if (atual > 1) {
        quantidadeInput.value = atual - 1;
      }
    });

    btnQtyMais?.addEventListener('click', () => {
      if (!quantidadeInput) return;
      const atual = parseInt(quantidadeInput.value, 10) || 1;
      quantidadeInput.value = atual + 1;
    });

    // Garantir valor mínimo ao digitar manualmente
    quantidadeInput?.addEventListener('change', () => {
      const valor = parseInt(quantidadeInput.value, 10);
      if (isNaN(valor) || valor < 1) {
        quantidadeInput.value = 1;
      }
    });

    function updateSelectedState(selectedInput) {
      document.querySelectorAll('.unit-card').forEach(card => card.classList.remove('unit-card--selected'));
      const parentCard = selectedInput.closest('.unit-card');
      if (parentCard) {
        parentCard.classList.add('unit-card--selected');
      }
      if (hiddenField) {
        hiddenField.value = selectedInput.value;
      }
      filtrarPortadores(Number(selectedInput.value));
    }

    function atualizarOrigemFromSelect() {
      const selectedOption = portadorSelect?.options[portadorSelect.selectedIndex];
      if (origemInput) {
        origemInput.value = selectedOption?.dataset?.origem || '';
      }
    }

    function filtrarPortadores(unidadeId) {
      if (!portadorSelect) return;

      portadorSelect.innerHTML = '<option value=\"\">Selecione...</option>';

      const filtrados = portadoresData.filter(item => item.unidade_id === unidadeId);
      if (!filtrados.length) {
        const opt = document.createElement('option');
        opt.value = '';
        opt.disabled = true;
        opt.textContent = 'Nenhum portador disponível para a unidade';
        portadorSelect.appendChild(opt);
        portadorSelect.value = '';
        if (origemInput) origemInput.value = '';
        return;
      }

      filtrados.forEach(item => {
        const opt = document.createElement('option');
        opt.value = item.id;
        opt.dataset.unidadeId = item.unidade_id;
        opt.dataset.origem = item.origem;
        opt.dataset.origemId = item.origem_id;
        opt.dataset.tipo = item.tipo;
        opt.textContent = `${item.nome} (${item.tipo})`;
        portadorSelect.appendChild(opt);
      });
      portadorSelect.value = '';
      if (origemInput) origemInput.value = '';
    }

    portadorSelect?.addEventListener('change', atualizarOrigemFromSelect);

    function esconderAlerta() {
      if (!alertaBox) return;
      alertaBox.classList.remove('alert--visible');
      alertaMsg.textContent = '';
    }

    function validarPreCondicoes() {
      if (!hiddenField?.value) {
        return { ok: false, message: 'Selecione uma unidade antes de localizar.' };
      }
      if (!portadorSelect?.value) {
        return { ok: false, message: 'Escolha um portador/representante.' };
      }
      const quantidade = Number(quantidadeInput?.value || 0);
      if (!quantidade || quantidade < 1) {
        return { ok: false, message: 'Informe uma quantidade válida de amostras.' };
      }
      const codigo = (barcodeInput?.value || '').trim();
      if (!codigo) {
        return { ok: false, message: 'Digite ou bipe o código de barras da requisição.' };
      }

      return { ok: true, quantidade, codigo };
    }

    function construirLinhasAmostra(qtd) {
      if (!modalSamplesList) return;
      modalSamplesList.innerHTML = '';
      
      const inputs = []; // Array para controlar a navegação

      for (let idx = 1; idx <= qtd; idx += 1) {
        const linha = document.createElement('div');
        linha.className = 'sample-line';

        const legenda = document.createElement('span');
        legenda.className = 'index';
        legenda.textContent = `Amostra ${idx}`;

        const input = document.createElement('input');
        input.type = 'text';
        input.placeholder = `Bipe ou digite o código da amostra ${idx}`;
        input.autocomplete = 'off';
        
        // Adicionar evento para navegação automática
        input.addEventListener('keydown', (e) => {
          if (e.key === 'Enter') {
            e.preventDefault();
            const valor = input.value.trim();
            if (!valor) return; // Não avança se estiver vazio

            const currentIndex = inputs.indexOf(input);
            
            // Se houver próximo campo, foca nele
            if (currentIndex < inputs.length - 1) {
              inputs[currentIndex + 1].focus();
            } else {
              // Se for o último, aciona o botão validar
              if (modalValidar) {
                // Pequeno delay visual para o usuário ver que preencheu
                setTimeout(() => modalValidar.click(), 100);
              }
            }
          }
        });

        inputs.push(input);
        linha.appendChild(legenda);
        linha.appendChild(input);
        modalSamplesList.appendChild(linha);
      }
    }

    // Variável global para armazenar dados de requisição em trânsito
    let dadosRequisicaoTransito = null;

    function abrirModal(quantidade, codigoBarras, dadosTransito = null) {
      if (!modalOverlay) return;
      
      // Armazenar dados se for requisição em trânsito
      dadosRequisicaoTransito = dadosTransito;
      
      modalQtd.textContent = quantidade;
      modalCodBarras.textContent = codigoBarras;
      
      // Se for requisição em trânsito, mostrar código da requisição
      if (dadosTransito && dadosTransito.cod_req) {
        modalCodReq.textContent = dadosTransito.cod_req;
        
        // Adicionar indicador visual de requisição em trânsito
        const modalMainText = document.querySelector('.modal-main-text');
        if (modalMainText) {
          modalMainText.innerHTML = `
            <strong style="color: var(--femme-blue);">📦 REQUISIÇÃO EM TRÂNSITO</strong><br/>
            Esta requisição já foi cadastrada. Bipe as amostras para confirmar o recebimento.<br/>
            <small style="color: var(--femme-gray);">Unidade: ${dadosTransito.unidade_nome} | Origem: ${dadosTransito.origem_descricao || '-'}</small>
          `;
        }
      } else {
        modalCodReq.textContent = '—';
        // Restaurar texto original
        const modalMainText = document.querySelector('.modal-main-text');
        if (modalMainText) {
          modalMainText.innerHTML = 'PARA DAR ANDAMENTO BIPE O(S) CÓDIGO(S) DE BARRA(S) DA(S) AMOSTRA(S).';
        }
      }
      
      construirLinhasAmostra(quantidade);
      modalOverlay.setAttribute('aria-hidden', 'false');
      
      // Focar automaticamente no primeiro input de amostra
      setTimeout(() => {
        const primeiroInput = modalSamplesList.querySelector('input[type="text"]');
        if (primeiroInput) {
          primeiroInput.focus();
        }
      }, 100); // Pequeno delay para garantir que o modal renderizou
    }

    function fecharModal() {
      if (!modalOverlay) return;
      modalOverlay.setAttribute('aria-hidden', 'true');
    }

    async function localizarCodigo() {
      const validacao = validarPreCondicoes();
      if (!validacao.ok) {
        mostrarAlerta(validacao.message);
        return;
      }

      esconderAlerta();
      const url = localizarBtn?.dataset?.url;
      if (!url) {
        mostrarAlerta('Endpoint de localização não configurado.');
        return;
      }

      localizarBtn?.setAttribute('aria-busy', 'true');
      localizarBtn?.setAttribute('disabled', 'disabled');

      try {
        console.log('Localizando código:', validacao.codigo);
        
        const response = await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-CSRFToken': csrfToken,
          },
          body: JSON.stringify({
            cod_barras: validacao.codigo,
          }),
        });

        console.log('Response status:', response.status);
        console.log('Response ok:', response.ok);
        
        const data = await response.json();
        console.log('Data recebida:', data);
        
        if (!response.ok || data.status === 'error') {
          mostrarAlerta(data.message || 'Falha ao localizar o código.');
          return;
        }

        if (data.status === 'found') {
          mostrarAlerta('Já existe registro para este código de barras.');
          return;
        }

        if (data.status === 'not_found') {
          abrirModal(validacao.quantidade, validacao.codigo);
          return;
        }

        if (data.status === 'in_transit') {
          // Requisição em trânsito - validar divergências antes de abrir modal
          validarDivergenciasTransito(data, validacao);
          return;
        }

        if (data.status === 'already_started') {
          // Requisição já iniciada por outro usuário - perguntar se quer assumir
          mostrarModalTransferencia(data);
          return;
        }

        if (data.status === 'already_yours') {
          // Requisição já iniciada pelo mesmo usuário
          mostrarAlerta('Você já iniciou esta requisição. Finalize o recebimento para continuar.');
          return;
        }

        mostrarAlerta('Retorno inesperado do servidor.');
      } catch (error) {
        console.error(error);
        mostrarAlerta('Erro de comunicação com o servidor. Tente novamente.');
      } finally {
        localizarBtn?.removeAttribute('aria-busy');
        localizarBtn?.removeAttribute('disabled');
      }
    }

    /**
     * Valida divergências entre dados selecionados e dados cadastrados
     * para requisições em trânsito
     */
    function validarDivergenciasTransito(data, validacao) {
      const divergencias = [];
      
      try {
        // Validar portador/representante
        const portadorSelecionado = portadorSelect?.value;
        if (portadorSelecionado && data.portador_representante_id && 
            parseInt(portadorSelecionado) !== data.portador_representante_id) {
          const portadorNome = portadorSelect.options[portadorSelect.selectedIndex]?.text || 'Desconhecido';
          divergencias.push({
            campo: 'Portador/Representante',
            selecionado: portadorNome,
            cadastrado: data.portador_representante_nome || 'Não informado'
          });
        }
        
        // Validar quantidade de amostras
        const qtdSelecionada = parseInt(quantidadeInput?.value || 0);
        if (qtdSelecionada && data.qtd_amostras && qtdSelecionada !== data.qtd_amostras) {
          divergencias.push({
            campo: 'Quantidade de Amostras',
            selecionado: qtdSelecionada.toString(),
            cadastrado: data.qtd_amostras.toString()
          });
        }
        
        // Se houver divergências, mostrar aviso
        if (divergencias.length > 0) {
          mostrarModalDivergencias(divergencias, data, validacao);
        } else {
          // Sem divergências, abrir modal normalmente
          abrirModal(data.qtd_amostras, validacao.codigo, data);
        }
      } catch (error) {
        console.error('Erro ao validar divergências:', error);
        // Em caso de erro, abrir modal normalmente
        abrirModal(data.qtd_amostras, validacao.codigo, data);
      }
    }
    
    /**
     * Mostra modal com aviso de divergências em formato de tabela comparativa
     */
    function mostrarModalDivergencias(divergencias, data, validacao) {
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
      
      function fecharModalDiv() {
        modal?.remove();
      }
      
      btnCancelar?.addEventListener('click', fecharModalDiv);
      
      btnContinuar?.addEventListener('click', () => {
        fecharModalDiv();
        // Abrir modal de bipagem com dados cadastrados
        abrirModal(data.qtd_amostras, validacao.codigo, data);
      });
    }

    localizarBtn?.addEventListener('click', localizarCodigo);
    barcodeInput?.addEventListener('keydown', (event) => {
      if (event.key === 'Enter') {
        event.preventDefault();
        localizarCodigo();
      }
    });

    modalClose?.addEventListener('click', fecharModal);
    modalCancelar?.addEventListener('click', fecharModal);
    modalOverlay?.addEventListener('click', (event) => {
      if (event.target === modalOverlay) {
        fecharModal();
      }
    });

    // Botão Finalizar Recebimento
    btnFinalizarRecebimento?.addEventListener('click', async () => {
      // Verifica se há itens na tabela visualmente
      const counterSpan = document.getElementById('kit_counter');
      const count = counterSpan ? parseInt(counterSpan.textContent) : 0;
      
      if (count === 0 && !confirm('Não há requisições bipadas visíveis neste kit. Deseja finalizar mesmo assim?')) {
        return;
      }

      const urlFinalizar = window.FEMME_DATA?.urlFinalizar || '/operacao/recebimento/finalizar/';
      btnFinalizarRecebimento.setAttribute('aria-busy', 'true');
      btnFinalizarRecebimento.setAttribute('disabled', 'disabled');

      try {
        const response = await fetch(urlFinalizar, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-CSRFToken': csrfToken,
          },
          body: JSON.stringify({}) // Body vazio
        });

        const data = await response.json();
        
        if (!response.ok || data.status === 'error') {
             mostrarAlerta(data.message || 'Erro ao finalizar recebimento.');
             btnFinalizarRecebimento.removeAttribute('aria-busy');
             btnFinalizarRecebimento.removeAttribute('disabled');
             return;
        }
        
        if (data.status === 'success') {
            // Limpar sessionStorage
            sessionStorage.removeItem('recebimento_unidade_id');
            sessionStorage.removeItem('recebimento_portador_representante_id');
            
            mostrarToastSucesso(data.message || 'Recebimento finalizado com sucesso!');
            
            // Aguardar toast e recarregar para limpar a tela
            setTimeout(() => {
                location.reload();
            }, 1500);
        }

      } catch (error) {
        console.error(error);
        mostrarAlerta('Erro de comunicação ao finalizar recebimento.');
        btnFinalizarRecebimento.removeAttribute('aria-busy');
        btnFinalizarRecebimento.removeAttribute('disabled');
      }
    });

    function adicionarRequisicaoNaTabela(requisicao) {
      const tableWrapper = document.querySelector('.kit-table-wrapper');
      let tbody = tableWrapper.querySelector('tbody');
      
      // Se não houver tabela (primeira inserção), criar a estrutura
      if (!tbody) {
        const headerDiv = tableWrapper.querySelector('.kit-table-header');
        if (headerDiv) {
            // Atualizar contador no header se existir
             headerDiv.innerHTML = `
                <div>
                  <strong>Requisições bipadas neste kit:</strong> <span id="kit_counter">1</span> registros
                </div>
                <div>
                  Kit em edição · não esqueça de salvar ao finalizar
                </div>
             `;
        }
        
        // Limpar mensagem de "nenhum registro"
        const emptyMsg = tableWrapper.querySelector('div[style*="padding:16px"]');
        if (emptyMsg) emptyMsg.remove();

        const table = document.createElement('table');
        table.innerHTML = `
          <thead>
          <tr>
            <th>Cód. Req.</th>
            <th>Cód. Barras</th>
            <th>Unidade</th>
            <th>Origem</th>
            <th>Data/Hora bipagem</th>
          </tr>
          </thead>
          <tbody></tbody>
        `;
        tableWrapper.appendChild(table);
        tbody = table.querySelector('tbody');
      } else {
        // Atualizar contador
        const counterSpan = document.getElementById('kit_counter');
        if (counterSpan) {
            counterSpan.textContent = parseInt(counterSpan.textContent || '0') + 1;
        } else {
             // Caso o contador não tenha ID, tenta atualizar via regex no header (fallback)
             const headerDiv = tableWrapper.querySelector('.kit-table-header strong');
             if(headerDiv && headerDiv.nextSibling) {
                 const currentText = headerDiv.nextSibling.textContent;
                 const match = currentText.match(/(\d+)/);
                 if(match) {
                     const newCount = parseInt(match[1]) + 1;
                     headerDiv.nextSibling.textContent = ` ${newCount} registros`;
                 }
             }
        }
      }

      const tr = document.createElement('tr');
      // Animação de entrada para a nova linha
      tr.style.animation = 'highlightRow 1s ease-out';
      
      // Formatar data atual
      const now = new Date();
      const dataFormatada = now.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' }) + 
                           ' · ' + 
                           now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

      tr.innerHTML = `
        <td>${requisicao.cod_req}</td>
        <td>${requisicao.cod_barras_req}</td>
        <td>${requisicao.unidade_nome}</td>
        <td>${requisicao.origem_descricao || '-'}</td>
        <td>${dataFormatada}</td>
      `;
      
      // Inserir no topo da tabela
      if (tbody.firstChild) {
        tbody.insertBefore(tr, tbody.firstChild);
      } else {
        tbody.appendChild(tr);
      }
    }

    // Função para verificar divergência de códigos
    function verificarDivergenciaCodigos(codBarrasReq, codigosAmostras) {
      const todosCodig = [codBarrasReq, ...codigosAmostras];
      const codigosUnicos = new Set(todosCodig);
      return codigosUnicos.size > 1;
    }

    // Função para transformar modal em modo divergência
    function mostrarModalDivergencia(codBarrasReq, codigosAmostras) {
      // Atualizar título e ícone
      const modalBadge = document.querySelector('.modal-badge-icon');
      const modalTitle = document.querySelector('.modal-title-text h2');
      const modalMainText = document.querySelector('.modal-main-text');
      const modalBody = document.querySelector('.modal-body');
      
      if (modalBadge) modalBadge.textContent = '⚠️';
      if (modalTitle) modalTitle.textContent = 'Divergência de Códigos Detectada';
      if (modalMainText) {
        modalMainText.innerHTML = `
          <strong style="color: var(--femme-red);">ATENÇÃO: Os códigos de barras não são iguais!</strong><br/>
          Verifique se todos os códigos foram bipados corretamente.
        `;
      }

      // Criar lista de códigos com destaque
      const listaDiv = document.createElement('div');
      listaDiv.style.marginTop = '16px';
      listaDiv.style.padding = '12px';
      listaDiv.style.background = 'var(--femme-light-gray)';
      listaDiv.style.borderRadius = '4px';
      listaDiv.style.fontSize = '13px';
      
      let html = '<div style="margin-bottom: 8px;"><strong>Códigos bipados:</strong></div>';
      html += `<div style="margin-left: 12px;">📦 Requisição: <code style="background: white; padding: 2px 6px; border-radius: 3px;">${codBarrasReq}</code></div>`;
      
      codigosAmostras.forEach((cod, idx) => {
        const isDiferente = cod !== codBarrasReq;
        const cor = isDiferente ? 'var(--femme-red)' : 'var(--femme-green)';
        const icone = isDiferente ? '❌' : '✅';
        html += `<div style="margin-left: 12px; color: ${cor}; margin-top: 4px;">${icone} Amostra ${idx + 1}: <code style="background: white; padding: 2px 6px; border-radius: 3px;">${cod}</code></div>`;
      });
      
      listaDiv.innerHTML = html;
      modalMainText.appendChild(listaDiv);

      // Esconder os campos de input e informações da requisição
      const modalMeta = modalBody?.querySelector('.modal-meta');
      const modalField = modalBody?.querySelector('.field');
      if (modalMeta) modalMeta.style.display = 'none';
      if (modalField) modalField.style.display = 'none';

      // Atualizar botões do footer
      const modalFooter = document.querySelector('.modal-footer');
      if (modalFooter) {
        modalFooter.innerHTML = `
          <button class="btn btn-ghost" type="button" id="modal_btn_cancelar_div">Cancelar</button>
          <button class="btn btn-outline" type="button" id="modal_btn_bipar_novamente">🔄 Bipar Novamente</button>
          <button class="btn btn-warning" type="button" id="modal_btn_registrar_problema">⚠️ Registrar Problema</button>
        `;

        // Event listeners para os novos botões
        document.getElementById('modal_btn_cancelar_div')?.addEventListener('click', () => {
          fecharModal();
          restaurarModalOriginal();
        });

        document.getElementById('modal_btn_bipar_novamente')?.addEventListener('click', () => {
          // Limpar todos os campos de código
          const inputs = modalSamplesList?.querySelectorAll('input[type="text"]') || [];
          inputs.forEach(input => input.value = '');
          
          // Focar no primeiro campo
          if (inputs.length > 0) inputs[0].focus();
          
          // Restaurar modal ao estado original
          restaurarModalOriginal();
        });

        document.getElementById('modal_btn_registrar_problema')?.addEventListener('click', () => {
          // TODO: Implementar fluxo de registro de problema
          alert('Funcionalidade "Registrar Problema" será implementada em breve.');
          // Por enquanto, apenas fecha o modal
          fecharModal();
          restaurarModalOriginal();
        });
      }
    }

    // Função para restaurar modal ao estado original
    function restaurarModalOriginal() {
      const modalBadge = document.querySelector('.modal-badge-icon');
      const modalTitle = document.querySelector('.modal-title-text h2');
      const modalMainText = document.querySelector('.modal-main-text');
      const modalFooter = document.querySelector('.modal-footer');
      const modalBody = document.querySelector('.modal-body');
      
      if (modalBadge) modalBadge.textContent = '⚠';
      if (modalTitle) modalTitle.textContent = 'Bipagem das amostras do kit';
      if (modalMainText) {
        modalMainText.innerHTML = 'PARA DAR ANDAMENTO BIPE O(S) CÓDIGO(S) DE BARRA(S) DA(S) AMOSTRA(S).';
      }
      
      // Restaurar visibilidade dos campos
      const modalMeta = modalBody?.querySelector('.modal-meta');
      const modalField = modalBody?.querySelector('.field');
      if (modalMeta) modalMeta.style.display = '';
      if (modalField) modalField.style.display = '';
      
      if (modalFooter) {
        modalFooter.innerHTML = `
          <button class="btn btn-ghost" type="button" id="modal_btn_cancelar">Cancelar</button>
          <button class="btn btn-primary" type="button" id="modal_btn_validar">Validar</button>
        `;
        
        // Re-anexar event listeners
        document.getElementById('modal_btn_cancelar')?.addEventListener('click', fecharModal);
        document.getElementById('modal_btn_validar')?.addEventListener('click', handleValidar);
      }
    }

    // Handler principal de validação
    async function handleValidar() {
      esconderAlerta();
      
      // DEBUG: Verificar estado da variável
      console.log('🔍 handleValidar - dadosRequisicaoTransito:', dadosRequisicaoTransito);
      
      // Coletar códigos de barras das amostras
      const inputsAmostras = modalSamplesList?.querySelectorAll('input[type="text"]') || [];
      const codigosAmostras = [];
      
      for (const input of inputsAmostras) {
        const valor = (input.value || '').trim();
        if (!valor) {
          mostrarAlerta('Todos os campos de código de barras das amostras devem ser preenchidos.');
          return;
        }
        codigosAmostras.push(valor);
      }

      const codBarrasReq = modalCodBarras?.textContent?.trim() || '';
      
      // VERIFICAR DIVERGÊNCIA DE CÓDIGOS
      if (verificarDivergenciaCodigos(codBarrasReq, codigosAmostras)) {
        mostrarModalDivergencia(codBarrasReq, codigosAmostras);
        return; // Não prossegue com a validação
      }
      
      // Preparar payload baseado no tipo de requisição
      let payload = {
        cod_barras_req: codBarrasReq,
        cod_barras_amostras: codigosAmostras,
      };
      
      // Se for requisição em trânsito
      if (dadosRequisicaoTransito) {
        payload.is_transit = true;
        payload.requisicao_id = dadosRequisicaoTransito.requisicao_id;
      } else {
        // Nova requisição - precisa de unidade, portador_representante, origem
        const unidadeId = hiddenField?.value;
        const portadorRepresentanteId = portadorSelect?.value;
        const origemId = portadorSelect?.options[portadorSelect.selectedIndex]?.dataset?.origemId;
        
        if (!unidadeId || !portadorRepresentanteId) {
          mostrarAlerta('Dados incompletos para validação.');
          return;
        }
        
        payload.unidade_id = unidadeId;
        payload.portador_representante_id = portadorRepresentanteId;
        payload.origem_id = origemId;
      }
      
      // Pegar texto da unidade e descrição da origem para a tabela
      const unidadeNome = dadosRequisicaoTransito 
        ? dadosRequisicaoTransito.unidade_nome 
        : document.querySelector('.unit-card--selected span')?.textContent || '';
      const origemDescricao = dadosRequisicaoTransito
        ? dadosRequisicaoTransito.origem_descricao
        : origemInput?.value || '';

      const urlValidar = window.FEMME_DATA?.urlValidar || '/operacao/recebimento/validar/';
      const btnValidar = document.getElementById('modal_btn_validar');
      if (btnValidar) {
        btnValidar.setAttribute('aria-busy', 'true');
        btnValidar.setAttribute('disabled', 'disabled');
      }

      // DEBUG: Log do payload
      console.log('🔍 Payload sendo enviado:', payload);
      console.log('🔍 Dados requisição trânsito:', dadosRequisicaoTransito);

      try {
        const response = await fetch(urlValidar, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-CSRFToken': csrfToken,
          },
          body: JSON.stringify(payload),
        });

        const data = await response.json();
        if (!response.ok || data.status === 'error') {
          mostrarAlerta(data.message || 'Erro ao validar requisição.');
          return;
        }

        if (data.status === 'success') {
          // 1. Atualizar Tabela IMEDIATAMENTE
          adicionarRequisicaoNaTabela({
            cod_req: data.cod_req,
            cod_barras_req: codBarrasReq,
            unidade_nome: unidadeNome,
            origem_descricao: origemDescricao
          });

          // 2. Mostrar toast de sucesso (sem bloquear)
          mostrarToastSucesso(`Requisição ${data.cod_req} criada com sucesso!`);
          
          // 3. Fechar modal e limpar campos
          fecharModal();
          
          // Limpar dados de requisição em trânsito
          dadosRequisicaoTransito = null;
          
          if (barcodeInput) {
            barcodeInput.value = '';
            barcodeInput.focus(); // Focar imediatamente para próxima leitura
          }
          if (quantidadeInput) quantidadeInput.value = 1;
          
          // Salvar valores atuais no sessionStorage (backup) - apenas se não for trânsito
          if (!payload.is_transit) {
            sessionStorage.setItem('recebimento_unidade_id', hiddenField?.value || '');
            sessionStorage.setItem('recebimento_portador_representante_id', portadorSelect?.value || '');
          }
        }
      } catch (error) {
        console.error('Erro na validação:', error);
        mostrarAlerta('Erro ao processar validação. Tente novamente.');
      } finally {
        if (btnValidar) {
          btnValidar.removeAttribute('aria-busy');
          btnValidar.removeAttribute('disabled');
        }
      }
    }

    // Anexar event listener ao botão validar
    modalValidar?.addEventListener('click', handleValidar);

    radioInputs.forEach(input => {
      input.addEventListener('change', () => updateSelectedState(input));
      input.addEventListener('click', () => updateSelectedState(input));
    });

    // Restaurar valores do sessionStorage
    const savedUnidadeId = sessionStorage.getItem('recebimento_unidade_id');
    const savedPortadorRepresentanteId = sessionStorage.getItem('recebimento_portador_representante_id');
    
    if (savedUnidadeId) {
      const radioToCheck = document.querySelector(`.unit-card input[type="radio"][value="${savedUnidadeId}"]`);
      if (radioToCheck) {
        radioToCheck.checked = true;
        updateSelectedState(radioToCheck);
        
        // Restaurar portador_representante após filtrar
        if (savedPortadorRepresentanteId) {
          setTimeout(() => {
            if (portadorSelect) {
              portadorSelect.value = savedPortadorRepresentanteId;
              atualizarOrigemFromSelect();
            }
          }, 100);
        }
      }
    } else {
      // Comportamento padrão se não houver valores salvos
      const initiallyChecked = document.querySelector('.unit-card input[type="radio"]:checked');
      if (initiallyChecked) {
        updateSelectedState(initiallyChecked);
      } else if (radioInputs.length) {
        updateSelectedState(radioInputs[0]);
      }
    }
  });
  
  /**
   * Mostra modal de confirmação de transferência de requisição
   */
  function mostrarModalTransferencia(data) {
    const modalHtml = `
      <div class="modal-transferencia" id="modal-transferencia" style="position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index: 10000;">
        <div style="background: white; border-radius: 18px; padding: 32px; max-width: 500px; width: 90%; box-shadow: 0 20px 60px rgba(0,0,0,0.3);">
          <h3 style="margin: 0 0 16px; color: #7a3d8a; font-size: 20px;">⚠️ Requisição Já Iniciada</h3>
          <p style="margin: 0 0 20px; color: #34343a; line-height: 1.6;">
            Esta requisição foi iniciada por <strong>${data.usuario_anterior_nome}</strong> em ${data.created_at}.
          </p>
          <p style="margin: 0 0  24px; color: #77767c; font-size: 14px;">
            Deseja assumir esta requisição? O usuário anterior será notificado.
          </p>
          <div style="display: flex; gap: 12px; justify-content: flex-end;">
            <button id="btn-cancelar-transferencia" style="padding: 10px 20px; background: #f5f5f7; color: #34343a; border: none; border-radius: 8px; font-weight: 600; cursor: pointer;">
              Cancelar
            </button>
            <button id="btn-confirmar-transferencia" style="padding: 10px 20px; background: #7a3d8a; color: white; border: none; border-radius: 8px; font-weight: 600; cursor: pointer;">
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
    
    function fecharModalTransferencia() {
      modal.remove();
    }
    
    btnCancelar.addEventListener('click', fecharModalTransferencia);
    
    btnConfirmar.addEventListener('click', async () => {
      btnConfirmar.disabled = true;
      btnConfirmar.textContent = 'Transferindo...';
      
      try {
        console.log('Transferindo requisição ID:', data.requisicao_id);
        
        const response = await fetch('/operacao/requisicao/transferir/', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-CSRFToken': getCookie('csrftoken'),
          },
          body: JSON.stringify({
            requisicao_id: data.requisicao_id,
          }),
        });
        
        console.log('Response status:', response.status);
        console.log('Response ok:', response.ok);
        
        const result = await response.json();
        console.log('Result:', result);
        
        if (result.status === 'success') {
          fecharModalTransferencia();
          mostrarToastSucesso('Requisição transferida com sucesso!');
          
          // Atualizar contador de notificações (se disponível)
          if (window.Notificacoes) {
            window.Notificacoes.atualizarContador();
          }
          
          // Recarregar página após 1.5s
          setTimeout(() => location.reload(), 1500);
        } else {
          console.error('Erro na transferência:', result);
          mostrarAlerta(result.message || 'Erro ao transferir requisição.');
          btnConfirmar.disabled = false;
          btnConfirmar.textContent = 'Assumir Requisição';
        }
      } catch (error) {
        console.error('Erro ao transferir requisição:', error);
        mostrarAlerta(`Erro ao transferir: ${error.message}`);
        btnConfirmar.disabled = false;
        btnConfirmar.textContent = 'Assumir Requisição';
      }
    });
  }
