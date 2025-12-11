# Data migration para popular motivos de armazenamento inadequado

from django.db import migrations


def popular_motivos(apps, schema_editor):
    """Popula tabela lista_motivo_inadequado com dados iniciais."""
    ListaMotivoInadequado = apps.get_model('operacao', 'ListaMotivoInadequado')
    
    motivos = [
        {'codigo': 'TEMP', 'descricao': 'Temperatura inadequada'},
        {'codigo': 'FRASC', 'descricao': 'Frasco danificado'},
        {'codigo': 'VAZAM', 'descricao': 'Amostra derramada/vazamento'},
        {'codigo': 'VENC', 'descricao': 'Prazo de validade vencido'},
        {'codigo': 'CONTAM', 'descricao': 'Contaminação visível'},
        {'codigo': 'OUTRO', 'descricao': 'Outros'},
    ]
    
    for motivo_data in motivos:
        ListaMotivoInadequado.objects.get_or_create(
            codigo=motivo_data['codigo'],
            defaults={
                'descricao': motivo_data['descricao'],
                'ativo': True
            }
        )


def reverter_motivos(apps, schema_editor):
    """Remove motivos populados."""
    ListaMotivoInadequado = apps.get_model('operacao', 'ListaMotivoInadequado')
    codigos = ['TEMP', 'FRASC', 'VAZAM', 'VENC', 'CONTAM', 'OUTRO']
    ListaMotivoInadequado.objects.filter(codigo__in=codigos).delete()


class Migration(migrations.Migration):

    dependencies = [
        ('operacao', '0008_triagem_etapa1'),
    ]

    operations = [
        migrations.RunPython(popular_motivos, reverter_motivos),
    ]
