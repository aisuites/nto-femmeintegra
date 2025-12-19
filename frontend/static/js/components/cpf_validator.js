/**
 * CPF_VALIDATOR.JS - Componente Global para Consulta de CPF
 * 
 * Fornece consulta de CPF via Korus e Receita Federal.
 * Inclua este arquivo no base_app.html para disponibilizar globalmente.
 * 
 * Uso:
 *   CpfValidator.consultarKorus(cpf, requisicaoId, callbacks);
 *   CpfValidator.consultarReceita(cpf, requisicaoId, callbacks);
 *   CpfValidator.validarCpf(cpf); // Valida formato
 */

window.CpfValidator = (function() {
  'use strict';

  /**
   * Valida se o CPF tem formato válido (11 dígitos)
   * @param {string} cpf - CPF com ou sem formatação
   * @returns {boolean} true se válido
   */
  function validarCpf(cpf) {
    if (!cpf) return false;
    const numeros = cpf.replace(/\D/g, '');
    return numeros.length === 11;
  }

  /**
   * Limpa CPF (remove formatação)
   * @param {string} cpf - CPF com ou sem formatação
   * @returns {string} CPF apenas números
   */
  function limparCpf(cpf) {
    if (!cpf) return '';
    return cpf.replace(/\D/g, '');
  }

  /**
   * Consulta CPF na base Korus
   * @param {string} cpf - CPF do paciente
   * @param {number|string} requisicaoId - ID da requisição (opcional, para salvar no banco)
   * @param {object} callbacks - Callbacks: onSucesso, onErro, onNaoEncontrado, btnElement
   */
  async function consultarKorus(cpf, requisicaoId, callbacks = {}) {
    const cpfLimpo = limparCpf(cpf);
    
    if (!validarCpf(cpfLimpo)) {
      if (callbacks.onErro) {
        callbacks.onErro('Informe um CPF válido (11 dígitos).');
      }
      return;
    }
    
    // Mostrar loading no botão se fornecido
    if (callbacks.btnElement) {
      callbacks.btnElement.disabled = true;
      callbacks.btnElement.textContent = 'Consultando...';
    }
    
    try {
      const reqId = requisicaoId || '';
      const response = await fetch(
        `/operacao/triagem/consultar-cpf-korus/?cpf=${encodeURIComponent(cpfLimpo)}&requisicao_id=${reqId}`,
        {
          method: 'GET',
          headers: { 'X-CSRFToken': FemmeUtils.getCsrfToken() }
        }
      );
      
      const data = await response.json();
      console.log('[CpfValidator] Resposta Korus:', data);
      
      if (data.status === 'success' && data.paciente) {
        const paciente = normalizarPaciente(data.paciente);
        
        if (callbacks.onSucesso) {
          callbacks.onSucesso(paciente, 'korus');
        }
      } else {
        if (callbacks.onNaoEncontrado) {
          callbacks.onNaoEncontrado(data.message || 'CPF não encontrado na base Korus.', 'korus');
        } else if (callbacks.onErro) {
          callbacks.onErro(data.message || 'CPF não encontrado na base Korus.');
        }
      }
      
    } catch (error) {
      console.error('[CpfValidator] Erro ao consultar Korus:', error);
      if (callbacks.onErro) {
        callbacks.onErro('Erro de conexão ao consultar CPF.');
      }
    } finally {
      // Restaurar botão
      if (callbacks.btnElement) {
        callbacks.btnElement.disabled = false;
        callbacks.btnElement.textContent = callbacks.btnTexto || 'CPF Korus';
      }
    }
  }

  /**
   * Consulta CPF na Receita Federal
   * @param {string} cpf - CPF do paciente
   * @param {number|string} requisicaoId - ID da requisição (opcional, para salvar no banco)
   * @param {object} callbacks - Callbacks: onSucesso, onErro, onNaoEncontrado, btnElement
   */
  async function consultarReceita(cpf, requisicaoId, callbacks = {}) {
    const cpfLimpo = limparCpf(cpf);
    
    if (!validarCpf(cpfLimpo)) {
      if (callbacks.onErro) {
        callbacks.onErro('Informe um CPF válido (11 dígitos).');
      }
      return;
    }
    
    // Mostrar loading no botão se fornecido
    if (callbacks.btnElement) {
      callbacks.btnElement.disabled = true;
      callbacks.btnElement.textContent = 'Consultando...';
    }
    
    try {
      const reqId = requisicaoId || '';
      const response = await fetch(
        `/operacao/triagem/consultar-cpf-receita/?cpf=${encodeURIComponent(cpfLimpo)}&requisicao_id=${reqId}`,
        {
          method: 'GET',
          headers: { 'X-CSRFToken': FemmeUtils.getCsrfToken() }
        }
      );
      
      const data = await response.json();
      console.log('[CpfValidator] Resposta Receita:', data);
      
      if (data.status === 'success' && data.paciente) {
        const paciente = normalizarPaciente(data.paciente);
        
        if (callbacks.onSucesso) {
          callbacks.onSucesso(paciente, 'receita');
        }
      } else {
        if (callbacks.onNaoEncontrado) {
          callbacks.onNaoEncontrado(data.message || 'CPF não encontrado na Receita Federal.', 'receita');
        } else if (callbacks.onErro) {
          callbacks.onErro(data.message || 'CPF não encontrado na Receita Federal.');
        }
      }
      
    } catch (error) {
      console.error('[CpfValidator] Erro ao consultar Receita:', error);
      if (callbacks.onErro) {
        callbacks.onErro('Erro de conexão ao consultar CPF.');
      }
    } finally {
      // Restaurar botão
      if (callbacks.btnElement) {
        callbacks.btnElement.disabled = false;
        callbacks.btnElement.textContent = callbacks.btnTexto || 'CPF Receita';
      }
    }
  }

  /**
   * Normaliza dados do paciente para formato padrão
   * @param {object} paciente - Dados do paciente da API
   * @returns {object} Paciente normalizado
   */
  function normalizarPaciente(paciente) {
    if (!paciente) return null;
    
    // Normalizar sexo
    let sexo = paciente.sexo || '';
    if (sexo.toLowerCase() === 'feminino') {
      sexo = 'F';
    } else if (sexo.toLowerCase() === 'masculino') {
      sexo = 'M';
    }
    
    // Normalizar data de nascimento para formato de input (YYYY-MM-DD)
    let dataNascimento = paciente.data_nascimento || '';
    if (dataNascimento) {
      dataNascimento = FemmeUtils.formatarDataInput(dataNascimento);
    }
    
    return {
      nome: paciente.nome || '',
      data_nascimento: dataNascimento,
      email: paciente.email || '',
      telefone: paciente.telefone || '',
      sexo: sexo,
      cpf: paciente.cpf || ''
    };
  }

  /**
   * Preenche campos de formulário com dados do paciente
   * @param {object} paciente - Dados do paciente normalizado
   * @param {object} campos - Mapeamento de campos: { nome, dataNascimento, email, telefone, sexo }
   */
  function preencherCampos(paciente, campos) {
    if (!paciente || !campos) return;
    
    if (campos.nome && paciente.nome) {
      campos.nome.value = paciente.nome;
    }
    if (campos.dataNascimento && paciente.data_nascimento) {
      campos.dataNascimento.value = paciente.data_nascimento;
    }
    if (campos.email && paciente.email) {
      campos.email.value = paciente.email;
    }
    if (campos.telefone && paciente.telefone) {
      campos.telefone.value = paciente.telefone;
    }
    if (campos.sexo && paciente.sexo) {
      campos.sexo.value = paciente.sexo;
    }
  }

  /**
   * Limpa campos de formulário do paciente
   * @param {object} campos - Mapeamento de campos: { nome, dataNascimento, email, telefone, sexo, dum }
   */
  function limparCampos(campos) {
    if (!campos) return;
    
    Object.values(campos).forEach(campo => {
      if (campo && campo.value !== undefined) {
        campo.value = '';
      }
    });
  }

  // API Pública
  return {
    validarCpf: validarCpf,
    limparCpf: limparCpf,
    consultarKorus: consultarKorus,
    consultarReceita: consultarReceita,
    normalizarPaciente: normalizarPaciente,
    preencherCampos: preencherCampos,
    limparCampos: limparCampos
  };

})();
