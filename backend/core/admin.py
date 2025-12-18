from django.contrib import admin
from django import forms
from .models import MenuItem, ConfiguracaoEmail, LogEnvioEmail


class MenuItemAdminForm(forms.ModelForm):
    """Form customizado para seleção múltipla de roles."""
    
    ROLE_CHOICES = [
        ('recebimento', 'Recebimento'),
        ('triagem', 'Triagem'),
        ('gestao', 'Gestão'),
        ('atendimento', 'Atendimento'),
        ('admin', 'Administração'),
    ]
    
    roles_widget = forms.MultipleChoiceField(
        choices=ROLE_CHOICES,
        widget=forms.CheckboxSelectMultiple,
        required=False,
        label='Roles permitidos',
        help_text='Selecione os perfis que podem ver este item. Nenhum selecionado = todos podem ver.'
    )
    
    class Meta:
        model = MenuItem
        fields = '__all__'
    
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        # Preencher o widget com os valores salvos
        if self.instance and self.instance.pk:
            self.fields['roles_widget'].initial = self.instance.roles_permitidos or []
    
    def save(self, commit=True):
        instance = super().save(commit=False)
        # Converter seleção do widget para o campo JSON
        instance.roles_permitidos = self.cleaned_data.get('roles_widget', [])
        if commit:
            instance.save()
        return instance


@admin.register(MenuItem)
class MenuItemAdmin(admin.ModelAdmin):
    form = MenuItemAdminForm
    
    list_display = [
        'get_titulo_indentado',
        'icone',
        'url_name',
        'parent',
        'ordem',
        'ativo',
        'get_roles_display',
    ]
    list_filter = ['ativo', 'parent']
    list_editable = ['ordem', 'ativo']
    search_fields = ['titulo', 'url_name']
    ordering = ['parent__ordem', 'parent__titulo', 'ordem', 'titulo']
    
    fieldsets = (
        ('Informações Básicas', {
            'fields': ('titulo', 'icone', 'ordem', 'ativo')
        }),
        ('Navegação', {
            'fields': ('url_name', 'url_externa', 'abrir_nova_aba'),
            'description': 'Configure a URL do item. Deixe ambos vazios para criar um grupo.'
        }),
        ('Hierarquia', {
            'fields': ('parent', 'divisor_antes'),
        }),
        ('Permissões', {
            'fields': ('roles_widget',),
            'description': 'Controle quais perfis de usuário podem ver este item.'
        }),
    )
    
    def get_titulo_indentado(self, obj):
        """Exibe o título com indentação visual para submenus."""
        if obj.parent:
            return f"    └─ {obj.titulo}"
        return f"📁 {obj.titulo}"
    get_titulo_indentado.short_description = 'Título'
    get_titulo_indentado.admin_order_field = 'titulo'
    
    def get_roles_display(self, obj):
        """Exibe os roles de forma legível."""
        if not obj.roles_permitidos:
            return "Todos"
        return ", ".join(obj.roles_permitidos)
    get_roles_display.short_description = 'Visível para'
    
    def get_queryset(self, request):
        """Ordena para mostrar hierarquia corretamente."""
        qs = super().get_queryset(request)
        return qs.select_related('parent')


@admin.register(ConfiguracaoEmail)
class ConfiguracaoEmailAdmin(admin.ModelAdmin):
    """Admin para configuração de templates de email."""
    list_display = ['nome', 'tipo', 'email_destino', 'ativo', 'updated_at']
    list_filter = ['tipo', 'ativo']
    search_fields = ['nome', 'email_destino', 'assunto_padrao']
    list_editable = ['ativo']
    ordering = ['tipo']
    
    fieldsets = (
        ('Identificação', {
            'fields': ('tipo', 'nome', 'ativo')
        }),
        ('Destinatários', {
            'fields': ('email_destino', 'email_resposta'),
            'description': 'Separe múltiplos emails por vírgula. O email de resposta (Reply-To) é para onde as respostas serão enviadas.'
        }),
        ('Template', {
            'fields': ('assunto_padrao', 'corpo_padrao'),
            'description': 'Use placeholders: {crm}, {uf}, {medicos}, {usuario}, {data}'
        }),
    )


@admin.register(LogEnvioEmail)
class LogEnvioEmailAdmin(admin.ModelAdmin):
    """Admin para visualização de logs de envio de email."""
    list_display = ['created_at', 'tipo', 'descricao', 'destinatario', 'status', 'enviado_por']
    list_filter = ['status', 'tipo', 'created_at']
    search_fields = ['tipo', 'descricao', 'destinatario', 'assunto']
    readonly_fields = ['created_at', 'updated_at', 'tipo', 'descricao', 'destinatario', 'assunto', 'corpo', 'status', 'erro_mensagem', 'enviado_em', 'enviado_por']
    ordering = ['-created_at']
    date_hierarchy = 'created_at'
    
    fieldsets = (
        ('Informações', {
            'fields': ('tipo', 'descricao', 'status', 'enviado_em', 'enviado_por')
        }),
        ('Email', {
            'fields': ('destinatario', 'assunto', 'corpo')
        }),
        ('Erro', {
            'fields': ('erro_mensagem',),
            'classes': ('collapse',)
        }),
        ('Auditoria', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
    
    def has_add_permission(self, request):
        return False
    
    def has_change_permission(self, request, obj=None):
        return False
    
    def has_delete_permission(self, request, obj=None):
        return False
