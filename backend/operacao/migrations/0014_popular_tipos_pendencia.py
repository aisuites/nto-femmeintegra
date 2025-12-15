# Migration para popular tabela tipo_pendencia com dados iniciais

from django.db import migrations


def popular_tipos_pendencia(apps, schema_editor):
    """Popula a tabela tipo_pendencia com os tipos iniciais."""
    TipoPendencia = apps.get_model('operacao', 'TipoPendencia')
    
    tipos = [
        (1, 'CPF EM BRANCO'),
        (2, 'DADOS CONVÊNIO INCOMPLETOS'),
        (3, 'MATRÍCULA EM BRANCO'),
        (4, 'ASSINATURA MÉDICO EM BRANCO'),
        (5, 'ASSINATURA PACIENTE EM BRANCO'),
        (6, 'IMAGEM REQUISIÇÃO INVÁLIDA'),
        (7, 'MÉDICO NÃO CADASTRADO'),
        (8, 'CARIMBO OU ASSINATURA EM BRANCO'),
        (9, 'PLANO NÃO ATENDIDO'),
        (10, 'EXAMES NÃO AUTORIZADOS'),
        (11, 'OFERECER CONGIP'),
        (12, 'EM LIBERAÇÃO'),
        (13, 'NOME PACIENTE EM BRANCO/ RASURADO'),
        (14, 'EXAMES EM BRANCO'),
        (15, 'REQUISIÇÃO EM BRANCO'),
        (16, 'AMOSTRA CÓDIGO BARRAS DIVERGENTE'),
    ]
    
    for codigo, descricao in tipos:
        TipoPendencia.objects.get_or_create(
            codigo=codigo,
            defaults={'descricao': descricao, 'ativo': True}
        )


def remover_tipos_pendencia(apps, schema_editor):
    """Remove os tipos de pendência (reversão)."""
    TipoPendencia = apps.get_model('operacao', 'TipoPendencia')
    TipoPendencia.objects.filter(codigo__lte=16).delete()


class Migration(migrations.Migration):

    dependencies = [
        ('operacao', '0013_criar_tabelas_pendencia'),
    ]

    operations = [
        migrations.RunPython(popular_tipos_pendencia, remover_tipos_pendencia),
    ]
