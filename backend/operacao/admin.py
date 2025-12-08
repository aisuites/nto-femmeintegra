from django.contrib import admin, messages
from django.core.cache import cache

from .models import (
    Amostra,
    LogRecebimento,
    MotivoPreenchimento,
    MotivoStatusManual,
    Notificacao,
    Origem,
    PortadorRepresentante,
    DadosRequisicao,
    RequisicaoStatusHistorico,
    StatusRequisicao,
    Unidade,
    TipoArquivo,
    RequisicaoArquivo,
)


# Action global para limpar cache
@admin.action(description='🔄 Limpar cache (Unidades e Portadores)')
def limpar_cache_recebimento(modeladmin, request, queryset):
    """Action para limpar o cache de unidades e portadores."""
    cache.delete('recebimento:unidades')
    cache.delete('recebimento:portadores')
    messages.success(
        request,
        '✅ Cache limpo com sucesso! As unidades e portadores serão recarregados na próxima requisição.'
    )


@admin.action(description='🗑️ Limpar TODO o cache do sistema')
def limpar_cache_completo(modeladmin, request, queryset):
    """Action para limpar todo o cache do sistema."""
    cache.clear()
    messages.success(
        request,
        '✅ Todo o cache do sistema foi limpo com sucesso!'
    )


@admin.register(Unidade)
class UnidadeAdmin(admin.ModelAdmin):
    list_display = ('codigo', 'nome', 'created_at_formatted')
    search_fields = ('codigo', 'nome')
    actions = [limpar_cache_recebimento, limpar_cache_completo]
    
    def created_at_formatted(self, obj):
        """Exibe created_at no formato DD/MM/YYYY HH:MM:SS"""
        if obj.created_at:
            return obj.created_at.strftime('%d/%m/%Y %H:%M:%S')
        return '-'
    created_at_formatted.short_description = 'Data Criação'
    created_at_formatted.admin_order_field = 'created_at'


@admin.register(Origem)
class OrigemAdmin(admin.ModelAdmin):
    list_display = ('codigo', 'descricao', 'cod_origem_tiss', 'tipo', 'ativo')
    list_filter = ('ativo', 'tipo')
    search_fields = ('codigo', 'descricao', 'cod_origem_tiss')


@admin.register(PortadorRepresentante)
class PortadorRepresentanteAdmin(admin.ModelAdmin):
    list_display = ('nome', 'tipo', 'origem', 'ativo')
    list_filter = ('tipo', 'ativo')
    search_fields = ('nome',)
    actions = [limpar_cache_recebimento, limpar_cache_completo]


@admin.register(StatusRequisicao)
class StatusRequisicaoAdmin(admin.ModelAdmin):
    list_display = ('codigo', 'descricao', 'ordem', 'permite_edicao')
    list_editable = ('ordem', 'permite_edicao')
    search_fields = ('codigo', 'descricao')


@admin.register(MotivoPreenchimento)
class MotivoPreenchimentoAdmin(admin.ModelAdmin):
    list_display = ('descricao', 'ativo')
    list_filter = ('ativo',)
    search_fields = ('descricao',)


@admin.register(MotivoStatusManual)
class MotivoStatusManualAdmin(admin.ModelAdmin):
    list_display = ('descricao', 'ativo')
    list_filter = ('ativo',)
    search_fields = ('descricao',)


class AmostraInline(admin.TabularInline):
    model = Amostra
    extra = 0


class RequisicaoStatusHistoricoInline(admin.TabularInline):
    """Inline para exibir histórico de status na página de Requisição."""
    model = RequisicaoStatusHistorico
    extra = 0
    readonly_fields = ('data_registro', 'status', 'usuario', 'observacao')
    can_delete = False
    ordering = ('-data_registro',)
    
    def has_add_permission(self, request, obj=None):
        """Não permite adicionar histórico manualmente via inline."""
        return False


class RequisicaoArquivoInline(admin.TabularInline):
    """Inline para exibir arquivos na página de Requisição."""
    model = RequisicaoArquivo
    extra = 0
    readonly_fields = ('data_upload', 'created_by', 'updated_by')
    fields = ('tipo_arquivo', 'nome_arquivo', 'url_arquivo', 'data_upload')
    
    def has_delete_permission(self, request, obj=None):
        """Permite deletar apenas para superusuários."""
        return request.user.is_superuser


@admin.register(DadosRequisicao)
class DadosRequisicaoAdmin(admin.ModelAdmin):
    list_display = (
        'cod_req',
        'cod_barras_req',
        'unidade',
        'status',
        'portador_representante',
        'created_at_formatted',
    )
    list_filter = ('status', 'unidade', 'origem', 'flag_erro_preenchimento', 'korus_bloqueado')
    search_fields = ('cod_req', 'cod_barras_req', 'nome_paciente', 'crm')
    inlines = [AmostraInline, RequisicaoStatusHistoricoInline, RequisicaoArquivoInline]
    autocomplete_fields = (
        'unidade',
        'status',
        'portador_representante',
        'origem',
        'motivo_preenchimento',
        'motivo_status_manual',
    )
    
    def created_at_formatted(self, obj):
        """Exibe created_at no formato DD/MM/YYYY HH:MM:SS"""
        if obj.created_at:
            return obj.created_at.strftime('%d/%m/%Y %H:%M:%S')
        return '-'
    created_at_formatted.short_description = 'Data Criação'
    created_at_formatted.admin_order_field = 'created_at'


