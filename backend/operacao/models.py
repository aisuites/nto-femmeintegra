from django.conf import settings
from django.db import models
from django.utils import timezone

from core.models import AuditModel, TimeStampedModel


class Unidade(TimeStampedModel):
    codigo = models.CharField(max_length=10, default='')
    nome = models.CharField(max_length=120)
    ativo = models.BooleanField(default=True)

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
    ativo = models.BooleanField(default=True)

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


class MotivoArmazenamentoInadequado(TimeStampedModel):
    """
    Lista de motivos de armazenamento inadequado de amostras.
    Usado na triagem etapa 1 quando flag_armazenamento_inadequado=True.
    Uma amostra pode ter múltiplos motivos associados via tabela intermediária.
    """
    codigo = models.CharField(
        'Código',
        max_length=20,
        unique=True,
        db_index=True,
        help_text='Código único do motivo (ex: TEMP, FRASC, VAZAM)'
    )
    descricao = models.CharField(
        'Descrição',
        max_length=200,
        help_text='Descrição do motivo de armazenamento inadequado'
    )
    ativo = models.BooleanField(
        'Ativo',
        default=True,
        db_index=True,
        help_text='Indica se o motivo está disponível para seleção'
    )

    class Meta:
        db_table = 'motivo_armazen_inadequado'
        ordering = ('codigo', 'descricao')
        verbose_name = 'Motivo Inadequado'
        verbose_name_plural = 'Motivos Inadequados'

    def __str__(self) -> str:
        return f'{self.codigo} - {self.descricao}'


class AmostraMotivoArmazenamentoInadequado(TimeStampedModel):
    """
    Tabela intermediária para relação N:N entre Amostra e Motivo de Armazenamento Inadequado.
    Permite que uma amostra tenha múltiplos motivos de armazenamento inadequado.
    Inclui auditoria de quem registrou e quando.
    """
    amostra = models.ForeignKey(
        'RequisicaoAmostra',
        on_delete=models.CASCADE,
        related_name='motivos_armazenamento_inadequado',
        verbose_name='Amostra',
        help_text='Amostra associada ao motivo'
    )
    cod_barras = models.CharField(
        'Código de barras da amostra',
        max_length=64,
        db_index=True,
        help_text='Código de barras da amostra (desnormalizado para auditoria)'
    )
    motivo = models.ForeignKey(
        'MotivoArmazenamentoInadequado',
        on_delete=models.PROTECT,
        related_name='amostras_associadas',
        verbose_name='Motivo',
        help_text='Motivo de armazenamento inadequado'
    )
    usuario = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        related_name='motivos_armazenamento_registrados',
        verbose_name='Usuário',
        help_text='Usuário que registrou o motivo'
    )

    class Meta:
        db_table = 'amostra_mtv_armaz_inadequado'
        ordering = ('-created_at',)
        verbose_name = 'Amostra × Motivo'
        verbose_name_plural = 'Amostras × Motivos'
        constraints = [
            models.UniqueConstraint(
                fields=['amostra', 'motivo'],
                name='unique_amostra_motivo'
            )
        ]
        indexes = [
            models.Index(fields=['amostra', 'motivo'], name='idx_amostra_motivo'),
        ]

    def __str__(self) -> str:
        return f'{self.amostra} - {self.motivo.descricao}'


class TipoPendencia(TimeStampedModel):
    """
    Tipos de pendências que podem ser registradas para requisições.
    Ex: CPF em branco, Dados convênio incompletos, etc.
    """
    codigo = models.PositiveSmallIntegerField(
        'Código',
        unique=True,
        db_index=True,
        help_text='Código único do tipo de pendência'
    )
    descricao = models.CharField(
        'Descrição',
        max_length=200,
        help_text='Descrição do tipo de pendência'
    )
    ativo = models.BooleanField(
        'Ativo',
        default=True,
        db_index=True,
        help_text='Indica se o tipo de pendência está disponível para uso'
    )

    class Meta:
        db_table = 'tipo_pendencia'
        ordering = ('codigo',)
        verbose_name = 'Tipo de Pendência'
        verbose_name_plural = 'Tipos de Pendência'

    def __str__(self) -> str:
        return f'{self.codigo} - {self.descricao}'


class TipoPendenciaEtapa(models.Model):
    """
    Relacionamento entre tipos de pendência e etapas de triagem.
    Permite configurar quais pendências aparecem em cada etapa e em qual ordem.
    """
    ETAPA_CHOICES = [
        (2, 'Etapa 2 - Pendências'),
        (3, 'Etapa 3 - Cadastro'),
    ]
    
    tipo_pendencia = models.ForeignKey(
        'TipoPendencia',
        on_delete=models.CASCADE,
        related_name='etapas',
        verbose_name='Tipo de Pendência'
    )
    etapa = models.PositiveSmallIntegerField(
        'Etapa',
        choices=ETAPA_CHOICES,
        db_index=True,
        help_text='Etapa de triagem onde esta pendência será exibida'
    )
    ordem = models.PositiveSmallIntegerField(
        'Ordem',
        default=0,
        help_text='Ordem de exibição na etapa (menor = primeiro)'
    )
    ativo = models.BooleanField(
        'Ativo',
        default=True,
        db_index=True,
        help_text='Se desativado, não aparece na etapa mesmo que o tipo esteja ativo'
    )

    class Meta:
        db_table = 'tipo_pendencia_etapa'
        ordering = ('etapa', 'ordem', 'tipo_pendencia__codigo')
        verbose_name = 'Pendência por Etapa'
        verbose_name_plural = 'Pendências por Etapa'
        unique_together = [['tipo_pendencia', 'etapa']]

    def __str__(self) -> str:
        return f'{self.tipo_pendencia.descricao} - Etapa {self.etapa} (ordem {self.ordem})'


