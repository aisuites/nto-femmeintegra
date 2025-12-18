# Generated manually - adicionar tipo TAREFA ao modelo Notificacao

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('operacao', '0031_add_origem_proprio'),
    ]

    operations = [
        migrations.AlterField(
            model_name='notificacao',
            name='tipo',
            field=models.CharField(
                choices=[
                    ('TRANSFERENCIA', 'Transferência de Requisição'),
                    ('TAREFA', 'Nova Tarefa'),
                    ('ALERTA', 'Alerta'),
                    ('INFO', 'Informação')
                ],
                default='INFO',
                max_length=20,
                verbose_name='Tipo'
            ),
        ),
    ]
