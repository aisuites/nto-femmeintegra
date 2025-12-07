# 🩺 FEMME Integra - Sistema de Gestão NTO

Sistema integrado para gestão de requisições, amostras e operações do laboratório FEMME.

## 🚀 Tecnologias

- **Backend**: Django 5.2, Python 3.12
- **Database**: PostgreSQL 14+
- **Cache**: Redis 7+
- **Frontend**: HTML5, CSS3, Vanilla JavaScript
- **Deploy**: Gunicorn, Nginx, Supervisor

## 📋 Requisitos

- Python 3.12+
- PostgreSQL 14+
- Redis 7+ (opcional, mas recomendado)

## 🔧 Instalação Local

### 1. Clonar repositório
```bash
git clone [URL_DO_REPOSITORIO]
cd femme_integra
```

### 2. Criar ambiente virtual
```bash
python3.12 -m venv .venv
source .venv/bin/activate  # macOS/Linux
# .venv\Scripts\activate  # Windows
```

### 3. Instalar dependências
```bash
pip install -r requirements.txt
```

### 4. Configurar variáveis de ambiente ⚠️ IMPORTANTE
```bash
# Copiar template
cp .env.example .env

# Gerar SECRET_KEY segura
python -c 'from django.core.management.utils import get_random_secret_key; print(get_random_secret_key())'

# Editar .env com suas configurações
# NUNCA commite o arquivo .env!
nano .env
```

**Configurações mínimas necessárias:**
- `DJANGO_SECRET_KEY` - Gerar uma chave única
- `DATABASE_URL` - Conexão com PostgreSQL
- `REDIS_URL` - Conexão com Redis (opcional)

📖 Ver `SECURITY.md` para guia completo de segurança

### 5. Configurar banco de dados
```bash
# Criar banco PostgreSQL
createdb femme_integra

# Rodar migrations
cd backend
python manage.py migrate
```

### 6. Criar superusuário
```bash
python manage.py createsuperuser
```

### 7. Popular dados iniciais ⭐
```bash
# Popular Status de Requisição (8) e Origens Papabrasil (14)
python manage.py popular_dados_iniciais

# Ou limpar e repopular
python manage.py popular_dados_iniciais --limpar
```

**Dados criados:**
- ✅ 8 Status de Requisição (ABERTO NTO, RECEBIDO, CAIXA LIDERANÇA, etc.)
- ✅ 14 Origens Papabrasil (FEMME, PP BRASIL RIO DE JANEIRO, etc.)

Ver detalhes completos em: `DADOS_INICIAIS_POPULADOS.md`

### 8. Iniciar Redis (opcional)
```bash
# macOS
brew services start redis

# Linux
sudo systemctl start redis-server
```

### 9. Iniciar servidor
```bash
python manage.py runserver 127.0.0.1:8003
```

Acesse: http://127.0.0.1:8003

## 📁 Estrutura do Projeto

```
femme_integra/
├── backend/
│   ├── accounts/          # Autenticação e usuários
│   ├── core/              # Models base e services
│   ├── operacao/          # App principal (recebimento, requisições)
│   ├── gestao/            # Gestão e relatórios
│   ├── atendimento/       # Atendimento ao cliente
│   └── femme_integra/     # Configurações do projeto
├── frontend/
│   ├── templates/         # Templates HTML
│   └── static/            # CSS, JS, imagens
├── deploy/                # Configurações de deploy
└── docs/                  # Documentação
```

## 🔐 Segurança

- CSRF protection ativado
- Rate limiting (20-30 req/min)
- LoginRequired em todas as views
- Validação de entrada
- Logging de auditoria
- HTTPS em produção

## 🚀 Deploy

Ver documentação completa em:
- `deploy/DEPLOY_VPS.md` - Guia completo de deploy
- `deploy/VPS_KVM8_OTIMIZADO.md` - Configurações otimizadas
- `deploy/REDIS_GUIA.md` - Configuração do Redis

## 📊 Performance

- **Cache Redis**: 78x mais rápido
- **Rate limiting**: 20-30 req/min
- **Usuários simultâneos**: 200-500 (VPS 32GB)
- **Tempo de resposta**: <100ms

## 🧪 Testes

```bash
# Rodar testes
python manage.py test

# Verificar deploy
python manage.py check --deploy
```

## 🛠️ Comandos Úteis

### Gerenciamento de Cache
```bash
# Limpar cache de unidades e portadores
python manage.py limpar_cache

# Limpar todo o cache do sistema
python manage.py limpar_cache --all

# Limpar chave específica
python manage.py limpar_cache --key recebimento:unidades
```

### Dados Iniciais
```bash
# Popular dados iniciais (Status e Origens)
python manage.py popular_dados_iniciais

# Limpar e repopular
python manage.py popular_dados_iniciais --limpar
```

**Nota:** Também é possível limpar o cache via Django Admin usando as actions disponíveis em Unidades e Portadores.

## 📝 Variáveis de Ambiente

```env
# Django
DJANGO_SECRET_KEY=sua-chave-secreta-aqui
DJANGO_DEBUG=true
DJANGO_ALLOWED_HOSTS=localhost,127.0.0.1

# Database
DATABASE_URL=postgresql://user:password@localhost:5432/femme_integra

# Redis (opcional)
REDIS_URL=redis://127.0.0.1:6379/1
```

## 🤝 Contribuindo

1. Fork o projeto
2. Crie uma branch (`git checkout -b feature/nova-funcionalidade`)
3. Commit suas mudanças (`git commit -am 'Adiciona nova funcionalidade'`)
4. Push para a branch (`git push origin feature/nova-funcionalidade`)
5. Abra um Pull Request

## 📄 Licença

Propriedade de FEMME - Todos os direitos reservados.

## 👥 Equipe

Desenvolvido por FEMME Tech Team

---

**Versão**: 1.0.0  
**Última atualização**: Dezembro 2024
