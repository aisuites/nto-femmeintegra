# 📋 Backlog de Funcionalidades - FEMME Integra

> **Última atualização**: 09/12/2025  
> **Versão**: 2.0

---

## 🎯 Como usar este arquivo

- ✅ **Concluído** - Funcionalidade implementada e testada
- 🚧 **Em Desenvolvimento** - Trabalho em andamento
- 📌 **Planejado** - Definido mas não iniciado
- 💡 **Ideia** - Sugestão para avaliação futura
- ⚠️ **Bloqueado** - Depende de outra funcionalidade

---

## ✅ CONCLUÍDOS RECENTEMENTE (Dezembro 2025)

### ✅ Página de Triagem com Scanner Dynamsoft
**Status**: ✅ Concluído  
**Data**: 09/12/2025  
**Commits**: `ba820d5`, `4968318`, `c79c49e`, `1d55405`, `38854bf`, `def856d`  
**Descrição**: Implementação completa da página de triagem com integração do scanner Dynamsoft Web TWAIN.

**Funcionalidades implementadas:**
- ✅ Modal de scanner elegante e responsivo
- ✅ Integração com Dynamsoft Web TWAIN SDK
- ✅ Seleção de scanner conectado
- ✅ Digitalização direta sem popup intermediário
- ✅ Toolbar com zoom, rotação, remoção de páginas
- ✅ Visualização de múltiplas páginas
- ✅ Tratamento de erro timeout (-2415)
- ✅ Segurança: código encapsulado (IIFE), sem onclick inline
- ✅ Performance: CSS externo cacheável
- ✅ Acessibilidade: ARIA labels, suporte à tecla ESC
- ✅ Constantes para magic numbers
- ✅ Sanitização de inputs (proteção XSS)

**Arquivos criados/modificados:**
- `frontend/templates/operacao/triagem.html`
- `frontend/static/css/scanner-modal.css`
- `frontend/static/css/triagem.css`
- `frontend/static/js/triagem.js`

**Documentação:**
- `SCANNER_CONFIG.md`
- `REGRAS_NEGOCIO.md` (a atualizar)

---

### ✅ Refatoração e Limpeza do Projeto
**Status**: ✅ Concluído  
**Data**: 09/12/2025  
**Commits**: `bb0ac96`, `c05b577`, `8457879`, `cce10d8`  
**Descrição**: Reorganização completa da estrutura de arquivos e documentação.

**Ações realizadas:**
- ✅ Criada estrutura `/dev` para testes e desenvolvimento
- ✅ Removidos 5 arquivos CSS desnecessários (112 KB)
- ✅ Removidos 2 arquivos JS desnecessários (80 KB)
- ✅ Movidos 11 arquivos .md técnicos para `/dev/docs`
- ✅ Consolidado `GUIA_DESENVOLVIMENTO.md` (v3.0)
- ✅ Documentação organizada e atualizada
- ✅ Total economizado: 192 KB (54% de redução)

**Estrutura criada:**
```
dev/
├── README.md
├── tests/
│   ├── scanner/
│   ├── database/
│   └── fixtures/
└── docs/
    └── [documentos técnicos]
```

---

## 🔴 ALTA PRIORIDADE

### 📌 Upload de Imagens do Scanner para AWS S3
**Status**: Planejado  
**Localização**: `frontend/templates/operacao/triagem.html` (botão "Enviar para AWS")  
**Descrição**: Implementar upload das imagens digitalizadas pelo scanner Dynamsoft para AWS S3.

**Requisitos:**
- [ ] Converter imagens do buffer Dynamsoft para formato adequado (JPEG/PNG/PDF)
- [ ] Implementar endpoint backend para receber imagens
- [ ] Upload para bucket S3 configurado
- [ ] Vincular imagens à requisição no banco de dados
- [ ] Feedback visual de progresso do upload
- [ ] Tratamento de erros (falha de rede, S3 indisponível)
- [ ] Validação de tamanho máximo de arquivo
- [ ] Compressão de imagens se necessário

**Dependências:**
- ✅ Scanner Dynamsoft implementado
- Configuração de bucket S3 (credenciais, permissões)
- Modelo de dados para armazenar referências das imagens

**Estimativa**: 2-3 dias

**Referências:**
- Dynamsoft: `DWTObject.ConvertToBlob()` ou `DWTObject.HTTPUpload()`
- AWS SDK: `boto3` para Python
- Service existente: `core/services/s3.py`

---

