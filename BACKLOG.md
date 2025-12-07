# 📋 Backlog de Funcionalidades - FEMME Integra

> **Última atualização**: 07/12/2024  
> **Versão**: 1.0

---

## 🎯 Como usar este arquivo

- ✅ **Concluído** - Funcionalidade implementada e testada
- 🚧 **Em Desenvolvimento** - Trabalho em andamento
- 📌 **Planejado** - Definido mas não iniciado
- 💡 **Ideia** - Sugestão para avaliação futura
- ⚠️ **Bloqueado** - Depende de outra funcionalidade

---

## 🔴 ALTA PRIORIDADE

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

## ✅ CONCLUÍDOS

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
