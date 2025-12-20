# Guia de Desenvolvimento - NTO Femme Integra

## Configuração do Ambiente de Desenvolvimento

### 1. Configuração do Django

O projeto está configurado para ambiente de desenvolvimento quando `DEBUG=True` no arquivo `.env`.

**Arquivo `.env`:**
```bash
DJANGO_DEBUG=True  # Ativa modo de desenvolvimento
```

**Comportamento em desenvolvimento:**
- Cache de dados desabilitado (unidades, portadores, etc. sempre buscam do banco)
- Cache de arquivos estáticos desabilitado (WhiteNoise com max-age=0)
- Headers HTTP para desabilitar cache no navegador e CDN
- Logs detalhados de erros

### 2. Configuração do Cloudflare (IMPORTANTE)

O Cloudflare cacheia arquivos estáticos por padrão, o que impede ver mudanças imediatamente em desenvolvimento.

**Opção A: Development Mode (Temporário - 3 horas)**
1. Acesse o dashboard do Cloudflare
2. Selecione o domínio `aisuites.com.br`
3. Vá em **Caching** → **Configuration**
4. Ative **Development Mode**

**Opção B: Page Rule (Permanente - Recomendado)**
1. Vá em **Rules** → **Page Rules**
2. Crie uma nova regra:
   - **URL:** `*nto-femmeintegra.aisuites.com.br/*`
   - **Setting:** Cache Level → **Bypass**
3. Salvar

### 3. Arquivos Estáticos

**Após qualquer alteração em arquivos JavaScript/CSS:**

```bash
# Limpar e recoletar arquivos estáticos
docker exec nto_web gosu appuser python /app/backend/manage.py collectstatic --noinput --clear

# Reiniciar o container
docker compose restart web
```

**No navegador:**
- Sempre use **Ctrl+F5** (Windows/Linux) ou **Cmd+Shift+R** (Mac) para hard refresh
- Ou abra em aba anônima para garantir que não há cache local

### 4. Estrutura de Configuração

**Arquivos de configuração importantes:**

- `/home/apps/nto-femmeintegra/.env` - Variáveis de ambiente
- `/home/apps/nto-femmeintegra/frontend/static/js/config.js` - URLs da API por ambiente
- `/home/apps/nto-femmeintegra/backend/femme_integra/settings.py` - Configurações Django
- `/home/apps/nto-femmeintegra/backend/femme_integra/middleware.py` - Middleware de cache

### 5. URLs da API

O arquivo `config.js` detecta automaticamente o ambiente:

**Desenvolvimento (localhost):**
```javascript
apiBaseUrl: 'http://127.0.0.1:8000'
```

**Produção (domínio público):**
```javascript
apiBaseUrl: 'https://nto-femmeintegra.aisuites.com.br'
```

### 6. Comandos Úteis

```bash
# Ver logs em tempo real
docker compose logs -f web

# Acessar shell do Django
docker exec -it nto_web gosu appuser python /app/backend/manage.py shell

# Limpar cache do Redis
docker exec nto_redis redis-cli FLUSHALL

# Reiniciar todos os containers
docker compose restart

# Rebuild completo (após mudanças no Dockerfile ou requirements.txt)
docker compose build --no-cache web
docker compose up -d --force-recreate web
```

### 7. Troubleshooting

**Problema: Mudanças no JavaScript não aparecem**
- Solução: Ativar Development Mode no Cloudflare + Hard refresh no navegador

**Problema: Dados não atualizam (unidades, portadores)**
- Solução: Verificar se `DEBUG=True` no `.env`

**Problema: CSS não carrega**
- Solução: Executar `collectstatic --clear` e reiniciar container

**Problema: Erro 404 em arquivos estáticos**
- Solução: Verificar se WhiteNoise está configurado corretamente no `settings.py`

### 8. Migração para Produção

Quando for para produção, lembre-se de:

1. Alterar `.env`:
   ```bash
   DJANGO_DEBUG=False
   ```

2. Desativar Development Mode no Cloudflare

3. Remover Page Rule de bypass de cache (se criou)

4. Executar collectstatic:
   ```bash
   docker exec nto_web gosu appuser python /app/backend/manage.py collectstatic --noinput
   ```

5. Reiniciar containers:
   ```bash
   docker compose restart
   ```

## Melhores Práticas

1. **Sempre trabalhe com `DEBUG=True` em desenvolvimento**
2. **Use Development Mode do Cloudflare durante desenvolvimento ativo**
3. **Faça hard refresh no navegador após mudanças em JS/CSS**
4. **Commit o `.env.example` mas nunca o `.env` com credenciais reais**
5. **Teste em produção (DEBUG=False) antes de fazer deploy final**
