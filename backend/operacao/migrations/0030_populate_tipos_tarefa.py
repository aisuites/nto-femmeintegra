from django.db import migrations


def populate_tipos_tarefa(apps, schema_editor):
    """Popula tipos de tarefa iniciais."""
    TipoTarefa = apps.get_model('operacao', 'TipoTarefa')
    
    tipos = [
        {
            'codigo': 'CADASTRO_MEDICO',
            'nome': 'Cadastro de Médico',
            'descricao': 'Solicitação de cadastro de novo médico no sistema',
            'prazo_dias': 3,
        },
        {
            'codigo': 'VALIDACAO_DOCUMENTO',
            'nome': 'Validação de Documento',
            'descricao': 'Validação de documentos pendentes',
            'prazo_dias': 2,
        },
        {
            'codigo': 'CORRECAO_DADOS',
            'nome': 'Correção de Dados',
            'descricao': 'Correção de dados incorretos ou incompletos',
            'prazo_dias': 1,
        },
        {
            'codigo': 'PENDENCIA_REQUISICAO',
            'nome': 'Pendência de Requisição',
            'descricao': 'Resolução de pendências em requisições',
            'prazo_dias': 2,
        },
        {
            'codigo': 'CONTATO_PACIENTE',
            'nome': 'Contato com Paciente',
            'descricao': 'Necessidade de contato com paciente',
            'prazo_dias': 1,
        },
        {
            'codigo': 'OUTRO',
            'nome': 'Outro',
            'descricao': 'Outros tipos de tarefa',
            'prazo_dias': 3,
        },
    ]
    
    for tipo_data in tipos:
        TipoTarefa.objects.get_or_create(
            codigo=tipo_data['codigo'],
            defaults=tipo_data
        )


def remove_tipos_tarefa(apps, schema_editor):
    """Remove tipos de tarefa iniciais."""
    TipoTarefa = apps.get_model('operacao', 'TipoTarefa')
    codigos = [
        'CADASTRO_MEDICO', 'VALIDACAO_DOCUMENTO', 'CORRECAO_DADOS',
        'PENDENCIA_REQUISICAO', 'CONTATO_PACIENTE', 'OUTRO'
    ]
    TipoTarefa.objects.filter(codigo__in=codigos).delete()


class Migration(migrations.Migration):

    dependencies = [
        ('operacao', '0029_criar_sistema_tarefas'),
    ]

    operations = [
        migrations.RunPython(populate_tipos_tarefa, remove_tipos_tarefa),
    ]
