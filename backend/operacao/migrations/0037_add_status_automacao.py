# Generated migration to add status AUTOMAÇÃO

from django.db import migrations


def add_status_automacao(apps, schema_editor):
    """Adiciona o status AUTOMAÇÃO (código 13) se não existir."""
    StatusRequisicao = apps.get_model('operacao', 'StatusRequisicao')
    
    StatusRequisicao.objects.get_or_create(
        codigo='13',
        defaults={
            'descricao': 'AUTOMAÇÃO',
            'ordem': 13,
            'permite_edicao': False,
            'ativo': True,
        }
    )


def reverse_status(apps, schema_editor):
    """Remove o status AUTOMAÇÃO."""
    StatusRequisicao = apps.get_model('operacao', 'StatusRequisicao')
    StatusRequisicao.objects.filter(codigo='13').delete()


class Migration(migrations.Migration):

    dependencies = [
        ('operacao', '0036_populate_tipo_atendimento'),
    ]

    operations = [
        migrations.RunPython(add_status_automacao, reverse_status),
    ]
