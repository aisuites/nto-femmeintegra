/**
 * FORMATTERS.JS - Utilitários Globais de Formatação
 * 
 * Fornece funções para formatar CPF, telefone, data, etc.
 * Inclua este arquivo no base_app.html para disponibilizar globalmente.
 * 
 * Uso:
 *   const cpfFormatado = FemmeUtils.formatarCPF('12345678901');
 *   const telFormatado = FemmeUtils.formatarTelefone('11999998888');
 */

window.FemmeUtils = window.FemmeUtils || {};

(function(FemmeUtils) {
  'use strict';

  /**
   * Formata CPF para exibição (XXX.XXX.XXX-XX)
   * 
   * @param {string} cpf - CPF apenas números
   * @returns {string} CPF formatado ou original se inválido
   */
  FemmeUtils.formatarCPF = function(cpf) {
    if (!cpf) return '';
    const numeros = cpf.replace(/\D/g, '');
    if (numeros.length !== 11) return cpf;
    return numeros.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
  };

  /**
   * Remove formatação do CPF (retorna apenas números)
   * 
   * @param {string} cpf - CPF com ou sem formatação
   * @returns {string} CPF apenas números
   */
  FemmeUtils.limparCPF = function(cpf) {
    if (!cpf) return '';
    return cpf.replace(/\D/g, '');
  };

  /**
   * Formata telefone para exibição
   * Suporta: (XX) XXXX-XXXX ou (XX) XXXXX-XXXX
   * 
   * @param {string} tel - Telefone apenas números
   * @returns {string} Telefone formatado ou original se inválido
   */
  FemmeUtils.formatarTelefone = function(tel) {
    if (!tel) return '';
    const numeros = tel.replace(/\D/g, '');
    
    if (numeros.length === 11) {
      // Celular: (XX) XXXXX-XXXX
      return numeros.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
    } else if (numeros.length === 10) {
      // Fixo: (XX) XXXX-XXXX
      return numeros.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3');
    }
    
    return tel;
  };

  /**
   * Remove formatação do telefone (retorna apenas números)
   * 
   * @param {string} tel - Telefone com ou sem formatação
   * @returns {string} Telefone apenas números
   */
  FemmeUtils.limparTelefone = function(tel) {
    if (!tel) return '';
    return tel.replace(/\D/g, '');
  };

  /**
   * Formata data ISO para exibição (DD/MM/YYYY)
   * 
   * @param {string} dataISO - Data em formato ISO (YYYY-MM-DD ou YYYY-MM-DDTHH:mm:ss)
   * @returns {string} Data formatada ou original se inválida
   */
  FemmeUtils.formatarData = function(dataISO) {
    if (!dataISO) return '';
    
    try {
      // Se já está no formato DD/MM/YYYY, retorna como está
      if (/^\d{2}\/\d{2}\/\d{4}$/.test(dataISO)) {
        return dataISO;
      }
      
      // Extrai apenas a parte da data (ignora hora)
      const parteData = dataISO.split('T')[0];
      const [ano, mes, dia] = parteData.split('-');
      
      if (ano && mes && dia) {
        return `${dia}/${mes}/${ano}`;
      }
    } catch (e) {
      console.warn('[FemmeUtils] Erro ao formatar data:', e);
    }
    
    return dataISO;
  };

  /**
   * Formata data para input HTML (YYYY-MM-DD)
   * 
   * @param {string} data - Data em qualquer formato
   * @returns {string} Data em formato ISO para input
   */
  FemmeUtils.formatarDataInput = function(data) {
    if (!data) return '';
    
    try {
      // Se já está no formato YYYY-MM-DD, retorna como está
      if (/^\d{4}-\d{2}-\d{2}$/.test(data)) {
        return data;
      }
      
      // Se está no formato DD/MM/YYYY, converte
      if (/^\d{2}\/\d{2}\/\d{4}$/.test(data)) {
        const [dia, mes, ano] = data.split('/');
        return `${ano}-${mes}-${dia}`;
      }
      
      // Tenta parsear como Date
      const dateObj = new Date(data);
      if (!isNaN(dateObj.getTime())) {
        return dateObj.toISOString().split('T')[0];
      }
    } catch (e) {
      console.warn('[FemmeUtils] Erro ao formatar data para input:', e);
    }
    
    return data;
  };

  /**
   * Formata data e hora para exibição (DD/MM/YYYY HH:mm)
   * 
   * @param {string} dataISO - Data em formato ISO
   * @returns {string} Data e hora formatadas
   */
  FemmeUtils.formatarDataHora = function(dataISO) {
    if (!dataISO) return '';
    
    try {
      const dateObj = new Date(dataISO);
      if (isNaN(dateObj.getTime())) return dataISO;
      
      const dia = String(dateObj.getDate()).padStart(2, '0');
      const mes = String(dateObj.getMonth() + 1).padStart(2, '0');
      const ano = dateObj.getFullYear();
      const hora = String(dateObj.getHours()).padStart(2, '0');
      const minuto = String(dateObj.getMinutes()).padStart(2, '0');
      
      return `${dia}/${mes}/${ano} ${hora}:${minuto}`;
    } catch (e) {
      console.warn('[FemmeUtils] Erro ao formatar data/hora:', e);
    }
    
    return dataISO;
  };

  /**
   * Formata valor monetário para exibição (R$ X.XXX,XX)
   * 
   * @param {number|string} valor - Valor numérico
   * @returns {string} Valor formatado em reais
   */
  FemmeUtils.formatarMoeda = function(valor) {
    if (valor === null || valor === undefined || valor === '') return '';
    
    const numero = typeof valor === 'string' ? parseFloat(valor) : valor;
    if (isNaN(numero)) return '';
    
    return numero.toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    });
  };

  /**
   * Capitaliza primeira letra de cada palavra
   * 
   * @param {string} texto - Texto a capitalizar
   * @returns {string} Texto capitalizado
   */
  FemmeUtils.capitalizar = function(texto) {
    if (!texto) return '';
    return texto.toLowerCase().replace(/(?:^|\s)\S/g, function(a) {
      return a.toUpperCase();
    });
  };

})(window.FemmeUtils);
