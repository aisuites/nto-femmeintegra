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

# Executar migrações
echo "🔄 Running database migrations..."
python manage.py migrate --noinput

# Coletar arquivos estáticos
echo "📦 Collecting static files..."
python manage.py collectstatic --noinput --clear

# Criar superusuário se não existir (apenas em dev)
if [ "$DJANGO_DEBUG" = "true" ]; then
  echo "👤 Creating superuser if needed..."
  python manage.py shell << END
from django.contrib.auth import get_user_model
User = get_user_model()
if not User.objects.filter(username='admin').exists():
    User.objects.create_superuser('admin', 'admin@femme.com.br', 'admin123')
    print('✅ Superuser created: admin/admin123')
else:
    print('ℹ️  Superuser already exists')
END
fi

echo "✅ FEMME Integra is ready!"
echo "🌐 Starting application..."

# Executar comando passado como argumento
exec "$@"
