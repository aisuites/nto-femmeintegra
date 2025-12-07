from django.conf import settings
from django.db import models

from core.models import AuditModel, TimeStampedModel


class Unidade(TimeStampedModel):
    codigo = models.CharField(max_length=10, default='')
    nome = models.CharField(max_length=120)

    class Meta:
        ordering = ('codigo', 'nome')
        verbose_name = 'Unidade'
        verbose_name_plural = 'Unidades'

    def __str__(self) -> str:
        return f'{self.codigo} - {self.nome}'


class Origem(TimeStampedModel):
    class Tipo(models.TextChoices):
        EXTERNO = 'EXTERNO', 'Externo'
        PAPABRASIL = 'PAPABRASIL', 'Papabrasil'
        PARCEIRO = 'PARCEIRO', 'Parceiro'
        OUTRO = 'OUTRO', 'Outro'

    codigo = models.CharField(max_length=10, default='', blank=True)
    descricao = models.CharField(max_length=150)
    cod_origem_tiss = models.CharField(max_length=30, blank=True)
    tipo = models.CharField(max_length=20, choices=Tipo.choices, default=Tipo.EXTERNO)
    ativo = models.BooleanField(default=True)

    class Meta:
        ordering = ('codigo', 'descricao')
        verbose_name = 'Origem'
        verbose_name_plural = 'Origens'

    def __str__(self) -> str:
        return self.descricao


class PortadorRepresentante(TimeStampedModel):
    class Tipo(models.TextChoices):
        PORTADOR = 'PORTADOR', 'Portador'
        REPRESENTANTE = 'REPRESENTANTE', 'Representante'

    nome = models.CharField(max_length=120)
    tipo = models.CharField(max_length=20, choices=Tipo.choices)
    unidade = models.ForeignKey(
        Unidade,
        on_delete=models.PROTECT,
        related_name='portadores',
    )
    origem = models.ForeignKey(
        Origem,
        on_delete=models.PROTECT,
        related_name='portadores',
    )
    ativo = models.BooleanField(default=True)

    class Meta:
        ordering = ('nome',)
        verbose_name = 'Portador / Representante'

    def __str__(self) -> str:
        return f'{self.nome} ({self.get_tipo_display()})'


class StatusRequisicao(TimeStampedModel):
    codigo = models.CharField(max_length=30, unique=True)
    descricao = models.CharField(max_length=120)
    ordem = models.PositiveSmallIntegerField(default=0)
    permite_edicao = models.BooleanField(default=True)

    class Meta:
        ordering = ('ordem',)
        verbose_name = 'Status da Requisição'
        verbose_name_plural = 'Status das Requisições'

    def __str__(self) -> str:
        return f'{self.codigo} - {self.descricao}'


class MotivoPreenchimento(TimeStampedModel):
    descricao = models.CharField(max_length=200)
    ativo = models.BooleanField(default=True)

    class Meta:
        ordering = ('descricao',)
        verbose_name = 'Motivo de Preenchimento'

    def __str__(self) -> str:
        return self.descricao


class MotivoStatusManual(TimeStampedModel):
    descricao = models.CharField(max_length=200)
    ativo = models.BooleanField(default=True)

    class Meta:
        ordering = ('descricao',)
        verbose_name = 'Motivo de Status Manual'

    def __str__(self) -> str:
        return self.descricao


class DadosRequisicao(TimeStampedModel):
    cod_barras_req = models.CharField('Código de barras da requisição', max_length=64, unique=True)
    dados = models.JSONField('Payload bruto', default=dict, blank=True)

    class Meta:
        ordering = ('-created_at',)
        verbose_name = 'Dados da requisição'
        verbose_name_plural = 'Dados das requisições'
        indexes = [
            models.Index(fields=('cod_barras_req',)),
        ]

    def __str__(self) -> str:
        return self.cod_barras_req


