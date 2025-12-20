#!/bin/bash
set -e

echo "🚀 Starting FEMME Integra..."

# Aguardar banco de dados estar pronto
echo "⏳ Waiting for PostgreSQL..."
while ! nc -z db 5432; do
  sleep 0.1
done
echo "✅ PostgreSQL is ready!"

# Aguardar Redis estar pronto
echo "⏳ Waiting for Redis..."
while ! nc -z redis 6379; do
  sleep 0.1
done
echo "✅ Redis is ready!"

# Garantir permissões nos volumes (static/media) para o usuário da aplicação
echo "🔐 Fixing permissions..."
mkdir -p /app/frontend/staticfiles /app/frontend/media
chown -R appuser:appuser /app/frontend/staticfiles /app/frontend/media

# Executar migrações
echo "🔄 Running database migrations..."
gosu appuser python backend/manage.py migrate --noinput

# Coletar arquivos estáticos
echo "📦 Collecting static files..."
gosu appuser python backend/manage.py collectstatic --noinput --clear

# Criar superusuário se não existir (apenas em dev)
if [ "$DJANGO_DEBUG" = "true" ]; then
  echo "👤 Creating superuser if needed..."
  
  # Usar variáveis de ambiente ou valores padrão
  ADMIN_USER=${DJANGO_ADMIN_USER:-nto}
  ADMIN_EMAIL=${DJANGO_ADMIN_EMAIL:-admin@femme.com.br}
  ADMIN_PASSWORD=${DJANGO_ADMIN_PASSWORD:-nto#2025}
  
  gosu appuser python backend/manage.py shell << END
from django.contrib.auth import get_user_model
import os
User = get_user_model()
admin_user = os.environ.get('DJANGO_ADMIN_USER', 'nto')
admin_email = os.environ.get('DJANGO_ADMIN_EMAIL', 'admin@femme.com.br')
admin_password = os.environ.get('DJANGO_ADMIN_PASSWORD', 'nto#2025')
if not User.objects.filter(username=admin_user).exists():
    User.objects.create_superuser(admin_user, admin_email, admin_password)
    print(f'✅ Superuser created: {admin_user}')
else:
    print(f'ℹ️  Superuser {admin_user} already exists')
END
fi

echo "✅ FEMME Integra is ready!"
echo "🌐 Starting application..."

# Executar comando passado como argumento
exec gosu appuser "$@"
