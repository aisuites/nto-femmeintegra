# 🔒 Guia de Segurança - FEMME Integra

## 📋 Configuração de Variáveis de Ambiente

### 1️⃣ Criar arquivo `.env`

```bash
# Copiar o template
cp .env.example .env

# Editar com suas configurações
nano .env  # ou vim, code, etc.
```

### 2️⃣ Gerar SECRET_KEY Segura

```bash
# Gerar uma nova SECRET_KEY
python -c 'from django.core.management.utils import get_random_secret_key; print(get_random_secret_key())'
```

Copie a chave gerada e cole no arquivo `.env`:
```env
DJANGO_SECRET_KEY=sua-chave-gerada-aqui
```

### 3️⃣ Configurar Banco de Dados

**Desenvolvimento:**
```env
DATABASE_URL=postgresql://femme_integra:femme_integra@localhost:5432/femme_integra
```

**Produção:**
```env
DATABASE_URL=postgresql://usuario_prod:senha_segura@host_prod:5432/femme_integra_prod
```

### 4️⃣ Configurar Redis (Opcional mas Recomendado)

**Desenvolvimento:**
```env
REDIS_URL=redis://127.0.0.1:6379/1
```

**Produção:**
```env
REDIS_URL=redis://:senha_redis@host_redis:6379/1
```

---

## 🔐 Checklist de Segurança

### Desenvolvimento Local
- [ ] Arquivo `.env` criado e configurado
- [ ] `.env` está no `.gitignore` ✅
- [ ] `DJANGO_DEBUG=true` (apenas local)
- [ ] SECRET_KEY gerada (pode usar a de desenvolvimento)

### Produção
- [ ] `DJANGO_DEBUG=false` **OBRIGATÓRIO**
- [ ] SECRET_KEY única e segura (50+ caracteres)
- [ ] ALLOWED_HOSTS configurado com domínio real
- [ ] CSRF_TRUSTED_ORIGINS com HTTPS
- [ ] Senha do banco de dados forte (16+ caracteres)
- [ ] Redis com senha configurada
- [ ] HTTPS habilitado (SSL/TLS)
- [ ] Firewall configurado
- [ ] Backups automáticos do banco

---

## 🚨 Dados Sensíveis - NUNCA Commitar

### ❌ NUNCA faça commit de:
- Arquivo `.env`
- Senhas em texto plano
- Chaves de API
- Tokens de acesso
- Certificados SSL
- Credenciais AWS

### ✅ SEMPRE use:
- Variáveis de ambiente
- Gerenciadores de secrets (AWS Secrets Manager, HashiCorp Vault)
- `.env.example` como template (sem dados reais)

---

## 🔍 Auditoria de Segurança

### Verificar se há dados expostos:

```bash
# Buscar por possíveis senhas/chaves no código
cd backend
grep -r "password\s*=\s*['\"]" --include="*.py" .
grep -r "secret\s*=\s*['\"]" --include="*.py" .
grep -r "api_key\s*=\s*['\"]" --include="*.py" .

# Verificar histórico do Git
git log --all --full-history --source -- .env
```

### Remover dados sensíveis do histórico Git:

Se você acidentalmente commitou dados sensíveis:

```bash
# CUIDADO: Isso reescreve o histórico!
git filter-branch --force --index-filter \
  "git rm --cached --ignore-unmatch .env" \
  --prune-empty --tag-name-filter cat -- --all

# Forçar push (cuidado!)
git push origin --force --all
```

---

## 📊 Níveis de Segurança Implementados

### ✅ Implementado
- [x] CSRF Protection
- [x] Rate Limiting (20-30 req/min)
- [x] LoginRequired em todas as views
- [x] Variáveis de ambiente para dados sensíveis
- [x] Logging de auditoria
- [x] Validação de entrada
- [x] SQL Injection protection (Django ORM)
- [x] XSS Protection (Django templates)

### ⚠️ Recomendado para Produção
- [ ] HTTPS obrigatório
- [ ] Firewall (UFW, iptables)
- [ ] Fail2Ban para proteção contra brute force
- [ ] Monitoramento (Sentry, New Relic)
- [ ] Backups automáticos
- [ ] WAF (Web Application Firewall)
- [ ] 2FA para admin
- [ ] Rotação de senhas periódica

---

## 🆘 Em Caso de Vazamento

### Se dados sensíveis foram expostos:

1. **Imediatamente:**
   - Trocar todas as senhas
   - Gerar nova SECRET_KEY
   - Revogar tokens/chaves de API
   - Notificar equipe de segurança

2. **Investigar:**
   - Verificar logs de acesso
   - Identificar o escopo do vazamento
   - Documentar o incidente

3. **Remediar:**
   - Remover dados do histórico Git
   - Atualizar credenciais em todos os ambientes
   - Implementar controles adicionais

---

## 📞 Contato de Segurança

Para reportar vulnerabilidades de segurança:
- Email: security@femme.com.br
- Não divulgue publicamente antes de correção

---

**Última atualização**: Dezembro 2024  
**Versão**: 1.0
