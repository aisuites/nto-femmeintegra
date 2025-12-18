from django import template
from django.urls import reverse, NoReverseMatch
from core.models import MenuItem

register = template.Library()


@register.inclusion_tag('includes/menu_items.html', takes_context=True)
def render_menu(context):
    """
    Template tag para renderizar o menu dinâmico.
    Uso: {% load menu_tags %}{% render_menu %}
    """
    request = context.get('request')
    user = request.user if request else None
    
    menu_tree = MenuItem.get_menu_tree(user)
    active_page = context.get('active_page', '')
    
    return {
        'menu_tree': menu_tree,
        'active_page': active_page,
        'request': request,
    }


@register.simple_tag(takes_context=True)
def menu_item_active(context, item):
    """
    Verifica se um item de menu está ativo baseado na URL atual.
    Retorna 'active' se estiver ativo, string vazia caso contrário.
    """
    request = context.get('request')
    if not request:
        return ''
    
    current_path = request.path
    item_url = item.get_url()
    
    if item_url and current_path == item_url:
        return 'active'
    
    return ''


@register.simple_tag
def get_menu_url(item):
    """Retorna a URL resolvida do item de menu."""
    return item.get_url() or '#'
