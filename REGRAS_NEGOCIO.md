# 📋 REGRAS DE NEGÓCIO E VALIDAÇÕES - FEMME INTEGRA NTO

> **Objetivo**: Documentar todas as regras de negócio, validações e fluxos do sistema.  
> **Público**: Desenvolvedores e analistas de negócio.  
> **Atualização**: Este documento deve ser atualizado sempre que novas funcionalidades forem implementadas.

---

## 📑 ÍNDICE

1. [Página de Recebimento](#1-página-de-recebimento)
2. [Gestão de Requisições](#2-gestão-de-requisições)
3. [Validações de Código de Barras](#3-validações-de-código-de-barras)
4. [Fluxo de Requisições em Trânsito](#4-fluxo-de-requisições-em-trânsito)
5. [Cadastros Mestres](#5-cadastros-mestres)
6. [Auditoria e Logs](#6-auditoria-e-logs)

---

## 1. PÁGINA DE RECEBIMENTO

### 1.1. Seleção de Unidade

#### Regra: Unidade Obrigatória
- **Descrição**: O usuário DEVE selecionar uma unidade antes de localizar um código de barras.
- **Validação**: Frontend valida antes de permitir busca.
- **Mensagem**: "Selecione uma unidade antes de localizar."
- **Código**: `frontend/static/js/recebimento.js:125-127`

```javascript
if (!hiddenField?.value) {
  return { ok: false, message: 'Selecione uma unidade antes de localizar.' };
}
```

#### Regra: Filtro de Portadores por Unidade
- **Descrição**: Ao selecionar uma unidade, o sistema filtra automaticamente os portadores/representantes vinculados àquela unidade.
- **Comportamento**: Dropdown de portadores é atualizado dinamicamente.
- **Código**: `frontend/static/js/recebimento.js:79-108`

---

### 1.2. Seleção de Portador/Representante

#### Regra: Portador/Representante Obrigatório
- **Descrição**: O usuário DEVE selecionar um portador/representante antes de validar uma nova requisição.
- **Validação**: Frontend valida antes de enviar ao backend.
- **Mensagem**: "Escolha um portador/representante."
- **Código**: `frontend/static/js/recebimento.js:128-130`

#### Regra: Origem Automática
- **Descrição**: Ao selecionar um portador/representante, o campo "Origem" é preenchido automaticamente com a origem vinculada ao portador.
- **Comportamento**: Campo origem é readonly e atualizado via JavaScript.
- **Código**: `frontend/static/js/recebimento.js:72-77`

---

### 1.3. Quantidade de Amostras

#### Regra: Quantidade Mínima
- **Descrição**: A quantidade de amostras DEVE ser no mínimo 1.
- **Validação**: Frontend valida antes de abrir modal.
- **Mensagem**: "Informe a quantidade de amostras (mínimo 1)."
- **Código**: `frontend/static/js/recebimento.js:131-134`

```javascript
const quantidade = Number(quantidadeInput?.value || 0);
if (!quantidade || quantidade < 1) {
  return { ok: false, message: 'Informe a quantidade de amostras (mínimo 1).' };
}
```

---

### 1.4. Localização de Código de Barras

#### Regra: Busca de Código Existente
- **Descrição**: Ao bipar um código de barras, o sistema verifica se ele já existe no banco de dados.
- **Fluxos Possíveis**:
  1. **Código não existe** → Abre modal para cadastro novo
  2. **Código existe e já foi recebido** → Alerta de duplicidade
  3. **Código existe com status "EM TRÂNSITO"** → Abre modal com dados pré-preenchidos
  4. **Código existe com outros status** → Alerta conforme status
- **Código**: `backend/operacao/services.py:432-479`

#### Regra: Código Já Recebido (Duplicidade)
- **Descrição**: Se o código já existe no `LogRecebimento`, significa que já foi recebido anteriormente.
- **Ação**: Bloqueia recebimento e exibe alerta.
- **Mensagem**: "Já existe registro para este código de barras."
- **Status HTTP**: 200 (com status='found')
- **Código**: `backend/operacao/services.py:442-448`

```python
existe_log = LogRecebimento.objects.filter(
    cod_barras_req=cod_barras
).exists()

if existe_log:
    logger.info('Código de barras já recebido anteriormente: %s', cod_barras)
    return {'status': 'found'}
```

#### Regra: Código Não Encontrado
- **Descrição**: Se o código não existe em nenhuma tabela, é uma nova requisição.
- **Ação**: Abre modal para bipagem de amostras.
- **Status HTTP**: 200 (com status='not_found')
- **Código**: `backend/operacao/services.py:476-478`

---

## 2. GESTÃO DE REQUISIÇÕES

### 2.1. Criação de Requisição

#### Regra: Geração de Código de Requisição
- **Descrição**: O sistema gera automaticamente um código único no formato `REQ-YYYYMMDD-NNNN`.
- **Formato**: 
  - `REQ-` (prefixo fixo)
  - `YYYYMMDD` (data atual)
  - `NNNN` (sequencial de 4 dígitos)
- **Exemplo**: `REQ-20241207-0001`
- **Código**: `backend/operacao/services.py:22-56`

```python
def gerar_codigo_requisicao() -> str:
    hoje = timezone.now().date()
    prefixo = f'REQ-{hoje.strftime("%Y%m%d")}'
    
    ultima_req = DadosRequisicao.objects.filter(
        cod_req__startswith=prefixo
    ).order_by('-cod_req').first()
    
    if ultima_req:
        ultimo_numero = int(ultima_req.cod_req.split('-')[-1])
        proximo_numero = ultimo_numero + 1
    else:
        proximo_numero = 1
    
    return f'{prefixo}-{proximo_numero:04d}'
```

#### Regra: Validação de Foreign Keys
- **Descrição**: Antes de criar uma requisição, o sistema valida se Unidade, Portador/Representante e Origem (opcional) existem no banco.
- **Validações**:
  - ✅ Unidade DEVE existir
  - ✅ Portador/Representante DEVE existir
  - ✅ Origem é opcional (pode ser NULL)
  - ✅ Status inicial (código '1' - ABERTO NTO) DEVE existir
- **Código**: `backend/operacao/services.py:94-136`

#### Regra: Criação Atômica (Transaction)
- **Descrição**: A criação de uma requisição é uma transação atômica. Se qualquer etapa falhar, TUDO é revertido.
- **Etapas**:
  1. Criar `LogRecebimento` (JSON)
  2. Criar `DadosRequisicao` (tabela principal)
  3. Criar `Amostra` (uma para cada código bipado)
  4. Criar `RequisicaoStatusHistorico` (registro inicial)
- **Código**: `backend/operacao/services.py:138-240` (decorator `@transaction.atomic`)

---

### 2.2. Validação de Amostras

#### Regra: Códigos Iguais (Recomendado)
- **Descrição**: O sistema RECOMENDA que todos os códigos de barras (requisição + amostras) sejam iguais.
- **Comportamento**: Se forem diferentes, apenas loga um warning (não bloqueia).
- **Código**: `backend/operacao/services.py:58-92`

```python
def validar_codigos_iguais(cod_barras_req: str, cod_barras_amostras: List[str]) -> bool:
    if not cod_barras_amostras:
        return True
    
    todos_iguais = all(cod == cod_barras_req for cod in cod_barras_amostras)
    
    if not todos_iguais:
        logger.warning(
            'Códigos de barras divergentes - Requisição: %s, Amostras: %s',
            cod_barras_req, cod_barras_amostras
        )
    
    return todos_iguais
```

#### Regra: Quantidade de Amostras
- **Descrição**: A quantidade de amostras bipadas DEVE corresponder à quantidade informada no formulário.
- **Validação**: Frontend controla a quantidade de inputs gerados.
- **Código**: `frontend/static/js/recebimento.js:155-199`

#### Regra: Ordem das Amostras
- **Descrição**: Cada amostra recebe um número de ordem sequencial (1, 2, 3...).
- **Comportamento**: A ordem é definida pela sequência de bipagem.
- **Código**: `backend/operacao/services.py:203-213`

```python
for idx, cod_amostra in enumerate(cod_barras_amostras, start=1):
    Amostra.objects.create(
        requisicao=requisicao,
        cod_barras_amostra=cod_amostra,
        data_hora_bipagem=data_atual,
        ordem=idx,
        created_by=user,
        updated_by=user
    )
```

---

### 2.3. Finalização de Kit

#### Regra: Validação de Requisições Pendentes
- **Descrição**: Ao clicar em "Finalizar Recebimento", o sistema valida se há requisições com status "ABERTO NTO" para o usuário logado.
- **Comportamento**:
  - Se não houver requisições → Mensagem: "Nenhuma requisição pendente para finalizar."
  - Se houver → Atualiza todas para status "RECEBIDO"
- **Código**: `backend/operacao/services.py:364-428`

#### Regra: Atualização em Lote
- **Descrição**: Todas as requisições do usuário com status "ABERTO NTO" são atualizadas para "RECEBIDO" em uma única operação.
- **Campos Atualizados**:
  - `status` → 2 (RECEBIDO)
  - `data_recebimento_nto` → Data/hora atual
  - `updated_by` → Usuário logado
- **Código**: `backend/operacao/services.py:403-421`

```python
for req in requisicoes:
    try:
        req.status = status_recebido
        req.data_recebimento_nto = agora
        req.updated_by = user
        req.save()
        
        RequisicaoStatusHistorico.objects.create(
            requisicao=req,
            cod_req=req.cod_req,
            status=status_recebido,
            usuario=user,
            observacao='Recebimento finalizado em lote (kit)'
        )
        
        sucesso_count += 1
    except Exception as e:
        logger.exception('Erro ao finalizar requisição %s', req.cod_req)
        continue
```

---

## 3. VALIDAÇÕES DE CÓDIGO DE BARRAS

### 3.1. Duplicidade

#### Regra: Código de Barras Único
- **Descrição**: Não é permitido criar uma requisição com um código de barras que já existe no `LogRecebimento`.
- **Validação**: Backend verifica antes de criar.
- **Mensagem**: "Já existe um registro com este código de barras."
- **Status HTTP**: 400
- **Código**: `backend/operacao/services.py:155-159`

```python
if cls.validar_codigo_barras_duplicado(cod_barras_req):
    return {
        'status': 'error',
        'message': 'Já existe um registro com este código de barras.',
    }
```

---

### 3.2. Formato

#### Regra: Código Não Vazio
- **Descrição**: O código de barras da requisição NÃO pode ser vazio ou apenas espaços.
- **Validação**: Backend valida após strip().
- **Mensagem**: "Código de barras da requisição não informado."
- **Status HTTP**: 400
- **Código**: `backend/operacao/views.py:142-146`

```python
if not cod_barras_req:
    return JsonResponse(
        {'status': 'error', 'message': 'Código de barras da requisição não informado.'},
        status=400,
    )
```

---

## 4. FLUXO DE REQUISIÇÕES EM TRÂNSITO

### 4.1. Identificação

#### Regra: Status "EM TRÂNSITO" (código 10)
- **Descrição**: Requisições com status 10 são consideradas "em trânsito" - enviadas por representantes de fora de SP.
- **Características**:
  - Já possuem dados cadastrados (unidade, origem, representante)
  - Já possuem amostras cadastradas
  - Aguardam apenas confirmação de recebimento físico no NTO
- **Código**: `backend/operacao/services.py:450-475`

```python
try:
    requisicao = DadosRequisicao.objects.select_related(
        'unidade', 'origem', 'status'
    ).get(
        cod_barras_req=cod_barras,
        status__codigo='10'  # EM TRÂNSITO
    )
    
    # Buscar amostras da requisição
    amostras = list(requisicao.amostras.values_list('cod_barras_amostra', flat=True))
    
    return {
        'status': 'in_transit',
        'requisicao_id': requisicao.id,
        'cod_req': requisicao.cod_req,
        'unidade_nome': requisicao.unidade.nome,
        'origem_descricao': requisicao.origem.descricao if requisicao.origem else None,
        'qtd_amostras': len(amostras),
        'cod_barras_amostras': amostras,
    }
except DadosRequisicao.DoesNotExist:
    return {'status': 'not_found'}
```

---

### 4.2. Validação de Amostras em Trânsito

#### Regra: Quantidade Exata
- **Descrição**: A quantidade de amostras bipadas DEVE ser EXATAMENTE igual à quantidade cadastrada.
- **Validação**: Backend compara `len(amostras_bipadas)` com `len(amostras_cadastradas)`.
- **Mensagem**: "Quantidade de amostras divergente. Cadastradas: X, Bipadas: Y"
- **Status HTTP**: 400
- **Código**: `backend/operacao/services.py:279-290`

```python
amostras_cadastradas = list(
    requisicao.amostras.values_list('cod_barras_amostra', flat=True)
)
amostras_bipadas = cod_barras_amostras

# Validar quantidade (deve ser exatamente igual)
if len(amostras_bipadas) != len(amostras_cadastradas):
    return {
        'status': 'error',
        'message': f'Quantidade de amostras divergente. Cadastradas: {len(amostras_cadastradas)}, Bipadas: {len(amostras_bipadas)}',
    }
```

#### Regra: Códigos Correspondentes (com Duplicatas)
- **Descrição**: Os códigos bipados DEVEM corresponder aos códigos cadastrados, permitindo duplicatas (mesmo código para várias amostras).
- **Validação**: Compara listas ordenadas.
- **Mensagem**: "Divergência nas amostras bipadas. Código X: cadastradas=Y, bipadas=Z."
- **Código**: `backend/operacao/services.py:292-319`

```python
# Validar códigos (comparar listas ordenadas para permitir duplicatas)
amostras_cadastradas_sorted = sorted(amostras_cadastradas)
amostras_bipadas_sorted = sorted(amostras_bipadas)

if amostras_cadastradas_sorted != amostras_bipadas_sorted:
    # Identificar diferenças
    cadastradas_counter = {}
    for cod in amostras_cadastradas:
        cadastradas_counter[cod] = cadastradas_counter.get(cod, 0) + 1
    
    bipadas_counter = {}
    for cod in amostras_bipadas:
        bipadas_counter[cod] = bipadas_counter.get(cod, 0) + 1
    
    mensagem_erro = 'Divergência nas amostras bipadas.'
    
    # Verificar códigos faltando ou em excesso
    todos_codigos = set(cadastradas_counter.keys()) | set(bipadas_counter.keys())
    for cod in todos_codigos:
        qtd_cadastrada = cadastradas_counter.get(cod, 0)
        qtd_bipada = bipadas_counter.get(cod, 0)
        if qtd_cadastrada != qtd_bipada:
            mensagem_erro += f' Código {cod}: cadastradas={qtd_cadastrada}, bipadas={qtd_bipada}.'
    
    return {
        'status': 'error',
        'message': mensagem_erro,
    }
```

---

### 4.3. Atualização de Status

#### Regra: Transição EM TRÂNSITO → ABERTO NTO
- **Descrição**: Ao validar uma requisição em trânsito, o status muda de 10 (EM TRÂNSITO) para 1 (ABERTO NTO).
- **Campos Atualizados**:
  - `status` → 1 (ABERTO NTO)
  - `recebido_por` → Usuário logado
  - `updated_by` → Usuário logado
- **Histórico**: Cria registro no `RequisicaoStatusHistorico`.
- **Código**: `backend/operacao/services.py:321-349`

```python
# Buscar status
status_aberto = StatusRequisicao.objects.get(codigo='1')  # ABERTO NTO

# Atualizar requisição
requisicao.status = status_aberto
requisicao.recebido_por = user
requisicao.updated_by = user
requisicao.save()

# Criar registro no histórico
RequisicaoStatusHistorico.objects.create(
    requisicao=requisicao,
    cod_req=requisicao.cod_req,
    status=status_aberto,
    usuario=user,
    observacao='Requisição recebida no NTO (atualizada de Em Trânsito)',
)
```

---

## 5. CADASTROS MESTRES

### 5.1. Unidade

#### Regra: Campo Ativo
- **Descrição**: Unidades podem ser desativadas sem serem deletadas do banco.
- **Comportamento**:
  - Unidades inativas NÃO aparecem em dropdowns/selects
  - Requisições antigas mantêm referência à unidade (mesmo inativa)
- **Campo**: `ativo` (BooleanField, default=True)
- **Código**: `backend/operacao/models.py:7-25`

---

### 5.2. Portador/Representante

#### Regra: Unificação de Campos
- **Descrição**: O sistema usa um ÚNICO campo `portador_representante` no modelo `DadosRequisicao`.
- **Justificativa**: A tabela `PortadorRepresentante` já possui campo `tipo` para diferenciar PORTADOR vs REPRESENTANTE.
- **Migração**: Dados do campo antigo `portador` foram migrados para `portador_representante`.
- **Código**: 
  - Model: `backend/operacao/models.py:143-151`
  - Migration: `backend/operacao/migrations/0004_unificar_portador_representante.py:7-20`

```python
# Migration - Função de migração de dados
def migrar_dados_portador(apps, schema_editor):
    DadosRequisicao = apps.get_model('operacao', 'DadosRequisicao')
    
    for req in DadosRequisicao.objects.all():
        if req.portador_id:
            req.portador_representante_id = req.portador_id
        elif req.representante_id:
            req.portador_representante_id = req.representante_id
        req.save(update_fields=['portador_representante'])
```

#### Regra: Vínculo com Unidade e Origem
- **Descrição**: Cada portador/representante DEVE estar vinculado a uma Unidade e uma Origem.
- **Validação**: Foreign Keys obrigatórias no modelo.
- **Código**: `backend/operacao/models.py:43-60`

#### Regra: Campo Ativo
- **Descrição**: Portadores/Representantes podem ser desativados.
- **Comportamento**: Inativos não aparecem em selects.
- **Campo**: `ativo` (BooleanField, default=True)
- **Código**: `backend/operacao/models.py:60`

---

### 5.3. Status de Requisição

#### Regra: Status Cadastrados
- **Descrição**: O sistema possui status pré-definidos para controlar o ciclo de vida das requisições.
- **Status Principais**:
  - `1` - ABERTO NTO (requisição recebida, aguardando processamento)
  - `2` - RECEBIDO (kit finalizado)
  - `10` - EM TRÂNSITO (enviado por representante, aguardando recebimento)
  - `11` - CADASTRADO_REP (cadastrado mas não enviado - ERRO)
  - `9` - DELETADA (requisição deletada do sistema)
- **Código**: `backend/operacao/models.py:77-97`

#### Regra: Campo Ativo
- **Descrição**: Status podem ser desativados (ex: status obsoletos).
- **Comportamento**: Inativos não aparecem em transições de status.
- **Campo**: `ativo` (BooleanField, default=True)
- **Código**: `backend/operacao/models.py:82-86`

#### Regra: Ordem de Exibição
- **Descrição**: Status possuem campo `ordem` para controlar a sequência de exibição.
- **Uso**: Ordenação em listas e relatórios.
- **Código**: `backend/operacao/models.py:80`

---

### 5.4. Origem

#### Regra: Tipos de Origem
- **Descrição**: Origens são classificadas por tipo.
- **Tipos**:
  - `EXTERNO` - Origem externa
  - `PAPABRASIL` - Papa Brasil
  - `PARCEIRO` - Parceiro
  - `OUTRO` - Outros
- **Código**: `backend/operacao/models.py:20-31`

#### Regra: Campo Ativo
- **Descrição**: Origens podem ser desativadas.
- **Comportamento**: Inativas não aparecem em cadastros novos.
- **Campo**: `ativo` (BooleanField, default=True)
- **Código**: `backend/operacao/models.py:31`

---

## 6. AUDITORIA E LOGS

### 6.1. Campos de Auditoria (AuditModel)

#### Regra: Rastreamento Automático
- **Descrição**: Modelos que herdam de `AuditModel` possuem rastreamento automático de criação e atualização.
- **Campos**:
  - `created_at` - Data/hora de criação (auto_now_add=True)
  - `updated_at` - Data/hora da última atualização (auto_now=True)
  - `created_by` - Usuário que criou (FK para User)
  - `updated_by` - Usuário que atualizou (FK para User)
- **Modelos com Auditoria**:
  - `DadosRequisicao`
  - `Amostra`
- **Código**: `backend/core/models.py` (AuditModel)

---

### 6.2. LogRecebimento (JSON)

#### Regra: Log Imutável
- **Descrição**: Cada requisição recebida gera um registro JSON no `LogRecebimento`.
- **Conteúdo**:
  - `cod_barras_req` - Código de barras da requisição
  - `dados` - Payload JSON com informações brutas
- **Uso**: Auditoria e troubleshooting.
- **Código**: `backend/operacao/models.py:108-122`

```python
LogRecebimento.objects.create(
    cod_barras_req=cod_barras_req,
    dados={
        'cod_barras_amostras': cod_barras_amostras,
        'quantidade': len(cod_barras_amostras),
    },
)
```

---

### 6.3. Histórico de Status

#### Regra: Rastreamento de Mudanças
- **Descrição**: Toda mudança de status de uma requisição é registrada no `RequisicaoStatusHistorico`.
- **Campos**:
  - `requisicao` - FK para DadosRequisicao
  - `cod_req` - Código da requisição (desnormalizado para performance)
  - `status` - FK para StatusRequisicao
  - `usuario` - Usuário que fez a mudança
  - `data_registro` - Data/hora da mudança (auto_now_add=True)
  - `observacao` - Observações sobre a mudança
- **Código**: `backend/operacao/models.py:222-274`

#### Regra: Histórico Imutável
- **Descrição**: Registros de histórico NÃO podem ser editados ou deletados via admin (exceto superusuários).
- **Comportamento**: Apenas leitura no Django Admin.
- **Código**: `backend/operacao/admin.py:187-193`

```python
def has_add_permission(self, request):
    """Não permite adicionar histórico manualmente."""
    return False

def has_delete_permission(self, request, obj=None):
    """Permite deletar histórico apenas para superusuários."""
    return request.user.is_superuser
```

---

## 7. VALIDAÇÕES DE FRONTEND

### 7.1. SessionStorage

#### Regra: Persistência de Seleção
- **Descrição**: Ao validar uma requisição, o sistema salva a unidade e portador/representante selecionados no `sessionStorage`.
- **Objetivo**: Manter seleções após adicionar requisição (evitar reselecionar a cada bipagem).
- **Limpeza**: SessionStorage é limpo ao finalizar o kit.
- **Código**: 
  - Salvar: `frontend/static/js/recebimento.js:713-717`
  - Restaurar: `frontend/static/js/recebimento.js:738-758`
  - Limpar: `frontend/static/js/recebimento.js:353-355`

```javascript
// Salvar
sessionStorage.setItem('recebimento_unidade_id', hiddenField?.value || '');
sessionStorage.setItem('recebimento_portador_representante_id', portadorSelect?.value || '');

// Restaurar
const savedUnidadeId = sessionStorage.getItem('recebimento_unidade_id');
const savedPortadorRepresentanteId = sessionStorage.getItem('recebimento_portador_representante_id');

// Limpar
sessionStorage.removeItem('recebimento_unidade_id');
sessionStorage.removeItem('recebimento_portador_representante_id');
```

---

### 7.2. Modal de Bipagem

#### Regra: Geração Dinâmica de Inputs
- **Descrição**: O modal gera dinamicamente inputs de código de barras conforme a quantidade informada.
- **Comportamento**: 
  - Se quantidade = 3 → Gera 3 inputs
  - Cada input tem autofocus sequencial
- **Código**: `frontend/static/js/recebimento.js:155-199`

#### Regra: Modo Trânsito vs Modo Normal
- **Descrição**: O modal possui dois modos de exibição:
  - **Modo Normal**: Exibe título "BIPAGEM DE AMOSTRAS"
  - **Modo Trânsito**: Exibe título "📦 REQUISIÇÃO EM TRÂNSITO" + informações da requisição
- **Código**: `frontend/static/js/recebimento.js:155-234`

---

## 8. CACHE E PERFORMANCE

### 8.1. Cache de Unidades e Portadores

#### Regra: Cache de 5 Minutos
- **Descrição**: Unidades e portadores são cacheados por 5 minutos para melhorar performance.
- **Chaves de Cache**:
  - `recebimento:unidades`
  - `recebimento:portadores`
- **Invalidação**: Cache pode ser limpo manualmente via Django Admin (action).
- **Código**: `backend/operacao/views.py:25-62`

```python
# Buscar unidades (com cache)
unidades = cache.get('recebimento:unidades')
if unidades is None:
    unidades = list(
        Unidade.objects.filter(ativo=True)
        .values('id', 'codigo', 'nome')
        .order_by('codigo', 'nome')
    )
    cache.set('recebimento:unidades', unidades, timeout=300)  # 5 minutos
```

---

## 9. SEGURANÇA

### 9.1. Autenticação

#### Regra: Login Obrigatório
- **Descrição**: Todas as views de operação requerem autenticação.
- **Mixin**: `LoginRequiredMixin`
- **Redirecionamento**: Usuários não autenticados são redirecionados para login.
- **Código**: `backend/operacao/views.py:18` (class-based views)

---

### 9.2. Rate Limiting

#### Regra: Limite de Requisições
- **Descrição**: Endpoints de validação possuem rate limiting para prevenir abuso.
- **Limite**: Configurado via `django-ratelimit`.
- **Código**: `backend/operacao/views.py` (decorators)

---

### 9.3. CSRF Protection

#### Regra: Token CSRF Obrigatório
- **Descrição**: Todas as requisições POST requerem token CSRF válido.
- **Implementação**: Django CSRF middleware + token no frontend.
- **Código**: `frontend/static/js/recebimento.js:21-30`

```javascript
function getCookie(name) {
  const cookieValue = document.cookie
    .split('; ')
    .find(row => row.startsWith(name + '='))
    ?.split('=')[1];
  return cookieValue;
}

const csrfToken = getCookie('csrftoken');
```

---

## 📝 NOTAS FINAIS

### Como Usar Este Documento

1. **Busca Rápida**: Use Ctrl+F para buscar por palavra-chave (ex: "código de barras", "validação")
2. **Referência de Código**: Cada regra indica o arquivo e linhas onde está implementada
3. **Atualização**: Sempre que implementar nova funcionalidade, adicione aqui
4. **Estrutura**: Mantenha a organização por módulo/página

### Convenções

- 📍 **Código**: Indica localização do código-fonte
- ✅ **Validação**: Indica regra de validação
- ⚠️ **Atenção**: Indica ponto importante
- 🔄 **Fluxo**: Indica fluxo de processo

---

**Última Atualização**: 07/12/2024  
**Versão**: 1.0  
**Responsável**: Equipe de Desenvolvimento FEMME INTEGRA
