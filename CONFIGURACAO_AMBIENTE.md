# 🌍 GUIA DE CONFIGURAÇÃO DE AMBIENTE (DEV/PROD)

## 📋 VISÃO GERAL

O sistema agora possui configuração **automática** de ambiente baseada em uma única variável.
Trocar entre DEV e PROD é **extremamente simples**!

---

## ⚡ CONFIGURAÇÃO RÁPIDA

### **1. Editar arquivo `.env`**

```bash
# Abra o arquivo .env na raiz do projeto
nano .env
```

### **2. Definir o ambiente**

```bash
# Para DESENVOLVIMENTO:
ENVIRONMENT=dev

# Para PRODUÇÃO:
ENVIRONMENT=prod
```

### **3. Configurar URLs AWS (já feito)**

```bash
# URLs DEV
AWS_SIGNED_URL_API_DEV=https://a5xel8q8ld.execute-api.us-east-1.amazonaws.com/dev/signed-url
CLOUDFRONT_URL_DEV=https://d3fdwvz6ilbr80.cloudfront.net

# URLs PROD
AWS_SIGNED_URL_API_PROD=https://a5xel8q8ld.execute-api.us-east-1.amazonaws.com/prod/signed-url
CLOUDFRONT_URL_PROD=https://d62ucrzqdbxhj.cloudfront.net
```

### **4. Reiniciar servidor Django**

```bash
# Parar servidor (CTRL+C)
# Iniciar novamente
cd backend
python manage.py runserver
```

**PRONTO!** ✅ O sistema automaticamente usará as URLs corretas.

---

## 🔄 COMO FUNCIONA

### **Detecção Automática**

Quando o servidor inicia, o módulo `core.config` automaticamente:

1. ✅ Lê a variável `ENVIRONMENT` do `.env`
2. ✅ Valida se é `dev` ou `prod`
3. ✅ Carrega as URLs corretas para o ambiente
4. ✅ Loga no console qual ambiente está ativo

### **Exemplo de Log ao Iniciar:**

```
================================================================================
🌍 AMBIENTE: DEV
   AWS Signed URL API: https://a5xel8q8ld.execute-api.us-east-1.amazonaws.com/dev/signed-url
   CloudFront URL: https://d3fdwvz6ilbr80.cloudfront.net
================================================================================
```

---

## 📊 COMPARAÇÃO DE AMBIENTES

| Aspecto | DEV | PROD |
|---------|-----|------|
| **ENVIRONMENT** | `dev` | `prod` |
| **AWS Lambda** | `/dev/signed-url` | `/prod/signed-url` |
| **CloudFront** | `d3fdwvz6ilbr80` | `d62ucrzqdbxhj` |
| **Debug Logs** | Mais verboso | Otimizado |
| **DJANGO_DEBUG** | `true` | `false` |

---

## 🎯 CENÁRIOS DE USO

### **Desenvolvimento Local**

```bash
ENVIRONMENT=dev
DJANGO_DEBUG=true
```

- Upload vai para bucket DEV
- CloudFront DEV
- Logs detalhados

### **Servidor de Homologação**

```bash
ENVIRONMENT=dev
DJANGO_DEBUG=false
```

- Upload vai para bucket DEV
- CloudFront DEV
- Logs otimizados

### **Produção**

```bash
ENVIRONMENT=prod
DJANGO_DEBUG=false
```

- Upload vai para bucket PROD
- CloudFront PROD
- Logs otimizados
- Segurança máxima

---

## 🔍 VERIFICAÇÃO

### **Como verificar qual ambiente está ativo:**

1. **No log do servidor Django:**
   ```
   Procure por: 🌍 AMBIENTE: DEV (ou PROD)
   ```

2. **No código Python:**
   ```python
   from core.config import get_environment_config
   
   config = get_environment_config()
   print(f"Ambiente: {config.environment}")
   print(f"É DEV? {config.is_dev}")
   print(f"É PROD? {config.is_prod}")
   ```

3. **Testar upload:**
   - Faça upload de um arquivo
   - Verifique o log: `Signed URL gerada: ...`
   - Confirme que a URL contém `/dev/` ou `/prod/`

---

## ⚠️ IMPORTANTE

### **Variáveis Obrigatórias no `.env`:**

```bash
# SEMPRE necessário
ENVIRONMENT=dev  # ou 'prod'

# Para DEV
AWS_SIGNED_URL_API_DEV=...
CLOUDFRONT_URL_DEV=...

# Para PROD
AWS_SIGNED_URL_API_PROD=...
CLOUDFRONT_URL_PROD=...
```

### **Se faltar alguma variável:**

O sistema vai:
1. ❌ Logar erro no console
2. ❌ Retornar erro 500 ao tentar upload
3. ✅ Continuar funcionando (outras partes do sistema)

---

## 🚀 DEPLOY PARA PRODUÇÃO

### **Checklist antes de ir para PROD:**

- [ ] Atualizar `.env` com `ENVIRONMENT=prod`
- [ ] Verificar `DJANGO_DEBUG=false`
- [ ] Confirmar URLs PROD configuradas
- [ ] Testar upload em ambiente de staging
- [ ] Verificar permissões S3 bucket PROD
- [ ] Confirmar CloudFront PROD funcionando
- [ ] Backup do banco de dados
- [ ] Monitoramento configurado

### **Comando de deploy:**

```bash
# 1. Atualizar código
git pull origin main

# 2. Atualizar .env
nano .env
# Mudar: ENVIRONMENT=prod

# 3. Reiniciar servidor
sudo systemctl restart gunicorn
# ou
supervisorctl restart femme_integra
```

---

## 🛠️ TROUBLESHOOTING

### **Problema: Upload falha com erro 500**

**Solução:**
1. Verificar se `ENVIRONMENT` está definido no `.env`
2. Verificar se URLs do ambiente estão configuradas
3. Checar logs do Django para mensagem de erro específica

### **Problema: Arquivo vai para ambiente errado**

**Solução:**
1. Verificar valor de `ENVIRONMENT` no `.env`
2. Reiniciar servidor Django
3. Verificar log de inicialização: `🌍 AMBIENTE: ...`

### **Problema: CloudFront retorna 404**

**Solução:**
1. Verificar se `CLOUDFRONT_URL_[ENV]` está correto
2. Confirmar que arquivo foi enviado para S3
3. Verificar permissões do bucket S3

---

## 📞 SUPORTE

### **Logs Importantes:**

```bash
# Ver logs do Django
tail -f /var/log/femme_integra/django.log

# Ver ambiente atual
grep "AMBIENTE:" /var/log/femme_integra/django.log | tail -1

# Ver uploads recentes
grep "Signed URL gerada:" /var/log/femme_integra/django.log | tail -10
```

### **Comandos Úteis:**

```bash
# Verificar variáveis de ambiente
python manage.py shell
>>> import os
>>> print(os.getenv('ENVIRONMENT'))
>>> print(os.getenv('AWS_SIGNED_URL_API_DEV'))

# Testar configuração
python manage.py shell
>>> from core.config import get_environment_config
>>> config = get_environment_config()
>>> print(config.environment)
>>> print(config.aws_signed_url_api)
>>> print(config.cloudfront_url)
```

---

## ✅ RESUMO

**Para trocar de ambiente:**
1. Editar `.env`
2. Mudar `ENVIRONMENT=dev` ou `ENVIRONMENT=prod`
3. Reiniciar servidor
4. **PRONTO!** ✨

**Tudo é automático!** Não precisa mudar código, não precisa mudar configurações complexas.
Uma variável controla tudo! 🎯
