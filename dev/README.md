# 🛠️ Pasta de Desenvolvimento e Testes

Esta pasta contém arquivos auxiliares para desenvolvimento, testes e validações do projeto FEMME Integra.

## 📁 Estrutura

```
dev/
├── toggle_sidebar_fixo.sh  # Script para ativar/desativar sidebar fixo
├── tests/                  # Arquivos de teste
│   ├── scanner/            # Testes do scanner Dynamsoft
│   ├── database/           # Scripts de banco de dados
│   └── fixtures/           # Dados de teste (fixtures)
└── docs/                   # Documentação de desenvolvimento
```

---

## 🔧 Scripts Úteis

### `toggle_sidebar_fixo.sh`
Script bash para ativar/desativar o sidebar fixo (sticky) na interface.

**Uso:**
```bash
# Ver status atual
./dev/toggle_sidebar_fixo.sh status

# Ativar sidebar fixo
./dev/toggle_sidebar_fixo.sh ativar

# Desativar sidebar fixo
./dev/toggle_sidebar_fixo.sh desativar

# Restaurar backup original
./dev/toggle_sidebar_fixo.sh restaurar
```

**O que faz:**
- Modifica `frontend/static/css/base_app.css`
- Cria backup automático antes de modificar
- Comenta/descomenta a linha CSS do sidebar sticky
- Requer recarregar página com Ctrl+F5 após mudança

---

## 🐍 Comandos Django Úteis

### Criar Requisição de Teste
Cria requisição de teste com código de barras `999` para validação de fluxos.

```bash
# Criar requisição de teste
python3 manage.py criar_requisicao_teste

# Limpar requisições antigas e criar nova
python3 manage.py criar_requisicao_teste --limpar
```

**Detalhes:**
- Código de barras: `999`
- Status: Em trânsito (ABERTO_NTO)
- Útil para testar fluxo de recebimento
- Arquivo: `backend/operacao/management/commands/criar_requisicao_teste.py`

### Outros Comandos Úteis
```bash
# Criar superusuário
python3 manage.py createsuperuser

# Fazer migrations
python3 manage.py makemigrations
python3 manage.py migrate

# Limpar cache
python3 manage.py shell
>>> from django.core.cache import cache
>>> cache.clear()

# Exportar dados para fixture
python3 manage.py dumpdata operacao.Requisicao --indent 2 > dev/tests/fixtures/requisicoes.json

# Importar fixture
python3 manage.py loaddata dev/tests/fixtures/requisicoes.json
```

---

## 📂 Subpastas

### `tests/scanner/`
Arquivos HTML para testar funcionalidades do scanner Dynamsoft:
- `test_scanner.html` - Teste básico do scanner
- `test_scanner_v2.html` - Teste com layout melhorado
- `test_scanner_final.html` - Teste completo com todas as funcionalidades

**Como usar:**
1. Certifique-se de que o servidor Django está rodando
2. Acesse via URL: `http://localhost:8000/dev/tests/scanner/test_scanner.html`
3. Ou abra diretamente no navegador (algumas funcionalidades podem não funcionar)

### `tests/database/`
Scripts para popular banco de dados, criar registros de teste, etc.

**Exemplos de uso:**
- Scripts SQL para criar dados de teste
- Scripts Python para popular modelos Django
- Fixtures JSON para importar dados

### `tests/fixtures/`
Arquivos de dados de teste (JSON, CSV, etc.) para popular o sistema.

**Exemplos:**
- `requisicoes_teste.json` - Requisições de exemplo
- `usuarios_teste.json` - Usuários de teste
- `portadores_teste.csv` - Lista de portadores

### `docs/`
Documentação técnica, backups de código, notas de desenvolvimento.

**Conteúdo:**
- `BACKUP_MODAL_FUNCIONANDO.md` - Backup do código do modal de scanner
- Diagramas de arquitetura
- Notas de implementação
- Decisões técnicas

---

## ⚠️ IMPORTANTE

**Esta pasta NÃO deve ir para produção!**

Adicione ao `.gitignore` se necessário:
```
# Arquivos de desenvolvimento
/dev/tests/database/*.sql
/dev/tests/fixtures/*.csv
```

Ou mantenha no Git para compartilhar com a equipe (recomendado para testes).

---

## 🚀 Boas Práticas

1. **Nomeie arquivos claramente**: `test_funcionalidade_descricao.html`
2. **Documente o propósito**: Adicione comentários no início dos arquivos
3. **Mantenha organizado**: Cada tipo de teste em sua subpasta
4. **Limpe regularmente**: Remova testes obsoletos
5. **Compartilhe**: Commit testes úteis para a equipe

---

## 📝 Exemplos de Uso

### Criar script de teste de banco:
```bash
# Criar arquivo SQL
touch dev/tests/database/popular_requisicoes.sql

# Executar
psql -U usuario -d femme_integra < dev/tests/database/popular_requisicoes.sql
```

### Criar fixture JSON:
```bash
# Exportar dados
python manage.py dumpdata operacao.Requisicao --indent 2 > dev/tests/fixtures/requisicoes.json

# Importar dados
python manage.py loaddata dev/tests/fixtures/requisicoes.json
```

### Adicionar novo teste de scanner:
```bash
# Copiar template
cp dev/tests/scanner/test_scanner.html dev/tests/scanner/test_nova_funcionalidade.html

# Editar e testar
# Acessar: http://localhost:8000/dev/tests/scanner/test_nova_funcionalidade.html
```

---

## 🤝 Contribuindo

Ao adicionar novos arquivos de teste:
1. Coloque na subpasta apropriada
2. Adicione comentários explicativos
3. Atualize este README se necessário
4. Commit com mensagem descritiva

---

**Última atualização:** Dezembro 2025
