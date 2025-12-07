-- Verificar Status de Requisição
SELECT 'STATUS DE REQUISIÇÃO' as tabela;
SELECT codigo, descricao, ordem, permite_edicao 
FROM operacao_statusrequisicao 
ORDER BY ordem;

-- Verificar Origens
SELECT '' as separador;
SELECT 'ORIGENS (PAPABRASIL)' as tabela;
SELECT codigo, descricao, tipo, ativo 
FROM operacao_origem 
ORDER BY codigo::integer;
