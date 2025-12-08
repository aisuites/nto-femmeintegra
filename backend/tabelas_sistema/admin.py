from django.contrib import admin
from django.db import models
from .models import (
    DbRequisicao,
    DbStatusRequisicao,
    DbLogRecebimento,
    DbHistorico,
    DbUnidade,
    DbPortador,
    DbRequisicaoAmostra,
    DbTipoArquivo,
    DbRequisicaoArquivo,
)

class ReadOnlyAdmin(admin.ModelAdmin):
    """Admin base somente leitura que mostra todos os campos."""
    
    # Paginação configurável
    list_per_page = 50
    list_max_show_all = 500
    
    def has_add_permission(self, request):
        return False

    def has_change_permission(self, request, obj=None):
        return False

    def has_delete_permission(self, request, obj=None):
        return False

    def get_list_display(self, request):
        """
        Retorna todos os campos do modelo automaticamente.
        1. Usa o nome técnico do campo no header (field.name).
        2. Aplica formatação manual em campos de data (DD/MM/YYYY HH:mm:ss).
        """
        list_display = []
        for field in self.model._meta.fields:
            # Nome único para o método wrapper
            method_name = f'raw_{field.name}'
            
            # Se o método ainda não existe na instância, cria dinamicamente
            if not hasattr(self, method_name):
                # Closure para capturar o campo
                def field_wrapper(obj, _field=field):
                    val = getattr(obj, _field.name)
                    
                    # Formatação de Data
                    if isinstance(_field, (models.DateTimeField, models.DateField)) and val:
                        return val.strftime('%d/%m/%Y %H:%M:%S')
                    
                    return val
                
                # AQUI ESTÁ O TRUQUE: Forçar o nome do header ser o nome técnico
                field_wrapper.short_description = field.name
                field_wrapper.admin_order_field = field.name
                
                setattr(self, method_name, field_wrapper)
            
            list_display.append(method_name)
                
        return list_display

# Configurações específicas (quais campos buscar)

@admin.register(DbRequisicao)
class DbRequisicaoAdmin(ReadOnlyAdmin):
    search_fields = ['cod_req', 'cod_barras_req', 'nome_paciente']
    list_filter = ['status', 'unidade', 'created_at']

@admin.register(DbRequisicaoAmostra)
class DbRequisicaoAmostraAdmin(ReadOnlyAdmin):
    search_fields = ['cod_barras_amostra', 'requisicao__cod_barras_req']
    list_filter = ['requisicao__unidade', 'data_hora_bipagem']

@admin.register(DbStatusRequisicao)
class DbStatusRequisicaoAdmin(ReadOnlyAdmin):
    search_fields = ['codigo', 'descricao']
    ordering = ['id']

@admin.register(DbLogRecebimento)
class DbLogRecebimentoAdmin(ReadOnlyAdmin):
    search_fields = ['cod_barras_req']
    list_filter = ['created_at']

@admin.register(DbHistorico)
class DbHistoricoAdmin(ReadOnlyAdmin):
    search_fields = ['cod_req', 'observacao']
    list_filter = ['status', 'usuario', 'data_registro']

@admin.register(DbUnidade)
class DbUnidadeAdmin(ReadOnlyAdmin):
    search_fields = ['codigo', 'nome']

@admin.register(DbPortador)
class DbPortadorAdmin(ReadOnlyAdmin):
    search_fields = ['nome']
    list_filter = ['tipo', 'ativo']

@admin.register(DbTipoArquivo)
class DbTipoArquivoAdmin(ReadOnlyAdmin):
    search_fields = ['descricao']
    list_filter = ['ativo']

@admin.register(DbRequisicaoArquivo)
class DbRequisicaoArquivoAdmin(ReadOnlyAdmin):
    search_fields = ['cod_req', 'nome_arquivo']
    list_filter = ['tipo_arquivo', 'data_upload']
