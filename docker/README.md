# 📁 Diretório Docker

Este diretório contém arquivos de configuração para deploy com Docker.

## Estrutura

```
docker/
├── entrypoint.sh          # Script de inicialização do container Django
├── postgres/
│   └── init.sql          # Script de inicialização do PostgreSQL
└── nginx/
    ├── nginx.conf        # Configuração principal do Nginx
    ├── conf.d/
    │   └── femme.conf    # Configuração do site FEMME Integra
    └── ssl/              # Certificados SSL (adicionar quando tiver)
```

## Arquivos

### entrypoint.sh
Script executado ao iniciar o container Django. Responsável por:
- Aguardar PostgreSQL e Redis estarem prontos
- Executar migrações do banco
- Coletar arquivos estáticos
- Criar superusuário em ambiente dev

### postgres/init.sql
Script executado na primeira criação do banco. Configura:
- Extensões PostgreSQL (uuid-ossp, pg_trgm)
- Parâmetros de performance

### nginx/
Configurações do Nginx como reverse proxy:
- `nginx.conf`: Configuração global
- `conf.d/femme.conf`: Configuração específica do FEMME Integra
- `ssl/`: Diretório para certificados SSL (criar quando necessário)

## Uso

Estes arquivos são utilizados automaticamente pelo `docker-compose.yml` na raiz do projeto.

Consulte `DEPLOY_DOCKER.md` na raiz para instruções completas de deploy.
