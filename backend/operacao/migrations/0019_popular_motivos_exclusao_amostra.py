# Generated manually - Popular motivos de exclusão de amostra

from django.db import migrations


def popular_motivos_exclusao(apps, schema_editor):
    """Popula a tabela de motivos de exclusão de amostra."""
    MotivoExclusaoAmostra = apps.get_model('operacao', 'MotivoExclusaoAmostra')
    
    motivos = [
        {'codigo': 1, 'descricao': 'Amostra não cadastrada na etapa de recebimento'},
        {'codigo': 2, 'descricao': 'Amostra duplicada'},
        {'codigo': 3, 'descricao': 'Amostra com código de barras incorreto'},
    ]
    
    for motivo in motivos:
        MotivoExclusaoAmostra.objects.get_or_create(
            codigo=motivo['codigo'],
            defaults={'descricao': motivo['descricao'], 'ativo': True}
        )


def reverter_motivos_exclusao(apps, schema_editor):
    """Remove os motivos de exclusão populados."""
    MotivoExclusaoAmostra = apps.get_model('operacao', 'MotivoExclusaoAmostra')
    MotivoExclusaoAmostra.objects.filter(codigo__in=[1, 2, 3]).delete()


class Migration(migrations.Migration):

    dependencies = [
        ('operacao', '0018_etapa3_auditoria_amostras'),
    ]

    operations = [
        migrations.RunPython(popular_motivos_exclusao, reverter_motivos_exclusao),
    ]
