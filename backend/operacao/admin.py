from django.contrib import admin

from .models import (
    Amostra,
    DadosRequisicao,
    MotivoPreenchimento,
    MotivoStatusManual,
    Origem,
    PortadorRepresentante,
    Requisicao,
    StatusRequisicao,
    Unidade,
)


@admin.register(Unidade)
class UnidadeAdmin(admin.ModelAdmin):
    list_display = ('codigo', 'nome', 'created_at')
    search_fields = ('codigo', 'nome')


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


@admin.register(Requisicao)
class RequisicaoAdmin(admin.ModelAdmin):
    list_display = (
        'cod_req',
        'cod_barras_req',
        'unidade',
        'status',
        'representante',
        'created_at',
    )
    list_filter = ('status', 'unidade', 'origem', 'flag_erro_preenchimento', 'korus_bloqueado')
    search_fields = ('cod_req', 'cod_barras_req', 'nome_paciente', 'crm')
    inlines = [AmostraInline]
    autocomplete_fields = (
        'unidade',
        'status',
        'representante',
        'origem',
        'portador',
        'motivo_preenchimento',
        'motivo_status_manual',
    )


@admin.register(Amostra)
class AmostraAdmin(admin.ModelAdmin):
    list_display = ('requisicao', 'cod_barras_amostra', 'ordem', 'data_hora_bipagem')
    list_filter = ('requisicao__unidade',)
    search_fields = ('cod_barras_amostra', 'requisicao__cod_barras_req')


@admin.register(DadosRequisicao)
class DadosRequisicaoAdmin(admin.ModelAdmin):
    list_display = ('cod_barras_req', 'created_at')
    search_fields = ('cod_barras_req',)