class TipoAmostra(TimeStampedModel):
    """
    Tipos de amostras que podem ser associadas às requisições.
    Ex: Biópsia, Citologia, Papanicolau, etc.
    """
    descricao = models.CharField(
        'Descrição',
        max_length=100,
        help_text='Descrição do tipo de amostra'
    )
    ativo = models.BooleanField(
        'Ativo',
        default=True,
        db_index=True,
        help_text='Indica se o tipo de amostra está disponível para uso'
    )

    class Meta:
        db_table = 'tipo_amostra'
        ordering = ('descricao',)
        verbose_name = 'Tipo de Amostra'
        verbose_name_plural = 'Tipos de Amostra'

    def __str__(self) -> str:
        return self.descricao


class RequisicaoPendencia(TimeStampedModel):
    """
    Pendências registradas para requisições.
    Uma requisição pode ter várias pendências.
    """
    class StatusPendencia(models.TextChoices):
        PENDENTE = 'PENDENTE', 'Pendente'
        RESOLVIDO = 'RESOLVIDO', 'Resolvido'

    requisicao = models.ForeignKey(
        'DadosRequisicao',
        on_delete=models.CASCADE,
        related_name='pendencias',
        verbose_name='Requisição',
        help_text='Requisição associada à pendência'
    )
    codigo_barras = models.CharField(
        'Código de barras',
        max_length=64,
        db_index=True,
        help_text='Código de barras da requisição (desnormalizado para auditoria)'
    )
    tipo_pendencia = models.ForeignKey(
        'TipoPendencia',
        on_delete=models.PROTECT,
        related_name='pendencias',
        verbose_name='Tipo de Pendência',
        help_text='Tipo da pendência registrada'
    )
    usuario = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        related_name='pendencias_registradas',
        verbose_name='Usuário',
        help_text='Usuário que registrou a pendência'
    )
    status = models.CharField(
        'Status',
        max_length=10,
        choices=StatusPendencia.choices,
        default=StatusPendencia.PENDENTE,
        db_index=True,
        help_text='Status da pendência'
    )

    class Meta:
        db_table = 'requisicao_pendencia'
        ordering = ('-created_at',)
        verbose_name = 'Pendência da Requisição'
        verbose_name_plural = 'Pendências das Requisições'
        indexes = [
            models.Index(fields=['requisicao', 'tipo_pendencia'], name='idx_req_tipo_pend'),
            models.Index(fields=['status', '-created_at'], name='idx_status_created'),
        ]

    def __str__(self) -> str:
        return f'{self.codigo_barras} - {self.tipo_pendencia.descricao} ({self.status})'


class LogRecebimento(TimeStampedModel):
    cod_barras_req = models.CharField('Código de barras da requisição', max_length=64, unique=True)
    dados = models.JSONField('Payload bruto', default=dict, blank=True)

    class Meta:
        ordering = ('-created_at',)
        verbose_name = 'Log de Recebimento (JSON)'
        verbose_name_plural = 'Logs de Recebimento (JSON)'
        indexes = [
            models.Index(fields=('cod_barras_req',)),
        ]

    def __str__(self) -> str:
        return self.cod_barras_req


