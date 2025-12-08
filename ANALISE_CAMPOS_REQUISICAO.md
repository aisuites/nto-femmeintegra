# 🔍 ANÁLISE COMPLETA: CAMPOS E RELACIONAMENTOS
**Data:** 08/12/2025  
**Objetivo:** Garantir que TODOS os campos sejam enviados corretamente

---

## 📊 MODELO: DadosRequisicao

### **Campos ForeignKey (DEVEM SER IDs NUMÉRICOS):**

| Campo | Tipo | Obrigatório | Valor Esperado | Observação |
|-------|------|-------------|----------------|------------|
| `unidade` | ForeignKey(Unidade) | ✅ SIM | **INTEGER** (ID) | ⚠️ NUNCA texto |
| `status` | ForeignKey(StatusRequisicao) | ✅ SIM | **INTEGER** (ID) | Definido pelo backend |
| `recebido_por` | ForeignKey(User) | ❌ NÃO | **INTEGER** (ID) | Definido pelo backend |
| `portador_representante` | ForeignKey(PortadorRepresentante) | ❌ NÃO | **INTEGER** (ID) | ⚠️ NUNCA texto |
| `origem` | ForeignKey(Origem) | ❌ NÃO | **INTEGER** (ID) ou NULL | ⚠️ NUNCA texto |

---

## 🎯 PAYLOAD ESPERADO PELO BACKEND

### **Service: `criar_requisicao()`**

```python
def criar_requisicao(
    cls,
    cod_barras_req: str,              # ✅ STRING
    cod_barras_amostras: List[str],   # ✅ LISTA DE STRINGS
    unidade_id: int,                  # ⚠️ INTEGER (não string!)
    portador_representante_id: int,   # ⚠️ INTEGER (não string!)
    origem_id: Optional[int],         # ⚠️ INTEGER ou NULL (não string!)
    user,                             # ✅ Objeto User (backend)
) -> Dict[str, any]:
```

### **Payload JSON Correto:**

```json
{
  "cod_barras_req": "1",                    // ✅ STRING
  "cod_barras_amostras": ["1"],             // ✅ ARRAY DE STRINGS
  "unidade_id": 3,                          // ✅ INTEGER
  "portador_representante_id": 2,           // ✅ INTEGER
  "origem_id": 2,                           // ✅ INTEGER ou null
  "requisicao_id": null,                    // ✅ NULL ou INTEGER
  "is_transit": false                       // ✅ BOOLEAN
}
```

### **❌ Payload ERRADO (causava erro 500):**

```json
{
  "cod_barras_req": "1",
  "cod_barras_amostras": ["1"],
  "unidade_id": 3,                          // ✅ OK
  "portador_representante_id": 2,           // ✅ OK
  "origem_id": "FEMME",                     // ❌ ERRO! String ao invés de INTEGER
  "requisicao_id": null,
  "is_transit": false
}
```

**Erro gerado:**
```
ValueError: Field 'id' expected a number but got 'FEMME'.
```

---

## 🔍 ANÁLISE DO FRONTEND

### **HTML: Como os dados são armazenados**

#### **1. Unidade (Radio Buttons):**
```html
<input
  type="radio"
  name="unidade_origem"
  value="{{ unidade.id }}"                    <!-- ✅ ID NUMÉRICO -->
  data-unidade-nome="{{ unidade.nome }}"      <!-- Texto para exibição -->
  data-unidade-codigo="{{ unidade.codigo }}"  <!-- Código para exibição -->
/>
```

**✅ CORRETO:** `value` contém o ID numérico

#### **2. Portador/Representante (Select):**
```html
<option
  value="{{ portador.id }}"                   <!-- ✅ ID NUMÉRICO -->
  data-unidade-id="{{ portador.unidade_id }}" <!-- ID da unidade -->
  data-origem="{{ portador.origem.descricao }}" <!-- ❌ TEXTO (não usar!) -->
  data-origem-id="{{ portador.origem_id }}"   <!-- ✅ ID NUMÉRICO (usar!) -->
  data-tipo="{{ portador.get_tipo_display }}"
>
  {{ portador.nome }}
</option>
```

**✅ CORRETO:** `value` contém o ID do portador  
**✅ CORRETO:** `data-origem-id` contém o ID da origem  
**❌ ERRADO:** `data-origem` contém o TEXTO (não usar para payload!)

#### **3. Origem (Input Readonly):**
```html
<input type="text" id="campo_origem" readonly
       placeholder="Será preenchido automaticamente" />
```

**⚠️ ATENÇÃO:** Este campo é APENAS para exibição!  
**❌ NUNCA** usar `elements.origemInput.value` para o payload!

---

