# 🚀 Guia de Deploy - VPS Hostinger KVM8

## 📋 PRÉ-REQUISITOS

### Informações da VPS
- **OS**: Ubuntu 22.04 LTS
- **RAM**: 8-16 GB
- **CPU**: 8 cores
- **Storage**: 200-400 GB SSD
- **IP**: [SEU_IP_AQUI]
- **Domínio**: [SEU_DOMINIO_AQUI]

---

## 🔧 PARTE 1: PREPARAÇÃO DA VPS (Primeira vez)

### 1. Conectar via SSH
```bash
ssh root@SEU_IP
```

### 2. Atualizar sistema
```bash
apt update && apt upgrade -y
apt install -y software-properties-common
```

### 3. Criar usuário dedicado
```bash
adduser femme
usermod -aG sudo femme
su - femme
```

### 4. Instalar dependências
```bash
# Python 3.12
sudo add-apt-repository ppa:deadsnakes/ppa -y
sudo apt update
sudo apt install -y python3.12 python3.12-venv python3.12-dev

# PostgreSQL
sudo apt install -y postgresql postgresql-contrib

# Nginx
sudo apt install -y nginx

# Supervisor
sudo apt install -y supervisor

# Git
sudo apt install -y git

# Ferramentas de build
sudo apt install -y build-essential libpq-dev
```

### 5. Configurar PostgreSQL
```bash
sudo -u postgres psql

# No prompt do PostgreSQL:
CREATE DATABASE femme_integra;
CREATE USER femme_integra WITH PASSWORD 'SUA_SENHA_FORTE_AQUI';
ALTER ROLE femme_integra SET client_encoding TO 'utf8';
ALTER ROLE femme_integra SET default_transaction_isolation TO 'read committed';
ALTER ROLE femme_integra SET timezone TO 'America/Sao_Paulo';
GRANT ALL PRIVILEGES ON DATABASE femme_integra TO femme_integra;
\q
```

### 6. Otimizar PostgreSQL para VPS KVM8
```bash
sudo nano /etc/postgresql/14/main/postgresql.conf
```

**Adicionar/modificar:**
```conf
# Memória (para 8GB RAM)
shared_buffers = 2GB
effective_cache_size = 6GB
maintenance_work_mem = 512MB
work_mem = 32MB

# Conexões
max_connections = 100

# Performance
random_page_cost = 1.1
effective_io_concurrency = 200

# WAL
wal_buffers = 16MB
checkpoint_completion_target = 0.9
```

```bash
sudo systemctl restart postgresql
```

---

## 📦 PARTE 2: DEPLOY DA APLICAÇÃO

### 1. Clonar repositório (ou fazer upload via SFTP)
```bash
cd /home/femme
git clone [SEU_REPOSITORIO] femme_integra
# OU
# Fazer upload via SFTP para /home/femme/femme_integra
```

### 2. Criar ambiente virtual
```bash
cd /home/femme/femme_integra
python3.12 -m venv .venv
source .venv/bin/activate
```

### 3. Instalar dependências
```bash
pip install --upgrade pip
pip install -r requirements.txt
```

### 4. Configurar variáveis de ambiente
```bash
nano /home/femme/femme_integra/.env
```

**Conteúdo do .env:**
```env
# Django
DJANGO_SECRET_KEY=GERAR_CHAVE_SECRETA_AQUI_50_CARACTERES
DJANGO_DEBUG=false
DJANGO_ALLOWED_HOSTS=seu-dominio.com,www.seu-dominio.com,SEU_IP
DJANGO_CSRF_TRUSTED_ORIGINS=https://seu-dominio.com,https://www.seu-dominio.com

# Database
DATABASE_URL=postgresql://femme_integra:SUA_SENHA@localhost:5432/femme_integra
DATABASE_CONN_MAX_AGE=600

# Logging
DJANGO_LOG_LEVEL=INFO
```

**Gerar SECRET_KEY:**
```bash
python3 -c "from django.core.management.utils import get_random_secret_key; print(get_random_secret_key())"
```

### 5. Preparar aplicação
```bash
cd /home/femme/femme_integra/backend

# Migrations
python manage.py makemigrations
python manage.py migrate

# Criar superuser
python manage.py createsuperuser

# Coletar arquivos estáticos
python manage.py collectstatic --noinput

# Popular status
python manage.py shell -c "
from operacao.models import StatusRequisicao
dados = [
    {'codigo': 'ABERTO_NTO', 'descricao': 'ABERTO NTO', 'ordem': 1},
    {'codigo': 'RECEBIDO', 'descricao': 'RECEBIDO', 'ordem': 2},
    {'codigo': 'CAIXA_LIDERANCA', 'descricao': 'CAIXA LIDERANÇA', 'ordem': 3},
    {'codigo': 'CAIXA_BO', 'descricao': 'CAIXA BO', 'ordem': 4},
    {'codigo': 'CAIXA_BARRADOS', 'descricao': 'CAIXA BARRADOS', 'ordem': 5},
    {'codigo': 'PENDENCIA', 'descricao': 'PENDÊNCIA', 'ordem': 6},
    {'codigo': 'TRIAGEM1_OK', 'descricao': 'TRIAGEM1-OK', 'ordem': 7},
    {'codigo': 'TRIAGEM2_OK', 'descricao': 'TRIAGEM2-OK', 'ordem': 8},
]
for item in dados:
    StatusRequisicao.objects.get_or_create(codigo=item['codigo'], defaults={'descricao': item['descricao'], 'ordem': item['ordem']})
"
```

### 6. Criar diretórios de logs
```bash
sudo mkdir -p /var/log/femme_integra
sudo mkdir -p /var/run/femme_integra
sudo chown -R femme:femme /var/log/femme_integra
sudo chown -R femme:femme /var/run/femme_integra
```

