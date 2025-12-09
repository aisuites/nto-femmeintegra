# 📘 PADRÃO JAVASCRIPT - FEMME INTEGRA
**Versão:** 2.0  
**Data:** 08/12/2025  
**Status:** ✅ **OBRIGATÓRIO** para todos os novos desenvolvimentos

---

## 🎯 OBJETIVO

Estabelecer um padrão consistente e profissional para todo código JavaScript no projeto FEMME Integra, garantindo:
- ✅ Código organizado e manutenível
- ✅ Sem problemas de escopo
- ✅ Fácil de testar
- ✅ Performance otimizada
- ✅ Segurança aprimorada

---

## 📦 PADRÃO MODULE (IIFE)

### **Estrutura Base:**

```javascript
/**
 * ============================================
 * MÓDULO [NOME DO MÓDULO]
 * ============================================
 * 
 * [Descrição do que o módulo faz]
 * 
 * @author FEMME Integra
 * @version 1.0
 * @date [DATA]
 */

// ============================================
// FUNÇÕES UTILITÁRIAS GLOBAIS (se necessário)
// ============================================

function utilidadeGlobal() {
  // Apenas funções que precisam ser globais
}

// ============================================
// MÓDULO PRINCIPAL
// ============================================

const NomeDoModulo = (() => {
  'use strict';
  
  // ============================================
  // VARIÁVEIS PRIVADAS
  // ============================================
  
  let elements = {};
  let state = {};
  
  // ============================================
  // CACHE DE ELEMENTOS DOM
  // ============================================
  
  function cacheElements() {
    elements = {
      // Buscar elementos uma única vez
      btn: document.getElementById('btn'),
      input: document.getElementById('input')
    };
  }
  
  // ============================================
  // VALIDAÇÃO
  // ============================================
  
  const Validator = {
    validarCampo() {
      // Lógica de validação
    }
  };
  
  // ============================================
  // API
  // ============================================
  
  const API = {
    async buscar() {
      // Comunicação com backend
    }
  };
  
  // ============================================
  // UI
  // ============================================
  
  const UI = {
    mostrarModal() {
      // Manipulação de UI
    }
  };
  
  // ============================================
  // EVENT HANDLERS
  // ============================================
  
  const EventHandlers = {
    onBtnClick() {
      // Handler de evento
    }
  };
  
  // ============================================
  // SETUP EVENT LISTENERS
  // ============================================
  
  function setupEventListeners() {
    elements.btn?.addEventListener('click', EventHandlers.onBtnClick);
  }
  
  // ============================================
  // INICIALIZAÇÃO
  // ============================================
  
  function init() {
    console.log('🚀 NomeDoModulo - Inicializando...');
    cacheElements();
    setupEventListeners();
    console.log('✅ NomeDoModulo inicializado!');
  }
  
  // ============================================
  // API PÚBLICA
  // ============================================
  
  return {
    init: init
  };
})();

// ============================================
// INICIALIZAR QUANDO DOM ESTIVER PRONTO
// ============================================

document.addEventListener('DOMContentLoaded', NomeDoModulo.init);
```

---

## 📋 REGRAS OBRIGATÓRIAS

### **1. Organização de Código**

✅ **SEMPRE:**
- Usar padrão Module (IIFE)
- Organizar por responsabilidade
- Cachear elementos DOM
- Usar `'use strict'`
- Adicionar comentários de seção

❌ **NUNCA:**
- Código solto no escopo global
- Buscar elementos DOM repetidamente
- Funções gigantes (>50 linhas)
- Variáveis globais desnecessárias

### **2. Nomenclatura**

```javascript
// ✅ BOM
const RecebimentoModule = (() => {
  const Validator = {};
  const API = {};
  
  function cacheElements() {}
  function setupEventListeners() {}
});

// ❌ RUIM
const modulo = (() => {
  const v = {};
  const a = {};
  
  function cache() {}
  function setup() {}
});
```

**Padrões:**
- Módulos: `PascalCase` + `Module` (ex: `RecebimentoModule`)
- Objetos internos: `PascalCase` (ex: `Validator`, `API`)
- Funções: `camelCase` (ex: `cacheElements`)
- Constantes: `UPPER_SNAKE_CASE` (ex: `MAX_TENTATIVAS`)

### **3. Cache de Elementos DOM**

✅ **SEMPRE cachear:**
```javascript
function cacheElements() {
  elements = {
    btn: document.getElementById('btn'),
    input: document.getElementById('input'),
    form: document.querySelector('form')
  };
}

// Usar cache
function validar() {
  const valor = elements.input.value; // ✅ Usa cache
}
```

❌ **NUNCA buscar repetidamente:**
```javascript
function validar() {
  const valor = document.getElementById('input').value; // ❌ Busca toda vez
}
```

### **4. Separação de Responsabilidades**