### 📌 Fluxo "Registrar Problema" - Modal de Divergência
**Status**: Planejado  
**Localização**: `frontend/static/js/recebimento.js` (linha ~516)  
**Descrição**: Implementar o fluxo completo quando usuário clica em "Registrar Problema" após detectar divergência de códigos de barras.

**Requisitos a definir:**
- [ ] Qual tipo de problema será registrado?
- [ ] Criar nova tabela no banco? (ex: `ProblemaRecebimento`)
- [ ] Campos necessários: descrição, tipo, anexos?
- [ ] Notificar alguém? (email, dashboard)
- [ ] Status do problema (aberto, em análise, resolvido)
- [ ] Quem pode resolver problemas?

**Dependências:**
- Definição do modelo de dados
- Definição do fluxo de aprovação/resolução

**Estimativa**: 2-3 dias (após definições)

---

## 🟡 MÉDIA PRIORIDADE

### 📌 Finalizar Recebimento - Implementação Completa
**Status**: Planejado  
**Localização**: `frontend/static/js/recebimento.js` (linha ~285), `backend/operacao/views.py` (RecebimentoFinalizarView)  
**Descrição**: Implementar o que acontece quando usuário clica em "Finalizar Recebimento".

**Requisitos a definir:**
- [ ] O que significa "finalizar"? (mudar status, gerar lote, imprimir etiqueta?)
- [ ] Validações necessárias antes de finalizar
- [ ] Gerar número de lote automaticamente?
- [ ] Imprimir relatório/etiqueta?
- [ ] Limpar sessão/cache após finalizar?
- [ ] Redirecionar para onde?

**Dependências:**
- Definição de regras de negócio

**Estimativa**: 1-2 dias (após definições)

---

### 📌 Botão "Salvar Rascunho"
**Status**: Planejado  
**Localização**: `frontend/templates/operacao/recebimento.html` (linha ~167)  
**Descrição**: Permitir salvar o kit parcialmente preenchido para continuar depois.

**Requisitos a definir:**
- [ ] Salvar em sessão ou banco de dados?
- [ ] Expiração do rascunho (24h, 7 dias?)
- [ ] Listar rascunhos salvos em algum lugar?
- [ ] Permitir múltiplos rascunhos por usuário?

**Dependências:**
- Nenhuma

**Estimativa**: 1 dia

---

### 📌 Botão "Cancelar Kit"
**Status**: Planejado  
**Localização**: `frontend/templates/operacao/recebimento.html` (linha ~166)  
**Descrição**: Cancelar o kit atual e limpar todos os dados.

**Requisitos a definir:**
- [ ] Confirmar antes de cancelar?
- [ ] Deletar requisições já criadas ou apenas limpar interface?
- [ ] Registrar log de cancelamento?

**Dependências:**
- Nenhuma

**Estimativa**: 4 horas

---

## 🟢 BAIXA PRIORIDADE

### 💡 Histórico de Alterações de Status
**Status**: Ideia  
**Localização**: Modelo `RequisicaoStatusHistorico` já existe  
**Descrição**: Interface para visualizar histórico completo de mudanças de status de uma requisição.

**Requisitos a definir:**
- [ ] Onde exibir? (modal, página separada?)
- [ ] Filtros por data, usuário, status?
- [ ] Exportar histórico?

**Estimativa**: 1 dia

---

### 💡 Dashboard de Estatísticas
**Status**: Ideia  
**Localização**: `backend/core/views.py` (DashboardView já existe)  
**Descrição**: Expandir dashboard com mais métricas e gráficos.

**Possíveis métricas:**
- [ ] Requisições por período (dia, semana, mês)
- [ ] Tempo médio de processamento
- [ ] Problemas mais frequentes
- [ ] Unidades mais ativas
- [ ] Gráficos interativos

**Estimativa**: 2-3 dias

---

### 💡 Notificações em Tempo Real
**Status**: Ideia  
**Descrição**: Notificar usuários sobre eventos importantes.

**Possíveis eventos:**
- [ ] Nova requisição atribuída
- [ ] Problema registrado
- [ ] Status alterado
- [ ] Kit finalizado

**Tecnologias sugeridas:**
- WebSockets (Django Channels)
- Server-Sent Events (SSE)
- Polling simples

**Estimativa**: 3-5 dias

---

### 💡 Exportação de Relatórios
**Status**: Ideia  
**Descrição**: Exportar dados em diferentes formatos.

**Formatos:**
- [ ] Excel (.xlsx)
- [ ] PDF
- [ ] CSV

