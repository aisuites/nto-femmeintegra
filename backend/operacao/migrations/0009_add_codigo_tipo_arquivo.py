# Generated migration

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('operacao', '0007_renomear_e_expandir_amostra'),
    ]

    operations = [
        migrations.AddField(
            model_name='tipoarquivo',
            name='codigo',
            field=models.CharField(
                max_length=50,
                unique=True,
                null=True,
                blank=True,
                help_text='Código único para identificar o tipo de arquivo programaticamente',
                verbose_name='Código'
            ),
        ),
    ]
