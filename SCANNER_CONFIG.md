# 📄 Configuração do Scanner Dynamsoft Web TWAIN

## 🔐 Segurança da Licença

A licença do Dynamsoft Web TWAIN **NÃO deve ser commitada** diretamente no código.

### ✅ Configuração Correta

1. **Adicione a licença no arquivo `.env`**:
```bash
DYNAMSOFT_LICENSE_KEY=sua-licenca-aqui
```

2. **A licença é lida automaticamente** pelo Django via `settings.py`:
```python
DYNAMSOFT_LICENSE_KEY = os.getenv('DYNAMSOFT_LICENSE_KEY', '')
```

3. **O template recebe a licença via context** de forma segura:
```python
# views.py
context['dynamsoft_license_key'] = settings.DYNAMSOFT_LICENSE_KEY
```

4. **O frontend usa a variável do template**:
```javascript
Dynamsoft.DWT.ProductKey = "{{ dynamsoft_license_key }}";
```

---

## 📝 Arquivo `.env.example`

O arquivo `.env.example` contém um **exemplo** da licença para referência:

```bash
# Dynamsoft Web TWAIN SDK License Key
# Get your license at: https://www.dynamsoft.com/customer/license/trialLicense?product=dwt
DYNAMSOFT_LICENSE_KEY=t0198EQYAAC85uPzYjPrtpR1M4qS08Da//YOLeL6P1D9WoRjAV1luvJcJ233wTWtMhLBKx/oQ5raLVcuM5IcuR9Ib72oaedRHvO6cHODU/Z1R3NeJAU4+copM8dOn21bHvDiBOzCnxb7P4QegBFIuF2Ax5+idIQPYAnQD0K0c0AKqu/g7/COZypk+udDo5ACn7u8sC6SPEwOcfOQMBWK9qC3sdksFgvLlZABbgK4CcV1IpUDkCrAF6CqwXKqYGSDWkPTefACb6jd8
```

---

## 🔄 Fluxo de Configuração

```
.env (não commitado)
    ↓
settings.py (lê do .env)
    ↓
views.py (passa para context)
    ↓
triagem.html (renderiza no JavaScript)
    ↓
Dynamsoft SDK (usa a licença)
```

---

## ⚠️ Importante

- ✅ **`.env`** - Contém a licença real (não commitado)
- ✅ **`.env.example`** - Exemplo para referência (commitado)
- ✅ **`.gitignore`** - Garante que `.env` não seja commitado
- ❌ **Nunca commite** a licença diretamente no código

---

## 🔑 Como Obter uma Licença

1. Acesse: https://www.dynamsoft.com/customer/license/trialLicense?product=dwt
2. Crie uma conta ou faça login
3. Solicite uma licença trial (30 dias)
4. Copie a licença gerada
5. Cole no arquivo `.env`

---

## 🧪 Testando

Após configurar a licença:

1. Reinicie o servidor Django
2. Acesse: http://127.0.0.1:8000/operacao/triagem/
3. Localize uma requisição
4. Clique no botão "📠 SCANNER"
5. O Dynamsoft deve carregar sem erros de licença

---

## 🐛 Troubleshooting

### Erro: "License expired" ou "Invalid license"

**Solução**: Verifique se:
- A licença está correta no `.env`
- O servidor Django foi reiniciado após adicionar a licença
- A licença não expirou (trial = 30 dias)

### Erro: "ProductKey is empty"

**Solução**: 
- Verifique se a variável `DYNAMSOFT_LICENSE_KEY` está no `.env`
- Certifique-se que o `.env` está na raiz do projeto
- Reinicie o servidor Django

---

## 📦 Arquivos Relacionados

- `.env` - Licença real (não commitado)
- `.env.example` - Exemplo de configuração
- `backend/femme_integra/settings.py` - Lê a licença do .env
- `backend/operacao/views.py` - Passa licença para template
- `frontend/templates/operacao/triagem.html` - Usa a licença
- `frontend/static/dynamsoft/dynamsoft.webtwain.config.js` - Configuração do SDK (licença removida)

---

## 🔒 Auditoria de Segurança

### ✅ Dados Movidos para `.env`

1. **Dynamsoft License Key** - Licença do scanner
2. **AWS API Gateway URL** - Endpoint para gerar URLs pré-assinadas
3. **CloudFront URLs** - URLs de distribuição (prod e dev)

### ❌ Dados Removidos do Código

- ✅ Licença Dynamsoft removida de `dynamsoft.webtwain.config.js`
- ✅ URLs AWS/CloudFront removidas de `settings.py`
- ✅ Todas as credenciais agora vêm do `.env`

---

**Última atualização**: 08/12/2024
