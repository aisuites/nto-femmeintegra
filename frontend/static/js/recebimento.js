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

    function mostrarAlerta(mensagem) {
      if (!alertaBox || !alertaMsg) return;
      alertaMsg.textContent = mensagem;
      alertaBox.classList.add('alert--visible');
    }

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

    function abrirModal(quantidade, codigoBarras) {
      if (!modalOverlay) return;
      modalQtd.textContent = quantidade;
      modalCodBarras.textContent = codigoBarras;
      modalCodReq.textContent = '—';
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

        const data = await response.json();
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

        mostrarAlerta('Retorno inesperado do servidor.');
      } catch (error) {
        console.error(error);
        mostrarAlerta('Erro de comunicação com o servidor. Tente novamente.');
      } finally {
        localizarBtn?.removeAttribute('aria-busy');
        localizarBtn?.removeAttribute('disabled');
      }
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
            sessionStorage.removeItem('recebimento_portador_id');
            
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

    // Função para mostrar toast de sucesso empilhável
    function mostrarToastSucesso(mensagem) {
      let container = document.getElementById('toast_container');
      if (!container) {
        container = document.createElement('div');
        container.id = 'toast_container';
        container.className = 'toast-container';
        document.body.appendChild(container);
      }

      const toast = document.createElement('div');
      toast.className = 'toast-success';
      toast.textContent = mensagem;
      
      container.appendChild(toast);

      // Remove o elemento do DOM após a animação de fadeOut (3s total: 0.3s slideIn + 2.2s wait + 0.5s fadeOut)
      setTimeout(() => {
        if (toast.parentNode) {
          toast.parentNode.removeChild(toast);
        }
      }, 3000);
    }

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

    modalValidar?.addEventListener('click', async () => {
      esconderAlerta();
      
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
      const unidadeId = hiddenField?.value;
      const portadorId = portadorSelect?.value;
      const origemId = portadorSelect?.options[portadorSelect.selectedIndex]?.dataset?.origemId;
      // Pegar texto da unidade e descrição da origem para a tabela
      const unidadeNome = document.querySelector('.unit-card--selected span')?.textContent || '';
      const origemDescricao = origemInput?.value || '';

      if (!unidadeId || !portadorId) {
        mostrarAlerta('Dados incompletos para validação.');
        return;
      }

      const urlValidar = window.FEMME_DATA?.urlValidar || '/operacao/recebimento/validar/';
      modalValidar?.setAttribute('aria-busy', 'true');
      modalValidar?.setAttribute('disabled', 'disabled');

      try {
        const response = await fetch(urlValidar, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-CSRFToken': csrfToken,
          },
          body: JSON.stringify({
            cod_barras_req: codBarrasReq,
            cod_barras_amostras: codigosAmostras,
            unidade_id: unidadeId,
            portador_id: portadorId,
            origem_id: origemId,
          }),
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
          
          if (barcodeInput) {
            barcodeInput.value = '';
            barcodeInput.focus(); // Focar imediatamente para próxima leitura
          }
          if (quantidadeInput) quantidadeInput.value = 1;
          
          // Salvar valores atuais no sessionStorage (backup)
          sessionStorage.setItem('recebimento_unidade_id', hiddenField?.value || '');
          sessionStorage.setItem('recebimento_portador_id', portadorSelect?.value || '');
          
          // NÃO RECARREGAR A PÁGINA
        }
      } catch (error) {
        console.error(error);
        mostrarAlerta('Erro de comunicação com o servidor.');
      } finally {
        modalValidar?.removeAttribute('aria-busy');
        modalValidar?.removeAttribute('disabled');
      }
    });

    radioInputs.forEach(input => {
      input.addEventListener('change', () => updateSelectedState(input));
      input.addEventListener('click', () => updateSelectedState(input));
    });

    // Restaurar valores do sessionStorage
    const savedUnidadeId = sessionStorage.getItem('recebimento_unidade_id');
    const savedPortadorId = sessionStorage.getItem('recebimento_portador_id');
    
    if (savedUnidadeId) {
      const radioToCheck = document.querySelector(`.unit-card input[type="radio"][value="${savedUnidadeId}"]`);
      if (radioToCheck) {
        radioToCheck.checked = true;
        updateSelectedState(radioToCheck);
        
        // Restaurar portador após filtrar
        if (savedPortadorId) {
          setTimeout(() => {
            if (portadorSelect) {
              portadorSelect.value = savedPortadorId;
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
