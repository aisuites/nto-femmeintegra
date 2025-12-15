# Migration para criar tabelas de motivo de armazenamento inadequado

import django.db.models.deletion
from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('operacao', '0009_popular_motivos_inadequados'),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        # 1. Criar tabela de motivos de armazenamento inadequado
        migrations.CreateModel(
            name='MotivoArmazenamentoInadequado',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('codigo', models.CharField(db_index=True, help_text='Código único do motivo (ex: TEMP, FRASC, VAZAM)', max_length=20, unique=True, verbose_name='Código')),
                ('descricao', models.CharField(help_text='Descrição do motivo de armazenamento inadequado', max_length=200, verbose_name='Descrição')),
                ('ativo', models.BooleanField(db_index=True, default=True, help_text='Indica se o motivo está disponível para seleção', verbose_name='Ativo')),
            ],
            options={
                'verbose_name': 'Motivo de Armazenamento Inadequado',
                'verbose_name_plural': 'Motivos de Armazenamento Inadequado',
                'db_table': 'motivo_armazen_inadequado',
                'ordering': ('codigo', 'descricao'),
            },
        ),
        # 2. Criar tabela intermediária para relação N:N entre Amostra e Motivo
        migrations.CreateModel(
            name='AmostraMotivoArmazenamentoInadequado',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('cod_barras', models.CharField(db_index=True, help_text='Código de barras da amostra (desnormalizado para auditoria)', max_length=64, verbose_name='Código de barras da amostra')),
                ('amostra', models.ForeignKey(help_text='Amostra associada ao motivo', on_delete=django.db.models.deletion.CASCADE, related_name='motivos_armazenamento_inadequado', to='operacao.requisicaoamostra', verbose_name='Amostra')),
                ('motivo', models.ForeignKey(help_text='Motivo de armazenamento inadequado', on_delete=django.db.models.deletion.PROTECT, related_name='amostras_associadas', to='operacao.motivoarmazenamentoinadequado', verbose_name='Motivo')),
                ('usuario', models.ForeignKey(help_text='Usuário que registrou o motivo', on_delete=django.db.models.deletion.PROTECT, related_name='motivos_armazenamento_registrados', to=settings.AUTH_USER_MODEL, verbose_name='Usuário')),
            ],
            options={
                'verbose_name': 'Motivo de Armazenamento Inadequado da Amostra',
                'verbose_name_plural': 'Motivos de Armazenamento Inadequado das Amostras',
                'db_table': 'amostra_mtv_armaz_inadequado',
                'ordering': ('-created_at',),
            },
        ),
        # 3. Adicionar índice composto para performance
        migrations.AddIndex(
            model_name='amostramotivoarmazenamentoinadequado',
            index=models.Index(fields=['amostra', 'motivo'], name='idx_amostra_motivo'),
        ),
        # 4. Adicionar constraint de unicidade (mesma amostra não pode ter o mesmo motivo duplicado)
        migrations.AddConstraint(
            model_name='amostramotivoarmazenamentoinadequado',
            constraint=models.UniqueConstraint(fields=('amostra', 'motivo'), name='unique_amostra_motivo'),
        ),
    ]
