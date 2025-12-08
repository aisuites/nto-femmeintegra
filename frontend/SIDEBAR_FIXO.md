# 📌 Sidebar Fixo - Guia de Ativação/Desativação

## 🎯 Objetivo

Este documento explica como ativar ou desativar o **sidebar fixo** (sticky) de forma rápida e reversível.

---

## ✅ Como ATIVAR o Sidebar Fixo

### Passo 1: Abrir o arquivo CSS
```
frontend/static/css/base_app.css
```

### Passo 2: Localizar a seção (linha ~222)
Procure por:
```css
/* DESCOMENTE A LINHA ABAIXO PARA ATIVAR SIDEBAR FIXO */
/* .sidebar { position: sticky; top: 88px; align-self: flex-start; max-height: calc(100vh - 108px); overflow-y: auto; } */
```

### Passo 3: Descomentar a linha
Remova os `/* */` da linha:

**ANTES:**
```css
/* .sidebar { position: sticky; top: 88px; align-self: flex-start; max-height: calc(100vh - 108px); overflow-y: auto; } */
```

**DEPOIS:**
```css
.sidebar { position: sticky; top: 88px; align-self: flex-start; max-height: calc(100vh - 108px); overflow-y: auto; }
```

### Passo 4: Salvar e recarregar
- Salve o arquivo
- Recarregue a página (Ctrl+F5 ou Cmd+Shift+R para limpar cache)

---

## ❌ Como DESATIVAR o Sidebar Fixo

### Reverter a mudança
Basta **comentar novamente** a linha:

**ANTES (ativo):**
```css
.sidebar { position: sticky; top: 88px; align-self: flex-start; max-height: calc(100vh - 108px); overflow-y: auto; }
```

**DEPOIS (desativado):**
```css
/* .sidebar { position: sticky; top: 88px; align-self: flex-start; max-height: calc(100vh - 108px); overflow-y: auto; } */
```

---

## 🔍 O que muda quando ativado?

### Comportamento ANTES (sidebar normal)
- Sidebar rola junto com a página
- Desaparece quando você scrolla para baixo

### Comportamento DEPOIS (sidebar fixo)
- ✅ Sidebar fica **fixo na tela** ao fazer scroll
- ✅ Sempre visível, mesmo em páginas longas
- ✅ Navegação mais rápida entre seções
- ✅ Scrollbar própria se o conteúdo do sidebar for maior que a tela

---

## 🎨 Detalhes Técnicos

### Propriedades aplicadas:
```css
position: sticky;           /* Fixa o elemento ao fazer scroll */
top: 88px;                  /* Distância do topo (altura do header) */
align-self: flex-start;     /* Alinha ao topo do container */
max-height: calc(100vh - 108px); /* Altura máxima (viewport - header - padding) */
overflow-y: auto;           /* Scroll interno se necessário */
```

### Scrollbar customizada:
- Largura: 6px
- Cor: roxo FEMME com transparência
- Efeito hover: escurece levemente

---

## 📱 Responsividade

O sidebar fixo **NÃO afeta mobile** (telas < 720px):
- Em mobile, o sidebar continua aparecendo abaixo do conteúdo
- A propriedade `sticky` é ignorada automaticamente no layout mobile

---

## 🧪 Teste Rápido

1. Ative o sidebar fixo
2. Abra qualquer página (ex: Recebimento)
3. Role a página para baixo
4. **Resultado esperado**: Sidebar permanece visível no lado esquerdo

---

## 🔄 Reversão de Emergência

Se algo der errado:

### Opção 1: Via Git (se commitado)
```bash
git checkout frontend/static/css/base_app.css
```

### Opção 2: Manual
Simplesmente **comente a linha** novamente (adicione `/* */`)

### Opção 3: Backup
Mantenha uma cópia do arquivo original:
```bash
cp frontend/static/css/base_app.css frontend/static/css/base_app.css.backup
```

---

## 💡 Dicas

### Ajustar a posição do topo
Se o sidebar ficar muito alto ou baixo, ajuste o valor `top`:
```css
top: 88px;  /* Aumente ou diminua este valor */
```

### Ajustar a altura máxima
Se o sidebar ficar muito alto ou baixo, ajuste o cálculo:
```css
max-height: calc(100vh - 108px);  /* Ajuste o valor subtraído */
```

### Desativar scrollbar customizada
Se preferir a scrollbar padrão do navegador, comente as regras:
```css
/* .sidebar::-webkit-scrollbar { ... } */
```

---

## 📊 Comparação Visual

| Aspecto | Sidebar Normal | Sidebar Fixo |
|---------|---------------|--------------|
| Visibilidade ao scroll | ❌ Desaparece | ✅ Sempre visível |
| Navegação rápida | ⚠️ Precisa voltar ao topo | ✅ Sempre acessível |
| Performance | ✅ Leve | ✅ Leve (CSS puro) |
| Mobile | ✅ Funciona | ✅ Funciona (ignora sticky) |
| Reversão | - | ✅ 1 linha de código |

---

## ✅ Checklist de Ativação

- [ ] Abrir `frontend/static/css/base_app.css`
- [ ] Localizar linha ~222
- [ ] Descomentar a linha do `.sidebar { position: sticky; ... }`
- [ ] Salvar arquivo
- [ ] Recarregar página com Ctrl+F5
- [ ] Testar scroll na página
- [ ] Verificar se sidebar permanece visível

---

## 🆘 Problemas Comuns

### Sidebar não fica fixo
- ✅ Verificar se a linha foi descomentada corretamente
- ✅ Limpar cache do navegador (Ctrl+Shift+Delete)
- ✅ Verificar se não há outro CSS sobrescrevendo

### Sidebar fica cortado
- ✅ Ajustar `max-height` para valor menor
- ✅ Verificar se há padding/margin extra

### Scrollbar não aparece
- ✅ Normal se o conteúdo do sidebar couber na tela
- ✅ Adicionar mais itens ao menu para testar

---

**Última atualização**: 08/12/2024  
**Versão**: 1.0  
**Responsável**: Equipe de Desenvolvimento FEMME INTEGRA
