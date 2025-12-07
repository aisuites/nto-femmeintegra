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

### 4. Configurar variáveis de ambiente
```bash
cp .env.example .env
# Editar .env com suas configurações
```

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

### 7. Popular dados iniciais
```bash
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