## 🐛 ERRO IDENTIFICADO

### **Código ERRADO (causava erro 500):**

```javascript
// ❌ ERRADO - Pegava o TEXTO da origem
elements.modalValidar.dataset.origemId = elements.origemInput?.value || '';
// Resultado: origemId = "FEMME" (string)
```

### **Código CORRETO:**

```javascript
// ✅ CORRETO - Pega o ID numérico do dataset do portador
const portadorOption = elements.portadorSelect?.options[elements.portadorSelect.selectedIndex];
const origemId = portadorOption?.dataset?.origemId || '';
elements.modalValidar.dataset.origemId = origemId;
// Resultado: origemId = "2" (string que será convertida para int)
```

---

## ✅ CHECKLIST DE VALIDAÇÃO

### **Antes de enviar payload para o backend:**

- [ ] `unidade_id` é um **número** (não texto)
- [ ] `portador_representante_id` é um **número** (não texto)
- [ ] `origem_id` é um **número** ou **null** (não texto)
- [ ] `cod_barras_req` é uma **string**
- [ ] `cod_barras_amostras` é um **array de strings**
- [ ] `is_transit` é um **boolean**
- [ ] `requisicao_id` é um **número** ou **null**

### **Como verificar no console:**

```javascript
console.log('Payload sendo enviado:', payload);
console.log('Tipos:', {
  unidade_id: typeof payload.unidade_id,              // deve ser "string" (será convertido)
  portador_representante_id: typeof payload.portador_representante_id,
  origem_id: typeof payload.origem_id,
  is_transit: typeof payload.is_transit              // deve ser "boolean"
});
```

---

## 📋 REGRAS PARA NOVOS DESENVOLVIMENTOS

### **1. NUNCA usar `.value` de inputs readonly para IDs**

```javascript
// ❌ ERRADO
const origemId = document.getElementById('campo_origem').value;

// ✅ CORRETO
const portadorOption = portadorSelect.options[portadorSelect.selectedIndex];
const origemId = portadorOption.dataset.origemId;
```

### **2. SEMPRE usar `data-*` attributes para IDs**

```html
<!-- ✅ CORRETO -->
<option value="2" data-origem-id="5" data-origem-nome="FEMME">
  Maria
</option>
```

```javascript
// ✅ CORRETO
const origemId = option.dataset.origemId;      // "5" (ID)
const origemNome = option.dataset.origemNome;  // "FEMME" (nome)
```

### **3. SEMPRE validar tipos antes de enviar**

```javascript
// ✅ CORRETO
const payload = {
  unidade_id: parseInt(unidadeId) || null,
  portador_representante_id: parseInt(portadorId) || null,
  origem_id: origemId ? parseInt(origemId) : null
};

// Validar
if (isNaN(payload.unidade_id)) {
  console.error('unidade_id inválido:', payload.unidade_id);
  return;
}
```

### **4. SEMPRE adicionar logs de debug**

```javascript
// ✅ CORRETO
console.log('Payload sendo enviado:', payload);
console.log('Tipos:', {
  unidade_id: typeof payload.unidade_id,
  portador_representante_id: typeof payload.portador_representante_id,
  origem_id: typeof payload.origem_id
});
```

---

## 🎯 MAPEAMENTO COMPLETO

### **Frontend → Backend:**

| Frontend | Origem | Backend | Tipo Esperado |
|----------|--------|---------|---------------|
| `unidade_id` | `radio.value` | `unidade_id` | INTEGER |
| `portador_representante_id` | `select.value` | `portador_representante_id` | INTEGER |
| `origem_id` | `option.dataset.origemId` | `origem_id` | INTEGER ou NULL |
| `cod_barras_req` | `input.value` | `cod_barras_req` | STRING |
| `cod_barras_amostras` | `Array de input.value` | `cod_barras_amostras` | LIST[STRING] |

---

## ✅ CONCLUSÃO

### **Erro Primário Identificado:**

1. ❌ Usar `.value` de input readonly que contém **TEXTO**
2. ❌ Enviar string "FEMME" onde backend espera **INTEGER**
3. ❌ Não validar tipos antes de enviar

### **Solução Implementada:**

1. ✅ Usar `dataset.origemId` que contém o **ID numérico**
2. ✅ Adicionar logs para debug
3. ✅ Documentar regras para evitar erros futuros

### **Lição Aprendida:**

> **NUNCA** assumir que um campo de texto contém um ID.  
> **SEMPRE** usar `data-*` attributes para armazenar IDs.  
> **SEMPRE** validar tipos antes de enviar para o backend.

---

**Status:** ✅ Corrigido e Documentado  
**Data:** 08/12/2025  
**Responsável:** Equipe FEMME Integra
