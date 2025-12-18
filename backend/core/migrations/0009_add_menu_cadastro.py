# Generated migration to add Cadastro menu item

from django.db import migrations


def add_menu_cadastro(apps, schema_editor):
    """Adiciona o menu Cadastro dentro de Operacional."""
    MenuItem = apps.get_model('core', 'MenuItem')
    
    # Buscar o menu Operacional
    try:
        operacional = MenuItem.objects.get(titulo='Operacional', parent__isnull=True)
    except MenuItem.DoesNotExist:
        # Se não existir, criar como item de nível superior
        MenuItem.objects.create(
            titulo='Cadastro',
            icone='📝',
            url_name='operacao:cadastro-requisicao',
            ordem=25,
            ativo=True,
            roles_permitidos=[],
        )
        return
    
    # Criar submenu Cadastro dentro de Operacional
    MenuItem.objects.create(
        titulo='Cadastro',
        icone='📝',
        url_name='operacao:cadastro-requisicao',
        parent=operacional,
        ordem=25,  # Entre Triagem (20) e Cadastro Protocolo (30)
        ativo=True,
        roles_permitidos=[],
    )


def remove_menu_cadastro(apps, schema_editor):
    """Remove o menu Cadastro."""
    MenuItem = apps.get_model('core', 'MenuItem')
    MenuItem.objects.filter(
        titulo='Cadastro',
        url_name='operacao:cadastro-requisicao'
    ).delete()


class Migration(migrations.Migration):

    dependencies = [
        ('core', '0008_add_menu_tarefas'),
    ]

    operations = [
        migrations.RunPython(add_menu_cadastro, remove_menu_cadastro),
    ]
