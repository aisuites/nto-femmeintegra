# 📋 PLANO DE IMPLEMENTAÇÃO - ETAPA 1 DE TRIAGEM

## 🎯 OBJETIVO
Implementar o fluxo completo de validação de amostras na Etapa 1 de Triagem, permitindo que o usuário preencha dados de cada amostra, valide e prossiga para próxima amostra ou próxima etapa.

---

## 📊 ANÁLISE DA ESTRUTURA ATUAL

### ✅ MODEL `RequisicaoAmostra` - JÁ EXISTE
Campos já implementados:
- ✅ `requisicao` - FK para DadosRequisicao
- ✅ `cod_barras_amostra` - Código de barras
- ✅ `data_hora_bipagem` - Data/hora da bipagem
- ✅ `ordem` - Ordem da amostra (1, 2, 3...)
- ✅ `tipos_amostra_id` - ID do tipo de amostra
- ✅ `data_coleta` - Data da coleta
- ✅ `data_validade` - Data de validade
- ✅ `flag_data_coleta_rasurada` - Data rasurada
- ✅ `flag_sem_data_validade` - Sem data de validade
- ✅ `flag_amostra_sem_identificacao` - Sem identificação
- ✅ `flag_armazenamento_inadequado` - Armazenamento inadequado
- ✅ `flag_frasco_trocado_tipo_coleta` - Frasco trocado
- ✅ `flag_material_nao_analisado` - Material não analisado
- ✅ `motivo_inadequado_id` - ID do motivo inadequado
- ✅ `status` - Status da amostra (null/blank permitido)
- ✅ `descricao` - Observações

### ⚠️ CAMPOS NECESSÁRIOS - ANÁLISE

**Campo `status` atual:**
- Tipo: `IntegerField(null=True, blank=True)`
- Uso proposto: Flag para saber se amostra foi validada
- **PROBLEMA**: Tipo genérico, sem choices definidos

**Solução proposta:**
- Manter campo `status` como IntegerField
- Definir convenção: `0 ou NULL = Não validada`, `1 = Validada`
- OU criar campo específico `validada` (BooleanField)

**Campo `motivo_inadequado_id` atual:**
- Tipo: `IntegerField(null=True, blank=True)`
- **PROBLEMA**: Não há tabela de motivos de armazenamento inadequado
- **SOLUÇÃO**: Criar model `MotivoArmazenamentoInadequado`

---

## 🗄️ BANCO DE DADOS - MUDANÇAS NECESSÁRIAS

### 1. Criar Model `MotivoArmazenamentoInadequado`

```python
class MotivoArmazenamentoInadequado(TimeStampedModel):
    """
    Motivos de armazenamento inadequado de amostras.
    """
    descricao = models.CharField(max_length=200)
    ativo = models.BooleanField(default=True)
    
    class Meta:
        ordering = ('descricao',)
        verbose_name = 'Motivo de Armazenamento Inadequado'
        verbose_name_plural = 'Motivos de Armazenamento Inadequado'
    
    def __str__(self):
        return self.descricao
```

**Dados iniciais sugeridos:**
- Temperatura inadequada
- Frasco danificado
- Amostra derramada/vazamento
- Prazo de validade vencido
- Contaminação visível
- Outros

### 2. Alterar `RequisicaoAmostra.motivo_inadequado_id`

**Opção A (Recomendada):** Converter para ForeignKey
```python
motivo_inadequado = models.ForeignKey(
    'MotivoArmazenamentoInadequado',
    on_delete=models.SET_NULL,
    null=True,
    blank=True,
    related_name='amostras',
    verbose_name='Motivo de armazenamento inadequado',
)
```

**Opção B:** Manter IntegerField (menos seguro, sem integridade referencial)

### 3. Padronizar campo `status`

**Opção A (Recomendada):** Adicionar campo específico
```python
triagem_validada = models.BooleanField(
    'Triagem validada',
    default=False,
    help_text='Indica se a amostra já foi validada na triagem',
    db_index=True,
)
```

**Opção B:** Usar campo `status` existente com convenção
- 0 ou NULL = Não validada
- 1 = Validada na triagem

### 4. Criar Model `TipoAmostra` (se não existir)

```python
class TipoAmostra(TimeStampedModel):
    """
    Tipos de amostras (sangue, urina, fezes, etc).
    """
    codigo = models.CharField(max_length=20, unique=True)
    descricao = models.CharField(max_length=100)
    ativo = models.BooleanField(default=True)
    
    class Meta:
        ordering = ('descricao',)
        verbose_name = 'Tipo de Amostra'
        verbose_name_plural = 'Tipos de Amostras'
    
    def __str__(self):
        return self.descricao
```

---

