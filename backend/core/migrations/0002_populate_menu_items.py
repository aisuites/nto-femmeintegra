from django.db import migrations


def populate_menu_items(apps, schema_editor):
    """Popula os itens de menu iniciais."""
    MenuItem = apps.get_model('core', 'MenuItem')
    
    # Dashboard (nível superior)
    MenuItem.objects.create(
        titulo='Dashboard',
        icone='🏠',
        url_name='core:dashboard',
        ordem=10,
        ativo=True,
        roles_permitidos=[],  # Todos podem ver
    )
    
    # Operacional (grupo)
    operacional = MenuItem.objects.create(
        titulo='Operacional',
        icone='⚙',
        url_name='',
        ordem=20,
        ativo=True,
        roles_permitidos=[],  # Todos podem ver
    )
    
    # Subitens de Operacional
    MenuItem.objects.create(
        titulo='Recebimento',
        icone='⬇',
        url_name='operacao:recebimento',
        parent=operacional,
        ordem=10,
        ativo=True,
        roles_permitidos=[],  # Permissão controlada pelo grupo
    )
    
    MenuItem.objects.create(
        titulo='Triagem',
        icone='🩺',
        url_name='operacao:triagem',
        parent=operacional,
        ordem=20,
        ativo=True,
        roles_permitidos=[],  # Permissão controlada pelo grupo
    )
    
    # Pendência (nível superior)
    MenuItem.objects.create(
        titulo='Pendência',
        icone='⏱',
        url_name='',  # Ainda não implementado
        ordem=30,
        ativo=True,
        divisor_antes=True,
        roles_permitidos=[],
    )
    
    # Gestão (nível superior)
    MenuItem.objects.create(
        titulo='Gestão',
        icone='📊',
        url_name='',
        ordem=40,
        ativo=True,
        roles_permitidos=[],
    )
    
    # Atendimento (nível superior)
    MenuItem.objects.create(
        titulo='Atendimento',
        icone='💬',
        url_name='',
        ordem=50,
        ativo=True,
        roles_permitidos=[],
    )


def remove_menu_items(apps, schema_editor):
    """Remove todos os itens de menu."""
    MenuItem = apps.get_model('core', 'MenuItem')
    MenuItem.objects.all().delete()


class Migration(migrations.Migration):

    dependencies = [
        ('core', '0001_menu_item'),
    ]

    operations = [
        migrations.RunPython(populate_menu_items, remove_menu_items),
    ]
