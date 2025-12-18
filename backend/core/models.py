from django.conf import settings
from django.db import models


class TimeStampedModel(models.Model):
    """Adds created_at/updated_at automatically."""

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        abstract = True


class AuditModel(TimeStampedModel):
    """Tracks which usuário realizou alterações críticas."""

    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='%(class)s_created',
    )
    updated_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='%(class)s_updated',
    )

    class Meta:
        abstract = True


class MenuItem(TimeStampedModel):
    """
    Item de menu dinâmico para sidebar.
    Suporta hierarquia (menus e submenus) e controle de acesso por role.
    """
    
    class Role(models.TextChoices):
        RECEBIMENTO = 'recebimento', 'Recebimento'
        TRIAGEM = 'triagem', 'Triagem'
        GESTAO = 'gestao', 'Gestão'
        ATENDIMENTO = 'atendimento', 'Atendimento'
        ADMIN = 'admin', 'Administração'
    
    titulo = models.CharField(
        'Título',
        max_length=100,
        help_text='Texto exibido no menu'
    )
    icone = models.CharField(
        'Ícone',
        max_length=50,
        blank=True,
        default='📄',
        help_text='Emoji ou classe CSS do ícone (ex: 🏠, fa-home)'
    )
    url_name = models.CharField(
        'Nome da URL',
        max_length=100,
        blank=True,
        default='',
        help_text='Nome da URL Django (ex: operacao:triagem). Deixe vazio para itens de grupo.'
    )
    url_externa = models.URLField(
        'URL Externa',
        blank=True,
        default='',
        help_text='URL externa completa. Tem prioridade sobre url_name.'
    )
    parent = models.ForeignKey(
        'self',
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name='children',
        verbose_name='Item pai',
        help_text='Deixe vazio para itens de nível superior'
    )
    ordem = models.PositiveSmallIntegerField(
        'Ordem',
        default=0,
        help_text='Ordem de exibição (menor = primeiro)'
    )
    ativo = models.BooleanField(
        'Ativo',
        default=True,
        help_text='Desmarque para ocultar temporariamente'
    )
    abrir_nova_aba = models.BooleanField(
        'Abrir em nova aba',
        default=False,
        help_text='Marque para abrir link em nova aba'
    )
    divisor_antes = models.BooleanField(
        'Divisor antes',
        default=False,
        help_text='Adiciona uma linha divisória antes deste item'
    )
    roles_permitidos = models.JSONField(
        'Roles permitidos',
        default=list,
        blank=True,
        help_text='Lista de roles que podem ver este item. Vazio = todos podem ver.'
    )
    
    class Meta:
        db_table = 'core_menu_item'
        ordering = ['ordem', 'titulo']
        verbose_name = 'Item de Menu'
        verbose_name_plural = 'Itens de Menu'
    
    def __str__(self):
        if self.parent:
            return f"  └─ {self.titulo}"
        return self.titulo
    
    def pode_visualizar(self, user):
        """Verifica se o usuário pode visualizar este item de menu."""
        if not self.ativo:
            return False
        
        # Se não há roles definidos, todos podem ver
        if not self.roles_permitidos:
            return True
        
        # Verifica se o role do usuário está na lista
        return user.role in self.roles_permitidos
    
    def get_url(self):
        """Retorna a URL do item (externa ou resolvida do url_name)."""
        if self.url_externa:
            return self.url_externa
        if self.url_name:
            from django.urls import reverse, NoReverseMatch
            try:
                return reverse(self.url_name)
            except NoReverseMatch:
                return '#'
        return None
    
    def is_group(self):
        """Retorna True se este item é apenas um grupo (sem URL)."""
        return not self.url_name and not self.url_externa
    
    @classmethod
    def get_menu_tree(cls, user=None):
        """
        Retorna a árvore de menu filtrada por permissões do usuário.
        Estrutura: lista de dicts com 'item' e 'children'.
        """
        # Buscar todos os itens ativos de nível superior
        items = cls.objects.filter(
            ativo=True,
            parent__isnull=True
        ).prefetch_related('children').order_by('ordem', 'titulo')
        
        result = []
        for item in items:
            # Verificar permissão
            if user and not item.pode_visualizar(user):
                continue
            
            # Buscar filhos
            children = []
            for child in item.children.filter(ativo=True).order_by('ordem', 'titulo'):
                if user and not child.pode_visualizar(user):
                    continue
                children.append({
                    'item': child,
                    'children': []  # Suporte a apenas 2 níveis por enquanto
                })
            
            result.append({
                'item': item,
                'children': children
            })
        
        return result
