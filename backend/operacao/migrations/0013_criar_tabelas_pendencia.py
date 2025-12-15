# Migration para criar tabelas de pendências de requisições

import django.db.models.deletion
from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('operacao', '0012_remover_lista_motivo_inadequado'),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        # 1. Criar tabela TipoPendencia
        migrations.CreateModel(
            name='TipoPendencia',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('codigo', models.PositiveSmallIntegerField(db_index=True, help_text='Código único do tipo de pendência', unique=True, verbose_name='Código')),
                ('descricao', models.CharField(help_text='Descrição do tipo de pendência', max_length=200, verbose_name='Descrição')),
                ('ativo', models.BooleanField(db_index=True, default=True, help_text='Indica se o tipo de pendência está disponível para uso', verbose_name='Ativo')),
            ],
            options={
                'verbose_name': 'Tipo de Pendência',
                'verbose_name_plural': 'Tipos de Pendência',
                'db_table': 'tipo_pendencia',
                'ordering': ('codigo',),
            },
        ),
        # 2. Criar tabela RequisicaoPendencia
        migrations.CreateModel(
            name='RequisicaoPendencia',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('codigo_barras', models.CharField(db_index=True, help_text='Código de barras da requisição (desnormalizado para auditoria)', max_length=64, verbose_name='Código de barras')),
                ('status', models.CharField(choices=[('PENDENTE', 'Pendente'), ('RESOLVIDO', 'Resolvido')], db_index=True, default='PENDENTE', help_text='Status da pendência', max_length=10, verbose_name='Status')),
                ('requisicao', models.ForeignKey(help_text='Requisição associada à pendência', on_delete=django.db.models.deletion.CASCADE, related_name='pendencias', to='operacao.dadosrequisicao', verbose_name='Requisição')),
                ('tipo_pendencia', models.ForeignKey(help_text='Tipo da pendência registrada', on_delete=django.db.models.deletion.PROTECT, related_name='pendencias', to='operacao.tipopendencia', verbose_name='Tipo de Pendência')),
                ('usuario', models.ForeignKey(help_text='Usuário que registrou a pendência', on_delete=django.db.models.deletion.PROTECT, related_name='pendencias_registradas', to=settings.AUTH_USER_MODEL, verbose_name='Usuário')),
            ],
            options={
                'verbose_name': 'Pendência da Requisição',
                'verbose_name_plural': 'Pendências das Requisições',
                'db_table': 'requisicao_pendencia',
                'ordering': ('-created_at',),
            },
        ),
        # 3. Criar índices para RequisicaoPendencia
        migrations.AddIndex(
            model_name='requisicaopendencia',
            index=models.Index(fields=['requisicao', 'tipo_pendencia'], name='idx_req_tipo_pend'),
        ),
        migrations.AddIndex(
            model_name='requisicaopendencia',
            index=models.Index(fields=['status', '-created_at'], name='idx_status_created'),
        ),
    ]
