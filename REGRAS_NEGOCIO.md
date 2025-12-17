# 📋 REGRAS DE NEGÓCIO E VALIDAÇÕES - FEMME INTEGRA NTO

> **Objetivo**: Documentar todas as regras de negócio, validações e fluxos do sistema.  
> **Público**: Desenvolvedores e analistas de negócio.  
> **Atualização**: Este documento deve ser atualizado sempre que novas funcionalidades forem implementadas.

---

## 📑 ÍNDICE

1. [Página de Recebimento](#1-página-de-recebimento)
2. [Página de Triagem](#2-página-de-triagem)
3. [Scanner Dynamsoft](#3-scanner-dynamsoft)
4. [Triagem - Etapa 1 (Validação de Amostras)](#4-triagem---etapa-1-validação-de-amostras)
5. [Triagem - Etapa 2 (Finalização)](#5-triagem---etapa-2-finalização)
6. [Triagem - Etapa 3 (Cadastro)](#6-triagem---etapa-3-cadastro)
7. [Integração Korus CPF](#7-integração-korus-cpf)
8. [Upload de Arquivos](#8-upload-de-arquivos)
9. [Gestão de Requisições](#9-gestão-de-requisições)
10. [Validações de Código de Barras](#10-validações-de-código-de-barras)
11. [Fluxo de Requisições em Trânsito](#11-fluxo-de-requisições-em-trânsito)
12. [Cadastros Mestres](#12-cadastros-mestres)
13. [Auditoria e Logs](#13-auditoria-e-logs)
14. [Validações de Frontend](#14-validações-de-frontend)
15. [Cache e Performance](#15-cache-e-performance)
16. [Segurança](#16-segurança)
17. [Sistema de Notificações](#17-sistema-de-notificações)
18. [Transferência de Requisições](#18-transferência-de-requisições)

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
- **Fluxos Possíveis** (em ordem de verificação):
  1. **Código já RECEBIDO** (status 2) → Alerta de duplicidade
  2. **Código EM TRÂNSITO** (status 10) → Abre modal com dados pré-preenchidos
  3. **Código ABERTO NTO do mesmo usuário** (status 1) → Alerta "Você já iniciou esta requisição"
  4. **Código ABERTO NTO de outro usuário** (status 1) → Modal de transferência
  5. **Código não existe** → Abre modal para cadastro novo
- **Código**: `backend/operacao/services.py:431-523` (classe `BuscaService`)

#### Regra: Código Já Recebido (Duplicidade)
- **Descrição**: Se o código já existe com status RECEBIDO (código '2'), significa que já foi finalizado anteriormente.
- **Ação**: Bloqueia recebimento e exibe alerta.
- **Mensagem**: "Já existe registro para este código de barras."
- **Retorno**: `{'status': 'found'}`
- **Código**: `backend/operacao/services.py:446-454`

```python
# Verificar se já foi recebido (status RECEBIDO = 2)
existe_recebido = DadosRequisicao.objects.filter(
    cod_barras_req=cod_barras,
    status__codigo='2'  # RECEBIDO
).exists()

if existe_recebido:
    logger.info('Código de barras já recebido anteriormente: %s', cod_barras)
    return {'status': 'found'}
```

⚠️ **MUDANÇA**: Verificação agora é feita por status RECEBIDO (código '2') ao invés de `LogRecebimento`.

#### Regra: Código Em Trânsito
- **Descrição**: Se o código existe com status EM TRÂNSITO (código '10'), retorna dados para pré-preenchimento.
- **Dados Retornados**:
  - `requisicao_id` - ID da requisição
  - `cod_req` - Código da requisição
  - `unidade_nome` e `unidade_id`
  - `origem_descricao` e `origem_id`
  - `portador_representante_nome` e `portador_representante_id`
  - `qtd_amostras` - Quantidade de amostras cadastradas
  - `cod_barras_amostras` - Lista de códigos das amostras
- **Retorno**: `{'status': 'in_transit', ...}`
- **Código**: `backend/operacao/services.py:456-486`

#### Regra: Código Já Iniciado (Mesmo Usuário)
- **Descrição**: Se o código existe com status ABERTO NTO (código '1') e foi iniciado pelo mesmo usuário.
- **Ação**: Alerta informando que a requisição já foi iniciada.
- **Retorno**: `{'status': 'already_yours'}`
- **Código**: `backend/operacao/services.py:498-501`

#### Regra: Código Já Iniciado (Outro Usuário) - Transferência
- **Descrição**: Se o código existe com status ABERTO NTO (código '1') e foi iniciado por outro usuário.
- **Ação**: Oferece opção de transferência (assumir a requisição).
- **Dados Retornados**:
  - `requisicao_id` - ID da requisição
  - `cod_req` - Código da requisição
  - `usuario_anterior` - Username do usuário anterior
  - `usuario_anterior_nome` - Nome completo do usuário anterior
  - `created_at` - Data/hora de início formatada
- **Retorno**: `{'status': 'already_started', ...}`
- **Código**: `backend/operacao/services.py:489-517`

#### Regra: Código Não Encontrado
- **Descrição**: Se o código não existe em nenhum status, é uma nova requisição.
- **Ação**: Abre modal para bipagem de amostras.
- **Retorno**: `{'status': 'not_found'}`
- **Código**: `backend/operacao/services.py:521-523`

---

## 2. PÁGINA DE TRIAGEM

### 2.1. Localização de Requisição

#### Regra: Busca por Código de Barras
- **Descrição**: O usuário bipa o código de barras da requisição para localizá-la no sistema.
- **Validação**: Sistema busca requisição e verifica se está em status válido para triagem.
- **Status Válidos**:
  - `2` (RECEBIDO) → Carrega Etapa 1
  - `7` (TRIAGEM1-OK) → Carrega Etapa 2
  - `8` (TRIAGEM2-OK) → Carrega Etapa 3
- **Comportamento**: Se encontrada e em status válido, carrega a etapa correspondente.
- **Código**: `backend/operacao/views.py:49-161` e `frontend/static/js/triagem.js:264-319`

#### Regra: Requisição Não Encontrada
- **Descrição**: Se o código de barras não existe no sistema, exibe mensagem de erro.
- **Mensagem**: "Requisição não encontrada no sistema."
- **Status HTTP**: 404
- **Código**: `backend/operacao/views.py:73-80`

#### Regra: Requisição com Status Inválido
- **Descrição**: Se a requisição existe mas não está em status válido para triagem, exibe mensagem específica.
- **Mensagens por Status**:
  - Status `1` (ABERTO NTO): "Requisição ainda não foi recebida no NTO. Status atual: ABERTO NTO"
  - Status `4` ou `5` (CAIXA BO/BARRADOS): "Requisição já passou pela triagem. Status atual: X"
  - Status `12` (CADASTRADA): "Requisição já foi cadastrada. Status atual: CADASTRADA"
  - Status `99`: "Requisição foi rejeitada. Status atual: X"
  - Outros: "Requisição não está apta para triagem. Status atual: X"
- **Status HTTP**: 200 (requisição existe, só não está apta)
- **Código**: `backend/operacao/views.py:89-114`

---

### 2.2. Digitalização de Documentos

#### Regra: Scanner Obrigatório
- **Descrição**: Para digitalizar, o usuário DEVE ter um scanner conectado e configurado.
- **Validação**: Sistema verifica disponibilidade de scanners ao abrir modal.
- **Mensagem**: "Nenhum scanner encontrado. Verifique se o scanner está conectado."
- **Código**: `frontend/templates/operacao/triagem.html` (função `carregarListaScanners`)

---

## 3. SCANNER DYNAMSOFT

### 3.1. Inicialização do Scanner

#### Regra: Carregamento Dinâmico de Scripts
- **Descrição**: Scripts do Dynamsoft são carregados dinamicamente apenas quando o modal é aberto.
- **Comportamento**: Evita carregar biblioteca pesada desnecessariamente.
- **Scripts Carregados**:
  1. `dynamsoft.webtwain.initiate.js`
  2. `dynamsoft.webtwain.config.js`
- **Código**: `frontend/templates/operacao/triagem.html:308-353` (função `carregarScriptsDynamsoft`)

#### Regra: Configuração de ResourcesPath
- **Descrição**: O caminho dos recursos do Dynamsoft DEVE ser configurado ANTES de carregar os scripts.
- **Valor**: `/static/dynamsoft`
- **Código**: `frontend/templates/operacao/triagem.html:310-312`

```javascript
window.Dynamsoft = window.Dynamsoft || {};
Dynamsoft.DWT = Dynamsoft.DWT || {};
Dynamsoft.DWT.ResourcesPath = '/static/dynamsoft';
```

---

### 3.2. Seleção de Scanner

#### Regra: Lista de Scanners Disponíveis
- **Descrição**: Sistema lista automaticamente todos os scanners conectados ao computador.
- **Comportamento**: Dropdown é populado com scanners detectados via TWAIN/WIA.
- **Validação**: Se nenhum scanner encontrado, exibe mensagem "Nenhum scanner encontrado".
- **Código**: `frontend/templates/operacao/triagem.html:450-495` (função `carregarListaScanners`)

#### Regra: Sanitização de Nomes de Scanners
- **Descrição**: Nomes de scanners são sanitizados para prevenir XSS.
- **Método**: Uso de `textContent` ao invés de `innerHTML`.
- **Fallback**: Se nome vier vazio, exibe "Scanner desconhecido".
- **Código**: `frontend/templates/operacao/triagem.html:471`

```javascript
option.textContent = device.displayName || device.name || 'Scanner desconhecido';
```

---

### 3.3. Configurações de Digitalização

#### Regra: Timeout Estendido
- **Descrição**: Timeout de digitalização configurado para 60 segundos (padrão é 30s).
- **Motivo**: Alguns scanners demoram mais para processar imagens de alta qualidade.
- **Constante**: `SCANNER_TIMEOUT = 60000` (milissegundos)
- **Código**: `frontend/templates/operacao/triagem.html:271`

#### Regra: Tipo de Pixel Padrão
- **Descrição**: Digitalização em COLORIDO por padrão.
- **Valores Possíveis**:
  - `0` = Preto e Branco
  - `1` = Escala de Cinza
  - `2` = Colorido (padrão)
- **Constante**: `PIXEL_TYPE_COLOR = 2`
- **Código**: `frontend/templates/operacao/triagem.html:272`

#### Regra: Resolução Padrão
- **Descrição**: Resolução padrão de 300 DPI.
- **Motivo**: Boa qualidade para leitura e OCR.
- **Constante**: `resolution: 300`
- **Código**: `frontend/static/js/scanner.js:38`

#### Regra: Digitalização Apenas Frente (Sem Duplex)
- **Descrição**: Scanner SEMPRE digitaliza apenas a frente do documento.
- **Configuração**: `IfDuplexEnabled: false`
- **Motivo**: O verso das requisições é sempre em branco. Digitalizar frente e verso causa problemas no envio.
- **Código**: `frontend/static/js/scanner.js:333`

#### Regra: Alimentador Desabilitado
- **Descrição**: Alimentador automático de folhas (ADF) desabilitado.
- **Configuração**: `IfFeederEnabled: false`
- **Motivo**: Digitalização manual de uma folha por vez.
- **Código**: `frontend/static/js/scanner.js:332`

---

### 3.4. Processo de Digitalização

#### Regra: Seleção Automática de Scanner
- **Descrição**: Scanner selecionado no dropdown é automaticamente configurado, SEM popup intermediário.
- **Comportamento**: Usa `SelectDeviceAsync()` para selecionar dispositivo programaticamente.
- **Código**: `frontend/static/js/scanner.js:323`

#### Regra: Digitalização Sem UI
- **Descrição**: Interface do scanner NÃO é exibida (digitalização silenciosa).
- **Configuração**: `IfShowUI: false`
- **Motivo**: Melhor UX, usuário controla tudo pelo modal do sistema.
- **Código**: `frontend/static/js/scanner.js:331`

#### Regra: Tratamento de Erro Timeout
- **Descrição**: Erro de timeout (código -2415) é IGNORADO se a imagem foi capturada com sucesso.
- **Comportamento**: Verifica `DWTObject.HowManyImagesInBuffer > 0` antes de mostrar erro.
- **Motivo**: Alguns scanners retornam timeout mesmo após capturar imagem corretamente.
- **Constante**: `ERROR_CODE_TIMEOUT = -2415`
- **Código**: `frontend/templates/operacao/triagem.html:570-573`

```javascript
if (error.code === ERROR_CODE_TIMEOUT && DWTObject.HowManyImagesInBuffer > 0) {
  return; // Ignorar erro timeout se imagem capturada
}
```

---

### 3.5. Manipulação de Imagens

#### Regra: Toolbar de Ferramentas
- **Descrição**: Usuário pode manipular imagens digitalizadas antes de enviar.
- **Ferramentas Disponíveis**:
  - 🗑️ Remover página atual
  - 🗑️🗑️ Remover todas as páginas
  - ➖ Diminuir zoom
  - ➕ Aumentar zoom
  - ↻ Girar à esquerda
  - ⊟ Tamanho original
  - 🖐️ Ferramenta de mão (mover imagem)
- **Código**: `frontend/templates/operacao/triagem.html:187-212`

#### Regra: Visualização de Múltiplas Páginas
- **Descrição**: Sistema suporta digitalização de múltiplas páginas em uma única sessão.
- **Comportamento**: Cada página digitalizada é adicionada ao buffer.
- **Indicador**: Mostra "Pág. X / Y" na toolbar.
- **Código**: `frontend/templates/operacao/triagem.html:217-219`

---

### 3.6. Segurança do Scanner

#### Regra: Encapsulamento de Código
- **Descrição**: Todo código JavaScript do scanner está encapsulado em IIFE (Immediately Invoked Function Expression).
- **Motivo**: Evita poluição do escopo global e conflitos de variáveis.
- **Modo Strict**: `'use strict'` ativado.
- **Código**: `frontend/templates/operacao/triagem.html:265-682`

#### Regra: Event Listeners (Não Onclick Inline)
- **Descrição**: Todos os botões usam `addEventListener` ao invés de atributos `onclick` inline.
- **Motivo**: Melhor segurança, permite CSP (Content Security Policy) mais restritivo.
- **Código**: `frontend/templates/operacao/triagem.html:416-447` (função `configurarEventListeners`)

#### Regra: Sanitização de Inputs
- **Descrição**: Todos os dados externos (nomes de scanners) são sanitizados antes de inserir no DOM.
- **Método**: Uso de `textContent` e `replaceChildren()` ao invés de `innerHTML`.
- **Proteção**: Previne ataques XSS (Cross-Site Scripting).
- **Código**: `frontend/templates/operacao/triagem.html:471`

---

### 3.7. Acessibilidade

#### Regra: ARIA Labels
- **Descrição**: Todos os botões possuem atributos `aria-label` para leitores de tela.
- **Exemplos**:
  - `aria-label="Remover página atual"`
  - `aria-label="Aumentar zoom"`
  - `aria-label="Fechar modal"`
- **Código**: `frontend/templates/operacao/triagem.html:187-211`

#### Regra: Suporte à Tecla ESC
- **Descrição**: Modal pode ser fechado pressionando a tecla ESC.
- **Comportamento**: Listener global detecta tecla ESC e fecha modal se estiver aberto.
- **Código**: `frontend/templates/operacao/triagem.html:416-425`

---

### 3.8. Performance

#### Regra: CSS Externo Cacheável
- **Descrição**: Estilos do modal estão em arquivo CSS separado, não inline.
- **Arquivo**: `frontend/static/css/scanner-modal.css`
- **Benefício**: Navegador pode cachear o CSS (HTTP 304 Not Modified).
- **Código**: `frontend/templates/operacao/triagem.html:7`

#### Regra: Altura Otimizada do Viewer
- **Descrição**: Altura do viewer configurada para 450px.
- **Motivo**: Melhor aproveitamento do espaço do modal.
- **Código**: `frontend/templates/operacao/triagem.html:364`

---

### 3.9. Envio para AWS S3

#### Regra: Upload de Imagens
- **Status**: ✅ **IMPLEMENTADO**
- **Descrição**: Imagens digitalizadas são enviadas para AWS S3 via signed URL.
- **Fluxo**:
  1. Converter imagem do buffer para PDF (`ConvertToBlob`)
  2. Obter signed URL do backend (`GET /operacao/upload/signed-url/`)
  3. Upload direto para S3 usando signed URL
  4. Confirmar upload no backend (vincula arquivo à requisição)
- **Código**: `frontend/static/js/scanner.js:363-462` (função `enviarParaAWS`)

#### Regra: Formato de Arquivo
- **Descrição**: Imagens são convertidas para PDF antes do envio.
- **Tipo MIME**: `application/pdf`
- **Código**: `frontend/static/js/scanner.js:470-484` (função `obterImagemComoBlob`)

```javascript
DWTObject.ConvertToBlob(
  [index],
  Dynamsoft.DWT.EnumDWT_ImageType.IT_PDF,
  successCallback,
  errorCallback
);
```

#### Regra: Signed URL (Pré-assinada)
- **Descrição**: Backend gera URL pré-assinada para upload direto ao S3.
- **Endpoint**: `GET /operacao/upload/signed-url/?requisicao_id=X&content_type=Y`
- **Retorno**: `{ signed_url, file_key, original_filename }`
- **Código**: `frontend/static/js/scanner.js:492-509` (função `obterSignedUrl`)

#### Regra: Confirmação de Upload
- **Descrição**: Após upload para S3, backend é notificado para vincular arquivo à requisição.
- **Endpoint**: `POST /operacao/upload/confirmar/`
- **Dados**: `{ requisicao_id, file_key, filename, file_size }`
- **Código**: `frontend/static/js/scanner.js:417-422`

#### Regra: Feedback Visual
- **Descrição**: Botão exibe progresso durante envio.
- **Comportamento**:
  - Botão desabilitado durante envio
  - Spinner animado
  - Texto "Enviando X/Y..." para múltiplas imagens
- **Código**: `frontend/static/js/scanner.js:380-386, 397-400`

#### Regra: Limpeza Após Envio
- **Descrição**: Buffer de imagens é limpo após envio bem-sucedido.
- **Método**: `DWTObject.RemoveAllImages()`
- **Código**: `frontend/static/js/scanner.js:449`

---

## 4. TRIAGEM - ETAPA 1 (VALIDAÇÃO DE AMOSTRAS)

### 4.1. Pré-requisitos

#### Regra: Digitalização Obrigatória
- **Descrição**: É OBRIGATÓRIO digitalizar a requisição antes de validar qualquer amostra.
- **Validação**: Backend verifica existência de arquivo do tipo REQUISICAO (código 1) vinculado à requisição.
- **Mensagem**: "É obrigatório digitalizar a requisição antes de validar as amostras."
- **Status HTTP**: 400
- **Código**: `backend/operacao/triagem_views.py:270-289`

```python
# Buscar tipo de arquivo REQUISICAO (código 1)
tipo_requisicao = TipoArquivo.objects.filter(codigo=1).first()

if tipo_requisicao:
    tem_arquivo = RequisicaoArquivo.objects.filter(
        requisicao=amostra.requisicao,
        tipo_arquivo=tipo_requisicao
    ).exists()
    
    if not tem_arquivo:
        return JsonResponse(
            {'status': 'error', 'message': 'É obrigatório digitalizar a requisição antes de validar as amostras.'},
            status=400
        )
```

---

### 4.2. Campos da Amostra

#### Regra: Data de Validade Obrigatória (Condicional)
- **Descrição**: Data de validade é obrigatória APENAS se a flag "Sem data de validade" NÃO estiver marcada.
- **Validação**: Se `data_validade` está vazia e `flag_sem_data_validade` é False → Erro.
- **Mensagem**: "Data de validade é obrigatória ou marque 'Sem data de validade'"
- **Código**: `backend/operacao/triagem_views.py:319-322`

#### Regra: Motivo de Armazenamento Inadequado Obrigatório
- **Descrição**: Se flag "Armazenamento inadequado" estiver marcada, pelo menos um motivo DEVE ser selecionado.
- **Validação**: `flag_armazenamento_inadequado=True` e `len(motivos_ids)==0` → Erro.
- **Mensagem**: "Selecione pelo menos um motivo de armazenamento inadequado"
- **Código**: `backend/operacao/triagem_views.py:324-326`

---

### 4.3. Flags de Impeditivos

#### Regra: Lista de Flags de Impeditivo
- **Descrição**: O sistema verifica 6 flags que podem gerar impeditivos na amostra.
- **Flags**:
  - `flag_data_coleta_rasurada` → "Data de coleta rasurada"
  - `flag_sem_data_validade` → "Sem data de validade"
  - `flag_amostra_sem_identificacao` → "Amostra sem identificação"
  - `flag_armazenamento_inadequado` → "Armazenamento inadequado"
  - `flag_frasco_trocado_tipo_coleta` → "Frasco trocado"
  - `flag_material_nao_analisado` → "Material não analisado"
- **Código**: `backend/operacao/triagem_views.py:334-359`

#### Regra: Data de Validade Expirada (90 dias)
- **Descrição**: Se a data de validade exceder 90 dias atrás, é considerado impeditivo.
- **Validação**: `(hoje - data_validade).days > 90` → Impeditivo.
- **Mensagem**: "Data de validade excede 90 dias (há X dias)"
- **Código**: `backend/operacao/triagem_views.py:343-347`

```python
if amostra.data_validade:
    dias_atras = (timezone.now().date() - amostra.data_validade).days
    if dias_atras > 90:
        impeditivos.append(f'Data de validade excede 90 dias (há {dias_atras} dias)')
```

---

### 4.4. Status de Rejeição por Unidade

#### Regra: Determinação do Status de Rejeição
- **Descrição**: O status de rejeição depende da unidade da requisição.
- **Regras**:
  - Unidade `09` (EXTERNOS) → Status `5` (CAIXA BARRADOS)
  - Unidade `17` (PAPA BRASIL) → Status `4` (CAIXA BO)
  - Outras unidades → Status `4` (CAIXA BO) como padrão
- **Código**: `backend/operacao/triagem_views.py:363-375`

```python
unidade_codigo = amostra.requisicao.unidade.codigo

if unidade_codigo == '09':  # EXTERNOS
    status_rejeicao_id = 5  # CAIXA BARRADOS
    status_rejeicao_nome = 'CAIXA BARRADOS'
elif unidade_codigo == '17':  # PAPA BRASIL
    status_rejeicao_id = 4  # CAIXA BO
    status_rejeicao_nome = 'CAIXA BO'
else:
    status_rejeicao_id = 4
    status_rejeicao_nome = 'CAIXA BO'
```

---

### 4.5. Fluxo de Validação

#### Regra: Validação com Impeditivos
- **Descrição**: Se amostra possui impeditivos, dados são salvos mas amostra NÃO é marcada como validada.
- **Comportamento**: Retorna status `impeditivo` para frontend decidir (continuar ou rejeitar).
- **Dados Salvos**: Flags, motivos inadequados, descrição.
- **Código**: `backend/operacao/triagem_views.py:361-402`

#### Regra: Validação sem Impeditivos
- **Descrição**: Se amostra NÃO possui impeditivos, é marcada como `triagem1_validada=True`.
- **Comportamento**: Sistema avança automaticamente para próxima amostra pendente.
- **Código**: `backend/operacao/triagem_views.py:404-407`

#### Regra: Conclusão Automática da Etapa 1
- **Descrição**: Quando TODAS as amostras forem validadas, status da requisição muda para TRIAGEM1-OK (código 7).
- **Registro**: Cria entrada no `RequisicaoStatusHistorico`.
- **Código**: `backend/operacao/triagem_views.py:433-457`

---

### 4.6. Motivos de Armazenamento Inadequado

#### Regra: Registro de Motivos
- **Descrição**: Motivos selecionados são salvos na tabela `AmostraMotivoArmazenamentoInadequado`.
- **Comportamento**: 
  - Remove motivos anteriores da amostra
  - Cria novos registros com código de barras, motivo e usuário
- **Código**: `backend/operacao/triagem_views.py:381-392`

---

## 5. TRIAGEM - ETAPA 2 (FINALIZAÇÃO)

### 5.1. Tipos de Pendência

#### Regra: Listagem de Pendências por Etapa
- **Descrição**: Sistema lista tipos de pendência configurados para cada etapa específica.
- **Endpoint**: `GET /operacao/triagem/tipos-pendencia/?etapa=2`
- **Parâmetro**: `etapa` (default: 2) - Define qual etapa buscar
- **Filtros**:
  - Pendência configurada para a etapa (`TipoPendenciaEtapa.etapa`)
  - Configuração ativa (`TipoPendenciaEtapa.ativo=True`)
  - Tipo de pendência ativo (`TipoPendencia.ativo=True`)
- **Ordenação**: Por `ordem` configurada, depois por `codigo`
- **Código**: `backend/operacao/triagem_views.py:589-626`

#### Regra: Configuração de Pendências por Etapa
- **Descrição**: Administrador pode configurar quais pendências aparecem em cada etapa via Django Admin.
- **Tabela**: `tipo_pendencia_etapa`
- **Campos**:
  - `tipo_pendencia` - FK para TipoPendencia
  - `etapa` - Número da etapa (2 ou 3)
  - `ordem` - Ordem de exibição (menor = primeiro)
  - `ativo` - Se deve aparecer na etapa
- **Flexibilidade**: Uma pendência pode aparecer em múltiplas etapas com ordens diferentes.
- **Admin**: `Operação > Pendências por Etapa`
- **Código**: `backend/operacao/models.py:232-274`

#### Pendências Configuradas para Etapa 2 (Padrão)
| Ordem | Código | Descrição |
|-------|--------|-----------|
| 1 | 2 | CPF EM BRANCO |
| 2 | 5 | ASSINATURA DO PACIENTE EM BRANCO |
| 3 | 4 | ASSINATURA MÉDICO EM BRANCO |
| 4 | 8 | CARIMBO MÉDICO EM BRANCO |
| 5 | 3 | DADOS CONVÊNIO INCOMPLETOS |
| 6 | 13 | NOME PACIENTE EM BRANCO/RASURADO |
| 7 | 14 | EXAMES EM BRANCO |
| 8 | 15 | REQUISIÇÃO EM BRANCO |

---

### 5.2. Finalização da Triagem

#### Regra: Registro de Pendências
- **Descrição**: Ao finalizar Etapa 2, sistema registra pendências selecionadas.
- **Endpoint**: `POST /operacao/triagem/finalizar/`
- **Dados**:
  - `requisicao_id` - ID da requisição
  - `pendencias` - Array de IDs de tipos de pendência
- **Código**: `backend/operacao/triagem_views.py:608-738`

#### Regra: Atualização de Status
- **Descrição**: Após finalizar Etapa 2, status muda para TRIAGEM2-OK (código 8).
- **Registro**: Cria entrada no `RequisicaoStatusHistorico`.

---

## 6. TRIAGEM - ETAPA 3 (CADASTRO)

### 6.1. Gestão de Amostras

#### Regra: Exclusão de Amostra
- **Descrição**: Permite excluir amostra da requisição com registro de auditoria.
- **Endpoint**: `POST /operacao/triagem/amostras/excluir/`
- **Requisitos**:
  - `amostra_id` - ID da amostra
  - `motivo_exclusao_id` - Motivo obrigatório
  - `etapa` - Etapa onde ocorreu (ex: TRIAGEM3)
- **Auditoria**: Cria registro em `LogAlteracaoAmostra` com tipo EXCLUSAO.
- **Código**: `backend/operacao/triagem_views.py:866-954`

#### Regra: Adição de Amostra
- **Descrição**: Permite adicionar nova amostra à requisição com registro de auditoria.
- **Endpoint**: `POST /operacao/triagem/amostras/adicionar/`
- **REGRA CRÍTICA**: Código de barras da nova amostra DEVE ser IGUAL ao código de barras da requisição.
- **Validação**: `cod_barras_amostra != requisicao.cod_barras_req` → Erro.
- **Mensagem**: "O código de barras da amostra deve ser igual ao código de barras da requisição (XXX)."
- **Código**: `backend/operacao/triagem_views.py:958-1080`

```python
# REGRA DE NEGÓCIO: Código de barras da amostra DEVE ser igual ao da requisição
if cod_barras_amostra != requisicao.cod_barras_req:
    return JsonResponse(
        {
            'status': 'error',
            'message': f'O código de barras da amostra deve ser igual ao código de barras da requisição ({requisicao.cod_barras_req}).',
            'codigo_esperado': requisicao.cod_barras_req,
            'codigo_informado': cod_barras_amostra
        },
        status=400
    )
```

#### Regra: Amostra Adicionada Já Validada
- **Descrição**: Amostra adicionada na Etapa 3 já vem com `triagem1_validada=True`.
- **Motivo**: Está na etapa final, já passou pelas validações anteriores.
- **Código**: `backend/operacao/triagem_views.py:1028`

---

### 6.2. Tipos de Amostra

#### Regra: Listagem de Tipos
- **Descrição**: Sistema lista tipos de amostra ativos para seleção.
- **Endpoint**: `GET /operacao/triagem/tipos-amostra/`
- **Código**: `backend/operacao/triagem_views.py:773-796`

#### Regra: Atualização de Tipo
- **Descrição**: Permite atualizar o tipo de amostra de uma amostra específica.
- **Endpoint**: `POST /operacao/triagem/amostras/atualizar-tipo/`
- **Código**: `backend/operacao/triagem_views.py:801-861`

---

### 6.3. Cadastro Final

#### Regra: Status Correto para Cadastro
- **Descrição**: Requisição DEVE estar no status TRIAGEM2-OK (código 8) para ser cadastrada.
- **Validação**: `requisicao.status.codigo != '8'` → Erro.
- **Mensagem**: "Requisição não está apta para cadastro. Status atual: X"
- **Código**: `backend/operacao/triagem_views.py:1119-1124`

#### Regra: Flags de Problema
- **Descrição**: Sistema verifica flags de problema CPF e Médico.
- **Flags**:
  - `flag_problema_cpf` - CPF em branco ou inválido
  - `flag_problema_medico` - Dados do médico incompletos
- **Código**: `backend/operacao/triagem_views.py:1127-1128`

#### Regra: Confirmação de Envio para Pendência
- **Descrição**: Se há flags de problema, usuário DEVE confirmar envio para fila de pendências.
- **Validação**: `(flag_problema_cpf or flag_problema_medico) and not enviar_para_pendencia` → Erro.
- **Mensagem**: "Confirme o envio para fila de pendências."
- **Código**: `backend/operacao/triagem_views.py:1131-1136`

#### Regra: Fluxo de Cadastro
- **Com Problemas**: Status muda para PENDÊNCIA (código 6), cria registros de pendência.
  - `flag_problema_cpf` → Tipo pendência código 17 (CPF em branco ou inválido)
  - `flag_problema_medico` → Tipo pendência código 18 (Dados médico incompletos)
- **Sem Problemas**: Status muda para CADASTRADA (código 12).
- **Código**: `backend/operacao/triagem_views.py:1151-1184`

---

## 7. INTEGRAÇÃO KORUS CPF

### 7.1. Configuração

#### Regra: Variáveis de Ambiente
- **Descrição**: Credenciais da API Korus são configuradas via variáveis de ambiente.
- **Variáveis**:
  - `KORUS_API_URL` - URL base da API
  - `KORUS_API_LOGIN` - Login de autenticação
  - `KORUS_API_PASSWORD` - Senha de autenticação
  - `KORUS_API_TIMEOUT` - Timeout em segundos (padrão: 20)
- **Código**: `backend/core/services/external_api.py:145-170`

---

### 7.2. Autenticação

#### Regra: Token por Requisição
- **Descrição**: Sistema gera NOVO token a cada requisição (sem cache de token).
- **Motivo**: Garantir sempre token válido e evitar problemas de expiração.
- **Código**: `backend/core/services/external_api.py:274-282`

```python
def get_korus_client() -> KorusAPIClient:
    """
    Retorna nova instância do cliente Korus.
    Sempre gera novo token a cada requisição conforme especificado.
    """
    return KorusAPIClient()
```

---

### 7.3. Consulta de CPF

#### Regra: Endpoint de Consulta
- **Descrição**: Consulta dados de paciente por CPF na API Korus.
- **Endpoint**: `GET /operacao/triagem/consultar-cpf-korus/?cpf=XXX&requisicao_id=YYY`
- **Rate Limit**: 30 requisições por minuto
- **Código**: `backend/operacao/triagem_views.py:1243-1389`

#### Regra: Mapeamento de Campos
- **Descrição**: Dados da API Korus são mapeados para o formato interno.
- **Estrutura da API**:
  - `pessoaFisica.nome` → `nome_paciente`
  - `pessoaFisica.dataNascimento` → `data_nasc_paciente`
  - `pessoaFisica.sexo` → `sexo_paciente`
  - `contato.email` → `email_paciente`
  - `matricula` → `matricula_paciente`
  - `convenio` → `convenio_paciente`
  - `plano` → `plano_paciente`
- **Código**: `backend/operacao/triagem_views.py:1313-1328`

```python
pessoa_fisica = dados_api.get('pessoaFisica', {}) or {}
contato = dados_api.get('contato', {}) or {}

paciente = {
    'nome': pessoa_fisica.get('nome', '') or '',
    'data_nascimento': pessoa_fisica.get('dataNascimento', '') or '',
    'email': contato.get('email', '') or '',
    'sexo': pessoa_fisica.get('sexo', '') or '',
    'matricula': dados_api.get('matricula', '') or '',
    'convenio': dados_api.get('convenio', '') or '',
    'plano': dados_api.get('plano', '') or '',
}
```

#### Regra: Salvamento Automático
- **Descrição**: Se `requisicao_id` for informado, dados são salvos automaticamente na requisição.
- **CPF**: O CPF digitado também é salvo no campo `cpf_paciente`.
- **Código**: `backend/operacao/triagem_views.py:1332-1383`

#### Regra: CPF Não Encontrado
- **Descrição**: Se CPF não existe na base FEMME, retorna erro com status 404.
- **Mensagem**: "CPF não encontrado na base FEMME."
- **Código**: `backend/core/services/external_api.py:241-269`

---

## 8. UPLOAD DE ARQUIVOS

### 8.1. Tipos de Arquivo

#### Regra: Tipos Cadastrados
- **Descrição**: Sistema possui tipos de arquivo pré-definidos.
- **Tipos Principais**:
  - Código `1` = REQUISICAO (digitalização da requisição física)
  - Outros tipos conforme cadastro
- **Código**: `backend/operacao/models.py` (TipoArquivo)

---

### 8.2. Verificação de Arquivo

#### Regra: Verificação de Existência
- **Descrição**: Sistema verifica se requisição possui arquivo digitalizado.
- **Endpoint**: `GET /operacao/triagem/verificar-arquivo/?requisicao_id=XXX`
- **Resposta**: `{"status": "success", "tem_arquivo": true/false}`
- **Código**: `backend/operacao/triagem_views.py:73-119`

---

### 8.3. Obrigatoriedade na Triagem

#### Regra: Digitalização Obrigatória
- **Descrição**: Requisição DEVE ter arquivo digitalizado (tipo REQUISICAO) antes de validar amostras na Etapa 1.
- **Validação**: Backend verifica antes de salvar amostra.
- **Bloqueio**: Se não houver arquivo, não permite validar nenhuma amostra.
- **Mensagem**: "É obrigatório digitalizar a requisição antes de validar as amostras."
- **Código**: `backend/operacao/triagem_views.py:270-289`

---

## 9. GESTÃO DE REQUISIÇÕES

### 9.1. Criação de Requisição

#### Regra: Geração de Código de Requisição
- **Descrição**: O sistema gera automaticamente um código único alfanumérico aleatório.
- **Formato**: 
  - 10 caracteres alfanuméricos (letras maiúsculas A-Z e dígitos 0-9)
  - Gerado usando `secrets.choice()` para garantir aleatoriedade criptográfica
  - Valida unicidade no banco antes de retornar
- **Exemplo**: `A3B7XK9M2P`, `K1D8F2N5Q7`
- **Tentativas**: Até 10 tentativas para gerar código único
- **Código**: `backend/operacao/services.py:32-55`

```python
def gerar_codigo_requisicao(tamanho: int = 10, max_tentativas: int = 10) -> str:
    chars = string.ascii_uppercase + string.digits
    
    for tentativa in range(max_tentativas):
        codigo = ''.join(secrets.choice(chars) for _ in range(tamanho))
        
        # Verificar se código já existe
        if not DadosRequisicao.objects.filter(cod_req=codigo).exists():
            return codigo
    
    raise ValueError(
        f'Não foi possível gerar código único após {max_tentativas} tentativas'
    )
```

#### Regra: Validação de Foreign Keys
- **Descrição**: Antes de criar uma requisição, o sistema valida se Unidade, Portador/Representante e Origem (opcional) existem no banco.
- **Validações**:
  - ✅ Unidade DEVE existir
  - ✅ Portador/Representante DEVE existir
  - ✅ Origem é opcional (pode ser NULL)
  - ✅ Status inicial (código '1' - ABERTO NTO) DEVE existir
- **Código**: `backend/operacao/services.py:81-122`

#### Regra: Criação Atômica (Transaction)
- **Descrição**: A criação de uma requisição é uma transação atômica. Se qualquer etapa falhar, TUDO é revertido.
- **Etapas**:
  1. Criar `DadosRequisicao` (tabela principal com status ABERTO NTO)
  2. Criar `Amostra` (uma para cada código bipado)
  3. Criar `RequisicaoStatusHistorico` (registro inicial)
  4. `LogRecebimento` é criado apenas ao finalizar kit (status RECEBIDO)
- **Código**: `backend/operacao/services.py:124-230` (decorator `@transaction.atomic`)

⚠️ **IMPORTANTE**: `LogRecebimento` NÃO é criado ao receber a requisição inicialmente. Ele é criado apenas quando o kit é finalizado (status muda para RECEBIDO = 2).

---

### 9.2. Validação de Amostras

#### Regra: Códigos Iguais (OBRIGATÓRIO)
- **Descrição**: O sistema EXIGE que todos os códigos de barras (requisição + amostras) sejam IGUAIS.
- **Comportamento**: Se forem diferentes, retorna erro e BLOQUEIA a criação da requisição.
- **Mensagem de Erro**: "Todos os códigos de barras devem ser iguais."
- **Validação**: Cria um conjunto (set) com todos os códigos e verifica se há apenas 1 código único.
- **Código**: `backend/operacao/services.py:57-78`

```python
def validar_codigos_iguais(cod_barras_req: str, cod_barras_amostras: List[str]) -> bool:
    if not cod_barras_amostras:
        return False
    
    todos_codigos = [cod_barras_req] + cod_barras_amostras
    codigos_unicos = set(todos_codigos)
    
    resultado = len(codigos_unicos) == 1
    
    if not resultado:
        logger.warning(
            'Códigos de barras diferentes detectados. '
            'Requisição: %s, Amostras: %s',
            cod_barras_req, cod_barras_amostras
        )
    
    return resultado
```

⚠️ **IMPORTANTE**: Esta é uma validação BLOQUEANTE. A requisição NÃO é criada se os códigos forem diferentes.

#### Regra: Quantidade de Amostras
- **Descrição**: A quantidade de amostras bipadas DEVE corresponder à quantidade informada no formulário.
- **Validação**: Frontend controla a quantidade de inputs gerados.
- **Código**: `frontend/static/js/recebimento.js:155-199`

#### Regra: Ordem das Amostras
- **Descrição**: Cada amostra recebe um número de ordem sequencial (1, 2, 3...).
- **Comportamento**: A ordem é definida pela sequência de bipagem.
- **Código**: `backend/operacao/services.py:189-198`

```python
data_atual = timezone.now()
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

### 9.3. Finalização de Kit

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
- **Registros Criados**:
  - `LogRecebimento` - Marca definitivamente como recebido (JSON com amostras)
  - `RequisicaoStatusHistorico` - Registro da mudança de status
- **Código**: `backend/operacao/services.py:358-426`

```python
for req in requisicoes:
    try:
        # Atualizar status da requisição
        req.status = status_recebido
        req.data_recebimento_nto = agora
        req.updated_by = user
        req.save()
        
        # Criar LogRecebimento (marca como recebido definitivamente)
        amostras = list(req.amostras.values_list('cod_barras_amostra', flat=True))
        LogRecebimento.objects.create(
            cod_barras_req=req.cod_barras_req,
            dados={
                'cod_barras_amostras': amostras,
                'quantidade': len(amostras),
                'cod_req': req.cod_req,
                'finalizado_em': agora.isoformat(),
            },
        )
        
        # Registrar no histórico
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

⚠️ **IMPORTANTE**: `LogRecebimento` é criado APENAS nesta etapa, quando o kit é finalizado. Ele NÃO é criado ao receber a requisição inicialmente.

---

## 10. VALIDAÇÕES DE CÓDIGO DE BARRAS

### 10.1. Duplicidade

#### Regra: Código de Barras Único
- **Descrição**: Não é permitido criar uma requisição com um código de barras que já foi RECEBIDO (status 2).
- **Validação**: Backend verifica se existe requisição com o código e status RECEBIDO.
- **Mensagem**: "Já existe um registro com este código de barras."
- **Status HTTP**: 400
- **Código**: `backend/operacao/services.py:141-152`

```python
# Verificar se código já foi recebido (status RECEBIDO = 2)
existe_recebido = DadosRequisicao.objects.filter(
    cod_barras_req=cod_barras_req,
    status__codigo='2'  # RECEBIDO
).exists()

if existe_recebido:
    logger.warning('Código de barras já recebido: %s', cod_barras_req)
    return {
        'status': 'error',
        'message': 'Já existe um registro com este código de barras.',
    }
```

⚠️ **MUDANÇA**: A verificação agora é feita na tabela `DadosRequisicao` com filtro de status '2' ao invés de verificar `LogRecebimento`.

---

### 10.2. Formato

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

## 11. FLUXO DE REQUISIÇÕES EM TRÂNSITO

### 11.1. Identificação

#### Regra: Status "EM TRÂNSITO" (código 10)
- **Descrição**: Requisições com status 10 são consideradas "em trânsito" - enviadas por representantes de fora de SP.
- **Características**:
  - Já possuem dados cadastrados (unidade, origem, portador/representante)
  - Já possuem amostras cadastradas
  - Aguardam apenas confirmação de recebimento físico no NTO
- **Código**: `backend/operacao/services.py:456-486`

```python
try:
    requisicao = DadosRequisicao.objects.select_related(
        'unidade', 'origem', 'status', 'recebido_por', 'portador_representante'
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
        'unidade_id': requisicao.unidade_id,
        'origem_descricao': requisicao.origem.descricao if requisicao.origem else None,
        'origem_id': requisicao.origem_id,
        'portador_representante_nome': requisicao.portador_representante.nome if requisicao.portador_representante else None,
        'portador_representante_id': requisicao.portador_representante_id,
        'qtd_amostras': len(amostras),
        'cod_barras_amostras': amostras,
    }
except DadosRequisicao.DoesNotExist:
    pass
```

---

### 11.2. Validação de Amostras em Trânsito

#### Regra: Quantidade Exata
- **Descrição**: A quantidade de amostras bipadas DEVE ser EXATAMENTE igual à quantidade cadastrada.
- **Validação**: Backend compara `len(amostras_bipadas)` com `len(amostras_cadastradas)`.
- **Mensagem**: "Quantidade de amostras divergente. Cadastradas: X, Bipadas: Y"
- **Status HTTP**: 400
- **Código**: `backend/operacao/services.py:264-275`

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
- **Código**: `backend/operacao/services.py:277-304`

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

### 11.3. Atualização de Status

#### Regra: Transição EM TRÂNSITO → ABERTO NTO
- **Descrição**: Ao validar uma requisição em trânsito, o status muda de 10 (EM TRÂNSITO) para 1 (ABERTO NTO).
- **Campos Atualizados**:
  - `status` → 1 (ABERTO NTO)
  - `recebido_por` → Usuário logado
  - `updated_by` → Usuário logado
- **Histórico**: Cria registro no `RequisicaoStatusHistorico`.
- **Código**: `backend/operacao/services.py:306-341`

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

## 12. CADASTROS MESTRES

### 12.1. Unidade

#### Regra: Campo Ativo
- **Descrição**: Unidades podem ser desativadas sem serem deletadas do banco.
- **Comportamento**:
  - Unidades inativas NÃO aparecem em dropdowns/selects
  - Requisições antigas mantêm referência à unidade (mesmo inativa)
- **Campo**: `ativo` (BooleanField, default=True)
- **Código**: `backend/operacao/models.py:7-25`

---

### 12.2. Portador/Representante

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

### 12.3. Status de Requisição

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

### 12.4. Origem

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

## 13. AUDITORIA E LOGS

### 13.1. Campos de Auditoria (AuditModel)

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

### 13.2. LogRecebimento (JSON)

#### Regra: Log Imutável
- **Descrição**: Cada requisição FINALIZADA gera um registro JSON no `LogRecebimento`.
- **Momento de Criação**: Apenas ao finalizar kit (status ABERTO NTO → RECEBIDO)
- **Conteúdo**:
  - `cod_barras_req` - Código de barras da requisição (unique)
  - `dados` - Payload JSON com:
    - `cod_barras_amostras` - Lista de códigos das amostras
    - `quantidade` - Número de amostras
    - `cod_req` - Código da requisição
    - `finalizado_em` - Data/hora de finalização (ISO format)
- **Uso**: Auditoria e verificação de duplicidade (requisições já recebidas)
- **Código**: `backend/operacao/services.py:396-406`

```python
# Criado ao finalizar kit
amostras = list(req.amostras.values_list('cod_barras_amostra', flat=True))
LogRecebimento.objects.create(
    cod_barras_req=req.cod_barras_req,
    dados={
        'cod_barras_amostras': amostras,
        'quantidade': len(amostras),
        'cod_req': req.cod_req,
        'finalizado_em': agora.isoformat(),
    },
)
```

⚠️ **MUDANÇA**: `LogRecebimento` NÃO é mais criado ao receber a requisição. É criado apenas ao finalizar o kit.

---

### 13.3. Histórico de Status

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

## 14. VALIDAÇÕES DE FRONTEND

### 14.1. SessionStorage

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

### 14.2. Modal de Bipagem

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

## 15. CACHE E PERFORMANCE

### 15.1. Cache de Unidades e Portadores

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

## 16. SEGURANÇA

### 16.1. Autenticação

#### Regra: Login Obrigatório
- **Descrição**: Todas as views de operação requerem autenticação.
- **Mixin**: `LoginRequiredMixin`
- **Redirecionamento**: Usuários não autenticados são redirecionados para login.
- **Código**: `backend/operacao/views.py:18` (class-based views)

---

### 16.2. Rate Limiting

#### Regra: Limite de Requisições
- **Descrição**: Endpoints de validação possuem rate limiting para prevenir abuso.
- **Limite**: Configurado via `django-ratelimit`.
- **Código**: `backend/operacao/views.py` (decorators)

---

### 16.3. CSRF Protection

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

## 17. SISTEMA DE NOTIFICAÇÕES

### 17.1. Model Notificacao

#### Regra: Tipos de Notificação
- **Descrição**: O sistema suporta 3 tipos de notificações.
- **Tipos**:
  - `TRANSFERENCIA` - Notificação de transferência de requisição
  - `ALERTA` - Alertas importantes
  - `INFO` - Informações gerais
- **Código**: `backend/operacao/models.py:298-301`

```python
class Tipo(models.TextChoices):
    TRANSFERENCIA = 'TRANSFERENCIA', 'Transferência de Requisição'
    ALERTA = 'ALERTA', 'Alerta'
    INFO = 'INFO', 'Informação'
```

#### Regra: Notificações Não Lidas
- **Descrição**: Notificações possuem flag `lida` para controlar visualização.
- **Comportamento**: 
  - Ao criar: `lida=False`
  - Ao marcar como lida: `lida=True` + `data_leitura=now()`
- **Código**: `backend/operacao/models.py:349-354`

---

### 17.2. Sininho no Header

#### Regra: Badge de Contador
- **Descrição**: Badge vermelho exibe quantidade de notificações não lidas.
- **Comportamento**:
  - Se `contador > 0` → Badge visível com número
  - Se `contador > 99` → Badge exibe "99+"
  - Se `contador = 0` → Badge oculto
- **Código**: `frontend/static/js/notificacoes.js:32-42`

```javascript
if (contador > 0) {
  badgeNotificacoes.textContent = contador > 99 ? '99+' : contador;
  badgeNotificacoes.style.display = 'flex';
} else {
  badgeNotificacoes.style.display = 'none';
}
```

#### Regra: Atualização ao Login
- **Descrição**: Contador é atualizado automaticamente ao carregar qualquer página.
- **Frequência**: Uma vez ao carregar página
- **Código**: `frontend/static/js/notificacoes.js:227`

---

### 17.3. Modal de Notificações

#### Regra: Listagem de Notificações
- **Descrição**: Modal exibe até 50 notificações mais recentes.
- **Ordenação**: Mais recentes primeiro (`-created_at`)
- **Filtro Padrão**: Apenas não lidas
- **Código**: `backend/operacao/views.py:262-294`

#### Regra: Marcar Como Lida
- **Descrição**: Usuário pode marcar notificações individualmente ou todas de uma vez.
- **Endpoints**:
  - `POST /operacao/notificacoes/marcar-lida/` (uma ou mais)
  - `POST /operacao/notificacoes/marcar-todas-lidas/` (todas)
- **Código**: `backend/operacao/views.py:297-368`

#### Regra: Estado Vazio
- **Descrição**: Se não houver notificações, exibe mensagem amigável.
- **Mensagem**: "Nenhuma notificação"
- **Código**: `frontend/static/js/notificacoes.js:70-80`

---

## 18. TRANSFERÊNCIA DE REQUISIÇÕES

### 18.1. Detecção de Requisição Iniciada

#### Regra: Verificação ao Localizar
- **Descrição**: Ao bipar código de barras, sistema verifica se requisição já foi iniciada por outro usuário.
- **Fluxos Possíveis**:
  1. **Mesmo usuário** → Mensagem: "Você já iniciou esta requisição"
  2. **Outro usuário** → Modal de confirmação de transferência
- **Código**: `backend/operacao/services.py:489-517` (método `buscar_codigo_barras`)

```python
# Verificar se existe com status ABERTO NTO (status 1)
try:
    requisicao = DadosRequisicao.objects.select_related(
        'recebido_por', 'status'
    ).get(
        cod_barras_req=cod_barras,
        status__codigo='1'  # ABERTO NTO
    )
    
    # Verificar se é do mesmo usuário
    if user and requisicao.recebido_por == user:
        return {'status': 'already_yours'}
    
    # É de outro usuário - permitir transferência
    return {
        'status': 'already_started',
        'requisicao_id': requisicao.id,
        'cod_req': requisicao.cod_req,
        'usuario_anterior': requisicao.recebido_por.username,
        'usuario_anterior_nome': requisicao.recebido_por.get_full_name() or requisicao.recebido_por.username,
        'created_at': requisicao.created_at.strftime('%d/%m/%Y %H:%M'),
    }
except DadosRequisicao.DoesNotExist:
    pass
```

---

### 18.2. Modal de Confirmação

#### Regra: Confirmação Obrigatória
- **Descrição**: Usuário DEVE confirmar antes de assumir requisição de outro usuário.
- **Informações Exibidas**:
  - Nome do usuário anterior
  - Data/hora de início
  - Aviso de notificação
- **Código**: `frontend/static/js/recebimento.js:784-860`

#### Regra: Ações Disponíveis
- **Cancelar**: Fecha modal sem fazer nada
- **Assumir Requisição**: Transfere requisição para usuário atual

---

### 18.3. Processo de Transferência

#### Regra: Transferência Atômica
- **Descrição**: Transferência é uma transação atômica que:
  1. Atualiza `recebido_por` para novo usuário
  2. Registra no histórico de status
  3. Cria notificação para usuário anterior
- **Código**: `backend/operacao/services.py:526-609` (método `transferir_requisicao`)

```python
@transaction.atomic
def transferir_requisicao(cls, requisicao_id, novo_usuario, user_solicitante):
    requisicao = DadosRequisicao.objects.select_related(
        'recebido_por', 'status'
    ).get(id=requisicao_id)
    
    usuario_anterior = requisicao.recebido_por
    
    # 1. Transferir
    requisicao.recebido_por = novo_usuario
    requisicao.updated_by = user_solicitante
    requisicao.save()
    
    # 2. Histórico
    RequisicaoStatusHistorico.objects.create(
        requisicao=requisicao,
        cod_req=requisicao.cod_req,
        status=requisicao.status,
        usuario=novo_usuario,
        observacao=f'Requisição transferida de {usuario_anterior.username} para {novo_usuario.username}',
    )
    
    # 3. Notificação
    Notificacao.objects.create(
        usuario=usuario_anterior,
        tipo='TRANSFERENCIA',
        titulo='Requisição Transferida',
        mensagem=f'A requisição {requisicao.cod_req} foi assumida por {novo_usuario.get_full_name() or novo_usuario.username}.',
        dados={
            'cod_req': requisicao.cod_req,
            'cod_barras': requisicao.cod_barras_req,
            'requisicao_id': requisicao.id,
            'novo_usuario': novo_usuario.username,
            'novo_usuario_nome': novo_usuario.get_full_name() or novo_usuario.username,
        },
    )
```

#### Regra: Status Permitidos
- **Descrição**: Apenas requisições com status `1` (ABERTO NTO) ou `10` (EM TRÂNSITO) podem ser transferidas.
- **Validação**: Backend valida antes de transferir.
- **Mensagem**: "Requisição com status X não pode ser transferida."
- **Código**: `backend/operacao/services.py:549-554`

```python
if requisicao.status.codigo not in ['1', '10']:  # ABERTO NTO ou EM TRÂNSITO
    return {
        'status': 'error',
        'message': f'Requisição com status {requisicao.status.descricao} não pode ser transferida.',
    }
```

---

### 18.4. Notificação de Transferência

#### Regra: Criação Automática
- **Descrição**: Ao transferir requisição, sistema cria notificação automaticamente para usuário anterior.
- **Conteúdo**:
  - **Tipo**: TRANSFERENCIA
  - **Título**: "Requisição Transferida"
  - **Mensagem**: "A requisição {cod_req} foi assumida por {novo_usuario}."
  - **Dados**: JSON com:
    - `cod_req` - Código da requisição
    - `cod_barras` - Código de barras
    - `requisicao_id` - ID da requisição
    - `novo_usuario` - Username do novo usuário
    - `novo_usuario_nome` - Nome completo do novo usuário
- **Código**: `backend/operacao/services.py:570-583`

#### Regra: Visualização da Notificação
- **Descrição**: Usuário anterior verá notificação:
  - No badge do sininho (contador atualizado)
  - No modal de notificações (ao abrir)
- **Timing**: Imediatamente após transferência (verificação sob demanda)

---

### 18.5. Impacto no Grid

#### Regra: Requisição Removida do Grid Original
- **Descrição**: Após transferência, requisição NÃO aparece mais no grid do usuário anterior.
- **Motivo**: `recebido_por` foi alterado para novo usuário.
- **Comportamento**: Ao recarregar página, grid estará atualizado.

#### Regra: Requisição Adicionada ao Grid Novo
- **Descrição**: Requisição aparece no grid do novo usuário após transferência.
- **Código**: Query filtra por `recebido_por=request.user`

---

### 18.6. Histórico de Transferências

#### Regra: Rastreamento Completo
- **Descrição**: Toda transferência é registrada no `RequisicaoStatusHistorico`.
- **Observação**: "Requisição transferida de {usuario_anterior} para {novo_usuario}"
- **Auditoria**: Permite rastrear todas as transferências de uma requisição.
- **Código**: `backend/operacao/services.py:561-568`

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

**Última Atualização**: 17/12/2025  
**Versão**: 1.4  
**Responsável**: Equipe de Desenvolvimento FEMME INTEGRA

---

## 🔄 HISTÓRICO DE ALTERAÇÕES

### Versão 1.4 (17/12/2025)
- **Nova seção**: 4. Triagem - Etapa 1 (Validação de Amostras)
  * Digitalização obrigatória antes de validar amostras
  * Data de validade obrigatória (condicional)
  * Motivos de armazenamento inadequado
  * 6 flags de impeditivos com regras específicas
  * Data de validade expirada (90 dias)
  * Status de rejeição por unidade (CAIXA BO/BARRADOS)
  * Conclusão automática da etapa
- **Nova seção**: 5. Triagem - Etapa 2 (Finalização)
  * Tipos de pendência
  * Registro de pendências
  * Atualização de status para TRIAGEM2-OK
- **Nova seção**: 6. Triagem - Etapa 3 (Cadastro)
  * Exclusão/Adição de amostras com auditoria
  * Código de barras da amostra DEVE ser igual ao da requisição
  * Tipos de amostra
  * Cadastro final com flags de problema (CPF/Médico)
  * Fluxo para pendências ou cadastrada
- **Nova seção**: 7. Integração Korus CPF
  * Variáveis de ambiente
  * Token por requisição (sem cache)
  * Mapeamento de campos da API
  * Salvamento automático na requisição
  * Tratamento de CPF não encontrado
- **Nova seção**: 8. Upload de Arquivos
  * Tipos de arquivo
  * Verificação de existência
  * Obrigatoriedade na triagem
- **Renumeração**: Seções 4-13 renumeradas para 9-18
- **Atualização**: Mais de 50 novas regras de negócio documentadas

### Versão 1.3 (09/12/2025)
- **Nova seção**: 2. Página de Triagem - Regras de localização e digitalização de requisições
- **Nova seção**: 3. Scanner Dynamsoft - Documentação completa de todas as regras do scanner
  * 3.1. Inicialização do Scanner
  * 3.2. Seleção de Scanner
  * 3.3. Configurações de Digitalização
  * 3.4. Processo de Digitalização
  * 3.5. Manipulação de Imagens
  * 3.6. Segurança do Scanner
  * 3.7. Acessibilidade
  * 3.8. Performance
  * 3.9. Envio para AWS (Pendente)
- **Renumeração**: Seções antigas 2-11 renumeradas para 4-13
- **Documentação**: 9 subseções com 30+ regras de negócio do scanner
- **Referências**: Todas as regras incluem localização exata no código

### Versão 1.2 (08/12/2024)
- **Alteração**: Geração de código de requisição mudou de sequencial baseado em data (`REQ-YYYYMMDD-NNNN`) para código alfanumérico aleatório (10 caracteres)
- **Alteração**: `LogRecebimento` agora é criado apenas ao finalizar kit (status RECEBIDO), não mais ao receber a requisição
- **Alteração**: Validação de duplicidade agora verifica status RECEBIDO (código '2') ao invés de `LogRecebimento`
- **Alteração**: Validação de códigos iguais agora é OBRIGATÓRIA (bloqueante), não mais apenas recomendada
- **Nova funcionalidade**: Busca de código de barras agora identifica requisições já iniciadas pelo mesmo usuário ou por outros usuários
- **Nova funcionalidade**: Sistema de transferência de requisições entre usuários com notificação automática
- **Nova funcionalidade**: Requisições em trânsito agora retornam mais dados (unidade_id, origem_id, portador_representante_id e nome)
- Atualização de todas as referências de código para refletir linhas corretas do arquivo `services.py`

### Versão 1.1 (07/12/2024)
- Documentação inicial das regras de negócio
