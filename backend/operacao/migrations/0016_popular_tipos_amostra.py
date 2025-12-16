# Generated manually - Popular tipos de amostra

from django.db import migrations


TIPOS_AMOSTRA = [
    'Biópsia',
    'Bacterioscopia + Cito',
    'Bacterioscopia + Swab',
    'Biópsia + Papa',
    'Bloco + Lâmina',
    'Bloco de parafina',
    'Citologia em meio liquido',
    'Cito + Bacterioscopia + Swab',
    'Cito + Biopsia',
    'Cito + Biopsia + Papa',
    'Cito + Biópsia + Swab',
    'Cito + papa + biópsia + swab',
    'Cito + Papa + Swab',
    'Citomama',
    'Citomama + Cito',
    'Cultura em swab',
    'Cultura em placa',
    'Material para revisão',
    'PAAF',
    'PAAF + Biopsia',
    'Papa + Biópsia',
    'Papa + Cito',
    'Papa + Swab',
    'Papanicolau em lâmina',
    'Swab + Biopsia',
    'Swab + cito',
]


def popular_tipos_amostra(apps, schema_editor):
    TipoAmostra = apps.get_model('operacao', 'TipoAmostra')
    
    for descricao in TIPOS_AMOSTRA:
        TipoAmostra.objects.get_or_create(
            descricao=descricao,
            defaults={'ativo': True}
        )


def reverter_tipos_amostra(apps, schema_editor):
    TipoAmostra = apps.get_model('operacao', 'TipoAmostra')
    TipoAmostra.objects.filter(descricao__in=TIPOS_AMOSTRA).delete()


class Migration(migrations.Migration):

    dependencies = [
        ('operacao', '0015_etapa3_tipo_amostra_flags'),
    ]

    operations = [
        migrations.RunPython(popular_tipos_amostra, reverter_tipos_amostra),
    ]