class Requisicao(AuditModel):
    cod_req = models.CharField('Código da requisição', max_length=30, unique=True)
    cod_barras_req = models.CharField('Código de barras', max_length=64, unique=True)
    lote_req = models.CharField('Lote', max_length=50, blank=True)

    unidade = models.ForeignKey(Unidade, on_delete=models.PROTECT, related_name='requisicoes')
    status = models.ForeignKey(StatusRequisicao, on_delete=models.PROTECT, related_name='requisicoes')
    representante = models.ForeignKey(
        PortadorRepresentante,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='requisicoes_representante',
    )
    origem = models.ForeignKey(
        Origem,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='requisicoes',
    )
    portador = models.ForeignKey(
        PortadorRepresentante,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='requisicoes_portador',
    )

    data_envio_representante = models.DateField(null=True, blank=True)
    data_cadastro_representante = models.DateField(null=True, blank=True)
    data_recebimento_nto = models.DateField(null=True, blank=True)
    data_um = models.DateField(null=True, blank=True)

    nome_paciente = models.CharField(max_length=200, blank=True)
    cpf_paciente = models.CharField(max_length=14, blank=True)
    data_nasc_paciente = models.DateField(null=True, blank=True)
    sexo_paciente = models.CharField(max_length=10, blank=True)
    telefone_paciente = models.CharField(max_length=20, blank=True)
    email_paciente = models.EmailField(blank=True)

    crm = models.CharField('CRM', max_length=20, blank=True)
    uf_crm = models.CharField('UF CRM', max_length=2, blank=True)
    nome_medico = models.CharField(max_length=200, blank=True)
    end_medico = models.CharField('Endereço médico', max_length=255, blank=True)
    dest_medico = models.CharField('Destino médico', max_length=255, blank=True)

    flag_req_sem_cpf = models.BooleanField(default=False)
    flag_ass_paciente = models.BooleanField(default=False)
    flag_ass_medico = models.BooleanField(default=False)
    flag_carimbo_medico = models.BooleanField(default=False)
    flag_ocr = models.BooleanField(default=False)
    flag_erro_preenchimento = models.BooleanField(default=False)

    motivo_preenchimento = models.ForeignKey(
        MotivoPreenchimento,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
    )
    motivo_status_manual = models.ForeignKey(
        MotivoStatusManual,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
    )

    korus_bloqueado = models.BooleanField(default=False)
    liberacao_status = models.CharField(max_length=30, blank=True)
    liberacao_descricao = models.TextField(blank=True)
    usuario_edicao = models.CharField(max_length=60, blank=True)
    usuario_cod_barras = models.CharField(max_length=60, blank=True)

    class Meta:
        ordering = ('-created_at',)
        indexes = [
            models.Index(fields=('cod_barras_req',)),
            models.Index(fields=('status',)),
            models.Index(fields=('unidade',)),
            models.Index(fields=('data_recebimento_nto',)),
        ]
        verbose_name = 'Requisição'
        verbose_name_plural = 'Requisições'

    def __str__(self) -> str:
        return f'{self.cod_req} - {self.cod_barras_req}'


class RequisicaoStatusHistorico(models.Model):
    """
    Histórico de mudanças de status das requisições.
    
    Registra todas as alterações de status, permitindo auditoria
    e rastreamento completo do ciclo de vida de cada requisição.
    """
    requisicao = models.ForeignKey(
        Requisicao,
        on_delete=models.CASCADE,
        related_name='historico_status',
        verbose_name='Requisição',
    )
    cod_req = models.CharField(
        'Código da requisição',
        max_length=30,
        db_index=True,
        help_text='Código da requisição (desnormalizado para performance)',
    )
    status = models.ForeignKey(
        StatusRequisicao,
        on_delete=models.PROTECT,
        related_name='historico',
        verbose_name='Status',
    )
    usuario = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        related_name='historico_status_requisicoes',
        verbose_name='Usuário',
    )
    data_registro = models.DateTimeField(
        'Data/Hora do registro',
        auto_now_add=True,
        db_index=True,
    )
    observacao = models.TextField(
        'Observação',
        blank=True,
        help_text='Observações sobre a mudança de status',
    )

    class Meta:
        ordering = ('-data_registro',)
        verbose_name = 'Histórico de Status'
        verbose_name_plural = 'Históricos de Status'
        indexes = [
            models.Index(fields=('requisicao', '-data_registro')),
            models.Index(fields=('cod_req', '-data_registro')),
            models.Index(fields=('status', '-data_registro')),
        ]

    def __str__(self) -> str:
        return f'{self.cod_req} - {self.status.codigo} em {self.data_registro:%d/%m/%Y %H:%M}'


class Amostra(AuditModel):
    requisicao = models.ForeignKey(
        Requisicao,
        on_delete=models.CASCADE,
        related_name='amostras',
    )
    cod_barras_amostra = models.CharField(max_length=64)
    data_hora_bipagem = models.DateTimeField()
    ordem = models.PositiveSmallIntegerField(default=1)

    class Meta:
        ordering = ('requisicao', 'ordem')
        unique_together = ('requisicao', 'cod_barras_amostra')
        verbose_name = 'Amostra'

    def __str__(self) -> str:
        return f'{self.requisicao.cod_barras_req} - {self.cod_barras_amostra}'
