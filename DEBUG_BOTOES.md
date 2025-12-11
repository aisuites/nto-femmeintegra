# 🔍 GUIA DE DEBUG - Botões não funcionando

## 📋 CHECKLIST DE VERIFICAÇÃO

### 1️⃣ Abrir Console do Navegador
- Chrome/Edge: `F12` ou `Cmd+Option+I` (Mac)
- Verificar aba **Console**

### 2️⃣ Verificar se scripts carregaram
No console, digite:
```javascript
console.log('ArquivoManager:', window.ArquivoManager);
console.log('DynamosoftScanner:', window.DynamosoftScanner);
```

**Esperado:**
```
✅ ArquivoManager inicializado
ArquivoManager: {_initialized: true, init: ƒ, verificarArquivoExistente: ƒ, ...}
DynamosoftScanner: {init: ƒ, ...}
```

**Se aparecer `undefined`:**
- Algum script não carregou
- Verificar aba **Network** para ver se há erro 404

### 3️⃣ Verificar erros no Console
Procurar por mensagens em **vermelho**:
- `Uncaught ReferenceError`
- `Uncaught TypeError`
- `SyntaxError`

### 4️⃣ Testar botão Scanner manualmente
No console:
```javascript
const btnScanner = document.getElementById('btn-scanner');
console.log('Botão Scanner:', btnScanner);
console.log('Requisição Atual:', requisicaoAtual);
```

**Esperado:**
```
Botão Scanner: <button id="btn-scanner">...</button>
Requisição Atual: {id: 123, cod_req: "ABC123", ...}
```

### 5️⃣ Verificar se evento está anexado
```javascript
const btnScanner = document.getElementById('btn-scanner');
console.log('Listeners:', getEventListeners(btnScanner));
```

### 6️⃣ Forçar clique programático
```javascript
document.getElementById('btn-scanner').click();
```

Verificar se:
- Aparece erro no console
- Modal abre
- Nada acontece

---

## 🚨 PROBLEMAS COMUNS

### Problema 1: ArquivoManager is not defined
**Causa:** Script `arquivo-manager.js` não carregou
**Solução:** 
1. Verificar se arquivo existe em `/static/js/arquivo-manager.js`
2. Fazer hard refresh: `Cmd+Shift+R` (Mac) ou `Ctrl+Shift+R` (Windows)
3. Verificar aba Network se arquivo retorna 200 OK

### Problema 2: Botão não responde ao clique
**Causa:** Erro de JavaScript quebrou a execução
**Solução:**
1. Verificar console para erros
2. Procurar linha vermelha com número do erro
3. Reportar erro completo

### Problema 3: Modal não abre
**Causa:** Função `abrirModalScanner` não existe
**Solução:**
```javascript
// Testar se função existe
console.log('abrirModalScanner:', typeof abrirModalScanner);
```

### Problema 4: CSRF token error
**Causa:** Token não encontrado
**Solução:**
```javascript
// Verificar token
console.log('CSRF Token:', ArquivoManager.getCsrfToken());
```

---

## 🔧 TESTES RÁPIDOS

### Teste 1: Verificar todos os elementos
```javascript
console.log({
    btnScanner: document.getElementById('btn-scanner'),
    requisicaoAtual: typeof requisicaoAtual !== 'undefined' ? requisicaoAtual : 'NÃO DEFINIDA',
    ArquivoManager: window.ArquivoManager,
    abrirModalScanner: typeof abrirModalScanner !== 'undefined' ? 'EXISTE' : 'NÃO EXISTE'
});
```

### Teste 2: Simular verificação de arquivo
```javascript
if (window.ArquivoManager && requisicaoAtual) {
    ArquivoManager.verificarArquivoExistente(requisicaoAtual.id)
        .then(resultado => console.log('Resultado:', resultado))
        .catch(erro => console.error('Erro:', erro));
}
```

### Teste 3: Verificar modais
```javascript
console.log({
    modalSubstituicao: document.getElementById('modal-confirmar-substituicao'),
    modalExclusao: document.getElementById('modal-confirmar-exclusao')
});
```

---

## 📤 REPORTAR PROBLEMA

Se nenhum dos testes acima resolver, copie e envie:

1. **Mensagens de erro do console** (screenshot ou texto)
2. **Resultado dos testes acima**
3. **Versão do navegador** (Chrome, Firefox, Safari, etc.)

---

## ✅ SOLUÇÃO TEMPORÁRIA

Se precisar usar o scanner urgentemente:

```javascript
// Abrir scanner diretamente (bypass da verificação)
function abrirScanner() {
    if (typeof abrirModalScanner === 'function') {
        abrirModalScanner();
    }
}

// Chamar quando precisar
abrirScanner();
```