## 🔧 BACKEND - IMPLEMENTAÇÃO

### 1. Views Necessárias

#### A. `ListarAmostrasRequisicaoView`
```
GET /operacao/triagem/amostras/?requisicao_id=123

Response:
{
  "status": "success",
  "amostras": [
    {
      "id": 1,
      "ordem": 1,
      "cod_barras_amostra": "AMO123",
      "tipos_amostra_id": 5,
      "tipo_amostra_descricao": "Sangue",
      "data_coleta": "2024-12-10",
      "data_validade": "2024-12-15",
      "triagem_validada": false,
      "flags": {
        "data_coleta_rasurada": false,
        "sem_data_validade": false,
        "amostra_sem_identificacao": false,
        "armazenamento_inadequado": false,
        "frasco_trocado": false,
        "material_nao_analisado": false
      }
    }
  ],
  "total": 3,
  "validadas": 0,
  "pendentes": 3
}
```

#### B. `SalvarAmostraTriagemView`
```
POST /operacao/triagem/salvar-amostra/

Body:
{
  "amostra_id": 1,
  "tipos_amostra_id": 5,
  "data_coleta": "2024-12-10",
  "data_validade": "2024-12-15",
  "flag_data_coleta_rasurada": false,
  "flag_sem_data_validade": false,
  "flag_amostra_sem_identificacao": false,
  "flag_armazenamento_inadequado": true,
  "motivo_inadequado_id": 2,
  "flag_frasco_trocado": false,
  "flag_material_nao_analisado": false,
  "descricao": "Observações..."
}

Response:
{
  "status": "success",
  "message": "Amostra validada com sucesso!",
  "amostra": {...},
  "proxima_amostra": {
    "existe": true,
    "id": 2,
    "ordem": 2
  }
}
```

#### C. `ListarTiposAmostraView`
```
GET /operacao/triagem/tipos-amostra/

Response:
{
  "status": "success",
  "tipos": [
    {"id": 1, "codigo": "SANG", "descricao": "Sangue"},
    {"id": 2, "codigo": "URIN", "descricao": "Urina"},
    ...
  ]
}
```

#### D. `ListarMotivosInadequadosView`
```
GET /operacao/triagem/motivos-inadequados/

Response:
{
  "status": "success",
  "motivos": [
    {"id": 1, "descricao": "Temperatura inadequada"},
    {"id": 2, "descricao": "Frasco danificado"},
    ...
  ]
}
```

### 2. Validações Backend

**Regras de negócio:**
1. ✅ Amostra deve pertencer à requisição informada
2. ✅ Tipo de amostra é obrigatório
3. ✅ Data de coleta é obrigatória (exceto se flag_sem_data_validade=True)
4. ✅ Se flag_armazenamento_inadequado=True → motivo_inadequado_id é obrigatório
5. ✅ Data de validade deve ser >= data de coleta
6. ✅ Não permitir validar amostra já validada (evitar duplicação)
7. ✅ Registrar usuário que validou (campo updated_by do AuditModel)

### 3. Serialização

```python
class AmostraTriagemSerializer:
    def serialize(amostra):
        return {
            'id': amostra.id,
            'ordem': amostra.ordem,
            'cod_barras_amostra': amostra.cod_barras_amostra,
            'tipos_amostra_id': amostra.tipos_amostra_id,
            'tipo_amostra_descricao': get_tipo_descricao(amostra.tipos_amostra_id),
            'data_coleta': amostra.data_coleta.isoformat() if amostra.data_coleta else None,
            'data_validade': amostra.data_validade.isoformat() if amostra.data_validade else None,
            'triagem_validada': amostra.triagem_validada or amostra.status == 1,
            'flags': {
                'data_coleta_rasurada': amostra.flag_data_coleta_rasurada,
                'sem_data_validade': amostra.flag_sem_data_validade,
                'amostra_sem_identificacao': amostra.flag_amostra_sem_identificacao,
                'armazenamento_inadequado': amostra.flag_armazenamento_inadequado,
                'frasco_trocado': amostra.flag_frasco_trocado_tipo_coleta,
                'material_nao_analisado': amostra.flag_material_nao_analisado,
            },
            'motivo_inadequado_id': amostra.motivo_inadequado_id,
            'descricao': amostra.descricao,
        }
```

---

## 🎨 FRONTEND - IMPLEMENTAÇÃO

### 1. Estrutura do Formulário (HTML já existe)