### 7. Configurar Supervisor
```bash
sudo cp /home/femme/femme_integra/deploy/supervisor.conf /etc/supervisor/conf.d/femme_integra.conf
sudo supervisorctl reread
sudo supervisorctl update
sudo supervisorctl start femme_integra
sudo supervisorctl status
```

### 8. Configurar Nginx
```bash
sudo cp /home/femme/femme_integra/deploy/nginx.conf /etc/nginx/sites-available/femme_integra

# Editar com seu domínio
sudo nano /etc/nginx/sites-available/femme_integra

# Ativar site
sudo ln -s /etc/nginx/sites-available/femme_integra /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

### 9. Configurar SSL (Let's Encrypt)
```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d seu-dominio.com -d www.seu-dominio.com
```

---

## 🔄 PARTE 3: ATUALIZAÇÕES FUTURAS

### Script de deploy automático
```bash
nano /home/femme/femme_integra/deploy/update.sh
```

**Conteúdo:**
```bash
#!/bin/bash
set -e

echo "🔄 Atualizando FEMME Integra..."

cd /home/femme/femme_integra

# Backup do banco
echo "📦 Fazendo backup..."
sudo -u postgres pg_dump femme_integra > /home/femme/backups/femme_$(date +%Y%m%d_%H%M%S).sql

# Atualizar código
echo "📥 Atualizando código..."
git pull origin main

# Ativar venv
source .venv/bin/activate

# Instalar dependências
echo "📦 Instalando dependências..."
pip install -r requirements.txt

# Migrations
echo "🗄️ Aplicando migrations..."
cd backend
python manage.py migrate

# Coletar estáticos
echo "📁 Coletando arquivos estáticos..."
python manage.py collectstatic --noinput

# Reiniciar aplicação
echo "🔄 Reiniciando aplicação..."
sudo supervisorctl restart femme_integra

echo "✅ Deploy concluído!"
```

```bash
chmod +x /home/femme/femme_integra/deploy/update.sh
```

---

## 📊 PARTE 4: MONITORAMENTO BÁSICO

### 1. Verificar status
```bash
# Supervisor
sudo supervisorctl status

# Nginx
sudo systemctl status nginx

# PostgreSQL
sudo systemctl status postgresql

# Logs em tempo real
tail -f /var/log/femme_integra/gunicorn_error.log
tail -f /var/log/nginx/femme_integra_error.log
```

### 2. Backup automático (cron)
```bash
crontab -e
```

**Adicionar:**
```cron
# Backup diário às 2h da manhã
0 2 * * * /usr/bin/pg_dump femme_integra > /home/femme/backups/femme_$(date +\%Y\%m\%d).sql

# Limpar backups antigos (manter últimos 30 dias)
0 3 * * * find /home/femme/backups -name "femme_*.sql" -mtime +30 -delete
```

```bash
mkdir -p /home/femme/backups
```

---

## 🔥 TROUBLESHOOTING

### Aplicação não inicia
```bash
# Ver logs
sudo supervisorctl tail -f femme_integra stderr

# Testar manualmente
cd /home/femme/femme_integra/backend
source ../.venv/bin/activate
python manage.py check
gunicorn femme_integra.wsgi:application --bind 127.0.0.1:8003
```

### Erro 502 Bad Gateway
```bash
# Verificar se Gunicorn está rodando
sudo supervisorctl status

# Verificar logs do Nginx
sudo tail -f /var/log/nginx/femme_integra_error.log
```

### Banco de dados lento
```bash
# Verificar conexões ativas
sudo -u postgres psql -c "SELECT count(*) FROM pg_stat_activity WHERE datname='femme_integra';"

# Analisar queries lentas
sudo -u postgres psql femme_integra -c "SELECT query, calls, total_time FROM pg_stat_statements ORDER BY total_time DESC LIMIT 10;"
```

---

## 📈 PRÓXIMOS PASSOS (OPCIONAL)

### 1. Redis para cache (RECOMENDADO)
```bash
sudo apt install -y redis-server
pip install redis django-redis
```

**Adicionar ao settings.py:**
```python
CACHES = {
    'default': {
        'BACKEND': 'django_redis.cache.RedisCache',
        'LOCATION': 'redis://127.0.0.1:6379/1',
        'OPTIONS': {
            'CLIENT_CLASS': 'django_redis.client.DefaultClient',
        }
    }
}
```

### 2. Monitoramento com Uptime Kuma
```bash
docker run -d --restart=always -p 3001:3001 -v uptime-kuma:/app/data --name uptime-kuma louislam/uptime-kuma:1
```

Acesse: `http://SEU_IP:3001`

---

## ✅ CHECKLIST FINAL

- [ ] PostgreSQL configurado e otimizado
- [ ] Aplicação rodando via Gunicorn + Supervisor
- [ ] Nginx configurado
- [ ] SSL/HTTPS ativo (Let's Encrypt)
- [ ] Logs funcionando
- [ ] Backup automático configurado
- [ ] Firewall configurado (portas 80, 443, 22)
- [ ] DNS apontando para o IP da VPS
- [ ] Testar criação de requisição
- [ ] Verificar rate limiting funcionando

---

## 🔒 SEGURANÇA ADICIONAL

### Firewall (UFW)
```bash
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable
sudo ufw status
```

### Fail2ban (proteção contra brute force)
```bash
sudo apt install -y fail2ban
sudo systemctl enable fail2ban
sudo systemctl start fail2ban
```

---

**Tempo estimado de deploy**: 1-2 horas
**Custo mensal VPS KVM8**: ~R$ 150-250
