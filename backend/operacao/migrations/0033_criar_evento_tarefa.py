# Generated manually - criar modelo EventoTarefa para tarefas automáticas

from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
        ('operacao', '0032_add_tipo_tarefa_notificacao'),
    ]

    operations = [
        migrations.CreateModel(
            name='EventoTarefa',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('created_at', models.DateTimeField(auto_now_add=True, verbose_name='Criado em')),
                ('updated_at', models.DateTimeField(auto_now=True, verbose_name='Atualizado em')),
                ('codigo_evento', models.CharField(help_text='Código único do evento (ex: MEDICO_NAO_ENCONTRADO)', max_length=50, unique=True, verbose_name='Código do Evento')),
                ('nome', models.CharField(help_text='Nome descritivo do evento', max_length=150, verbose_name='Nome do Evento')),
                ('descricao_evento', models.TextField(blank=True, default='', help_text='Quando este evento é disparado', verbose_name='Descrição do Evento')),
                ('titulo_template', models.CharField(help_text='Título da tarefa. Use {crm}, {uf}, {protocolo}, {usuario}, {data}', max_length=200, verbose_name='Template do Título')),
                ('descricao_template', models.TextField(blank=True, default='', help_text='Descrição da tarefa. Use {crm}, {uf}, {protocolo}, {usuario}, {data}', verbose_name='Template da Descrição')),
                ('prioridade', models.CharField(choices=[('BAIXA', 'Baixa'), ('MEDIA', 'Média'), ('ALTA', 'Alta'), ('URGENTE', 'Urgente')], default='MEDIA', help_text='Prioridade da tarefa criada', max_length=20, verbose_name='Prioridade')),
                ('responsavel_tipo', models.CharField(choices=[('EMAIL_DESTINO', 'Destinatário do Email (ConfiguracaoEmail)'), ('USUARIO_ACAO', 'Usuário que realizou a ação'), ('USUARIO_FIXO', 'Usuário específico')], default='EMAIL_DESTINO', help_text='Como determinar o responsável pela tarefa', max_length=20, verbose_name='Tipo de Responsável')),
                ('tipo_email', models.CharField(blank=True, default='', help_text='Tipo do email para buscar destinatário (ex: medico_nao_encontrado)', max_length=50, verbose_name='Tipo de Email (ConfiguracaoEmail)')),
                ('ativo', models.BooleanField(default=True, help_text='Se desativado, o evento não criará tarefas', verbose_name='Ativo')),
                ('responsavel_fixo', models.ForeignKey(blank=True, help_text='Usuário fixo (apenas se Tipo = Usuário específico)', null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='eventos_tarefa_responsavel', to=settings.AUTH_USER_MODEL, verbose_name='Responsável Fixo')),
                ('tipo_tarefa', models.ForeignKey(help_text='Tipo da tarefa que será criada', on_delete=django.db.models.deletion.PROTECT, related_name='eventos', to='operacao.tipotarefa', verbose_name='Tipo de Tarefa')),
            ],
            options={
                'verbose_name': 'Evento de Tarefa Automática',
                'verbose_name_plural': 'Eventos de Tarefas Automáticas',
                'ordering': ['nome'],
            },
        ),
    ]
