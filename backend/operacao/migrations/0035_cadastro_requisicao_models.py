# Generated migration for Cadastro Requisição models

from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
        ('operacao', '0033_criar_evento_tarefa'),
    ]

    operations = [
        # Adicionar flag_sexo_a_confirmar em DadosRequisicao
        migrations.AddField(
            model_name='dadosrequisicao',
            name='flag_sexo_a_confirmar',
            field=models.BooleanField(
                default=False,
                help_text='Indica que o sexo do paciente precisa ser confirmado posteriormente',
                verbose_name='Sexo a confirmar'
            ),
        ),
        
        # Criar tabela TipoAtendimento
        migrations.CreateModel(
            name='TipoAtendimento',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('codigo', models.CharField(db_index=True, help_text='Código único do tipo de atendimento (ex: CONVENIO, CONGIP_FAT)', max_length=30, unique=True, verbose_name='Código')),
                ('descricao', models.CharField(help_text='Descrição do tipo de atendimento', max_length=100, verbose_name='Descrição')),
                ('ativo', models.BooleanField(db_index=True, default=True, help_text='Indica se o tipo de atendimento está disponível para uso', verbose_name='Ativo')),
            ],
            options={
                'verbose_name': 'Tipo de Atendimento',
                'verbose_name_plural': 'Tipos de Atendimento',
                'db_table': 'tipo_atendimento',
                'ordering': ('descricao',),
            },
        ),
        
        # Criar tabela RequisicaoExame
        migrations.CreateModel(
            name='RequisicaoExame',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('cod_req', models.CharField(db_index=True, help_text='Código da requisição (desnormalizado para performance)', max_length=30, verbose_name='Código da requisição')),
                ('cod_barras_req', models.CharField(db_index=True, help_text='Código de barras da requisição (desnormalizado para auditoria)', max_length=64, verbose_name='Código de barras da requisição')),
                ('num_autorizacao', models.CharField(blank=True, default='', help_text='Número de autorização retornado pela API', max_length=50, verbose_name='Número de Autorização')),
                ('num_guia', models.CharField(blank=True, default='', help_text='Número da guia retornado pela API', max_length=50, verbose_name='Número da Guia')),
                ('num_guia_prestador', models.CharField(blank=True, default='', help_text='Número da guia do prestador retornado pela API', max_length=50, verbose_name='Número da Guia Prestador')),
                ('retorno_autorizacao', models.JSONField(blank=True, default=dict, help_text='Dados completos retornados pela API de autorização', verbose_name='Retorno da Autorização')),
                ('created_by', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='%(class)s_created', to=settings.AUTH_USER_MODEL)),
                ('updated_by', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='%(class)s_updated', to=settings.AUTH_USER_MODEL)),
                ('requisicao', models.ForeignKey(help_text='Requisição à qual o exame pertence', on_delete=django.db.models.deletion.CASCADE, related_name='exames', to='operacao.dadosrequisicao', verbose_name='Requisição')),
                ('tipo_amostra', models.ForeignKey(help_text='Tipo de amostra/exame selecionado', on_delete=django.db.models.deletion.PROTECT, related_name='exames', to='operacao.tipoamostra', verbose_name='Tipo de Amostra/Exame')),
                ('tipo_atendimento', models.ForeignKey(help_text='Tipo de atendimento (Convênio, CONGIP, etc)', on_delete=django.db.models.deletion.PROTECT, related_name='exames', to='operacao.tipoatendimento', verbose_name='Tipo de Atendimento')),
            ],
            options={
                'verbose_name': 'Exame da Requisição',
                'verbose_name_plural': 'Exames das Requisições',
                'db_table': 'requisicao_exame',
                'ordering': ('-created_at',),
            },
        ),
        
        # Adicionar índices para RequisicaoExame
        migrations.AddIndex(
            model_name='requisicaoexame',
            index=models.Index(fields=['requisicao', '-created_at'], name='requisicao__requisi_7e8f3a_idx'),
        ),
        migrations.AddIndex(
            model_name='requisicaoexame',
            index=models.Index(fields=['cod_req', '-created_at'], name='requisicao__cod_req_a1b2c3_idx'),
        ),
        migrations.AddIndex(
            model_name='requisicaoexame',
            index=models.Index(fields=['tipo_atendimento', '-created_at'], name='requisicao__tipo_at_d4e5f6_idx'),
        ),
    ]
