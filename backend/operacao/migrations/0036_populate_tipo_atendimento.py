# Generated migration to populate TipoAtendimento initial data

from django.db import migrations


def populate_tipo_atendimento(apps, schema_editor):
    """Popula tipos de atendimento iniciais."""
    TipoAtendimento = apps.get_model('operacao', 'TipoAtendimento')
    
    tipos = [
        {'codigo': 'CONVENIO', 'descricao': 'CONVÊNIO'},
        {'codigo': 'CONGIP_FAT', 'descricao': 'CONGIP FATURAMENTO'},
        {'codigo': 'CONGIP_CAIXA', 'descricao': 'CONGIP CAIXA'},
        {'codigo': 'CORTESIA', 'descricao': 'CORTESIA'},
    ]
    
    for tipo in tipos:
        TipoAtendimento.objects.get_or_create(
            codigo=tipo['codigo'],
            defaults={'descricao': tipo['descricao'], 'ativo': True}
        )


def reverse_populate(apps, schema_editor):
    """Remove tipos de atendimento criados."""
    TipoAtendimento = apps.get_model('operacao', 'TipoAtendimento')
    TipoAtendimento.objects.filter(
        codigo__in=['CONVENIO', 'CONGIP_FAT', 'CONGIP_CAIXA', 'CORTESIA']
    ).delete()


class Migration(migrations.Migration):

    dependencies = [
        ('operacao', '0035_cadastro_requisicao_models'),
    ]

    operations = [
        migrations.RunPython(populate_tipo_atendimento, reverse_populate),
    ]
