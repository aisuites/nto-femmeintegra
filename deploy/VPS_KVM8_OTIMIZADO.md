# 🚀 Configuração Otimizada para VPS KVM8 (32GB RAM)

## 📊 ESPECIFICAÇÕES DA SUA VPS

- **CPU**: 8 núcleos vCPU
- **RAM**: 32 GB (!!!)
- **Storage**: 400 GB NVMe
- **Bandwidth**: 32 TB/mês
- **Custo**: R$ 109,99/mês

**Esta VPS é EXCELENTE para sua aplicação!**

---

## 🎯 CAPACIDADE ESTIMADA

### Com esta configuração:
- **Usuários simultâneos**: 200-500
- **Requisições/segundo**: 500-1000
- **Tempo de resposta**: <100ms
- **Banco de dados**: Suporta milhões de registros

### Comparação:
- VPS 8GB: ~50-100 usuários
- **Sua VPS 32GB: ~200-500 usuários** ✅
- Servidor dedicado: ~1000+ usuários

---

## ⚙️ CONFIGURAÇÃO OTIMIZADA

### 1. PostgreSQL (Alocar 8GB RAM)

```bash
sudo nano /etc/postgresql/14/main/postgresql.conf
```

**Configuração para 32GB RAM:**
```conf
# Memória
shared_buffers = 8GB                    # 25% da RAM
effective_cache_size = 24GB             # 75% da RAM
maintenance_work_mem = 2GB              # Para VACUUM, INDEX
work_mem = 64MB                         # Por query
wal_buffers = 16MB

# Conexões
max_connections = 200                   # Aumentado para sua capacidade

# Performance
random_page_cost = 1.1                  # Para SSD/NVMe
effective_io_concurrency = 200          # Para NVMe
checkpoint_completion_target = 0.9
wal_level = minimal                     # Se não usar replicação
max_wal_size = 4GB
min_wal_size = 1GB

# Autovacuum (importante!)
autovacuum = on
autovacuum_max_workers = 4
autovacuum_naptime = 30s

# Logging (para monitoramento)
logging_collector = on
log_directory = 'log'
log_filename = 'postgresql-%Y-%m-%d_%H%M%S.log'
log_rotation_age = 1d
log_rotation_size = 100MB
log_line_prefix = '%t [%p]: [%l-1] user=%u,db=%d,app=%a,client=%h '
log_min_duration_statement = 1000       # Log queries > 1s
```

### 2. Redis (Alocar 4GB RAM)

```bash
sudo nano /etc/redis/redis.conf
```

**Configuração para 32GB RAM:**
```conf
# Memória
maxmemory 4gb
maxmemory-policy allkeys-lru

# Performance
tcp-backlog 511
timeout 300
tcp-keepalive 60
databases 16

# Persistência (desabilitar para máxima performance)
save ""
appendonly no

# Ou manter persistência leve (recomendado)
# save 900 1
# save 300 10
# save 60 10000
# appendonly yes
# appendfsync everysec

# Segurança
bind 127.0.0.1
protected-mode yes
requirepass SUA_SENHA_FORTE_AQUI

# Logs
loglevel notice
logfile /var/log/redis/redis-server.log
```

### 3. Gunicorn (Alocar 8GB RAM)

```python
# gunicorn_config.py
import multiprocessing

# Workers: (2 x CPU) + 1 = 17 workers
workers = 17
worker_class = "sync"
worker_connections = 1000

# Memória por worker: ~500MB
# Total: 17 x 500MB = ~8.5GB

# Timeouts
timeout = 30
graceful_timeout = 30
keepalive = 2

# Requests
max_requests = 2000
max_requests_jitter = 100

# Logging
accesslog = "/var/log/femme_integra/gunicorn_access.log"
errorlog = "/var/log/femme_integra/gunicorn_error.log"
loglevel = "info"
```

### 4. Nginx (Otimizado para NVMe)

```nginx
# /etc/nginx/nginx.conf

user www-data;
worker_processes 8;  # = número de CPUs
worker_rlimit_nofile 65535;
pid /run/nginx.pid;

events {
    worker_connections 4096;  # Aumentado
    use epoll;
    multi_accept on;
}

http {
    # Performance
    sendfile on;
    tcp_nopush on;
    tcp_nodelay on;
    keepalive_timeout 65;
    keepalive_requests 100;
    
    # Buffers (aumentados para 32GB RAM)
    client_body_buffer_size 128k;
    client_max_body_size 20M;
    client_header_buffer_size 1k;
    large_client_header_buffers 4 8k;
    output_buffers 1 32k;
    postpone_output 1460;
    
    # Cache de arquivos estáticos
    open_file_cache max=10000 inactive=30s;
    open_file_cache_valid 60s;
    open_file_cache_min_uses 2;
    open_file_cache_errors on;
    
    # Gzip
    gzip on;
    gzip_vary on;
    gzip_proxied any;
    gzip_comp_level 6;
    gzip_types text/plain text/css text/xml text/javascript 
               application/json application/javascript application/xml+rss 
               application/rss+xml font/truetype font/opentype 
               application/vnd.ms-fontobject image/svg+xml;
    
    # Rate limiting
    limit_req_zone $binary_remote_addr zone=api:10m rate=30r/s;
    limit_req_zone $binary_remote_addr zone=login:10m rate=5r/m;
    
    # Incluir configurações dos sites
    include /etc/nginx/sites-enabled/*;
}
```

---

## 📊 DISTRIBUIÇÃO DE RECURSOS

```
Total RAM: 32GB

PostgreSQL:     8GB  (25%)
Redis:          4GB  (12%)
Gunicorn:       8GB  (25%)
Sistema:        4GB  (12%)
Buffer/Cache:   8GB  (25%)
```

