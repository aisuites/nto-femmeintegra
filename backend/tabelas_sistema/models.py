from django.db import models
from operacao.models import (
    DadosRequisicao, 
    StatusRequisicao, 
    LogRecebimento, 
    RequisicaoStatusHistorico,
    Unidade,
    PortadorRepresentante,
    Origem,
    Amostra
)

# Criamos modelos "Proxy" para exibir no novo menu sem duplicar tabelas no banco

class DbRequisicao(DadosRequisicao):
    class Meta:
        proxy = True
        verbose_name = 'dados_requisicao'
        verbose_name_plural = 'dados_requisicao'

class DbAmostra(Amostra):
    class Meta:
        proxy = True
        verbose_name = 'amostra'
        verbose_name_plural = 'amostra'

class DbStatusRequisicao(StatusRequisicao):
    class Meta:
        proxy = True
        verbose_name = 'status_requisicao'
        verbose_name_plural = 'status_requisicao'

class DbLogRecebimento(LogRecebimento):
    class Meta:
        proxy = True
        verbose_name = 'log_recebimento'
        verbose_name_plural = 'log_recebimento'

class DbHistorico(RequisicaoStatusHistorico):
    class Meta:
        proxy = True
        verbose_name = 'requisicao_status_historico'
        verbose_name_plural = 'requisicao_status_historico'

class DbUnidade(Unidade):
    class Meta:
        proxy = True
        verbose_name = 'unidade'
        verbose_name_plural = 'unidade'

class DbPortador(PortadorRepresentante):
    class Meta:
        proxy = True
        verbose_name = 'portador_representante'
        verbose_name_plural = 'portador_representante'
