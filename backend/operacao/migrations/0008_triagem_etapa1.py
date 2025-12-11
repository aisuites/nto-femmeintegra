# Generated manually for triagem etapa 1

from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('operacao', '0007_renomear_e_expandir_amostra'),
    ]

    operations = [
        # 1. Criar tabela lista_motivo_inadequado
        migrations.CreateModel(
            name='ListaMotivoInadequado',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('created_at', models.DateTimeField(auto_now_add=True, verbose_name='Criado em')),
                ('updated_at', models.DateTimeField(auto_now=True, verbose_name='Atualizado em')),
                ('codigo', models.CharField(help_text='Código único do motivo', max_length=20, unique=True, verbose_name='Código')),
                ('descricao', models.CharField(max_length=200, verbose_name='Descrição')),
                ('ativo', models.BooleanField(default=True, verbose_name='Ativo')),
            ],
            options={
                'verbose_name': 'Motivo de Armazenamento Inadequado',
                'verbose_name_plural': 'Motivos de Armazenamento Inadequado',
                'db_table': 'lista_motivo_inadequado',
                'ordering': ('codigo', 'descricao'),
            },
        ),
        
        # 2. Adicionar campo triagem1_validada
        migrations.AddField(
            model_name='requisicaoamostra',
            name='triagem1_validada',
            field=models.BooleanField(
                db_index=True,
                default=False,
                help_text='Indica se a amostra foi validada na triagem etapa 1',
                verbose_name='Triagem 1 validada'
            ),
        ),
        
        # 3. Remover campo antigo motivo_inadequado_id
        migrations.RemoveField(
            model_name='requisicaoamostra',
            name='motivo_inadequado_id',
        ),
        
        # 4. Adicionar FK motivo_inadequado
        migrations.AddField(
            model_name='requisicaoamostra',
            name='motivo_inadequado',
            field=models.ForeignKey(
                blank=True,
                db_column='motivo_inadequado_id',
                help_text='Motivo quando flag_armazenamento_inadequado=True',
                null=True,
                on_delete=django.db.models.deletion.SET_NULL,
                related_name='amostras',
                to='operacao.listamotivoinadequado',
                verbose_name='Motivo de armazenamento inadequado'
            ),
        ),
    ]
