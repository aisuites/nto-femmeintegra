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

    // Botão Finalizar Recebimento - limpa sessionStorage
    btnFinalizarRecebimento?.addEventListener('click', () => {
      sessionStorage.removeItem('recebimento_unidade_id');
      sessionStorage.removeItem('recebimento_portador_id');
      mostrarToastSucesso('Recebimento finalizado! Valores resetados.');
      setTimeout(() => {
        location.reload();
      }, 1500);
    });

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

      if (!unidadeId || !portadorId) {
        mostrarAlerta('Dados incompletos para validação.');
        return;
      }

      const urlValidar = '{% url "operacao:recebimento-validar" %}';
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
          // Mostrar toast de sucesso
          mostrarToastSucesso(`Requisição ${data.cod_req} criada com sucesso!`);
          
          // Fechar modal
          fecharModal();
          
          // Limpar apenas o campo de código de barras e resetar quantidade
          if (barcodeInput) barcodeInput.value = '';
          if (quantidadeInput) quantidadeInput.value = 1;
          
          // Salvar valores atuais no sessionStorage
          sessionStorage.setItem('recebimento_unidade_id', hiddenField?.value || '');
          sessionStorage.setItem('recebimento_portador_id', portadorSelect?.value || '');
          
          // Recarregar após 2.5 segundos
          setTimeout(() => {
            location.reload();
          }, 2500);
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

    // Função para mostrar toast de sucesso
    function mostrarToastSucesso(mensagem) {
      let toast = document.getElementById('toast_sucesso');
      if (!toast) {
        toast = document.createElement('div');
        toast.id = 'toast_sucesso';
        toast.className = 'toast-success';
        document.body.appendChild(toast);
      }
      toast.textContent = mensagem;
      toast.classList.add('show');
      
      setTimeout(() => {
        toast.classList.remove('show');
      }, 2500);
    }

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