Campos do formulário (id's existentes):
- ✅ `select-amostra` - Select com lista de amostras
- ✅ `input-data-coleta` - Data de coleta
- ✅ `input-data-validade` - Data de validade
- ✅ `checkbox-data-rasurada` - Flag data rasurada
- ✅ `checkbox-sem-validade` - Flag sem validade
- ✅ `checkbox-sem-identificacao` - Flag sem identificação
- ✅ `checkbox-armazenamento-inadequado` - Flag armazenamento inadequado
- ✅ `select-motivo-inadequado` - Select de motivos (precisa popular)
- ✅ `checkbox-frasco-trocado` - Flag frasco trocado
- ✅ `checkbox-material-nao-analisado` - Flag material não analisado

### 2. Fluxo JavaScript

```javascript
// 1. Ao localizar requisição
async function carregarAmostras(requisicaoId) {
  const response = await fetch(`/operacao/triagem/amostras/?requisicao_id=${requisicaoId}`);
  const data = await response.json();
  
  // Popular select-amostra apenas com amostras NÃO validadas
  popularSelectAmostras(data.amostras.filter(a => !a.triagem_validada));
  
  // Verificar se há amostras pendentes
  if (data.pendentes === 0) {
    // Todas validadas, prosseguir para próxima etapa
    mostrarMensagem('Todas as amostras foram validadas!');
  }
}

// 2. Ao selecionar amostra no select
function aoSelecionarAmostra(amostraId) {
  const amostra = amostrasCache.find(a => a.id === amostraId);
  
  // Preencher campos com dados existentes (se houver)
  preencherFormularioAmostra(amostra);
}

// 3. Ao clicar em "Seguir"
async function salvarAmostra() {
  // Validar campos obrigatórios
  if (!validarFormulario()) return;
  
  // Coletar dados do formulário
  const dados = coletarDadosFormulario();
  
  // Enviar para backend
  const response = await fetch('/operacao/triagem/salvar-amostra/', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-CSRFToken': getCsrfToken()
    },
    body: JSON.stringify(dados)
  });
  
  const result = await response.json();
  
  if (result.status === 'success') {
    if (result.proxima_amostra.existe) {
      // Há mais amostras pendentes
      mostrarMensagemSucesso('Amostra validada com sucesso!');
      
      // Recarregar lista de amostras (atualizar select)
      await carregarAmostras(requisicaoAtual.id);
      
      // Limpar formulário
      limparFormularioAmostra();
      
      // Selecionar próxima amostra automaticamente
      document.getElementById('select-amostra').value = result.proxima_amostra.id;
      aoSelecionarAmostra(result.proxima_amostra.id);
      
    } else {
      // Todas amostras validadas
      mostrarMensagemSucesso('Todas as amostras foram validadas!');
      
      // Prosseguir para próxima etapa (a definir)
      // prosseguirParaProximaEtapa();
    }
  }
}
```

### 3. Validações Frontend

```javascript
function validarFormulario() {
  const erros = [];
  
  // Tipo de amostra obrigatório
  const tipoAmostra = document.getElementById('select-tipo-amostra').value;
  if (!tipoAmostra) {
    erros.push('Selecione o tipo de amostra');
  }
  
  // Data de coleta obrigatória (exceto se sem_validade=true)
  const semValidade = document.getElementById('checkbox-sem-validade').checked;
  const dataColeta = document.getElementById('input-data-coleta').value;
  if (!semValidade && !dataColeta) {
    erros.push('Informe a data de coleta');
  }
  
  // Se armazenamento inadequado, motivo é obrigatório
  const armazenamentoInadequado = document.getElementById('checkbox-armazenamento-inadequado').checked;
  const motivoInadequado = document.getElementById('select-motivo-inadequado').value;
  if (armazenamentoInadequado && !motivoInadequado) {
    erros.push('Selecione o motivo do armazenamento inadequado');
  }
  
  // Data validade >= data coleta
  const dataValidade = document.getElementById('input-data-validade').value;
  if (dataColeta && dataValidade && new Date(dataValidade) < new Date(dataColeta)) {
    erros.push('Data de validade deve ser maior ou igual à data de coleta');
  }
  
  if (erros.length > 0) {
    mostrarErro(erros.join('\n'));
    return false;
  }
  
  return true;
}
```

### 4. UX - Melhorias

1. **Contador de amostras:**
   ```
   Amostra 1 de 3 validadas
   ```

2. **Barra de progresso:**
   ```
   [████████░░] 2/3 amostras validadas
   ```

3. **Desabilitar campos condicionalmente:**
   - Se `checkbox-sem-validade` marcado → desabilitar `input-data-validade`
   - Se `checkbox-armazenamento-inadequado` desmarcado → desabilitar `select-motivo-inadequado`

4. **Mensagem de sucesso com barra verde lateral:**
   ```
   ✅ Amostra 1 validada com sucesso!
   Restam 2 amostras para validar.
   ```

---

## 🔒 SEGURANÇA

1. ✅ Autenticação: LoginRequiredMixin em todas as views
2. ✅ Rate Limiting: 60/min para listagens, 30/min para salvamento
3. ✅ CSRF Protection: Token em todas as requisições POST
4. ✅ Validação de propriedade: Verificar se amostra pertence à requisição
5. ✅ Auditoria: Registrar usuário que validou (updated_by)
6. ✅ Sanitização: Usar textContent para exibir dados do usuário

---

## ⚡ PERFORMANCE

1. ✅ Índices no banco:
   - `requisicao_amostra.requisicao_id` (já existe via FK)
   - `requisicao_amostra.triagem_validada` (novo, se criar campo)
   - `requisicao_amostra.status` (já existe)

2. ✅ Queries otimizadas:
   - `.select_related('requisicao')` ao buscar amostras
   - `.filter(triagem_validada=False)` para amostras pendentes

3. ✅ Cache:
   - Cachear lista de tipos de amostra (raramente muda)
   - Cachear lista de motivos inadequados (raramente muda)

---

## 📝 ORDEM DE IMPLEMENTAÇÃO

### FASE 1: Preparação do Banco (CRÍTICO)
1. ✅ Criar model `MotivoArmazenamentoInadequado`
2. ✅ Criar model `TipoAmostra` (se não existir)
3. ✅ Adicionar campo `triagem_validada` em `RequisicaoAmostra` (OU usar `status`)
4. ✅ Converter `motivo_inadequado_id` para FK (OU manter IntegerField)
5. ✅ Criar migrations
6. ✅ Popular dados iniciais (fixtures)

### FASE 2: Backend
1. ✅ Criar view `ListarTiposAmostraView`
2. ✅ Criar view `ListarMotivosInadequadosView`
3. ✅ Criar view `ListarAmostrasRequisicaoView`
4. ✅ Criar view `SalvarAmostraTriagemView`
5. ✅ Adicionar URLs
6. ✅ Testar endpoints com Postman/curl

### FASE 3: Frontend
1. ✅ Carregar tipos de amostra e motivos inadequados ao iniciar
2. ✅ Implementar carregamento de amostras ao localizar requisição
3. ✅ Popular select-amostra apenas com amostras não validadas
4. ✅ Implementar seleção de amostra e preenchimento do formulário
5. ✅ Implementar validações frontend
6. ✅ Implementar salvamento de amostra
7. ✅ Implementar fluxo de próxima amostra
8. ✅ Implementar mensagens de sucesso
9. ✅ Implementar contador/progresso de amostras

### FASE 4: Testes e Refinamento
1. ✅ Testar fluxo completo end-to-end
2. ✅ Testar validações
3. ✅ Testar edge cases (sem amostras, todas validadas, etc)
4. ✅ Ajustar UX conforme necessário

---

## ⚠️ DECISÕES PENDENTES (AGUARDANDO DEFINIÇÃO)

1. **Campo status vs triagem_validada:**
   - Usar campo `status` existente (IntegerField)?
   - OU criar campo `triagem_validada` (BooleanField)?
   - **Recomendação:** Criar `triagem_validada` para clareza

2. **Motivo inadequado - FK vs IntegerField:**
   - Converter para ForeignKey (mais seguro)?
   - OU manter IntegerField (menos mudanças)?
   - **Recomendação:** Converter para FK

3. **Fluxo após todas amostras validadas:**
   - Prosseguir automaticamente para próxima etapa?
   - Mostrar botão "Finalizar Triagem"?
   - **Aguardando definição do usuário**

4. **Tipo de amostra:**
   - Criar model `TipoAmostra` completo?
   - OU usar apenas IntegerField com referência externa?
   - **Recomendação:** Criar model completo

---

## 📊 ESTIMATIVA DE ESFORÇO

- **Fase 1 (Banco):** 2-3 horas
- **Fase 2 (Backend):** 3-4 horas
- **Fase 3 (Frontend):** 4-5 horas
- **Fase 4 (Testes):** 2-3 horas
- **TOTAL:** 11-15 horas

---

## ✅ CHECKLIST DE VALIDAÇÃO

Antes de considerar completo, verificar:
- [ ] Todas as migrations aplicadas sem erro
- [ ] Dados iniciais populados (tipos amostra, motivos)
- [ ] Endpoints retornam dados corretos
- [ ] Select de amostras mostra apenas não validadas
- [ ] Validações frontend funcionam
- [ ] Salvamento persiste dados corretamente
- [ ] Fluxo de próxima amostra funciona
- [ ] Mensagens de sucesso aparecem
- [ ] Código limpo e sem logs de debug
- [ ] Tudo commitado no git

---

**PRONTO PARA INICIAR IMPLEMENTAÇÃO!** 🚀
