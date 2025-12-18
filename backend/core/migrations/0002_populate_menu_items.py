from django.db import migrations


def populate_menu_items(apps, schema_editor):
    """Popula os itens de menu iniciais baseados no sidebar atual."""
    MenuItem = apps.get_model('core', 'MenuItem')
    
    # Dashboard (nível superior)
    dashboard = MenuItem.objects.create(
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
        roles_permitidos=[],
    )
    
    # Subitens de Operacional
    MenuItem.objects.create(
        titulo='Recebimento',
        icone='⬇',
        url_name='operacao:recebimento',
        parent=operacional,
        ordem=10,
        ativo=True,
        roles_permitidos=['recebimento', 'admin'],
    )
    
    MenuItem.objects.create(
        titulo='Triagem',
        icone='🩺',
        url_name='operacao:triagem',
        parent=operacional,
        ordem=20,
        ativo=True,
        roles_permitidos=['triagem', 'admin'],
    )
    
    MenuItem.objects.create(
        titulo='Pendências',
        icone='⏱',
        url_name='',  # Ainda não implementado
        parent=operacional,
        ordem=30,
        ativo=True,
        roles_permitidos=['triagem', 'gestao', 'admin'],
    )
    
    # Gestão (grupo)
    gestao = MenuItem.objects.create(
        titulo='Gestão',
        icone='📊',
        url_name='',
        ordem=30,
        ativo=True,
        divisor_antes=True,
        roles_permitidos=['gestao', 'admin'],
    )
    
    # Atendimento (grupo)
    atendimento = MenuItem.objects.create(
        titulo='Atendimento',
        icone='💬',
        url_name='',
        ordem=40,
        ativo=True,
        roles_permitidos=['atendimento', 'admin'],
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
