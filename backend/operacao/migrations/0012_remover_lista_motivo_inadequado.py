# Migration para remover tabela antiga ListaMotivoInadequado
# e campo FK motivo_inadequado de RequisicaoAmostra

from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ('operacao', '0011_popular_motivos_armazenamento'),
    ]

    operations = [
        # 1. Remover FK motivo_inadequado de RequisicaoAmostra
        migrations.RemoveField(
            model_name='requisicaoamostra',
            name='motivo_inadequado',
        ),
        # 2. Deletar tabela antiga ListaMotivoInadequado
        migrations.DeleteModel(
            name='ListaMotivoInadequado',
        ),
    ]
