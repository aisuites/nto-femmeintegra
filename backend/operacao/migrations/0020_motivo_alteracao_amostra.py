# Generated manually

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('operacao', '0019_popular_motivos_exclusao_amostra'),
    ]

    operations = [
        # 1. Renomear tabela motivo_exclusao_amostra para motivo_alteracao_amostra
        migrations.RenameModel(
            old_name='MotivoExclusaoAmostra',
            new_name='MotivoAlteracaoAmostra',
        ),
        
        # 2. Adicionar campo tipo na tabela
        migrations.AddField(
            model_name='motivoalteracaoamostra',
            name='tipo',
            field=models.CharField(
                choices=[('ADICAO', 'Adição'), ('EXCLUSAO', 'Exclusão')],
                db_index=True,
                default='EXCLUSAO',
                help_text='Tipo de alteração (adição ou exclusão)',
                max_length=10,
                verbose_name='Tipo'
            ),
        ),
        
        # 3. Remover constraint unique do codigo (agora é unique por tipo+codigo)
        migrations.AlterField(
            model_name='motivoalteracaoamostra',
            name='codigo',
            field=models.PositiveSmallIntegerField(
                db_index=True,
                help_text='Código do motivo (único por tipo)',
                verbose_name='Código'
            ),
        ),
        
        # 4. Adicionar constraint unique_together para tipo+codigo
        migrations.AlterUniqueTogether(
            name='motivoalteracaoamostra',
            unique_together={('tipo', 'codigo')},
        ),
        
        # 5. Alterar db_table
        migrations.AlterModelTable(
            name='motivoalteracaoamostra',
            table='motivo_alteracao_amostra',
        ),
        
        # 6. Renomear campo motivo_exclusao para motivo em LogAlteracaoAmostra
        migrations.RenameField(
            model_name='logalteracaoamostra',
            old_name='motivo_exclusao',
            new_name='motivo',
        ),
    ]
