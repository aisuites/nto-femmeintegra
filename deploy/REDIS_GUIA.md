# 🔴 Redis - Guia Completo

## 📦 INSTALAÇÃO

### Local (macOS)
```bash
# Instalar via Homebrew
brew install redis

# Iniciar Redis
brew services start redis

# Parar Redis
brew services stop redis

# Reiniciar Redis
brew services restart redis

# Testar conexão
redis-cli ping
# Deve retornar: PONG
```

### VPS (Ubuntu)
```bash
# Instalar
sudo apt update
sudo apt install -y redis-server

# Configurar para iniciar automaticamente
sudo systemctl enable redis-server
sudo systemctl start redis-server

# Verificar status
sudo systemctl status redis-server

# Testar
redis-cli ping
```

---

## ⚙️ CONFIGURAÇÃO OTIMIZADA (VPS)

### Editar configuração do Redis
```bash
sudo nano /etc/redis/redis.conf
```

### Configurações recomendadas para VPS KVM8:
```conf
# Memória máxima (2GB para VPS de 8GB)
maxmemory 2gb
maxmemory-policy allkeys-lru

# Persistência (desabilitar se não precisar)
save ""
appendonly no

# Performance
tcp-backlog 511
timeout 300
tcp-keepalive 60

# Logs
loglevel notice
logfile /var/log/redis/redis-server.log

# Segurança
bind 127.0.0.1
protected-mode yes
requirepass SUA_SENHA_FORTE_AQUI  # Opcional, mas recomendado
```

### Reiniciar após mudanças
```bash
sudo systemctl restart redis-server
```

---

## 🐍 DEPENDÊNCIAS PYTHON

### Já instalado via requirements.txt:
```txt
redis>=5.0,<6
django-redis>=5.4,<6
```

### Instalar manualmente (se necessário):
```bash
pip install redis django-redis
```

---

## 🔧 CONFIGURAÇÃO NO DJANGO

### Já configurado em `settings.py`:
```python
CACHES = {
    'default': {
        'BACKEND': 'django_redis.cache.RedisCache',
        'LOCATION': os.getenv('REDIS_URL', 'redis://127.0.0.1:6379/1'),
        'OPTIONS': {
            'CLIENT_CLASS': 'django_redis.client.DefaultClient',
            'CONNECTION_POOL_KWARGS': {
                'max_connections': 50,
                'retry_on_timeout': True,
            },
            'SOCKET_CONNECT_TIMEOUT': 5,
            'SOCKET_TIMEOUT': 5,
            'COMPRESSOR': 'django_redis.compressors.zlib.ZlibCompressor',
            'IGNORE_EXCEPTIONS': True,  # Não quebra se Redis cair
        },
        'KEY_PREFIX': 'femme_integra',
        'TIMEOUT': 300,  # 5 minutos padrão
    }
}
```

### Variável de ambiente (.env):
```env
# Desenvolvimento
REDIS_URL=redis://127.0.0.1:6379/1

# Produção (com senha)
REDIS_URL=redis://:SUA_SENHA@127.0.0.1:6379/1
```

---

## 🎯 O QUE ESTÁ SENDO CACHEADO

### 1. Unidades (1 hora)
```python
cache.get('recebimento:unidades')
```
- Lista de unidades raramente muda
- Reduz queries ao banco

### 2. Portadores (1 hora)
```python
cache.get('recebimento:portadores')
```
- Lista de portadores/representantes
- Inclui relacionamentos (origem, unidade)

### 3. Requisições recentes
- **NÃO cacheado** - dados em tempo real

---

## 🔄 INVALIDAR CACHE

### Via Django Shell
```bash
python manage.py shell
```

```python
from django.core.cache import cache

# Limpar cache específico
cache.delete('recebimento:unidades')
cache.delete('recebimento:portadores')

# Limpar todo o cache
cache.clear()

# Verificar se existe
cache.has_key('recebimento:unidades')

# Ver valor
cache.get('recebimento:unidades')
```

### Via Redis CLI
```bash
redis-cli

# Listar todas as chaves
KEYS femme_integra:*

# Ver valor de uma chave
GET femme_integra:1:recebimento:unidades

# Deletar chave específica
DEL femme_integra:1:recebimento:unidades

# Limpar tudo
FLUSHDB

# Sair
exit
```

---

## 📊 MONITORAMENTO

### Ver estatísticas do Redis
```bash
redis-cli INFO

# Memória usada
redis-cli INFO memory

# Estatísticas
redis-cli INFO stats

# Clientes conectados
redis-cli CLIENT LIST
```

### Monitorar em tempo real
```bash
redis-cli MONITOR
```

### Ver uso de memória por chave
```bash
redis-cli --bigkeys
```

---

## 🚀 COMANDOS ÚTEIS

### Django Management Commands

