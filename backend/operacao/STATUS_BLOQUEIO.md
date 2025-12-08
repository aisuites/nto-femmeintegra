# 🚫 Status de Bloqueio de Recebimento

## 📋 O que é?

A constante `STATUS_BLOQUEIO_RECEBIMENTO` define quais status impedem que uma requisição seja recebida novamente. Quando um código de barras é bipado e a requisição já possui um desses status, o sistema exibe a mensagem:

> **"Ops! Essa requisição já foi recebida ou já está em processamento. Entre em contato com sua supervisora."**

---

## 📍 Localização

**Arquivo**: `backend/operacao/services.py`  
**Linhas**: 29-35

```python
STATUS_BLOQUEIO_RECEBIMENTO = [
    '2',   # RECEBIDO - Requisição já foi recebida e finalizada
    # '3',   # CAIXA LIDERANÇA - Descomentar quando implementado
    # '4',   # CAIXA BO - Descomentar quando implementado
    # '7',   # TRIAGEM1-OK - Descomentar quando implementado
    # '8',   # TRIAGEM2-OK - Descomentar quando implementado
]
```

---

## ✏️ Como Adicionar Novos Status

### Passo 1: Identificar o Código do Status

Consulte a tabela `operacao_status_requisicao` ou use o admin Django:

| Código | Descrição |
|--------|-----------|
| 1 | ABERTO NTO |
| 2 | RECEBIDO ✅ **(já bloqueado)** |
| 3 | CAIXA LIDERANÇA |
| 4 | CAIXA BO |
| 5 | CAIXA BARRADOS |
| 6 | PENDÊNCIA |
| 7 | TRIAGEM1-OK |
| 8 | TRIAGEM2-OK |
| 10 | EM TRÂNSITO |

### Passo 2: Descomentar ou Adicionar na Lista

**Exemplo**: Para bloquear requisições com status "CAIXA LIDERANÇA" (código 3):

```python
STATUS_BLOQUEIO_RECEBIMENTO = [
    '2',   # RECEBIDO
    '3',   # CAIXA LIDERANÇA ← Descomentado
    # '4',   # CAIXA BO
    # '7',   # TRIAGEM1-OK
    # '8',   # TRIAGEM2-OK
]
```

### Passo 3: Testar

1. Crie uma requisição de teste com o novo status
2. Tente bipar o código de barras
3. Verifique se a mensagem de bloqueio aparece

---

## 🔍 Onde a Constante é Usada

### 1. **Criação de Requisição** (`RequisicaoService.criar_requisicao`)
- **Linha**: ~157
- **Função**: Impede criar nova requisição se código já existe com status bloqueado

```python
requisicao_bloqueada = DadosRequisicao.objects.filter(
    cod_barras_req=cod_barras_req,
    status__codigo__in=STATUS_BLOQUEIO_RECEBIMENTO
).exists()
```

### 2. **Busca de Código** (`BuscaService.buscar_codigo_barras`)
- **Linha**: ~462
- **Função**: Retorna `status: 'found'` se código tem status bloqueado

```python
requisicao_bloqueada = DadosRequisicao.objects.filter(
    cod_barras_req=cod_barras,
    status__codigo__in=STATUS_BLOQUEIO_RECEBIMENTO
).exists()
```

---

## 📊 Fluxo de Validação

```
┌─────────────────────────┐
│ Usuário bipa código     │
└───────────┬─────────────┘
            │
            ▼
┌─────────────────────────┐
│ BuscaService verifica   │
│ se código existe        │
└───────────┬─────────────┘
            │
            ▼
┌─────────────────────────┐
│ Status está na lista    │
│ STATUS_BLOQUEIO?        │
└───────────┬─────────────┘
            │
    ┌───────┴───────┐
    │ SIM           │ NÃO
    ▼               ▼
┌─────────┐   ┌─────────────┐
│ Bloqueia│   │ Continua    │
│ Mensagem│   │ fluxo normal│
└─────────┘   └─────────────┘
```

---

## ⚠️ Importante

1. **Sempre use o código do status como string** (`'2'`, não `2`)
2. **Adicione comentários** explicando cada status
3. **Teste após modificar** a lista
4. **Não remova o status '2' (RECEBIDO)** - é crítico para evitar duplicidade

---

## 🔄 Histórico de Mudanças

| Data | Status Adicionado | Motivo |
|------|-------------------|--------|
| 08/12/2024 | '2' (RECEBIDO) | Implementação inicial - evitar duplicidade |
| - | - | - |

---

## 📝 Exemplo de Uso Futuro

Quando implementar a funcionalidade de triagem e quiser bloquear requisições que já passaram pela triagem:

```python
STATUS_BLOQUEIO_RECEBIMENTO = [
    '2',   # RECEBIDO
    '7',   # TRIAGEM1-OK ← Novo bloqueio
    '8',   # TRIAGEM2-OK ← Novo bloqueio
]
```

**Resultado**: Requisições com status 7 ou 8 não poderão ser recebidas novamente.

---

## 🆘 Suporte

Se precisar adicionar um novo status ou modificar a mensagem de erro:

1. **Status**: Edite `STATUS_BLOQUEIO_RECEBIMENTO` em `services.py`
2. **Mensagem**: Edite a mensagem nas linhas 163 e 729 de `services.py` e `recebimento.js`

**Mensagem atual**:
```
"Ops! Essa requisição já foi recebida ou já está em processamento. Entre em contato com sua supervisora."
```