@admin.register(Amostra)
class AmostraAdmin(admin.ModelAdmin):
    list_display = ('requisicao', 'cod_barras_amostra', 'ordem', 'data_hora_bipagem_formatted')
    list_filter = ('requisicao__unidade',)
    search_fields = ('cod_barras_amostra', 'requisicao__cod_barras_req')
    
    def data_hora_bipagem_formatted(self, obj):
        """Exibe data_hora_bipagem no formato DD/MM/YYYY HH:MM:SS"""
        if obj.data_hora_bipagem:
            return obj.data_hora_bipagem.strftime('%d/%m/%Y %H:%M:%S')
        return '-'
    data_hora_bipagem_formatted.short_description = 'Data/Hora Bipagem'
    data_hora_bipagem_formatted.admin_order_field = 'data_hora_bipagem'


@admin.register(LogRecebimento)
class LogRecebimentoAdmin(admin.ModelAdmin):
    list_display = ('cod_barras_req', 'created_at_formatted')
    search_fields = ('cod_barras_req',)
    
    def created_at_formatted(self, obj):
        """Exibe created_at no formato DD/MM/YYYY HH:MM:SS"""
        if obj.created_at:
            return obj.created_at.strftime('%d/%m/%Y %H:%M:%S')
        return '-'
    created_at_formatted.short_description = 'Data Criação'
    created_at_formatted.admin_order_field = 'created_at'


@admin.register(RequisicaoStatusHistorico)
class RequisicaoStatusHistoricoAdmin(admin.ModelAdmin):
    """Admin para visualização do histórico de status."""
    list_display = ('cod_req', 'status', 'usuario', 'data_registro_formatted')
    list_filter = ('status', 'data_registro')
    search_fields = ('cod_req', 'requisicao__cod_barras_req')
    readonly_fields = ('requisicao', 'cod_req', 'status', 'usuario', 'data_registro', 'observacao')
    date_hierarchy = 'data_registro'
    
    def data_registro_formatted(self, obj):
        """Exibe data_registro no formato DD/MM/YYYY HH:MM:SS"""
        if obj.data_registro:
            return obj.data_registro.strftime('%d/%m/%Y %H:%M:%S')
        return '-'
    data_registro_formatted.short_description = 'Data/Hora Registro'
    data_registro_formatted.admin_order_field = 'data_registro'
    
    def has_add_permission(self, request):
        """Não permite adicionar histórico manualmente."""
        return False
    
    def has_delete_permission(self, request, obj=None):
        """Permite deletar histórico apenas para superusuários (via cascade ao deletar requisição)."""
        return request.user.is_superuser


@admin.register(Notificacao)
class NotificacaoAdmin(admin.ModelAdmin):
    """Admin para visualização de notificações."""
    list_display = ('usuario', 'tipo', 'titulo', 'lida', 'created_at_formatted')
    list_filter = ('tipo', 'lida', 'created_at')
    search_fields = ('usuario__username', 'titulo', 'mensagem')
    readonly_fields = ('usuario', 'tipo', 'titulo', 'mensagem', 'dados', 'created_at', 'data_leitura')
    date_hierarchy = 'created_at'
    
    def created_at_formatted(self, obj):
        """Exibe created_at no formato DD/MM/YYYY HH:MM:SS"""
        if obj.created_at:
            return obj.created_at.strftime('%d/%m/%Y %H:%M:%S')
        return '-'
    created_at_formatted.short_description = 'Data Criação'
    created_at_formatted.admin_order_field = 'created_at'
    
    def has_add_permission(self, request):
        """Não permite adicionar notificações manualmente."""
        return False


@admin.register(TipoArquivo)
class TipoArquivoAdmin(admin.ModelAdmin):
    """Admin para tipos de arquivo."""
    list_display = ('descricao', 'ativo', 'created_at_formatted')
    list_filter = ('ativo', 'created_at')
    search_fields = ('descricao',)
    list_editable = ('ativo',)
    
    def created_at_formatted(self, obj):
        """Exibe created_at no formato DD/MM/YYYY HH:MM:SS"""
        if obj.created_at:
            return obj.created_at.strftime('%d/%m/%Y %H:%M:%S')
        return '-'
    created_at_formatted.short_description = 'Data Criação'
    created_at_formatted.admin_order_field = 'created_at'


@admin.register(RequisicaoArquivo)
class RequisicaoArquivoAdmin(admin.ModelAdmin):
    """Admin para arquivos das requisições."""
    list_display = ('cod_req', 'nome_arquivo', 'tipo_arquivo', 'data_upload_formatted', 'created_by')
    list_filter = ('tipo_arquivo', 'data_upload', 'created_at')
    search_fields = ('cod_req', 'requisicao__cod_barras_req', 'nome_arquivo')
    readonly_fields = ('data_upload', 'created_at', 'updated_at', 'created_by', 'updated_by')
    autocomplete_fields = ('requisicao', 'tipo_arquivo')
    date_hierarchy = 'data_upload'
    
    fieldsets = (
        ('Requisição', {
            'fields': ('requisicao', 'cod_req')
        }),
        ('Arquivo', {
            'fields': ('tipo_arquivo', 'nome_arquivo', 'url_arquivo', 'data_upload')
        }),
        ('Auditoria', {
            'fields': ('created_at', 'updated_at', 'created_by', 'updated_by'),
            'classes': ('collapse',)
        }),
    )
    
    def data_upload_formatted(self, obj):
        """Exibe data_upload no formato DD/MM/YYYY HH:MM:SS"""
        if obj.data_upload:
            return obj.data_upload.strftime('%d/%m/%Y %H:%M:%S')
        return '-'
    data_upload_formatted.short_description = 'Data Upload'
    data_upload_formatted.admin_order_field = 'data_upload'
