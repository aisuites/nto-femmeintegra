# Generated manually - Popular tipos de pendência da Etapa 3

from django.db import migrations


TIPOS_PENDENCIA_ETAPA3 = [
    (17, 'PROBLEMA COM CPF'),
    (18, 'PROBLEMA COM DADOS DO MÉDICO'),
]


def popular_tipos_pendencia(apps, schema_editor):
    TipoPendencia = apps.get_model('operacao', 'TipoPendencia')
    
    for codigo, descricao in TIPOS_PENDENCIA_ETAPA3:
        TipoPendencia.objects.get_or_create(
            codigo=codigo,
            defaults={'descricao': descricao, 'ativo': True}
        )


def reverter_tipos_pendencia(apps, schema_editor):
    TipoPendencia = apps.get_model('operacao', 'TipoPendencia')
    codigos = [codigo for codigo, _ in TIPOS_PENDENCIA_ETAPA3]
    TipoPendencia.objects.filter(codigo__in=codigos).delete()


class Migration(migrations.Migration):

    dependencies = [
        ('operacao', '0016_popular_tipos_amostra'),
    ]

    operations = [
        migrations.RunPython(popular_tipos_pendencia, reverter_tipos_pendencia),
    ]
