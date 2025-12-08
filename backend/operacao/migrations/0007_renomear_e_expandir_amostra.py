# Generated manually

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('operacao', '0006_adicionar_tabelas_arquivos'),
    ]

    operations = [
        # 1. Renomear modelo (apenas no Django)
        migrations.RenameModel(
            old_name='Amostra',
            new_name='RequisicaoAmostra',
        ),
        
        # 2. Renomear tabela no banco de dados
        migrations.AlterModelTable(
            name='requisicaoamostra',
            table='operacao_requisicao_amostra',
        ),
        
        # 3. Atualizar Meta options
        migrations.AlterModelOptions(
            name='requisicaoamostra',
            options={
                'ordering': ('requisicao', 'ordem'),
                'verbose_name': 'Amostra da Requisição',
                'verbose_name_plural': 'Amostras das Requisições',
            },
        ),
        
        # 4. Adicionar novos campos para triagem
        migrations.AddField(
            model_name='requisicaoamostra',
            name='tipos_amostra_id',
            field=models.IntegerField(
                blank=True,
                null=True,
                verbose_name='ID do tipo de amostra',
                help_text='Referência ao tipo de amostra (ex: sangue, urina, etc)',
            ),
        ),
        migrations.AddField(
            model_name='requisicaoamostra',
            name='data_coleta',
            field=models.DateField(
                blank=True,
                null=True,
                verbose_name='Data da coleta',
            ),
        ),
        migrations.AddField(
            model_name='requisicaoamostra',
            name='data_validade',
            field=models.DateField(
                blank=True,
                null=True,
                verbose_name='Data de validade',
            ),
        ),
        migrations.AddField(
            model_name='requisicaoamostra',
            name='flag_data_coleta_rasurada',
            field=models.BooleanField(
                default=False,
                verbose_name='Data de coleta rasurada',
            ),
        ),
        migrations.AddField(
            model_name='requisicaoamostra',
            name='flag_sem_data_validade',
            field=models.BooleanField(
                default=False,
                verbose_name='Sem data de validade',
            ),
        ),
        migrations.AddField(
            model_name='requisicaoamostra',
            name='descricao',
            field=models.CharField(
                max_length=50,
                blank=True,
                default='',
                verbose_name='Descrição/Observações',
            ),
        ),
        migrations.AddField(
            model_name='requisicaoamostra',
            name='status',
            field=models.IntegerField(
                blank=True,
                null=True,
                verbose_name='Status da amostra',
                help_text='Status de processamento da amostra',
            ),
        ),
        migrations.AddField(
            model_name='requisicaoamostra',
            name='flag_amostra_sem_identificacao',
            field=models.BooleanField(
                default=False,
                verbose_name='Amostra sem identificação (biópsia/swab)',
            ),
        ),
        migrations.AddField(
            model_name='requisicaoamostra',
            name='flag_armazenamento_inadequado',
            field=models.BooleanField(
                default=False,
                verbose_name='Armazenamento inadequado',
            ),
        ),
        migrations.AddField(
            model_name='requisicaoamostra',
            name='flag_frasco_trocado_tipo_coleta',
            field=models.BooleanField(
                default=False,
                verbose_name='Frasco trocado - tipo de coletor',
            ),
        ),
        migrations.AddField(
            model_name='requisicaoamostra',
            name='flag_material_nao_analisado',
            field=models.BooleanField(
                default=False,
                verbose_name='Tipo de material não analisado pelo FEMME',
            ),
        ),
        migrations.AddField(
            model_name='requisicaoamostra',
            name='motivo_inadequado_id',
            field=models.IntegerField(
                blank=True,
                null=True,
                verbose_name='ID do motivo de armazenamento inadequado',
                help_text='Referência ao motivo quando flag_armazenamento_inadequado=True',
            ),
        ),
    ]