**Relatórios possíveis:**
- [ ] Requisições por período
- [ ] Problemas registrados
- [ ] Estatísticas por unidade

**Estimativa**: 2 dias

---

### 💡 Integração com Sistema de Etiquetas
**Status**: Ideia  
**Descrição**: Imprimir etiquetas com código de barras.

**Requisitos a definir:**
- [ ] Impressora térmica ou comum?
- [ ] Layout da etiqueta
- [ ] Biblioteca de impressão (reportlab, weasyprint?)
- [ ] Imprimir individual ou em lote?

**Estimativa**: 2-3 dias

---

## 🔧 MELHORIAS TÉCNICAS

### 💡 Testes Automatizados
**Status**: Ideia  
**Descrição**: Criar suite de testes para garantir qualidade.

**Tipos de testes:**
- [ ] Testes unitários (models, services)
- [ ] Testes de integração (views, APIs)
- [ ] Testes E2E (Playwright, Selenium)

**Estimativa**: 5-7 dias

---

### 💡 CI/CD Pipeline
**Status**: Ideia  
**Descrição**: Automatizar deploy e testes.

**Ferramentas:**
- [ ] GitHub Actions
- [ ] Docker
- [ ] Deploy automático (Heroku, AWS, etc)

**Estimativa**: 2-3 dias

---

### 💡 Monitoramento e Logs
**Status**: Ideia  
**Descrição**: Implementar monitoramento em produção.

**Ferramentas sugeridas:**
- [ ] Sentry (erros)
- [ ] New Relic (performance)
- [ ] ELK Stack (logs)

**Estimativa**: 2 dias

---

## 📝 NOTAS E OBSERVAÇÕES

### Convenções de Status
- Use ✅ quando implementar algo
- Mova itens concluídos para seção "Concluídos" no final
- Adicione data de conclusão
- Mantenha link para commit/PR

### Como Adicionar Nova Pendência
```markdown
### 📌 [Título da Funcionalidade]
**Status**: Planejado | Em Desenvolvimento | Bloqueado  
**Localização**: `caminho/do/arquivo.ext` (linha X)  
**Descrição**: Breve descrição do que precisa ser feito.

**Requisitos a definir:**
- [ ] Item 1
- [ ] Item 2

**Dependências:**
- Nome de outra funcionalidade

**Estimativa**: X dias
```

---

## 🔴 ALTA PRIORIDADE

### 📌 Sistema de Cadastro de Requisições por Representantes
**Status**: Planejado  
**Localização**: A definir  
**Descrição**: Sistema para representantes cadastrarem requisições que ficarão com status 10 (EM TRÂNSITO) até serem recebidas no NTO.

**Requisitos a definir:**
- [ ] Interface web ou app mobile?
- [ ] Autenticação de representantes
- [ ] Campos obrigatórios do cadastro
- [ ] Upload de fotos/documentos?
- [ ] Validações de dados
- [ ] Notificação ao NTO quando cadastrar

**Dependências:**
- Nenhuma (fluxo de recebimento já está pronto)

**Estimativa**: 5-7 dias

---

## ✅ CONCLUÍDOS

### ✅ Recebimento de Requisições em Trânsito (Status 10)
**Concluído em**: 07/12/2024  
**Commit**: `[pendente]`  
**Descrição**: Implementado fluxo completo para receber requisições já cadastradas com status 10 (EM TRÂNSITO). Sistema detecta automaticamente, valida amostras cadastradas vs bipadas, atualiza status para 1 (ABERTO NTO), adiciona recebido_por e cria histórico.

### ✅ Fluxo de Divergência de Códigos
**Concluído em**: 07/12/2024  
**Commit**: `0e5d06b`  
**Descrição**: Modal detecta divergência e oferece 3 opções (Cancelar, Bipar Novamente, Registrar Problema).

---

### ✅ Sistema de Cache com Redis
**Concluído em**: 06/12/2024  
**Descrição**: Cache implementado para Unidades e Portadores com comando de limpeza.

---

### ✅ Comando de Dados Iniciais
**Concluído em**: 06/12/2024  
**Descrição**: Comando `popular_dados_iniciais` para inserir StatusRequisicao e Origem.

---

### ✅ Refatoração de Nomes de Tabelas
**Concluído em**: 06/12/2024  
**Descrição**: Renomeação de DadosRequisicao → LogRecebimento e Requisicao → DadosRequisicao.

---

**Fim do Backlog**
