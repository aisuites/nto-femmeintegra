# 🚀 Próximos Passos - Deploy na VPS

## ✅ O que já está pronto:
- VPS Hostinger com Ubuntu 24.04
- Docker instalado
- IP: `72.61.223.244`
- Estrutura Docker completa no GitHub

## 📝 Checklist de Deploy

### 1. Push para GitHub
```bash
# No seu computador local
cd /Users/lusato/A\ TRABALHO/FEMME/NTO/femme_integra
git push origin main
```

### 2. Conectar na VPS
```bash
ssh root@72.61.223.244
```

### 3. Seguir o guia DEPLOY_DOCKER.md
Abra o arquivo `DEPLOY_DOCKER.md` e siga passo a passo:
- Clonar repositório
- Configurar .env
- Build e iniciar containers
- Testar aplicação

## ⚡ Comandos Rápidos

### Deploy inicial (na VPS):
```bash
cd /home/apps
git clone https://github.com/aisuites/nto-femmeintegra.git femme-integra
cd femme-integra
cp .env.docker .env
nano .env  # Ajustar senhas e chaves
docker-compose build
docker-compose up -d db redis web
docker-compose logs -f web
```

### Acessar aplicação:
```
http://72.61.223.244:8000
```

## 🔐 Importante: Gerar Senhas Seguras

Antes de fazer deploy, gere senhas fortes para:
- `DJANGO_SECRET_KEY`
- `POSTGRES_PASSWORD`
- `REDIS_PASSWORD`

```bash
# Gerar Django Secret Key
python3 -c 'from django.core.management.utils import get_random_secret_key; print(get_random_secret_key())'

# Gerar senhas aleatórias
openssl rand -base64 32
```

## 📊 Após Deploy

### Verificar se está funcionando:
```bash
# Ver containers rodando
docker-compose ps

# Ver logs
docker-compose logs -f

# Testar health
curl http://localhost:8000/health/
```

### Criar superusuário:
```bash
docker-compose exec web python manage.py createsuperuser
```

### Acessar admin:
```
http://72.61.223.244:8000/admin/
```

## 🎯 Próximas Melhorias

1. **Domínio próprio**: Apontar DNS para `72.61.223.244`
2. **SSL/HTTPS**: Configurar Certbot para certificado gratuito
3. **Nginx**: Ativar reverse proxy para melhor performance
4. **Backup**: Configurar backup automático do banco
5. **Monitoramento**: Instalar Portainer para gerenciar containers

## 📞 Suporte

Qualquer dúvida, consulte:
- `DEPLOY_DOCKER.md` - Guia completo
- `docker/README.md` - Estrutura de arquivos
- Logs: `docker-compose logs -f`