class DadosRequisicao(AuditModel):
    cod_req = models.CharField('Código da requisição', max_length=30, unique=True)
    cod_barras_req = models.CharField('Código de barras', max_length=64, unique=True)
    lote_req = models.CharField('Lote', max_length=50, blank=True)

    unidade = models.ForeignKey(Unidade, on_delete=models.PROTECT, related_name='requisicoes')
    status = models.ForeignKey(StatusRequisicao, on_delete=models.PROTECT, related_name='requisicoes')
    recebido_por = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='requisicoes_recebidas',
        verbose_name='Recebido por',
        help_text='Usuário que recebeu/criou a requisição no sistema',
        db_index=True,
    )
    portador_representante = models.ForeignKey(
        PortadorRepresentante,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='requisicoes',
        verbose_name='Portador/Representante',
        help_text='Pessoa que trouxe/enviou a requisição',
    )
    origem = models.ForeignKey(
        Origem,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='requisicoes_origem',
    )

    data_envio_representante = models.DateField(null=True, blank=True)
    data_cadastro_representante = models.DateField(null=True, blank=True)
    data_recebimento_nto = models.DateTimeField(null=True, blank=True)
    data_um = models.DateField(null=True, blank=True)

    nome_paciente = models.CharField(max_length=200, blank=True)
    cpf_paciente = models.CharField(max_length=14, blank=True)
    data_nasc_paciente = models.DateField(null=True, blank=True)
    sexo_paciente = models.CharField(max_length=10, blank=True)
    telefone_paciente = models.CharField(max_length=20, blank=True)
    email_paciente = models.EmailField(blank=True)
    
    # Dados do paciente vindos da API Korus
    matricula_paciente = models.CharField(
        'Matrícula',
        max_length=50,
        blank=True,
        help_text='Matrícula do paciente no convênio (API Korus)'
    )
    convenio_paciente = models.CharField(
        'Convênio',
        max_length=100,
        blank=True,
        help_text='Nome do convênio do paciente (API Korus)'
    )
    plano_paciente = models.CharField(
        'Plano',
        max_length=100,
        blank=True,
        help_text='Nome do plano do paciente (API Korus)'
    )

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
    
    # Flags da Etapa 3 - Cadastro
    flag_problema_cpf = models.BooleanField(
        'Problema com CPF',
        default=False,
        help_text='Indica problema identificado no CPF do paciente'
    )
    flag_problema_medico = models.BooleanField(
        'Problema com dados do médico',
        default=False,
        help_text='Indica problema identificado nos dados do médico'
    )
    flag_sexo_a_confirmar = models.BooleanField(
        'Sexo a confirmar',
        default=False,
        help_text='Indica que o sexo do paciente precisa ser confirmado posteriormente'
    )

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
    """
    requisicao = models.ForeignKey(
        DadosRequisicao,
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


class RequisicaoAmostra(AuditModel):
    """
    Amostras vinculadas a uma requisição.
    Armazena dados de triagem e validação de cada amostra.
    """
    requisicao = models.ForeignKey(
        DadosRequisicao,
        on_delete=models.CASCADE,
        related_name='amostras',
        verbose_name='Requisição',
    )
    # Campos de identificação (já existentes)
    cod_barras_amostra = models.CharField(
        'Código de barras da amostra',
        max_length=64,
    )
    data_hora_bipagem = models.DateTimeField(
        'Data/hora da bipagem',
    )
    ordem = models.PositiveSmallIntegerField(
        'Ordem',
        default=1,
        help_text='Ordem da amostra na requisição (1, 2, 3...)',
    )
    
    # Campos de triagem (novos)
    tipo_amostra = models.ForeignKey(
        'TipoAmostra',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='amostras',
        verbose_name='Tipo de amostra',
        help_text='Tipo de amostra (ex: Biópsia, Citologia, etc)',
    )
    data_coleta = models.DateField(
        'Data da coleta',
        null=True,
        blank=True,
    )
    data_validade = models.DateField(
        'Data de validade',
        null=True,
        blank=True,
    )
    flag_data_coleta_rasurada = models.BooleanField(
        'Data de coleta rasurada',
        default=False,
    )
    flag_sem_data_validade = models.BooleanField(
        'Sem data de validade',
        default=False,
    )
    descricao = models.CharField(
        'Descrição/Observações',
        max_length=50,
        blank=True,
        default='',
    )
    status = models.IntegerField(
        'Status da amostra',
        null=True,
        blank=True,
        help_text='Status de processamento da amostra',
    )
    
    # Flags de validação
    flag_amostra_sem_identificacao = models.BooleanField(
        'Amostra sem identificação (biópsia/swab)',
        default=False,
    )
    flag_armazenamento_inadequado = models.BooleanField(
        'Armazenamento inadequado',
        default=False,
    )
    flag_frasco_trocado_tipo_coleta = models.BooleanField(
        'Frasco trocado - tipo de coletor',
        default=False,
    )
    flag_material_nao_analisado = models.BooleanField(
        'Tipo de material não analisado pelo FEMME',
        default=False,
    )
    
    # Campo de validação da triagem etapa 1
    triagem1_validada = models.BooleanField(
        'Triagem 1 validada',
        default=False,
        db_index=True,
        help_text='Indica se a amostra foi validada na triagem etapa 1',
    )

    class Meta:
        ordering = ('requisicao', 'ordem')
        unique_together = ('requisicao', 'ordem')
        verbose_name = 'Amostra da Requisição'
        verbose_name_plural = 'Amostras das Requisições'
        db_table = 'operacao_requisicao_amostra'

    def __str__(self) -> str:
        return f'{self.requisicao.cod_req} - Amostra {self.ordem}'


class MotivoAlteracaoAmostra(TimeStampedModel):
    """
    Motivos pré-definidos para alteração de amostras (adição/exclusão).
    Usado para rastrear problemas e manter histórico de alterações.
    """
    class TipoMotivo(models.TextChoices):
        ADICAO = 'ADICAO', 'Adição'
        EXCLUSAO = 'EXCLUSAO', 'Exclusão'

    tipo = models.CharField(
        'Tipo',
        max_length=10,
        choices=TipoMotivo.choices,
        default=TipoMotivo.EXCLUSAO,
        db_index=True,
        help_text='Tipo de alteração (adição ou exclusão)'
    )
    codigo = models.PositiveSmallIntegerField(
        'Código',
        db_index=True,
        help_text='Código do motivo (único por tipo)'
    )
    descricao = models.CharField(
        'Descrição',
        max_length=200,
        help_text='Descrição do motivo'
    )
    ativo = models.BooleanField(
        'Ativo',
        default=True,
        db_index=True,
        help_text='Indica se o motivo está disponível para uso'
    )

    class Meta:
        db_table = 'motivo_alteracao_amostra'
        ordering = ('tipo', 'codigo')
        verbose_name = 'Motivo de Alteração de Amostra'
        verbose_name_plural = 'Motivos de Alteração de Amostra'
        unique_together = [['tipo', 'codigo']]

    def __str__(self) -> str:
        return f'{self.get_tipo_display()} - {self.codigo} - {self.descricao}'


# Alias para compatibilidade com código existente
MotivoExclusaoAmostra = MotivoAlteracaoAmostra


class LogAlteracaoAmostra(TimeStampedModel):
    """
    Log de alterações em amostras (adição/exclusão).
    Mantém histórico completo de quem fez a alteração, em qual etapa e motivo.
    """
    class TipoAlteracao(models.TextChoices):
        ADICAO = 'ADICAO', 'Adição'
        EXCLUSAO = 'EXCLUSAO', 'Exclusão'

    requisicao = models.ForeignKey(
        'DadosRequisicao',
        on_delete=models.CASCADE,
        related_name='logs_alteracao_amostra',
        verbose_name='Requisição',
        help_text='Requisição associada à alteração'
    )
    cod_barras_requisicao = models.CharField(
        'Código de barras da requisição',
        max_length=64,
        db_index=True,
        help_text='Código de barras da requisição (desnormalizado para auditoria)'
    )
    cod_barras_amostra = models.CharField(
        'Código de barras da amostra',
        max_length=64,
        db_index=True,
        help_text='Código de barras da amostra alterada'
    )
    ordem_amostra = models.PositiveSmallIntegerField(
        'Ordem/Frasco',
        null=True,
        blank=True,
        help_text='Número do frasco/ordem da amostra na requisição'
    )
    tipo_alteracao = models.CharField(
        'Tipo de alteração',
        max_length=10,
        choices=TipoAlteracao.choices,
        db_index=True,
        help_text='Tipo da alteração realizada (adição ou exclusão)'
    )
    etapa = models.CharField(
        'Etapa',
        max_length=20,
        db_index=True,
        help_text='Etapa em que a alteração foi realizada (ex: TRIAGEM3, RECEBIMENTO)'
    )
    usuario = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        related_name='logs_alteracao_amostra',
        verbose_name='Usuário',
        help_text='Usuário que realizou a alteração'
    )
    motivo = models.ForeignKey(
        'MotivoAlteracaoAmostra',
        on_delete=models.PROTECT,
        null=True,
        blank=True,
        related_name='logs_alteracao',
        verbose_name='Motivo',
        help_text='Motivo da alteração (adição ou exclusão)'
    )
    observacao = models.TextField(
        'Observação',
        blank=True,
        default='',
        help_text='Observações adicionais sobre a alteração'
    )

    class Meta:
        db_table = 'log_alteracao_amostra'
        ordering = ('-created_at',)
        verbose_name = 'Log de Alteração de Amostra'
        verbose_name_plural = 'Logs de Alteração de Amostra'
        indexes = [
            models.Index(fields=['requisicao', '-created_at'], name='idx_log_req_created'),
            models.Index(fields=['tipo_alteracao', '-created_at'], name='idx_log_tipo_created'),
            models.Index(fields=['usuario', '-created_at'], name='idx_log_user_created'),
        ]

    def __str__(self) -> str:
        return f'{self.cod_barras_requisicao} - {self.tipo_alteracao} - {self.cod_barras_amostra}'


class Notificacao(TimeStampedModel):
    """
    Modelo para armazenar notificações do sistema.
    Usado para alertar usuários sobre eventos importantes (ex: transferências).
    """
    class Tipo(models.TextChoices):
        TRANSFERENCIA = 'TRANSFERENCIA', 'Transferência de Requisição'
        TAREFA = 'TAREFA', 'Nova Tarefa'
        ALERTA = 'ALERTA', 'Alerta'
        INFO = 'INFO', 'Informação'
    
    usuario = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='notificacoes',
        verbose_name='Usuário',
    )
    tipo = models.CharField(
        max_length=20,
        choices=Tipo.choices,
        default=Tipo.INFO,
        verbose_name='Tipo',
    )
    titulo = models.CharField(
        max_length=200,
        verbose_name='Título',
    )
    mensagem = models.TextField(
        verbose_name='Mensagem',
    )
    lida = models.BooleanField(
        default=False,
        verbose_name='Lida',
    )
    data_leitura = models.DateTimeField(
        null=True,
        blank=True,
        verbose_name='Data de Leitura',
    )
    dados = models.JSONField(
        default=dict,
        blank=True,
        verbose_name='Dados Adicionais',
        help_text='Dados extras em formato JSON',
    )
    
    class Meta:
        ordering = ('-created_at',)
        verbose_name = 'Notificação'
        verbose_name_plural = 'Notificações'
        indexes = [
            models.Index(fields=['usuario', 'lida', '-created_at']),
        ]
    
    def __str__(self) -> str:
        return f'{self.usuario.username} - {self.titulo}'
    
    def marcar_como_lida(self):
        """Marca notificação como lida."""
        if not self.lida:
            self.lida = True
            self.data_leitura = timezone.now()
            self.save(update_fields=['lida', 'data_leitura'])


class TipoArquivo(TimeStampedModel):
    """
    Tipos de arquivos que podem ser anexados às requisições.
    Ex: Requisição, Laudo, Resultado, Documento de Identificação, etc.
    
    Códigos fixos:
    1 = REQUISICAO (documento digitalizado da requisição)
    """
    codigo = models.IntegerField(
        'Código',
        unique=True,
        db_index=True,
        default=0,
        help_text='Código único do tipo de arquivo (ex: 1=REQUISICAO)'
    )
    descricao = models.CharField(
        'Descrição',
        max_length=100,
        help_text='Descrição do tipo de arquivo'
    )
    ativo = models.BooleanField(default=True)
    
    class Meta:
        ordering = ('codigo',)
        verbose_name = 'Tipo de Arquivo'
        verbose_name_plural = 'Tipos de Arquivo'
    
    def __str__(self) -> str:
        return f'{self.codigo} - {self.descricao}'


class RequisicaoArquivo(AuditModel):
    """
    Arquivos anexados a uma requisição.
    Armazena uploads de imagens, PDFs, documentos relacionados à requisição.
    """
    requisicao = models.ForeignKey(
        DadosRequisicao,
        on_delete=models.CASCADE,
        related_name='arquivos',
        verbose_name='Requisição',
        help_text='Requisição à qual o arquivo pertence',
    )
    cod_req = models.CharField(
        'Código da requisição',
        max_length=30,
        db_index=True,
        help_text='Código da requisição (desnormalizado para performance)',
    )
    tipo_arquivo = models.ForeignKey(
        TipoArquivo,
        on_delete=models.PROTECT,
        related_name='arquivos',
        verbose_name='Tipo de Arquivo',
        help_text='Tipo/categoria do arquivo',
    )
    cod_tipo_arquivo = models.IntegerField(
        'Código do Tipo',
        db_index=True,
        default=1,
        help_text='Código do tipo de arquivo (desnormalizado para performance). Ex: 1=REQUISICAO',
    )
    nome_arquivo = models.CharField(
        'Nome do arquivo',
        max_length=255,
        help_text='Nome original do arquivo enviado',
    )
    url_arquivo = models.CharField(
        'URL do arquivo',
        max_length=500,
        help_text='URL ou caminho do arquivo armazenado',
    )
    data_upload = models.DateTimeField(
        'Data de upload',
        auto_now_add=True,
        db_index=True,
    )
    
    class Meta:
        ordering = ('-data_upload',)
        verbose_name = 'Arquivo da Requisição'
        verbose_name_plural = 'Arquivos das Requisições'
        indexes = [
            models.Index(fields=['requisicao', '-data_upload']),
            models.Index(fields=['cod_req', '-data_upload']),
            models.Index(fields=['tipo_arquivo', '-data_upload']),
            models.Index(fields=['cod_tipo_arquivo', '-data_upload']),
            models.Index(fields=['requisicao', 'cod_tipo_arquivo']),
        ]
    
    def __str__(self) -> str:
        return f'{self.cod_req} - {self.nome_arquivo}'


class Protocolo(AuditModel):
    """
    Protocolo de cadastro de médico/requisição.
    Armazena dados de unidade, portador, médico e arquivo digitalizado.
    """
    
    class Status(models.TextChoices):
        PENDENTE = 'PENDENTE', 'Pendente'
        PROCESSADO = 'PROCESSADO', 'Processado'
        CANCELADO = 'CANCELADO', 'Cancelado'
    
    codigo = models.CharField(
        'Código do Protocolo',
        max_length=30,
        unique=True,
        db_index=True,
        help_text='Código único do protocolo (gerado automaticamente)',
    )
    unidade = models.ForeignKey(
        Unidade,
        on_delete=models.PROTECT,
        related_name='protocolos',
        verbose_name='Unidade',
    )
    portador = models.ForeignKey(
        PortadorRepresentante,
        on_delete=models.PROTECT,
        related_name='protocolos',
        verbose_name='Portador/Representante',
    )
    origem = models.ForeignKey(
        Origem,
        on_delete=models.PROTECT,
        related_name='protocolos',
        verbose_name='Origem',
    )
    
    # Dados do médico
    crm = models.CharField(
        'CRM',
        max_length=20,
        help_text='Número do CRM do médico',
    )
    uf_crm = models.CharField(
        'UF do CRM',
        max_length=2,
        help_text='Estado do CRM (ex: SP, RJ)',
    )
    nome_medico = models.CharField(
        'Nome do Médico',
        max_length=200,
        blank=True,
        default='',
        help_text='Nome completo do médico (vazio se pendente de validação)',
    )
    medico_validado = models.BooleanField(
        'Médico Validado',
        default=False,
        help_text='Indica se o médico foi validado via API',
    )
    
    # Arquivo (obrigatório)
    arquivo_url = models.CharField(
        'URL do Arquivo',
        max_length=500,
        help_text='URL do arquivo PDF no S3',
    )
    arquivo_nome = models.CharField(
        'Nome do Arquivo',
        max_length=255,
        help_text='Nome original do arquivo enviado',
    )
    
    # Status
    status = models.CharField(
        'Status',
        max_length=20,
        choices=Status.choices,
        default=Status.PENDENTE,
        db_index=True,
    )
    
    # Observações
    observacao = models.TextField(
        'Observação',
        blank=True,
        default='',
        help_text='Observações adicionais sobre o protocolo',
    )
    
    class Meta:
        db_table = 'operacao_protocolo'
        ordering = ('-created_at',)
        verbose_name = 'Protocolo'
        verbose_name_plural = 'Protocolos'
        indexes = [
            models.Index(fields=['codigo']),
            models.Index(fields=['status', '-created_at']),
            models.Index(fields=['unidade', '-created_at']),
            models.Index(fields=['crm', 'uf_crm']),
        ]
    
    def __str__(self) -> str:
        return f'{self.codigo} - {self.nome_medico}'
    
    def save(self, *args, **kwargs):
        # Gerar código automaticamente se não existir
        if not self.codigo:
            self.codigo = self._gerar_codigo()
        super().save(*args, **kwargs)
    
    @classmethod
    def _gerar_codigo(cls):
        """Gera código único no formato PROT-YYYYMMDD-XXXX"""
        from datetime import datetime
        hoje = datetime.now().strftime('%Y%m%d')
        prefixo = f'PROT-{hoje}-'
        
        # Buscar último protocolo do dia
        ultimo = cls.objects.filter(
            codigo__startswith=prefixo
        ).order_by('-codigo').first()
        
        if ultimo:
            try:
                ultimo_num = int(ultimo.codigo.split('-')[-1])
                novo_num = ultimo_num + 1
            except (ValueError, IndexError):
                novo_num = 1
        else:
            novo_num = 1
        
        return f'{prefixo}{novo_num:04d}'


# ============================================
# SISTEMA DE TAREFAS
# ============================================

class TipoTarefa(TimeStampedModel):
    """
    Tipos de tarefa pré-definidos com prazo padrão.
    Ex: 'Cadastro de Médico' - 3 dias, 'Validação de Documento' - 1 dia
    """
    codigo = models.CharField(
        'Código',
        max_length=50,
        unique=True,
        help_text='Código único do tipo de tarefa (ex: CADASTRO_MEDICO)',
    )
    nome = models.CharField(
        'Nome',
        max_length=150,
        help_text='Nome descritivo do tipo de tarefa',
    )
    descricao = models.TextField(
        'Descrição',
        blank=True,
        default='',
        help_text='Descrição detalhada do tipo de tarefa',
    )
    prazo_dias = models.PositiveIntegerField(
        'Prazo (dias)',
        default=3,
        help_text='Prazo padrão em dias para conclusão',
    )
    ativo = models.BooleanField(
        'Ativo',
        default=True,
    )

    class Meta:
        ordering = ['nome']
        verbose_name = 'Tipo de Tarefa'
        verbose_name_plural = 'Tipos de Tarefa'

    def __str__(self) -> str:
        return f'{self.nome} ({self.prazo_dias} dias)'


class Tarefa(TimeStampedModel):
    """
    Tarefa para gerenciamento de processos em aberto.
    Suporta visualização Kanban com colunas: A FAZER, EM ANDAMENTO, CONCLUÍDA.
    """
    
    class Status(models.TextChoices):
        A_FAZER = 'A_FAZER', 'A Fazer'
        EM_ANDAMENTO = 'EM_ANDAMENTO', 'Em Andamento'
        CONCLUIDA = 'CONCLUIDA', 'Concluída'
        CANCELADA = 'CANCELADA', 'Cancelada'
    
    class Prioridade(models.TextChoices):
        BAIXA = 'BAIXA', 'Baixa'
        MEDIA = 'MEDIA', 'Média'
        ALTA = 'ALTA', 'Alta'
        URGENTE = 'URGENTE', 'Urgente'
    
    class Origem(models.TextChoices):
        SISTEMA = 'SISTEMA', 'Sistema'
        GESTOR = 'GESTOR', 'Gestor'
        PROPRIO = 'PROPRIO', 'Próprio'
    
    # Identificação
    codigo = models.CharField(
        'Código',
        max_length=20,
        unique=True,
        editable=False,
        help_text='Código único gerado automaticamente',
    )
    titulo = models.CharField(
        'Título',
        max_length=200,
        help_text='Título resumido da tarefa',
    )
    descricao = models.TextField(
        'Descrição',
        blank=True,
        default='',
        help_text='Descrição detalhada da tarefa',
    )
    
    # Tipo e Status
    tipo = models.ForeignKey(
        TipoTarefa,
        on_delete=models.PROTECT,
        related_name='tarefas',
        verbose_name='Tipo de Tarefa',
        null=True,
        blank=True,
        help_text='Tipo pré-definido (opcional)',
    )
    status = models.CharField(
        'Status',
        max_length=20,
        choices=Status.choices,
        default=Status.A_FAZER,
        db_index=True,
    )
    prioridade = models.CharField(
        'Prioridade',
        max_length=20,
        choices=Prioridade.choices,
        default=Prioridade.MEDIA,
    )
    
    # Origem e Responsáveis
    origem = models.CharField(
        'Origem',
        max_length=20,
        choices=Origem.choices,
        default=Origem.GESTOR,
        help_text='Quem criou a tarefa: Sistema ou Gestor',
    )
    criado_por = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        related_name='tarefas_criadas',
        verbose_name='Criado por',
        null=True,
        blank=True,
        help_text='Usuário que criou a tarefa (null se criada pelo sistema)',
    )
    responsavel = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        related_name='tarefas_responsavel',
        verbose_name='Responsável',
        help_text='Colaborador responsável pela execução',
    )
    
    # Datas
    data_prazo = models.DateField(
        'Data de Prazo',
        null=True,
        blank=True,
        help_text='Data limite para conclusão',
    )
    data_inicio = models.DateTimeField(
        'Data de Início',
        null=True,
        blank=True,
        help_text='Quando a tarefa foi iniciada (status EM_ANDAMENTO)',
    )
    data_conclusao = models.DateTimeField(
        'Data de Conclusão',
        null=True,
        blank=True,
        help_text='Quando a tarefa foi concluída',
    )
    
    # Referências (para vincular a outros objetos do sistema)
    protocolo = models.ForeignKey(
        'Protocolo',
        on_delete=models.SET_NULL,
        related_name='tarefas',
        verbose_name='Protocolo',
        null=True,
        blank=True,
        help_text='Protocolo relacionado (se aplicável)',
    )
    requisicao = models.ForeignKey(
        'DadosRequisicao',
        on_delete=models.SET_NULL,
        related_name='tarefas',
        verbose_name='Requisição',
        null=True,
        blank=True,
        help_text='Requisição relacionada (se aplicável)',
    )
    
    # Observações
    observacoes = models.TextField(
        'Observações',
        blank=True,
        default='',
        help_text='Observações adicionais ou histórico de ações',
    )

    class Meta:
        ordering = ['-created_at']
        verbose_name = 'Tarefa'
        verbose_name_plural = 'Tarefas'
        indexes = [
            models.Index(fields=['status', '-created_at']),
            models.Index(fields=['responsavel', 'status']),
            models.Index(fields=['data_prazo']),
            models.Index(fields=['origem', '-created_at']),
        ]

    def __str__(self) -> str:
        return f'{self.codigo} - {self.titulo}'

    def save(self, *args, **kwargs):
        # Gerar código automaticamente se não existir
        if not self.codigo:
            self.codigo = self._gerar_codigo()
        
        # Calcular data de prazo baseado no tipo, se não informada
        if not self.data_prazo and self.tipo:
            from datetime import timedelta
            self.data_prazo = timezone.now().date() + timedelta(days=self.tipo.prazo_dias)
        
        # Atualizar datas de status
        if self.pk:
            old = Tarefa.objects.filter(pk=self.pk).first()
            if old:
                # Iniciou a tarefa
                if old.status == self.Status.A_FAZER and self.status == self.Status.EM_ANDAMENTO:
                    self.data_inicio = timezone.now()
                # Concluiu a tarefa
                if old.status != self.Status.CONCLUIDA and self.status == self.Status.CONCLUIDA:
                    self.data_conclusao = timezone.now()
        
        super().save(*args, **kwargs)

    @classmethod
    def _gerar_codigo(cls):
        """Gera código único no formato TAR-YYYYMMDD-XXXX"""
        from datetime import datetime
        hoje = datetime.now().strftime('%Y%m%d')
        prefixo = f'TAR-{hoje}-'
        
        ultimo = cls.objects.filter(
            codigo__startswith=prefixo
        ).order_by('-codigo').first()
        
        if ultimo:
            try:
                ultimo_num = int(ultimo.codigo.split('-')[-1])
                novo_num = ultimo_num + 1
            except (ValueError, IndexError):
                novo_num = 1
        else:
            novo_num = 1
        
        return f'{prefixo}{novo_num:04d}'
    
    @property
    def esta_atrasada(self) -> bool:
        """Verifica se a tarefa está atrasada"""
        if self.status in [self.Status.CONCLUIDA, self.Status.CANCELADA]:
            return False
        if not self.data_prazo:
            return False
        return timezone.now().date() > self.data_prazo
    
    @property
    def dias_restantes(self) -> int | None:
        """Retorna dias restantes até o prazo (negativo se atrasada)"""
        if not self.data_prazo:
            return None
        return (self.data_prazo - timezone.now().date()).days


class EventoTarefa(TimeStampedModel):
    """
    Configuração de tarefas automáticas criadas por eventos do sistema.
    Permite personalizar via Admin: título, descrição, prioridade, responsável.
    
    Variáveis disponíveis nos templates:
    - {crm}: CRM do médico
    - {uf}: UF do CRM
    - {protocolo}: Número do protocolo
    - {usuario}: Nome do usuário que disparou o evento
    - {data}: Data atual formatada
    """
    
    class ResponsavelTipo(models.TextChoices):
        EMAIL_DESTINO = 'EMAIL_DESTINO', 'Destinatário do Email (ConfiguracaoEmail)'
        USUARIO_ACAO = 'USUARIO_ACAO', 'Usuário que realizou a ação'
        USUARIO_FIXO = 'USUARIO_FIXO', 'Usuário específico'
    
    # Identificação do evento
    codigo_evento = models.CharField(
        'Código do Evento',
        max_length=50,
        unique=True,
        help_text='Código único do evento (ex: MEDICO_NAO_ENCONTRADO)',
    )
    nome = models.CharField(
        'Nome do Evento',
        max_length=150,
        help_text='Nome descritivo do evento',
    )
    descricao_evento = models.TextField(
        'Descrição do Evento',
        blank=True,
        default='',
        help_text='Quando este evento é disparado',
    )
    
    # Configuração da tarefa a ser criada
    tipo_tarefa = models.ForeignKey(
        TipoTarefa,
        on_delete=models.PROTECT,
        related_name='eventos',
        verbose_name='Tipo de Tarefa',
        help_text='Tipo da tarefa que será criada',
    )
    titulo_template = models.CharField(
        'Template do Título',
        max_length=200,
        help_text='Título da tarefa. Use {crm}, {uf}, {protocolo}, {usuario}, {data}',
    )
    descricao_template = models.TextField(
        'Template da Descrição',
        blank=True,
        default='',
        help_text='Descrição da tarefa. Use {crm}, {uf}, {protocolo}, {usuario}, {data}',
    )
    prioridade = models.CharField(
        'Prioridade',
        max_length=20,
        choices=Tarefa.Prioridade.choices,
        default=Tarefa.Prioridade.MEDIA,
        help_text='Prioridade da tarefa criada',
    )
    
    # Configuração do responsável
    responsavel_tipo = models.CharField(
        'Tipo de Responsável',
        max_length=20,
        choices=ResponsavelTipo.choices,
        default=ResponsavelTipo.EMAIL_DESTINO,
        help_text='Como determinar o responsável pela tarefa',
    )
    responsavel_fixo = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        related_name='eventos_tarefa_responsavel',
        verbose_name='Responsável Fixo',
        null=True,
        blank=True,
        help_text='Usuário fixo (apenas se Tipo = Usuário específico)',
    )
    tipo_email = models.CharField(
        'Tipo de Email (ConfiguracaoEmail)',
        max_length=50,
        blank=True,
        default='',
        help_text='Tipo do email para buscar destinatário (ex: medico_nao_encontrado)',
    )
    
    # Controle
    ativo = models.BooleanField(
        'Ativo',
        default=True,
        help_text='Se desativado, o evento não criará tarefas',
    )
    
    class Meta:
        ordering = ['nome']
        verbose_name = 'Evento de Tarefa Automática'
        verbose_name_plural = 'Eventos de Tarefas Automáticas'
    
    def __str__(self) -> str:
        status = '✓' if self.ativo else '✗'
        return f'{status} {self.nome} → {self.tipo_tarefa.nome}'
    
    def criar_tarefa(self, dados: dict, usuario_acao=None) -> 'Tarefa':
        """
        Cria uma tarefa baseada neste evento.
        
        Args:
            dados: Dicionário com variáveis para substituição (crm, uf, protocolo, etc)
            usuario_acao: Usuário que disparou o evento (para ResponsavelTipo.USUARIO_ACAO)
        
        Returns:
            Tarefa criada
        """
        from datetime import datetime
        from core.models import ConfiguracaoEmail
        from django.contrib.auth import get_user_model
        
        User = get_user_model()
        
        # Preparar dados para substituição
        dados_sub = {
            'crm': dados.get('crm', ''),
            'uf': dados.get('uf', ''),
            'protocolo': dados.get('protocolo', ''),
            'usuario': usuario_acao.get_full_name() if usuario_acao else '',
            'data': datetime.now().strftime('%d/%m/%Y'),
            **dados  # Permite dados extras
        }
        
        # Substituir variáveis nos templates
        titulo = self.titulo_template.format(**dados_sub)
        descricao = self.descricao_template.format(**dados_sub)
        
        # Determinar responsável
        responsavel = None
        
        if self.responsavel_tipo == self.ResponsavelTipo.USUARIO_FIXO:
            responsavel = self.responsavel_fixo
        
        elif self.responsavel_tipo == self.ResponsavelTipo.USUARIO_ACAO:
            responsavel = usuario_acao
        
        elif self.responsavel_tipo == self.ResponsavelTipo.EMAIL_DESTINO:
            # Buscar usuário pelo email de destino da configuração
            if self.tipo_email:
                try:
                    config = ConfiguracaoEmail.objects.get(tipo=self.tipo_email, ativo=True)
                    emails = config.get_emails_destino_list()
                    if emails:
                        # Tentar encontrar usuário com esse email
                        responsavel = User.objects.filter(email__in=emails, is_active=True).first()
                except ConfiguracaoEmail.DoesNotExist:
                    pass
        
        # Se não encontrou responsável, usar o usuário da ação
        if not responsavel:
            responsavel = usuario_acao
        
        # Criar a tarefa
        tarefa = Tarefa.objects.create(
            titulo=titulo,
            descricao=descricao,
            tipo=self.tipo_tarefa,
            status=Tarefa.Status.A_FAZER,
            prioridade=self.prioridade,
            origem=Tarefa.Origem.SISTEMA,
            criado_por=None,  # Sistema
            responsavel=responsavel,
            protocolo_id=dados.get('protocolo_id'),
            requisicao_id=dados.get('requisicao_id'),
            observacoes=f'Tarefa criada automaticamente pelo evento: {self.nome}',
        )
        
        # Criar notificação para o responsável
        if responsavel:
            Notificacao.objects.create(
                usuario=responsavel,
                tipo='TAREFA',
                titulo='Nova tarefa automática',
                mensagem=f'Uma tarefa foi criada automaticamente: {tarefa.titulo}',
                dados={
                    'tarefa_id': tarefa.id,
                    'tarefa_codigo': tarefa.codigo,
                    'evento': self.codigo_evento,
                }
            )
        
        return tarefa


# ============================================
# CADASTRO DE REQUISIÇÃO - TIPOS DE ATENDIMENTO E EXAMES
# ============================================

class TipoAtendimento(TimeStampedModel):
    """
    Tipos de atendimento disponíveis para requisições.
    Ex: CONVÊNIO, CONGIP FATURAMENTO, CONGIP CAIXA, CORTESIA
    """
    codigo = models.CharField(
        'Código',
        max_length=30,
        unique=True,
        db_index=True,
        help_text='Código único do tipo de atendimento (ex: CONVENIO, CONGIP_FAT)'
    )
    descricao = models.CharField(
        'Descrição',
        max_length=100,
        help_text='Descrição do tipo de atendimento'
    )
    ativo = models.BooleanField(
        'Ativo',
        default=True,
        db_index=True,
        help_text='Indica se o tipo de atendimento está disponível para uso'
    )

    class Meta:
        db_table = 'tipo_atendimento'
        ordering = ('descricao',)
        verbose_name = 'Tipo de Atendimento'
        verbose_name_plural = 'Tipos de Atendimento'

    def __str__(self) -> str:
        return self.descricao


class RequisicaoExame(AuditModel):
    """
    Exames vinculados a uma requisição.
    Armazena dados de autorização e tipo de atendimento para cada exame.
    """
    requisicao = models.ForeignKey(
        DadosRequisicao,
        on_delete=models.CASCADE,
        related_name='exames',
        verbose_name='Requisição',
        help_text='Requisição à qual o exame pertence',
    )
    cod_req = models.CharField(
        'Código da requisição',
        max_length=30,
        db_index=True,
        help_text='Código da requisição (desnormalizado para performance)',
    )
    cod_barras_req = models.CharField(
        'Código de barras da requisição',
        max_length=64,
        db_index=True,
        help_text='Código de barras da requisição (desnormalizado para auditoria)',
    )
    tipo_amostra = models.ForeignKey(
        'TipoAmostra',
        on_delete=models.PROTECT,
        related_name='exames',
        verbose_name='Tipo de Amostra/Exame',
        help_text='Tipo de amostra/exame selecionado',
    )
    tipo_atendimento = models.ForeignKey(
        'TipoAtendimento',
        on_delete=models.PROTECT,
        related_name='exames',
        verbose_name='Tipo de Atendimento',
        help_text='Tipo de atendimento (Convênio, CONGIP, etc)',
    )
    
    # Dados de autorização (retornados via API)
    num_autorizacao = models.CharField(
        'Número de Autorização',
        max_length=50,
        blank=True,
        default='',
        help_text='Número de autorização retornado pela API',
    )
    num_guia = models.CharField(
        'Número da Guia',
        max_length=50,
        blank=True,
        default='',
        help_text='Número da guia retornado pela API',
    )
    num_guia_prestador = models.CharField(
        'Número da Guia Prestador',
        max_length=50,
        blank=True,
        default='',
        help_text='Número da guia do prestador retornado pela API',
    )
    retorno_autorizacao = models.JSONField(
        'Retorno da Autorização',
        default=dict,
        blank=True,
        help_text='Dados completos retornados pela API de autorização',
    )

    class Meta:
        db_table = 'requisicao_exame'
        ordering = ('-created_at',)
        verbose_name = 'Exame da Requisição'
        verbose_name_plural = 'Exames das Requisições'
        indexes = [
            models.Index(fields=['requisicao', '-created_at']),
            models.Index(fields=['cod_req', '-created_at']),
            models.Index(fields=['tipo_atendimento', '-created_at']),
        ]

    def __str__(self) -> str:
        return f'{self.cod_req} - {self.tipo_amostra.descricao} ({self.tipo_atendimento.descricao})'
