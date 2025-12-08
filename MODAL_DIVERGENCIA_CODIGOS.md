# 📋 MODAL DE DIVERGÊNCIA DE CÓDIGOS - ANÁLISE E REIMPLEMENTAÇÃO
**Data:** 08/12/2025  
**Status:** 🔴 PERDIDO NA REFATORAÇÃO - PRECISA SER REIMPLEMENTADO

---

## 🎯 OBJETIVO

Quando o usuário bipa códigos de barras **diferentes** entre requisição e amostras, o sistema deve:
1. ❌ **NÃO bloquear** imediatamente
2. ✅ **Mostrar modal visual** com as divergências
3. ✅ **Dar 3 opções** ao usuário

---

## 📊 FLUXO COMPLETO

### **Cenário:**
- Usuário bipa requisição: `2`
- Usuário bipa amostra: `3` (diferente!)

### **Comportamento Antigo (CORRETO):**

```
1. Usuário clica em "Validar"
2. Sistema detecta divergência
3. Modal SE TRANSFORMA em modo divergência:
   - Título muda para: "⚠️ Divergência de Códigos Detectada"
   - Mostra lista visual dos códigos:
     📦 Requisição: 2
     ✅ Amostra 1: 2 (verde se igual)
     ❌ Amostra 2: 3 (vermelho se diferente)
   - Esconde campos de input
   - Mostra 3 botões:
     [Cancelar] [🔄 Bipar Novamente] [⚠️ Registrar Problema]
```

### **Comportamento Atual (ERRADO):**

```
1. Usuário clica em "Validar"
2. Sistema mostra alerta simples
3. Modal fecha
4. Usuário perde contexto
```

---

## 🔍 CÓDIGO ANTIGO - ANÁLISE DETALHADA

### **1. Função: `verificarDivergenciaCodigos()`**

```javascript
// Linha 610-614
function verificarDivergenciaCodigos(codBarrasReq, codigosAmostras) {
  const todosCodig = [codBarrasReq, ...codigosAmostras];
  const codigosUnicos = new Set(todosCodig);
  return codigosUnicos.size > 1; // true = há divergência
}
```

**Lógica:**
- Junta todos os códigos (requisição + amostras)
- Usa `Set` para eliminar duplicatas
- Se `Set.size > 1` = códigos diferentes

---

### **2. Função: `mostrarModalDivergencia()`**

```javascript
// Linha 617-695
function mostrarModalDivergencia(codBarrasReq, codigosAmostras) {
  // 1. ATUALIZAR VISUAL DO MODAL
  const modalBadge = document.querySelector('.modal-badge-icon');
  const modalTitle = document.querySelector('.modal-title-text h2');
  const modalMainText = document.querySelector('.modal-main-text');
  
  if (modalBadge) modalBadge.textContent = '⚠️';
  if (modalTitle) modalTitle.textContent = 'Divergência de Códigos Detectada';
  if (modalMainText) {
    modalMainText.innerHTML = `
      <strong style="color: var(--femme-red);">
        ATENÇÃO: Os códigos de barras não são iguais!
      </strong><br/>
      Verifique se todos os códigos foram bipados corretamente.
    `;
  }
  
  // 2. CRIAR LISTA VISUAL DE CÓDIGOS
  const listaDiv = document.createElement('div');
  listaDiv.style.marginTop = '16px';
  listaDiv.style.padding = '12px';
  listaDiv.style.background = 'var(--femme-light-gray)';
  listaDiv.style.borderRadius = '4px';
  listaDiv.style.fontSize = '13px';
  
  let html = '<div style="margin-bottom: 8px;"><strong>Códigos bipados:</strong></div>';
  html += `<div style="margin-left: 12px;">
    📦 Requisição: 
    <code style="background: white; padding: 2px 6px; border-radius: 3px;">
      ${codBarrasReq}
    </code>
  </div>`;
  
  codigosAmostras.forEach((cod, idx) => {
    const isDiferente = cod !== codBarrasReq;
    const cor = isDiferente ? 'var(--femme-red)' : 'var(--femme-green)';
    const icone = isDiferente ? '❌' : '✅';
    html += `<div style="margin-left: 12px; color: ${cor}; margin-top: 4px;">
      ${icone} Amostra ${idx + 1}: 
      <code style="background: white; padding: 2px 6px; border-radius: 3px;">
        ${cod}
      </code>
    </div>`;
  });
  
  listaDiv.innerHTML = html;
  modalMainText.appendChild(listaDiv);
  
  // 3. ESCONDER CAMPOS DE INPUT
  const modalMeta = modalBody?.querySelector('.modal-meta');
  const modalField = modalBody?.querySelector('.field');
  if (modalMeta) modalMeta.style.display = 'none';
  if (modalField) modalField.style.display = 'none';
  
  // 4. ATUALIZAR BOTÕES DO FOOTER
  const modalFooter = document.querySelector('.modal-footer');
  if (modalFooter) {
    modalFooter.innerHTML = `
      <button class="btn btn-ghost" type="button" id="modal_btn_cancelar_div">
        Cancelar
      </button>
      <button class="btn btn-outline" type="button" id="modal_btn_bipar_novamente">
        🔄 Bipar Novamente
      </button>
      <button class="btn btn-warning" type="button" id="modal_btn_registrar_problema">
        ⚠️ Registrar Problema
      </button>
    `;
    
    // 5. EVENT LISTENERS DOS BOTÕES
    
    // Botão 1: Cancelar
    document.getElementById('modal_btn_cancelar_div')?.addEventListener('click', () => {
      fecharModal();
      restaurarModalOriginal();
    });
    
    // Botão 2: Bipar Novamente
    document.getElementById('modal_btn_bipar_novamente')?.addEventListener('click', () => {
      // Limpar todos os campos
      const inputs = modalSamplesList?.querySelectorAll('input[type="text"]') || [];
      inputs.forEach(input => input.value = '');
      
      // Focar no primeiro campo
      if (inputs.length > 0) inputs[0].focus();
      
      // Restaurar modal
      restaurarModalOriginal();
    });
    
    // Botão 3: Registrar Problema
    document.getElementById('modal_btn_registrar_problema')?.addEventListener('click', () => {
      // TODO: Implementar fluxo de registro de problema
      alert('Funcionalidade "Registrar Problema" será implementada em breve.');
      fecharModal();
      restaurarModalOriginal();
    });
  }
}
```

