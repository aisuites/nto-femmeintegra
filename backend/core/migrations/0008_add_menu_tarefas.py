from django.db import migrations


def add_menu_tarefas(apps, schema_editor):
    """Adiciona item de menu Tarefas no grupo Operacional."""
    MenuItem = apps.get_model('core', 'MenuItem')
    
    # Buscar menu Operacional
    try:
        operacional = MenuItem.objects.get(titulo='Operacional', parent__isnull=True)
    except MenuItem.DoesNotExist:
        return
    
    # Verificar se já existe
    if MenuItem.objects.filter(titulo='Tarefas', parent=operacional).exists():
        return
    
    # Criar item Tarefas
    MenuItem.objects.create(
        titulo='Tarefas',
        icone='📋',
        url_name='operacao:tarefas-kanban',
        parent=operacional,
        ordem=40,
        ativo=True,
        roles_permitidos=[],
    )


def remove_menu_tarefas(apps, schema_editor):
    """Remove item de menu Tarefas."""
    MenuItem = apps.get_model('core', 'MenuItem')
    MenuItem.objects.filter(titulo='Tarefas', url_name='operacao:tarefas-kanban').delete()


class Migration(migrations.Migration):

    dependencies = [
        ('core', '0004_adicionar_email_resposta'),
    ]

    operations = [
        migrations.RunPython(add_menu_tarefas, remove_menu_tarefas),
    ]
