# ✅ Dados Iniciais Populados no Banco

## Data: 07/12/2025

---

## 📋 Status de Requisição (8 registros)

| Código | Descrição         | Ordem | Permite Edição |
|--------|-------------------|-------|----------------|
| 1      | ABERTO NTO        | 1     | ✅ Sim         |
| 2      | RECEBIDO          | 2     | ✅ Sim         |
| 3      | CAIXA LIDERANÇA   | 3     | ✅ Sim         |
| 4      | CAIXA BO          | 4     | ✅ Sim         |
| 5      | CAIXA BARRADOS    | 5     | ✅ Sim         |
| 6      | PENDÊNCIA         | 6     | ✅ Sim         |
| 7      | TRIAGEM1-OK       | 7     | ❌ Não         |
| 8      | TRIAGEM2-OK       | 8     | ❌ Não         |

**Observações:**
- Status 1 (ABERTO NTO) é o status inicial ao criar uma requisição
- Status 7 e 8 (TRIAGEM) não permitem edição manual

---

## 🏢 Origens - Papabrasil (14 registros)

| Código | Descrição                        | Tipo       | Ativo |
|--------|----------------------------------|------------|-------|
| 1      | FEMME                            | PAPABRASIL | ✅    |
| 16     | PP BRASIL RIO DE JANEIRO         | PAPABRASIL | ✅    |
| 17     | PP BRASIL CURITIBA               | PAPABRASIL | ✅    |
| 18     | PP BRASIL SALVADOR               | PAPABRASIL | ✅    |
| 19     | PP BRASIL RIBEIRÃO PRETO         | PAPABRASIL | ✅    |
| 20     | PP BRASIL PORTO ALEGRE           | PAPABRASIL | ✅    |
| 21     | PP BRASIL RECIFE                 | PAPABRASIL | ✅    |
| 22     | PP BRASIL BRASÍLIA               | PAPABRASIL | ✅    |
| 23     | PP BRASIL PIRACABA               | PAPABRASIL | ✅    |
| 24     | PP BRASIL AMERICANA              | PAPABRASIL | ✅    |
| 25     | PP BRASIL LIMEIRA                | PAPABRASIL | ✅    |
| 26     | PP BRASIL BELO HORIZONTE         | PAPABRASIL | ✅    |
| 27     | PP BRASIL SANTA BARBARA D'OESTE  | PAPABRASIL | ✅    |
| 28     | PP BRASIL RIO CLARO              | PAPABRASIL | ✅    |

---

## 🔧 Como Usar o Comando

### Popular dados iniciais:
```bash
cd backend
python3 manage.py popular_dados_iniciais
```

### Limpar e repopular:
```bash
python3 manage.py popular_dados_iniciais --limpar
```

**Observação:** O comando usa `get_or_create`, então é seguro executar múltiplas vezes. Não criará duplicatas.

---

## 📁 Arquivo do Comando

**Local:** `/backend/operacao/management/commands/popular_dados_iniciais.py`

Este comando pode ser facilmente expandido para adicionar mais dados iniciais no futuro.

---

## ✅ Próximos Passos

Agora você pode:
1. ✅ Criar requisições no sistema
2. ✅ Testar o fluxo de recebimento
3. ✅ Visualizar os status no Admin
4. ✅ Configurar portadores/representantes para cada origem

---

## 🎯 Dados Ainda Necessários

Para o sistema funcionar completamente, você ainda precisa criar:
- **Unidades** (já criadas: 09 - EXTERNOS e outras 2)
- **Portadores/Representantes** (vincular às origens e unidades)
- **Motivos de Preenchimento** (opcional)
- **Motivos de Status Manual** (opcional)

Esses podem ser criados diretamente pelo Django Admin.