#### Testar conexão com Redis
```bash
python manage.py shell -c "
from django.core.cache import cache
cache.set('test', 'ok', 10)
print('Redis OK!' if cache.get('test') == 'ok' else 'Redis FAIL!')
"
```

#### Limpar cache via comando
```bash
python manage.py shell -c "
from django.core.cache import cache
cache.clear()
print('Cache limpo!')
"
```

#### Ver estatísticas de cache
```bash
python manage.py shell -c "
from django_redis import get_redis_connection
con = get_redis_connection('default')
info = con.info()
print(f'Memória usada: {info[\"used_memory_human\"]}')
print(f'Chaves: {info[\"db1\"][\"keys\"]}')
print(f'Hits: {info[\"keyspace_hits\"]}')
print(f'Misses: {info[\"keyspace_misses\"]}')
"
```

---

## 🔒 SEGURANÇA

### Configurar senha (Produção)
```bash
sudo nano /etc/redis/redis.conf
```

Adicionar:
```conf
requirepass SUA_SENHA_FORTE_AQUI
```

### Atualizar .env
```env
REDIS_URL=redis://:SUA_SENHA@127.0.0.1:6379/1
```

### Firewall (bloquear acesso externo)
```bash
sudo ufw deny 6379/tcp
```

---

## 📈 PERFORMANCE ESPERADA

### Sem Redis:
- Tempo de carregamento da página: ~300-500ms
- Queries ao banco: 10-15 por requisição

### Com Redis:
- Tempo de carregamento da página: ~50-150ms
- Queries ao banco: 1-3 por requisição
- **Melhoria: 3-5x mais rápido**

---

## ⚠️ TROUBLESHOOTING

### Redis não inicia
```bash
# Ver logs
sudo tail -f /var/log/redis/redis-server.log

# Verificar se porta está em uso
sudo lsof -i :6379

# Reiniciar
sudo systemctl restart redis-server
```

### Django não conecta ao Redis
```bash
# Testar conexão
redis-cli ping

# Verificar URL no .env
cat .env | grep REDIS_URL

# Testar no Django
python manage.py shell -c "
from django.core.cache import cache
try:
    cache.set('test', 'ok')
    print('Conexão OK!')
except Exception as e:
    print(f'Erro: {e}')
"
```

### Redis usando muita memória
```bash
# Ver uso
redis-cli INFO memory

# Limpar cache
redis-cli FLUSHDB

# Ajustar maxmemory
sudo nano /etc/redis/redis.conf
# maxmemory 2gb
```

---

## 🎯 QUANDO INVALIDAR O CACHE

### Criar script de invalidação
```bash
nano /home/femme/femme_integra/backend/clear_cache.py
```

```python
#!/usr/bin/env python
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'femme_integra.settings')
django.setup()

from django.core.cache import cache

# Limpar caches específicos
cache.delete('recebimento:unidades')
cache.delete('recebimento:portadores')

print('✅ Cache limpo!')
```

```bash
chmod +x clear_cache.py
```

### Usar após:
- Adicionar/editar unidades
- Adicionar/editar portadores
- Deploy de nova versão
- Mudanças no banco de dados

---

## 📝 CHECKLIST DE IMPLEMENTAÇÃO

### Local
- [x] Redis instalado
- [x] Dependências Python instaladas
- [x] Configuração no settings.py
- [x] Cache implementado nas views
- [ ] Testar localmente

### VPS
- [ ] Redis instalado
- [ ] Configuração otimizada
- [ ] Senha configurada
- [ ] Firewall configurado
- [ ] Monitoramento ativo

---

## 🔄 PRÓXIMOS PASSOS

1. **Testar localmente**
   ```bash
   # Iniciar Redis
   brew services start redis
   
   # Iniciar Django
   python manage.py runserver
   
   # Acessar página de recebimento
   # Verificar logs - deve ver menos queries
   ```

2. **Medir performance**
   - Antes: Ver tempo de resposta
   - Depois: Comparar com Redis ativo

3. **Deploy na VPS**
   - Seguir seção de instalação
   - Configurar senha
   - Testar conexão

---

## 💡 DICAS

1. **Cache de sessões** (opcional)
   ```python
   SESSION_ENGINE = 'django.contrib.sessions.backends.cache'
   SESSION_CACHE_ALIAS = 'default'
   ```

2. **Cache de templates** (opcional)
   ```python
   TEMPLATES = [{
       'OPTIONS': {
           'loaders': [
               ('django.template.loaders.cached.Loader', [
                   'django.template.loaders.filesystem.Loader',
                   'django.template.loaders.app_directories.Loader',
               ]),
           ],
       },
   }]
   ```

3. **Monitoramento automático**
   - Adicionar ao cron para verificar se Redis está rodando
   - Alertar se uso de memória > 80%

---

**Redis configurado e pronto para uso!** 🚀
