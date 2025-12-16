# Generated manually

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('operacao', '0021_popular_motivos_adicao_amostra'),
    ]

    operations = [
        migrations.AddField(
            model_name='logalteracaoamostra',
            name='ordem_amostra',
            field=models.PositiveSmallIntegerField(
                blank=True,
                help_text='Número do frasco/ordem da amostra na requisição',
                null=True,
                verbose_name='Ordem/Frasco'
            ),
        ),
    ]
