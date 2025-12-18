# Generated manually - adicionar opção PROPRIO no campo origem de Tarefa

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('operacao', '0030_populate_tipos_tarefa'),
    ]

    operations = [
        migrations.AlterField(
            model_name='tarefa',
            name='origem',
            field=models.CharField(
                choices=[('SISTEMA', 'Sistema'), ('GESTOR', 'Gestor'), ('PROPRIO', 'Próprio')],
                default='GESTOR',
                help_text='Quem criou a tarefa: Sistema, Gestor ou Próprio',
                max_length=20,
                verbose_name='Origem'
            ),
        ),
    ]
