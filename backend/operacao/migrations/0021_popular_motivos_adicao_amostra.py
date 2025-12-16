# Generated manually

from django.db import migrations


def popular_motivos_adicao(apps, schema_editor):
    """Popula motivos de adição de amostra."""
    MotivoAlteracaoAmostra = apps.get_model('operacao', 'MotivoAlteracaoAmostra')
    
    motivos_adicao = [
        (1, 'Amostra não cadastrada na etapa de Recebimento'),
        (2, 'Amostra adicional identificada'),
        (3, 'Correção de cadastro'),
    ]
    
    for codigo, descricao in motivos_adicao:
        MotivoAlteracaoAmostra.objects.get_or_create(
            tipo='ADICAO',
            codigo=codigo,
            defaults={
                'descricao': descricao,
                'ativo': True
            }
        )


def reverter_motivos_adicao(apps, schema_editor):
    """Remove motivos de adição."""
    MotivoAlteracaoAmostra = apps.get_model('operacao', 'MotivoAlteracaoAmostra')
    MotivoAlteracaoAmostra.objects.filter(tipo='ADICAO').delete()


class Migration(migrations.Migration):

    dependencies = [
        ('operacao', '0020_motivo_alteracao_amostra'),
    ]

    operations = [
        migrations.RunPython(popular_motivos_adicao, reverter_motivos_adicao),
    ]
