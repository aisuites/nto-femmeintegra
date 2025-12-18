/**
 * Sistema de Tarefas - Kanban
 * Gerenciamento de tarefas com drag & drop
 */
(function() {
  'use strict';

  // ============================================
  // ESTADO
  // ============================================
  const state = {
    tarefas: [],
    filtros: {
      minhasTarefas: true,
      responsavelId: null,
      prioridade: null,
      tipoId: null,
    },
    tarefaEditando: null,
    carregando: false,
  };

  // ============================================
  // ELEMENTOS DOM
  // ============================================
  const elements = {
    // Filtros
    filtroMinhasTarefas: () => document.getElementById('filtroMinhasTarefas'),
    filtroResponsavel: () => document.getElementById('filtroResponsavel'),
    filtroPrioridade: () => document.getElementById('filtroPrioridade'),
    filtroTipo: () => document.getElementById('filtroTipo'),
    
    // Contadores
    tarefasContador: () => document.getElementById('tarefasContador'),
    countAFazer: () => document.getElementById('countAFazer'),
    countEmAndamento: () => document.getElementById('countEmAndamento'),
    countConcluida: () => document.getElementById('countConcluida'),
    
    // Colunas
    cardsAFazer: () => document.getElementById('cardsAFazer'),
    cardsEmAndamento: () => document.getElementById('cardsEmAndamento'),
    cardsConcluida: () => document.getElementById('cardsConcluida'),
    
    // Modal Nova Tarefa
    modalNovaTarefa: () => document.getElementById('modalNovaTarefa'),
    modalTarefaTitulo: () => document.getElementById('modalTarefaTitulo'),
    btnNovaTarefa: () => document.getElementById('btnNovaTarefa'),
    btnFecharModal: () => document.getElementById('btnFecharModal'),
    btnCancelarTarefa: () => document.getElementById('btnCancelarTarefa'),
    btnSalvarTarefa: () => document.getElementById('btnSalvarTarefa'),
    formTarefa: () => document.getElementById('formTarefa'),
    tarefaId: () => document.getElementById('tarefaId'),
    tarefaTitulo: () => document.getElementById('tarefaTitulo'),
    tarefaDescricao: () => document.getElementById('tarefaDescricao'),
    tarefaTipo: () => document.getElementById('tarefaTipo'),
    tarefaPrioridade: () => document.getElementById('tarefaPrioridade'),
    tarefaResponsavel: () => document.getElementById('tarefaResponsavel'),
    tarefaDataPrazo: () => document.getElementById('tarefaDataPrazo'),
    tarefaObservacoes: () => document.getElementById('tarefaObservacoes'),
    
    // Modal Detalhes
    modalDetalhesTarefa: () => document.getElementById('modalDetalhesTarefa'),
    btnFecharDetalhes: () => document.getElementById('btnFecharDetalhes'),
    btnCancelarDetalhes: () => document.getElementById('btnCancelarDetalhes'),
    btnEditarTarefa: () => document.getElementById('btnEditarTarefa'),
    detalhesCodigo: () => document.getElementById('detalhesCodigo'),
    detalhesTitulo: () => document.getElementById('detalhesTitulo'),
    detalhesDescricao: () => document.getElementById('detalhesDescricao'),
    detalhesStatus: () => document.getElementById('detalhesStatus'),
    detalhesPrioridade: () => document.getElementById('detalhesPrioridade'),
    detalhesTipo: () => document.getElementById('detalhesTipo'),
    detalhesResponsavel: () => document.getElementById('detalhesResponsavel'),
    detalhesCriadoPor: () => document.getElementById('detalhesCriadoPor'),
    detalhesDataPrazo: () => document.getElementById('detalhesDataPrazo'),
    detalhesDataCriacao: () => document.getElementById('detalhesDataCriacao'),
    detalhesObservacoes: () => document.getElementById('detalhesObservacoes'),
    
    // Toast
    toastContainer: () => document.getElementById('toastContainer'),
  };

  // ============================================
  // INICIALIZAÇÃO
  // ============================================
  function init() {
    console.log('[TarefasKanban] Inicializando...');
    
    setupEventListeners();
    setupDragAndDrop();
    carregarTarefas();
    
    console.log('[TarefasKanban] Inicializado com sucesso');
  }

  function setupEventListeners() {
    // Filtros
    const filtroMinhas = elements.filtroMinhasTarefas();
    if (filtroMinhas) {
      filtroMinhas.addEventListener('change', handleFiltroMinhasTarefas);
    }
    
    const filtroResp = elements.filtroResponsavel();
    if (filtroResp) {
      filtroResp.addEventListener('change', handleFiltroChange);
    }
    
    const filtroPrio = elements.filtroPrioridade();
    if (filtroPrio) {
      filtroPrio.addEventListener('change', handleFiltroChange);
    }
    
    const filtroTipo = elements.filtroTipo();
    if (filtroTipo) {
      filtroTipo.addEventListener('change', handleFiltroChange);
    }
    
    // Botão Nova Tarefa
    const btnNova = elements.btnNovaTarefa();
    if (btnNova) {
      btnNova.addEventListener('click', abrirModalNovaTarefa);
    }
    
    // Modal Nova Tarefa
    const btnFechar = elements.btnFecharModal();
    if (btnFechar) {
      btnFechar.addEventListener('click', fecharModalTarefa);
    }
    
    const btnCancelar = elements.btnCancelarTarefa();
    if (btnCancelar) {
      btnCancelar.addEventListener('click', fecharModalTarefa);
    }
    
    const btnSalvar = elements.btnSalvarTarefa();
    if (btnSalvar) {
      btnSalvar.addEventListener('click', salvarTarefa);
    }
    
    // Tipo de tarefa - atualizar prazo
    const tarefaTipo = elements.tarefaTipo();
    if (tarefaTipo) {
      tarefaTipo.addEventListener('change', handleTipoChange);
    }
    
    // Modal Detalhes
    const btnFecharDet = elements.btnFecharDetalhes();
    if (btnFecharDet) {
      btnFecharDet.addEventListener('click', fecharModalDetalhes);
    }
    
    const btnCancelarDet = elements.btnCancelarDetalhes();
    if (btnCancelarDet) {
      btnCancelarDet.addEventListener('click', fecharModalDetalhes);
    }
    
    const btnEditar = elements.btnEditarTarefa();
    if (btnEditar) {
      btnEditar.addEventListener('click', editarTarefaAtual);
    }
    
    // Fechar modais com ESC
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        fecharModalTarefa();
        fecharModalDetalhes();
      }
    });
    
    // Fechar modais clicando fora
    const modalNova = elements.modalNovaTarefa();
    if (modalNova) {
      modalNova.addEventListener('click', (e) => {
        if (e.target === modalNova) fecharModalTarefa();
      });
    }
    
    const modalDet = elements.modalDetalhesTarefa();
    if (modalDet) {
      modalDet.addEventListener('click', (e) => {
        if (e.target === modalDet) fecharModalDetalhes();
      });
    }
  }

  // ============================================
  // DRAG AND DROP
  // ============================================
  function setupDragAndDrop() {
    const colunas = document.querySelectorAll('.column-cards');
    
    colunas.forEach(coluna => {
      coluna.addEventListener('dragover', handleDragOver);
      coluna.addEventListener('dragenter', handleDragEnter);
      coluna.addEventListener('dragleave', handleDragLeave);
      coluna.addEventListener('drop', handleDrop);
    });
  }

  function handleDragStart(e) {
    e.target.classList.add('dragging');
    e.dataTransfer.setData('text/plain', e.target.dataset.tarefaId);
    e.dataTransfer.effectAllowed = 'move';
  }

  function handleDragEnd(e) {
    e.target.classList.remove('dragging');
    document.querySelectorAll('.column-cards').forEach(col => {
      col.classList.remove('drag-over');
    });
  }

  function handleDragOver(e) {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  }

  function handleDragEnter(e) {
    e.preventDefault();
    e.currentTarget.classList.add('drag-over');
  }

  function handleDragLeave(e) {
    if (!e.currentTarget.contains(e.relatedTarget)) {
      e.currentTarget.classList.remove('drag-over');
    }
  }

  async function handleDrop(e) {
    e.preventDefault();
    e.currentTarget.classList.remove('drag-over');
    
    const tarefaId = e.dataTransfer.getData('text/plain');
    const novoStatus = e.currentTarget.dataset.status;
    
    if (!tarefaId || !novoStatus) return;
    
    // Atualizar status via API
    try {
      const response = await fetch(window.TAREFAS_URLS.atualizarStatus, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRFToken': window.CSRF_TOKEN,
        },
        body: JSON.stringify({
          tarefa_id: parseInt(tarefaId),
          status: novoStatus,
        }),
      });
      
      const data = await response.json();
      
      if (data.status === 'success') {
        // Atualizar estado local
        const tarefa = state.tarefas.find(t => t.id === parseInt(tarefaId));
        if (tarefa) {
          tarefa.status = novoStatus;
          tarefa.status_display = data.tarefa.status_display;
          if (data.tarefa.data_inicio) tarefa.data_inicio = data.tarefa.data_inicio;
          if (data.tarefa.data_conclusao) tarefa.data_conclusao = data.tarefa.data_conclusao;
        }
        
        renderizarTarefas();
        showToast('Status atualizado!', 'success');
      } else {
        showToast(data.message || 'Erro ao atualizar status', 'error');
      }
    } catch (error) {
      console.error('Erro ao atualizar status:', error);
      showToast('Erro ao atualizar status', 'error');
    }
  }

  // ============================================
  // FILTROS
  // ============================================
  function handleFiltroMinhasTarefas(e) {
    state.filtros.minhasTarefas = e.target.checked;
    
    // Mostrar/esconder filtro de responsável
    const filtroResp = elements.filtroResponsavel();
    if (filtroResp) {
      filtroResp.style.display = e.target.checked ? 'none' : 'block';
      if (e.target.checked) {
        filtroResp.value = '';
        state.filtros.responsavelId = null;
      }
    }
    
    carregarTarefas();
  }

  function handleFiltroChange() {
    state.filtros.responsavelId = elements.filtroResponsavel()?.value || null;
    state.filtros.prioridade = elements.filtroPrioridade()?.value || null;
    state.filtros.tipoId = elements.filtroTipo()?.value || null;
    
    carregarTarefas();
  }

  // ============================================
  // CARREGAR TAREFAS
  // ============================================
  async function carregarTarefas() {
    if (state.carregando) return;
    state.carregando = true;
    
    try {
      // Construir query params
      const params = new URLSearchParams();
      
      if (state.filtros.minhasTarefas) {
        params.append('minhas_tarefas', 'true');
      } else if (state.filtros.responsavelId) {
        params.append('responsavel_id', state.filtros.responsavelId);
      }
      
      if (state.filtros.prioridade) {
        params.append('prioridade', state.filtros.prioridade);
      }
      
      if (state.filtros.tipoId) {
        params.append('tipo_id', state.filtros.tipoId);
      }
      
      const url = `${window.TAREFAS_URLS.listar}?${params.toString()}`;
      const response = await fetch(url);
      const data = await response.json();
      
      if (data.status === 'success') {
        // Filtrar tarefas canceladas
        state.tarefas = data.tarefas.filter(t => t.status !== 'CANCELADA');
        renderizarTarefas();
      } else {
        showToast(data.message || 'Erro ao carregar tarefas', 'error');
      }
    } catch (error) {
      console.error('Erro ao carregar tarefas:', error);
      showToast('Erro ao carregar tarefas', 'error');
    } finally {
      state.carregando = false;
    }
  }

  // ============================================
  // RENDERIZAÇÃO
  // ============================================
  function renderizarTarefas() {
    // Separar por status
    const aFazer = state.tarefas.filter(t => t.status === 'A_FAZER');
    const emAndamento = state.tarefas.filter(t => t.status === 'EM_ANDAMENTO');
    const concluidas = state.tarefas.filter(t => t.status === 'CONCLUIDA');
    
    // Renderizar colunas
    renderizarColuna(elements.cardsAFazer(), aFazer);
    renderizarColuna(elements.cardsEmAndamento(), emAndamento);
    renderizarColuna(elements.cardsConcluida(), concluidas);
    
    // Atualizar contadores
    const total = state.tarefas.length;
    elements.tarefasContador().textContent = `${total} tarefa${total !== 1 ? 's' : ''}`;
    elements.countAFazer().textContent = aFazer.length;
    elements.countEmAndamento().textContent = emAndamento.length;
    elements.countConcluida().textContent = concluidas.length;
  }

  function renderizarColuna(container, tarefas) {
    if (!container) return;
    
    if (tarefas.length === 0) {
      container.innerHTML = `
        <div class="empty-column">
          <div class="empty-column-icon">📋</div>
          <div class="empty-column-text">Nenhuma tarefa</div>
        </div>
      `;
      return;
    }
    
    container.innerHTML = tarefas.map(tarefa => criarCardHTML(tarefa)).join('');
    
    // Adicionar eventos de drag e click
    container.querySelectorAll('.tarefa-card').forEach(card => {
      card.addEventListener('dragstart', handleDragStart);
      card.addEventListener('dragend', handleDragEnd);
      card.addEventListener('click', () => abrirDetalhes(card.dataset.tarefaId));
    });
  }

  function criarCardHTML(tarefa) {
    const prioridadeClass = `prioridade-${tarefa.prioridade.toLowerCase()}`;
    const atrasadaClass = tarefa.esta_atrasada ? 'atrasada' : '';
    const iniciais = getIniciais(tarefa.responsavel.nome);
    
    let prazoHTML = '';
    if (tarefa.data_prazo) {
      const prazoDate = new Date(tarefa.data_prazo);
      const prazoFormatado = prazoDate.toLocaleDateString('pt-BR');
      let prazoClass = '';
      
      if (tarefa.esta_atrasada) {
        prazoClass = 'atrasado';
      } else if (tarefa.dias_restantes !== null && tarefa.dias_restantes <= 2) {
        prazoClass = 'proximo';
      }
      
      prazoHTML = `
        <div class="card-prazo ${prazoClass}">
          📅 ${prazoFormatado}
          ${tarefa.dias_restantes !== null ? `(${tarefa.dias_restantes}d)` : ''}
        </div>
      `;
    }
    
    const tipoHTML = tarefa.tipo ? `<div class="card-tipo">${tarefa.tipo.nome}</div>` : '';
    
    return `
      <div class="tarefa-card ${prioridadeClass} ${atrasadaClass}" 
           draggable="true" 
           data-tarefa-id="${tarefa.id}">
        <div class="card-header">
          <span class="card-codigo">${tarefa.codigo}</span>
          <span class="card-prioridade">${tarefa.prioridade_display}</span>
        </div>
        <div class="card-titulo">${escapeHTML(tarefa.titulo)}</div>
        ${tipoHTML}
        <div class="card-footer">
          <div class="card-responsavel">
            <span class="responsavel-avatar">${iniciais}</span>
            <span>${escapeHTML(tarefa.responsavel.nome)}</span>
          </div>
          ${prazoHTML}
        </div>
      </div>
    `;
  }

  // ============================================
  // MODAL NOVA TAREFA
  // ============================================
  function abrirModalNovaTarefa() {
    state.tarefaEditando = null;
    
    // Limpar formulário
    elements.formTarefa().reset();
    elements.tarefaId().value = '';
    elements.modalTarefaTitulo().textContent = 'Nova Tarefa';
    
    // Pré-selecionar usuário atual como responsável
    const respSelect = elements.tarefaResponsavel();
    if (respSelect && window.USUARIO_ATUAL) {
      respSelect.value = window.USUARIO_ATUAL.id;
    }
    
    // Mostrar modal
    elements.modalNovaTarefa().classList.add('active');
    elements.tarefaTitulo().focus();
  }

  function fecharModalTarefa() {
    elements.modalNovaTarefa().classList.remove('active');
    state.tarefaEditando = null;
  }

  function handleTipoChange(e) {
    const option = e.target.selectedOptions[0];
    if (option && option.dataset.prazo) {
      const dias = parseInt(option.dataset.prazo);
      const dataPrazo = new Date();
      dataPrazo.setDate(dataPrazo.getDate() + dias);
      elements.tarefaDataPrazo().value = dataPrazo.toISOString().split('T')[0];
    }
  }

  async function salvarTarefa() {
    const titulo = elements.tarefaTitulo().value.trim();
    const responsavelId = elements.tarefaResponsavel().value;
    
    if (!titulo) {
      showToast('Informe o título da tarefa', 'warning');
      elements.tarefaTitulo().focus();
      return;
    }
    
    if (!responsavelId) {
      showToast('Selecione um responsável', 'warning');
      elements.tarefaResponsavel().focus();
      return;
    }
    
    const payload = {
      titulo: titulo,
      descricao: elements.tarefaDescricao().value.trim(),
      tipo_id: elements.tarefaTipo().value || null,
      prioridade: elements.tarefaPrioridade().value,
      responsavel_id: parseInt(responsavelId),
      data_prazo: elements.tarefaDataPrazo().value || null,
      observacoes: elements.tarefaObservacoes().value.trim(),
    };
    
    const tarefaId = elements.tarefaId().value;
    const isEdicao = !!tarefaId;
    
    if (isEdicao) {
      payload.tarefa_id = parseInt(tarefaId);
    }
    
    const url = isEdicao ? window.TAREFAS_URLS.atualizar : window.TAREFAS_URLS.criar;
    
    try {
      elements.btnSalvarTarefa().disabled = true;
      elements.btnSalvarTarefa().innerHTML = '<span class="loading-spinner"></span>';
      
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRFToken': window.CSRF_TOKEN,
        },
        body: JSON.stringify(payload),
      });
      
      const data = await response.json();
      
      if (data.status === 'success') {
        showToast(data.message || 'Tarefa salva com sucesso!', 'success');
        fecharModalTarefa();
        carregarTarefas();
      } else {
        showToast(data.message || 'Erro ao salvar tarefa', 'error');
      }
    } catch (error) {
      console.error('Erro ao salvar tarefa:', error);
      showToast('Erro ao salvar tarefa', 'error');
    } finally {
      elements.btnSalvarTarefa().disabled = false;
      elements.btnSalvarTarefa().textContent = 'Salvar Tarefa';
    }
  }

  // ============================================
  // MODAL DETALHES
  // ============================================
  async function abrirDetalhes(tarefaId) {
    try {
      const response = await fetch(`${window.TAREFAS_URLS.obter}?tarefa_id=${tarefaId}`);
      const data = await response.json();
      
      if (data.status === 'success') {
        const tarefa = data.tarefa;
        state.tarefaEditando = tarefa;
        
        // Preencher detalhes
        elements.detalhesCodigo().textContent = tarefa.codigo;
        elements.detalhesTitulo().textContent = tarefa.titulo;
        elements.detalhesDescricao().textContent = tarefa.descricao || '-';
        elements.detalhesStatus().textContent = tarefa.status_display;
        elements.detalhesPrioridade().textContent = tarefa.prioridade_display;
        elements.detalhesTipo().textContent = tarefa.tipo?.nome || '-';
        elements.detalhesResponsavel().textContent = tarefa.responsavel.nome;
        elements.detalhesCriadoPor().textContent = tarefa.criado_por?.nome || 'Sistema';
        elements.detalhesDataPrazo().textContent = tarefa.data_prazo 
          ? new Date(tarefa.data_prazo).toLocaleDateString('pt-BR') 
          : '-';
        elements.detalhesDataCriacao().textContent = new Date(tarefa.created_at).toLocaleString('pt-BR');
        elements.detalhesObservacoes().textContent = tarefa.observacoes || '-';
        
        // Mostrar modal
        elements.modalDetalhesTarefa().classList.add('active');
      } else {
        showToast(data.message || 'Erro ao carregar detalhes', 'error');
      }
    } catch (error) {
      console.error('Erro ao carregar detalhes:', error);
      showToast('Erro ao carregar detalhes', 'error');
    }
  }

  function fecharModalDetalhes() {
    elements.modalDetalhesTarefa().classList.remove('active');
  }

  function editarTarefaAtual() {
    if (!state.tarefaEditando) return;
    
    const tarefa = state.tarefaEditando;
    
    // Fechar modal de detalhes
    fecharModalDetalhes();
    
    // Preencher formulário de edição
    elements.tarefaId().value = tarefa.id;
    elements.tarefaTitulo().value = tarefa.titulo;
    elements.tarefaDescricao().value = tarefa.descricao || '';
    elements.tarefaTipo().value = tarefa.tipo?.id || '';
    elements.tarefaPrioridade().value = tarefa.prioridade;
    elements.tarefaResponsavel().value = tarefa.responsavel.id;
    elements.tarefaDataPrazo().value = tarefa.data_prazo || '';
    elements.tarefaObservacoes().value = tarefa.observacoes || '';
    
    elements.modalTarefaTitulo().textContent = 'Editar Tarefa';
    
    // Abrir modal de edição
    elements.modalNovaTarefa().classList.add('active');
  }

  // ============================================
  // UTILITÁRIOS
  // ============================================
  function getIniciais(nome) {
    if (!nome) return '?';
    const partes = nome.split(' ').filter(p => p.length > 0);
    if (partes.length === 1) return partes[0].charAt(0).toUpperCase();
    return (partes[0].charAt(0) + partes[partes.length - 1].charAt(0)).toUpperCase();
  }

  function escapeHTML(str) {
    if (!str) return '';
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  function showToast(message, type = 'success') {
    const container = elements.toastContainer();
    if (!container) return;
    
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = message;
    container.appendChild(toast);
    
    setTimeout(() => {
      toast.classList.add('hide');
      setTimeout(() => toast.remove(), 300);
    }, 3000);
  }

  // ============================================
  // INICIAR
  // ============================================
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
