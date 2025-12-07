-- Verificar as tabelas criadas no app operacao
SELECT tablename 
FROM pg_tables 
WHERE schemaname = 'public' 
  AND tablename LIKE 'operacao_%'
ORDER BY tablename;