---

## 🔥 TESTES DE CARGA ESPERADOS

### Cenário 1: Uso Normal
- 50 usuários simultâneos
- 100 requisições/segundo
- **CPU**: 20-30%
- **RAM**: 12-16GB
- **Resposta**: <100ms

### Cenário 2: Pico de Uso
- 200 usuários simultâneos
- 400 requisições/segundo
- **CPU**: 60-80%
- **RAM**: 20-24GB
- **Resposta**: <200ms

### Cenário 3: Carga Máxima
- 500 usuários simultâneos
- 1000 requisições/segundo
- **CPU**: 90-100%
- **RAM**: 28-30GB
- **Resposta**: <500ms

---

## 🛡️ SEGURANÇA ADICIONAL

### 1. Fail2ban (proteção brute force)
```bash
sudo apt install -y fail2ban

sudo nano /etc/fail2ban/jail.local
```

```ini
[DEFAULT]
bantime = 3600
findtime = 600
maxretry = 5

[sshd]
enabled = true
port = ssh
logpath = /var/log/auth.log

[nginx-limit-req]
enabled = true
filter = nginx-limit-req
logpath = /var/log/nginx/femme_integra_error.log
```

### 2. UFW Firewall
```bash
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable
```

### 3. Monitoramento de recursos
```bash
# Instalar htop
sudo apt install -y htop

# Instalar iotop (monitorar I/O)
sudo apt install -y iotop

# Instalar nethogs (monitorar rede)
sudo apt install -y nethogs
```

---

## 📈 MONITORAMENTO

### Script de monitoramento básico
```bash
nano /home/femme/monitor.sh
```

```bash
#!/bin/bash

echo "=== FEMME Integra - Status ==="
echo "Data: $(date)"
echo ""

# CPU
echo "CPU:"
top -bn1 | grep "Cpu(s)" | awk '{print "  Uso: " $2}'

# RAM
echo "RAM:"
free -h | awk 'NR==2{printf "  Usado: %s/%s (%.2f%%)\n", $3,$2,$3*100/$2 }'

# Disco
echo "Disco:"
df -h / | awk 'NR==2{printf "  Usado: %s/%s (%s)\n", $3,$2,$5}'

# PostgreSQL
echo "PostgreSQL:"
sudo -u postgres psql -c "SELECT count(*) as conexoes FROM pg_stat_activity WHERE datname='femme_integra';" -t | awk '{print "  Conexões: " $1}'

# Redis
echo "Redis:"
redis-cli INFO stats | grep total_commands_processed | awk -F: '{print "  Comandos: " $2}'

# Gunicorn
echo "Gunicorn:"
ps aux | grep gunicorn | grep -v grep | wc -l | awk '{print "  Workers: " $1}'

# Nginx
echo "Nginx:"
systemctl is-active nginx | awk '{print "  Status: " $1}'
```

```bash
chmod +x /home/femme/monitor.sh
```

### Executar a cada 5 minutos:
```bash
crontab -e
```

```cron
*/5 * * * * /home/femme/monitor.sh >> /home/femme/monitor.log
```

---

## 🚀 COMANDOS DE DEPLOY

### Deploy inicial
```bash
cd /home/femme/femme_integra
git pull origin main
source .venv/bin/activate
pip install -r requirements.txt
cd backend
python manage.py migrate
python manage.py collectstatic --noinput
sudo supervisorctl restart femme_integra
```

### Verificar status
```bash
sudo supervisorctl status
sudo systemctl status nginx
sudo systemctl status postgresql
sudo systemctl status redis-server
```

### Ver logs
```bash
# Aplicação
tail -f /var/log/femme_integra/gunicorn_error.log

# Nginx
tail -f /var/log/nginx/femme_integra_error.log

# PostgreSQL
sudo tail -f /var/log/postgresql/postgresql-14-main.log

# Redis
sudo tail -f /var/log/redis/redis-server.log
```

---

## 💰 CUSTO-BENEFÍCIO

### Sua VPS (R$ 109,99/mês):
- ✅ 32GB RAM
- ✅ 8 vCPUs
- ✅ 400GB NVMe
- ✅ Suporta 200-500 usuários
- ✅ **Custo por usuário: R$ 0,22-0,55**

### Alternativas:
- VPS 8GB: R$ 50/mês → 50 usuários → R$ 1,00/usuário
- Servidor dedicado: R$ 500+/mês → 1000 usuários → R$ 0,50/usuário

**Sua escolha é EXCELENTE!** 🎯

---

## ✅ CHECKLIST DE DEPLOY

### Antes do deploy
- [ ] Backup do banco local
- [ ] Testar localmente com Gunicorn
- [ ] Documentar credenciais
- [ ] Registrar domínio
- [ ] Contratar VPS

### Durante deploy
- [ ] Instalar PostgreSQL (config 8GB)
- [ ] Instalar Redis (config 4GB)
- [ ] Configurar Gunicorn (17 workers)
- [ ] Configurar Nginx
- [ ] Configurar SSL
- [ ] Configurar firewall
- [ ] Configurar backup automático

### Após deploy
- [ ] Testar criação de requisição
- [ ] Verificar logs
- [ ] Monitorar recursos
- [ ] Teste de carga
- [ ] Configurar alertas

---

## 🎯 PRÓXIMOS PASSOS

1. **Contratar VPS** (R$ 109,99/mês)
2. **Registrar domínio** (.com.br ~R$ 40/ano)
3. **Seguir** `DEPLOY_VPS.md`
4. **Aplicar** configurações deste arquivo
5. **Testar** e monitorar

**Sua aplicação vai voar nesta VPS!** 🚀
