from django.contrib import admin, messages
from django.core.cache import cache

from .models import (
    AmostraMotivoArmazenamentoInadequado,
    EventoTarefa,
    LogAlteracaoAmostra,
    LogRecebimento,
    MotivoArmazenamentoInadequado,
    MotivoAlteracaoAmostra,
    MotivoPreenchimento,
    MotivoStatusManual,
    Notificacao,
    Origem,
    PortadorRepresentante,
    Protocolo,
    DadosRequisicao,
    RequisicaoAmostra,
    RequisicaoArquivo,
    RequisicaoExame,
    RequisicaoPendencia,
    RequisicaoStatusHistorico,
    StatusRequisicao,
    Tarefa,
    TipoAmostra,
    TipoArquivo,
    TipoAtendimento,
    TipoPendencia,
    TipoPendenciaEtapa,
    TipoTarefa,
    Unidade,
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
    model = RequisicaoAmostra
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


@admin.register(RequisicaoAmostra)
class RequisicaoAmostraAdmin(admin.ModelAdmin):
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


@admin.register(MotivoArmazenamentoInadequado)
class MotivoArmazenamentoInadequadoAdmin(admin.ModelAdmin):
    """Admin para motivos de armazenamento inadequado."""
    list_display = ('codigo', 'descricao', 'ativo', 'created_at_formatted')
    list_filter = ('ativo',)
    search_fields = ('codigo', 'descricao')
    ordering = ('codigo',)
    list_editable = ('ativo',)
    
    def created_at_formatted(self, obj):
        if obj.created_at:
            return obj.created_at.strftime('%d/%m/%Y %H:%M:%S')
        return '-'
    created_at_formatted.short_description = 'Criado em'


@admin.register(AmostraMotivoArmazenamentoInadequado)
class AmostraMotivoArmazenamentoInadequadoAdmin(admin.ModelAdmin):
    """Admin para relação N:N entre amostra e motivo de armazenamento inadequado."""
    list_display = ('amostra', 'cod_barras', 'motivo', 'usuario', 'created_at_formatted')
    list_filter = ('motivo', 'created_at')
    search_fields = ('cod_barras', 'amostra__cod_barras_amostra', 'motivo__descricao')
    raw_id_fields = ('amostra',)
    autocomplete_fields = ('motivo', 'usuario')
    date_hierarchy = 'created_at'
    ordering = ('-created_at',)
    
    def created_at_formatted(self, obj):
        if obj.created_at:
            return obj.created_at.strftime('%d/%m/%Y %H:%M:%S')
        return '-'
    created_at_formatted.short_description = 'Registrado em'


@admin.register(TipoPendencia)
class TipoPendenciaAdmin(admin.ModelAdmin):
    """Admin para tipos de pendência."""
    list_display = ('codigo', 'descricao', 'ativo', 'created_at_formatted')
    list_filter = ('ativo',)
    search_fields = ('codigo', 'descricao')
    ordering = ('codigo',)
    list_editable = ('ativo',)
    
    def created_at_formatted(self, obj):
        if obj.created_at:
            return obj.created_at.strftime('%d/%m/%Y %H:%M:%S')
        return '-'
    created_at_formatted.short_description = 'Criado em'


@admin.register(TipoPendenciaEtapa)
class TipoPendenciaEtapaAdmin(admin.ModelAdmin):
    """Admin para configurar quais pendências aparecem em cada etapa."""
    list_display = ('tipo_pendencia', 'etapa', 'ordem', 'ativo', 'codigo_pendencia')
    list_filter = ('etapa', 'ativo')
    search_fields = ('tipo_pendencia__descricao', 'tipo_pendencia__codigo')
    ordering = ('etapa', 'ordem')
    list_editable = ('ordem', 'ativo')
    autocomplete_fields = ('tipo_pendencia',)
    
    def codigo_pendencia(self, obj):
        return obj.tipo_pendencia.codigo
    codigo_pendencia.short_description = 'Código'
    codigo_pendencia.admin_order_field = 'tipo_pendencia__codigo'


@admin.register(RequisicaoPendencia)
class RequisicaoPendenciaAdmin(admin.ModelAdmin):
    """Admin para pendências de requisições."""
    list_display = ('codigo_barras', 'tipo_pendencia', 'status', 'usuario', 'created_at_formatted')
    list_filter = ('status', 'tipo_pendencia', 'created_at')
    search_fields = ('codigo_barras', 'requisicao__cod_barras_req', 'tipo_pendencia__descricao')
    raw_id_fields = ('requisicao',)
    autocomplete_fields = ('tipo_pendencia', 'usuario')
    date_hierarchy = 'created_at'
    ordering = ('-created_at',)
    list_editable = ('status',)
    
    def created_at_formatted(self, obj):
        if obj.created_at:
            return obj.created_at.strftime('%d/%m/%Y %H:%M:%S')
        return '-'
    created_at_formatted.short_description = 'Registrado em'


@admin.register(TipoAmostra)
class TipoAmostraAdmin(admin.ModelAdmin):
    """Admin para tipos de amostra."""
    list_display = ('id', 'descricao', 'ativo')
    list_filter = ('ativo',)
    search_fields = ('descricao',)
    list_editable = ('ativo',)
    ordering = ('descricao',)


@admin.register(MotivoAlteracaoAmostra)
class MotivoAlteracaoAmostraAdmin(admin.ModelAdmin):
    """Admin para motivos de alteração de amostra (adição/exclusão)."""
    list_display = ('tipo', 'codigo', 'descricao', 'ativo')
    list_filter = ('tipo', 'ativo')
    search_fields = ('codigo', 'descricao')
    list_editable = ('ativo',)
    ordering = ('tipo', 'codigo')


@admin.register(LogAlteracaoAmostra)
class LogAlteracaoAmostraAdmin(admin.ModelAdmin):
    """Admin para logs de alteração de amostra (auditoria)."""
    list_display = ('created_at', 'tipo_alteracao', 'cod_barras_requisicao', 'ordem_amostra', 'etapa', 'usuario', 'motivo')
    list_filter = ('tipo_alteracao', 'etapa', 'created_at')
    search_fields = ('cod_barras_requisicao', 'cod_barras_amostra', 'usuario__username')
    readonly_fields = ('created_at', 'updated_at', 'requisicao', 'cod_barras_requisicao', 'cod_barras_amostra', 'ordem_amostra', 'tipo_alteracao', 'etapa', 'usuario', 'motivo', 'observacao')
    ordering = ('-created_at',)
    date_hierarchy = 'created_at'
    
    def has_add_permission(self, request):
        return False
    
    def has_change_permission(self, request, obj=None):
        return False
    
    def has_delete_permission(self, request, obj=None):
        return False


@admin.register(Protocolo)
class ProtocoloAdmin(admin.ModelAdmin):
    """Admin para gerenciamento de protocolos."""
    list_display = (
        'codigo',
        'unidade',
        'portador',
        'crm',
        'uf_crm',
        'nome_medico',
        'medico_validado',
        'status',
        'created_at',
        'created_by',
    )
    list_filter = ('status', 'medico_validado', 'unidade', 'uf_crm', 'created_at')
    search_fields = ('codigo', 'crm', 'nome_medico', 'portador__nome')
    readonly_fields = ('codigo', 'created_at', 'updated_at', 'created_by', 'updated_by')
    ordering = ('-created_at',)
    date_hierarchy = 'created_at'
    
    fieldsets = (
        ('Identificação', {
            'fields': ('codigo', 'status')
        }),
        ('Dados do Protocolo', {
            'fields': ('unidade', 'portador', 'origem')
        }),
        ('Dados do Médico', {
            'fields': ('crm', 'uf_crm', 'nome_medico', 'medico_validado')
        }),
        ('Arquivo', {
            'fields': ('arquivo_nome', 'arquivo_url')
        }),
        ('Observações', {
            'fields': ('observacao',),
            'classes': ('collapse',)
        }),
        ('Auditoria', {
            'fields': ('created_at', 'created_by', 'updated_at', 'updated_by'),
            'classes': ('collapse',)
        }),
    )


# ============================================
# SISTEMA DE TAREFAS
# ============================================

@admin.register(TipoTarefa)
class TipoTarefaAdmin(admin.ModelAdmin):
    list_display = ('codigo', 'nome', 'prazo_dias', 'ativo', 'created_at')
    list_filter = ('ativo',)
    search_fields = ('codigo', 'nome', 'descricao')
    ordering = ('nome',)
    list_editable = ('ativo',)
    
    fieldsets = (
        (None, {
            'fields': ('codigo', 'nome', 'descricao')
        }),
        ('Configuração', {
            'fields': ('prazo_dias', 'ativo')
        }),
    )


@admin.register(Tarefa)
class TarefaAdmin(admin.ModelAdmin):
    list_display = (
        'codigo', 'titulo', 'tipo', 'status', 'prioridade', 
        'responsavel', 'data_prazo', 'origem', 'created_at'
    )
    list_filter = ('status', 'prioridade', 'origem', 'tipo', 'responsavel')
    search_fields = ('codigo', 'titulo', 'descricao', 'responsavel__username', 'responsavel__first_name')
    ordering = ('-created_at',)
    date_hierarchy = 'created_at'
    raw_id_fields = ('responsavel', 'criado_por', 'protocolo', 'requisicao')
    readonly_fields = ('codigo', 'created_at', 'updated_at', 'data_inicio', 'data_conclusao')
    list_per_page = 30
    
    fieldsets = (
        ('Identificação', {
            'fields': ('codigo', 'titulo', 'descricao')
        }),
        ('Classificação', {
            'fields': ('tipo', 'status', 'prioridade')
        }),
        ('Responsáveis', {
            'fields': ('origem', 'criado_por', 'responsavel')
        }),
        ('Datas', {
            'fields': ('data_prazo', 'data_inicio', 'data_conclusao')
        }),
        ('Referências', {
            'fields': ('protocolo', 'requisicao'),
            'classes': ('collapse',)
        }),
        ('Observações', {
            'fields': ('observacoes',),
            'classes': ('collapse',)
        }),
        ('Auditoria', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
    
    def get_queryset(self, request):
        return super().get_queryset(request).select_related(
            'tipo', 'responsavel', 'criado_por', 'protocolo', 'requisicao'
        )


@admin.register(EventoTarefa)
class EventoTarefaAdmin(admin.ModelAdmin):
    """Admin para configurar tarefas automáticas por eventos do sistema."""
    list_display = (
        'nome', 'codigo_evento', 'tipo_tarefa', 'prioridade', 
        'responsavel_tipo', 'ativo', 'created_at_formatted'
    )
    list_filter = ('ativo', 'prioridade', 'responsavel_tipo', 'tipo_tarefa')
    search_fields = ('codigo_evento', 'nome', 'titulo_template', 'descricao_template')
    ordering = ('nome',)
    list_editable = ('ativo', 'prioridade')
    list_per_page = 20
    
    fieldsets = (
        ('Identificação do Evento', {
            'fields': ('codigo_evento', 'nome', 'descricao_evento', 'ativo'),
            'description': 'Defina o código único do evento que dispara a criação da tarefa.'
        }),
        ('Configuração da Tarefa', {
            'fields': ('tipo_tarefa', 'titulo_template', 'descricao_template', 'prioridade'),
            'description': 'Configure como a tarefa será criada. Use variáveis: {crm}, {uf}, {protocolo}, {usuario}, {data}'
        }),
        ('Responsável', {
            'fields': ('responsavel_tipo', 'responsavel_fixo', 'tipo_email'),
            'description': 'Defina quem receberá a tarefa criada automaticamente.'
        }),
    )
    
    def created_at_formatted(self, obj):
        if obj.created_at:
            return obj.created_at.strftime('%d/%m/%Y %H:%M')
        return '-'
    created_at_formatted.short_description = 'Criado em'
    
    def get_queryset(self, request):
        return super().get_queryset(request).select_related('tipo_tarefa', 'responsavel_fixo')


# ============================================
# CADASTRO DE REQUISIÇÃO - TIPOS DE ATENDIMENTO E EXAMES
# ============================================

@admin.register(TipoAtendimento)
class TipoAtendimentoAdmin(admin.ModelAdmin):
    list_display = ('codigo', 'descricao', 'ativo', 'created_at_formatted')
    list_filter = ('ativo',)
    search_fields = ('codigo', 'descricao')
    list_editable = ('ativo',)
    ordering = ('descricao',)
    
    def created_at_formatted(self, obj):
        if obj.created_at:
            return obj.created_at.strftime('%d/%m/%Y %H:%M')
        return '-'
    created_at_formatted.short_description = 'Criado em'


@admin.register(RequisicaoExame)
class RequisicaoExameAdmin(admin.ModelAdmin):
    list_display = ('cod_req', 'tipo_amostra', 'tipo_atendimento', 'num_autorizacao', 'created_at_formatted')
    list_filter = ('tipo_atendimento', 'tipo_amostra')
    search_fields = ('cod_req', 'cod_barras_req', 'num_autorizacao', 'num_guia')
    readonly_fields = ('created_at', 'updated_at', 'created_by', 'updated_by')
    raw_id_fields = ('requisicao',)
    ordering = ('-created_at',)
    
    def created_at_formatted(self, obj):
        if obj.created_at:
            return obj.created_at.strftime('%d/%m/%Y %H:%M')
        return '-'
    created_at_formatted.short_description = 'Criado em'
    
    def get_queryset(self, request):
        return super().get_queryset(request).select_related(
            'requisicao', 'tipo_amostra', 'tipo_atendimento'
        )
