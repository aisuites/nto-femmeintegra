"""
Migration para criar a tabela TipoPendenciaEtapa.
Permite configurar quais pendências aparecem em cada etapa de triagem.
"""
import django.db.models.deletion
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('operacao', '0024_alter_data_recebimento_nto_to_datetime'),
    ]

    operations = [
        migrations.CreateModel(
            name='TipoPendenciaEtapa',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('etapa', models.PositiveSmallIntegerField(choices=[(2, 'Etapa 2 - Pendências'), (3, 'Etapa 3 - Cadastro')], db_index=True, help_text='Etapa de triagem onde esta pendência será exibida', verbose_name='Etapa')),
                ('ordem', models.PositiveSmallIntegerField(default=0, help_text='Ordem de exibição na etapa (menor = primeiro)', verbose_name='Ordem')),
                ('ativo', models.BooleanField(db_index=True, default=True, help_text='Se desativado, não aparece na etapa mesmo que o tipo esteja ativo', verbose_name='Ativo')),
                ('tipo_pendencia', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='etapas', to='operacao.tipopendencia', verbose_name='Tipo de Pendência')),
            ],
            options={
                'verbose_name': 'Pendência por Etapa',
                'verbose_name_plural': 'Pendências por Etapa',
                'db_table': 'tipo_pendencia_etapa',
                'ordering': ('etapa', 'ordem', 'tipo_pendencia__codigo'),
                'unique_together': {('tipo_pendencia', 'etapa')},
            },
        ),
    ]