```javascript
// ✅ BOM - Separado por responsabilidade
const Validator = {
  validarEmail() {},
  validarCPF() {}
};

const API = {
  async buscar() {},
  async salvar() {}
};

const UI = {
  mostrarModal() {},
  fecharModal() {}
};

// ❌ RUIM - Tudo misturado
function fazerTudo() {
  // validação
  // API
  // UI
  // tudo junto
}
```

### **5. Event Handlers**

✅ **SEMPRE:**
- Criar objeto `EventHandlers`
- Funções nomeadas (não anônimas)
- Setup centralizado

```javascript
const EventHandlers = {
  onBtnClick() {
    // Lógica aqui
  },
  
  onInputChange() {
    // Lógica aqui
  }
};

function setupEventListeners() {
  elements.btn?.addEventListener('click', EventHandlers.onBtnClick);
  elements.input?.addEventListener('change', EventHandlers.onInputChange);
}
```

❌ **EVITAR:**
```javascript
// Funções anônimas espalhadas
document.getElementById('btn').addEventListener('click', function() {
  // Lógica aqui
});

document.getElementById('input').addEventListener('change', () => {
  // Lógica aqui
});
```

### **6. Async/Await**

✅ **SEMPRE usar async/await:**
```javascript
const API = {
  async buscar() {
    try {
      const response = await fetch('/api/endpoint');
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Erro:', error);
      throw error;
    }
  }
};
```

❌ **EVITAR Promises encadeadas:**
```javascript
// ❌ Difícil de ler
fetch('/api/endpoint')
  .then(response => response.json())
  .then(data => {
    // ...
  })
  .catch(error => {
    // ...
  });
```

### **7. Error Handling**

✅ **SEMPRE:**
- Try-catch em operações assíncronas
- Mensagens de erro claras
- Log de erros no console

```javascript
async function salvar() {
  try {
    const data = await API.salvar();
    mostrarToastSucesso('Salvo com sucesso!');
  } catch (error) {
    console.error('Erro ao salvar:', error);
    mostrarAlerta(`Erro: ${error.message}`);
  }
}
```

### **8. Comentários e Documentação**

✅ **SEMPRE:**
- JSDoc para funções públicas
- Comentários de seção
- Explicar "por quê", não "o quê"

```javascript
/**
 * Valida se o email é válido
 * @param {string} email - Email a ser validado
 * @returns {boolean} True se válido
 */
function validarEmail(email) {
  // Regex simples para validação básica
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}
```

### **9. Console Logs**

✅ **USAR para debug:**
```javascript
function init() {
  console.log('🚀 Módulo - Inicializando...');
  // ...
  console.log('✅ Módulo inicializado!');
}

async function buscar() {
  console.log('Buscando dados:', params);
  const data = await API.buscar(params);
  console.log('Dados recebidos:', data);
}
```

⚠️ **REMOVER em produção** (ou usar ferramenta de build)

### **10. Segurança**

✅ **SEMPRE:**
- Sanitizar inputs
- Validar dados antes de enviar
- Usar CSRF token
- Escapar HTML em conteúdo dinâmico

```javascript
// ✅ Escapar HTML
function escaparHTML(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

// ✅ Usar textContent, não innerHTML
element.textContent = dados.mensagem; // ✅ Seguro
element.innerHTML = dados.mensagem;   // ❌ Perigoso (XSS)
```

---

## 📊 CHECKLIST DE QUALIDADE

Antes de fazer commit, verificar:

- [ ] Código usa padrão Module (IIFE)
- [ ] Elementos DOM são cacheados
- [ ] Código organizado por responsabilidade
- [ ] Event handlers em objeto separado
- [ ] Async/await ao invés de Promises
- [ ] Try-catch em operações assíncronas
- [ ] Comentários JSDoc em funções públicas
- [ ] Nomes descritivos e consistentes
- [ ] Sem variáveis globais desnecessárias
- [ ] Console logs para debug
- [ ] Validação de inputs
- [ ] CSRF token em requisições POST
- [ ] Código testado no navegador

---

## 🎯 EXEMPLO COMPLETO

Ver arquivo: `frontend/static/js/recebimento.js`

Este arquivo implementa **TODOS** os padrões definidos neste documento e serve como referência para novos desenvolvimentos.

---

## 📚 REFERÊNCIAS

- **MDN Web Docs:** https://developer.mozilla.org/
- **JavaScript Module Pattern:** https://www.patterns.dev/posts/module-pattern
- **Clean Code JavaScript:** https://github.com/ryanmcdermott/clean-code-javascript

---

## ✅ APROVAÇÃO

Este padrão foi estabelecido em **08/12/2025** e é **OBRIGATÓRIO** para:
- ✅ Todos os novos arquivos JavaScript
- ✅ Refatorações de código existente
- ✅ Code reviews

**Responsável:** Equipe FEMME Integra  
**Status:** ✅ Ativo e Obrigatório
