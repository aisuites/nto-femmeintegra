# 🐳 Deploy FEMME Integra com Docker na VPS

## 📋 Pré-requisitos

- VPS com Ubuntu 24.04
- Docker e Docker Compose instalados ✅
- Acesso SSH: `ssh root@72.61.223.244`
- Repositório GitHub: `https://github.com/aisuites/nto-femmeintegra.git`

## 🚀 Passo a Passo

### 1️⃣ Conectar na VPS

```bash
ssh root@72.61.223.244
```

### 2️⃣ Instalar dependências adicionais

```bash
# Atualizar sistema
apt update && apt upgrade -y

# Instalar Git e outras ferramentas
apt install -y git curl nano htop

# Verificar Docker
docker --version
docker-compose --version
```

### 3️⃣ Criar estrutura de diretórios

```bash
# Criar diretório para aplicações
mkdir -p /home/apps
cd /home/apps
```

### 4️⃣ Clonar repositório

```bash
# Clonar do GitHub
git clone https://github.com/aisuites/nto-femmeintegra.git femme-integra
cd femme-integra
```

### 5️⃣ Configurar variáveis de ambiente

```bash
# Copiar template
cp .env.docker .env

# Editar arquivo .env
nano .env
```

**Valores que VOCÊ DEVE ALTERAR no .env:**

```bash
# Gerar chave secreta Django
python3 -c 'from django.core.management.utils import get_random_secret_key; print(get_random_secret_key())'

# Copie a chave gerada e cole em:
DJANGO_SECRET_KEY=COLE_A_CHAVE_AQUI

# Senhas seguras (gere senhas fortes)
POSTGRES_PASSWORD=SuaSenhaPostgresSegura123!
REDIS_PASSWORD=SuaSenhaRedisSegura123!

# Ajustar URLs no DATABASE_URL e REDIS_URL com as senhas acima
DATABASE_URL=postgresql://femme_integra:SuaSenhaPostgresSegura123!@db:5432/femme_integra
REDIS_URL=redis://:SuaSenhaRedisSegura123!@redis:6379/1

# Ajustar hosts permitidos
DJANGO_ALLOWED_HOSTS=72.61.223.244,seu-dominio.com.br,localhost
DJANGO_CSRF_TRUSTED_ORIGINS=http://72.61.223.244,https://seu-dominio.com.br

# Suas chaves de APIs (copie do .env local)
DYNAMSOFT_LICENSE_KEY=sua-licenca-real
KORUS_API_LOGIN=seu-login-real
KORUS_API_PASSWORD=sua-senha-real
# ... etc
```

### 6️⃣ Criar diretórios necessários

```bash
mkdir -p staticfiles mediafiles docker/nginx/ssl
chmod +x docker/entrypoint.sh
```

### 7️⃣ Build e iniciar containers

```bash
# Build das imagens
docker-compose build

# Iniciar serviços (sem Nginx por enquanto)
docker-compose up -d db redis web

# Ver logs em tempo real
docker-compose logs -f web
```

### 8️⃣ Verificar se está funcionando

```bash
# Verificar containers rodando
docker-compose ps

# Testar aplicação
curl http://localhost:8000/health/

# Acessar pelo navegador
http://72.61.223.244:8000
```

### 9️⃣ (Opcional) Adicionar Nginx

```bash
# Iniciar Nginx também
docker-compose --profile production up -d nginx

# Agora acesse pela porta 80
http://72.61.223.244
```

## 🔧 Comandos Úteis

### Ver logs
```bash
# Todos os serviços
docker-compose logs -f

# Apenas Django
docker-compose logs -f web

# Apenas PostgreSQL
docker-compose logs -f db
```

### Executar comandos Django
```bash
# Criar superusuário
docker-compose exec web python manage.py createsuperuser

# Executar migrações
docker-compose exec web python manage.py migrate

# Coletar estáticos
docker-compose exec web python manage.py collectstatic --noinput

# Shell Django
docker-compose exec web python manage.py shell
```

### Gerenciar containers
```bash
# Parar todos
docker-compose stop

# Iniciar todos
docker-compose start

# Reiniciar todos
docker-compose restart

# Parar e remover
docker-compose down

# Parar, remover e limpar volumes (CUIDADO: apaga banco!)
docker-compose down -v
```

### Atualizar aplicação
```bash
# Puxar código novo do GitHub
git pull origin main

# Rebuild e reiniciar
docker-compose up -d --build web

# Ver logs da atualização
docker-compose logs -f web
```

### Backup do banco de dados
```bash
# Criar backup
docker-compose exec db pg_dump -U femme_integra femme_integra > backup_$(date +%Y%m%d_%H%M%S).sql

# Restaurar backup
cat backup_20241219_180000.sql | docker-compose exec -T db psql -U femme_integra femme_integra
```

## 🔒 Segurança

### Firewall (UFW)
```bash
# Instalar e configurar firewall
apt install -y ufw

# Permitir SSH, HTTP e HTTPS
ufw allow 22/tcp
ufw allow 80/tcp
ufw allow 443/tcp

# Ativar firewall
ufw enable

# Ver status
ufw status
```

### SSL com Certbot (quando tiver domínio)
```bash
# Instalar Certbot
apt install -y certbot python3-certbot-nginx

# Obter certificado
certbot --nginx -d seu-dominio.com.br

# Renovação automática já está configurada
```

## 📊 Monitoramento

### Ver uso de recursos
```bash
# CPU e memória dos containers
docker stats

# Espaço em disco
df -h

# Logs do sistema
journalctl -u docker -f
```

## ⚠️ Troubleshooting

### Container não inicia
```bash
# Ver logs de erro
docker-compose logs web

# Verificar se portas estão em uso
netstat -tulpn | grep :8000

# Reiniciar tudo
docker-compose restart
```

### Banco de dados não conecta
```bash
# Verificar se PostgreSQL está rodando
docker-compose ps db

# Ver logs do PostgreSQL
docker-compose logs db

# Testar conexão
docker-compose exec db psql -U femme_integra -d femme_integra
```

### Aplicação lenta
```bash
# Ver uso de recursos
docker stats

# Aumentar workers do Gunicorn (editar docker-compose.yml)
# CMD ["gunicorn", "--workers", "4", ...]
```

## 🎯 Próximos Passos

1. ✅ Deploy básico funcionando
2. ⬜ Configurar domínio próprio
3. ⬜ Adicionar SSL (HTTPS)
4. ⬜ Configurar backup automático
5. ⬜ Adicionar monitoramento (Portainer, Grafana)
6. ⬜ CI/CD com GitHub Actions

## 📞 Suporte

Em caso de dúvidas ou problemas, verifique:
- Logs: `docker-compose logs -f`
- Status: `docker-compose ps`
- Recursos: `docker stats`
