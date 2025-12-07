-- Script para resetar as tabelas do app operacao
-- ATENÇÃO: Este script irá DELETAR TODOS OS DADOS das tabelas operacao

-- Desabilitar checagem de foreign keys temporariamente
SET session_replication_role = 'replica';

-- Dropar tabelas antigas (se existirem)
DROP TABLE IF EXISTS operacao_amostra CASCADE;
DROP TABLE IF EXISTS operacao_requisicaostatushistorico CASCADE;
DROP TABLE IF EXISTS operacao_requisicao CASCADE;
DROP TABLE IF EXISTS operacao_dadosrequisicao CASCADE;
DROP TABLE IF EXISTS operacao_portadorrepresentante CASCADE;
DROP TABLE IF EXISTS operacao_statusrequisicao CASCADE;
DROP TABLE IF EXISTS operacao_motivopreenchimento CASCADE;
DROP TABLE IF EXISTS operacao_motivostatusmanual CASCADE;
DROP TABLE IF EXISTS operacao_origem CASCADE;
DROP TABLE IF EXISTS operacao_unidade CASCADE;

-- Reabilitar checagem de foreign keys
SET session_replication_role = 'origin';

-- Limpar registro de migrations antigas
DELETE FROM django_migrations WHERE app = 'operacao';
DELETE FROM django_migrations WHERE app = 'tabelas_sistema';