---

### **3. Função: `restaurarModalOriginal()`**

```javascript
// Linha 698-727
function restaurarModalOriginal() {
  const modalBadge = document.querySelector('.modal-badge-icon');
  const modalTitle = document.querySelector('.modal-title-text h2');
  const modalMainText = document.querySelector('.modal-main-text');
  const modalFooter = document.querySelector('.modal-footer');
  const modalBody = document.querySelector('.modal-body');
  
  // Restaurar ícone e título
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
  
  // Restaurar botões originais
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
```

---

## 📋 ELEMENTOS HTML DO MODAL

### **Estrutura do Modal:**

```html
<div class="modal-overlay" id="modal_bipagem">
  <div class="modal">
    <div class="modal-header">
      <div class="modal-title">
        <div class="modal-badge-icon">⚠</div>  <!-- Muda para ⚠️ -->
        <div class="modal-title-text">
          <h2>Bipagem das amostras do kit</h2>  <!-- Muda para "Divergência..." -->
        </div>
      </div>
      <button class="modal-close-icon" id="modal_close">×</button>
    </div>
    
    <div class="modal-body">
      <div class="modal-main-text">
        <!-- Texto muda dinamicamente -->
      </div>
      
      <div class="modal-meta">
        <!-- Escondido em modo divergência -->
      </div>
      
      <div class="field">
        <div id="modal_samples_list">
          <!-- Inputs de amostras -->
        </div>
      </div>
    </div>
    
    <div class="modal-footer">
      <!-- Botões mudam dinamicamente -->
    </div>
  </div>
</div>
```

---

## 🎯 PLANO DE REIMPLEMENTAÇÃO

### **Fase 1: Adicionar ao Objeto Modal**

```javascript
const Modal = {
  // ... métodos existentes ...
  
  /**
   * Mostra modal de divergência de códigos
   */
  mostrarDivergenciasCodigos(codBarrasReq, codBarrasAmostras) {
    // Implementação completa
  },
  
  /**
   * Restaura modal ao estado original
   */
  restaurarModalOriginal() {
    // Implementação completa
  }
};
```

### **Fase 2: Integrar no EventHandler**

```javascript
const EventHandlers = {
  async onValidarClick() {
    // ... código existente ...
    
    // Validar se todos os códigos são iguais
    if (!Validator.validarCodigosIguais(codBarrasReq, codBarrasAmostras)) {
      Modal.mostrarDivergenciasCodigos(codBarrasReq, codBarrasAmostras);
      return; // NÃO continua validação
    }
    
    // ... resto do código ...
  }
};
```

### **Fase 3: Testar Cenários**

1. ✅ Códigos iguais → Validação normal
2. ✅ Códigos diferentes → Modal de divergência
3. ✅ Botão "Cancelar" → Fecha modal e restaura
4. ✅ Botão "Bipar Novamente" → Limpa campos e restaura
5. ✅ Botão "Registrar Problema" → TODO (alert por enquanto)

---

## ✅ CHECKLIST DE IMPLEMENTAÇÃO

- [ ] Adicionar `Modal.mostrarDivergenciasCodigos()`
- [ ] Adicionar `Modal.restaurarModalOriginal()`
- [ ] Integrar no `EventHandlers.onValidarClick()`
- [ ] Testar com códigos iguais
- [ ] Testar com códigos diferentes
- [ ] Testar botão "Cancelar"
- [ ] Testar botão "Bipar Novamente"
- [ ] Testar botão "Registrar Problema"
- [ ] Verificar que não quebrou nada existente
- [ ] Documentar no PADRAO_JAVASCRIPT.md

---

## 🎨 VISUAL ESPERADO

### **Modal Normal:**
```
⚠ Bipagem das amostras do kit
PARA DAR ANDAMENTO BIPE O(S) CÓDIGO(S) DE BARRA(S) DA(S) AMOSTRA(S).

[Input Amostra 1]
[Input Amostra 2]

[Cancelar] [Validar]
```

### **Modal Divergência:**
```
⚠️ Divergência de Códigos Detectada
ATENÇÃO: Os códigos de barras não são iguais!
Verifique se todos os códigos foram bipados corretamente.

┌─────────────────────────────────┐
│ Códigos bipados:                │
│   📦 Requisição: 2              │
│   ✅ Amostra 1: 2               │
│   ❌ Amostra 2: 3               │
└─────────────────────────────────┘

[Cancelar] [🔄 Bipar Novamente] [⚠️ Registrar Problema]
```

---

## 📝 NOTAS IMPORTANTES

1. **Modal se transforma** - não é um modal novo, é o mesmo modal que muda de estado
2. **Campos ficam escondidos** - `display: none` nos inputs durante divergência
3. **Botões são recriados** - `innerHTML` substitui os botões
4. **Event listeners precisam ser re-anexados** após restaurar
5. **Cores visuais** - Verde (✅) para igual, Vermelho (❌) para diferente

---

**Status:** 📋 Documentado - Pronto para implementação  
**Próximo Passo:** Implementar seguindo o padrão Module estabelecido
