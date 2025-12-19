-- Inicialização do banco de dados PostgreSQL para FEMME Integra
-- Este script é executado apenas na primeira criação do container

-- Garantir encoding UTF-8
SET client_encoding = 'UTF8';

-- Criar extensões necessárias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- Configurações de performance
ALTER SYSTEM SET shared_buffers = '256MB';
ALTER SYSTEM SET effective_cache_size = '1GB';
ALTER SYSTEM SET maintenance_work_mem = '64MB';
ALTER SYSTEM SET checkpoint_completion_target = '0.9';
ALTER SYSTEM SET wal_buffers = '16MB';
ALTER SYSTEM SET default_statistics_target = '100';
ALTER SYSTEM SET random_page_cost = '1.1';
ALTER SYSTEM SET effective_io_concurrency = '200';
ALTER SYSTEM SET work_mem = '4MB';
ALTER SYSTEM SET min_wal_size = '1GB';
ALTER SYSTEM SET max_wal_size = '4GB';

-- Log de inicialização
DO $$
BEGIN
  RAISE NOTICE '✅ Database initialized successfully';
  RAISE NOTICE '📊 Extensions created: uuid-ossp, pg_trgm';
  RAISE NOTICE '⚙️  Performance settings applied';
END $$;
