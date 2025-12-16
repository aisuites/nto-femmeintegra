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


class MotivoExclusaoAmostra(TimeStampedModel):
    """
    Motivos pré-definidos para exclusão de amostras.
    Usado para rastrear problemas e manter histórico de exclusões.
    """
    codigo = models.PositiveSmallIntegerField(
        'Código',
        unique=True,
        db_index=True,
        help_text='Código único do motivo de exclusão'
    )
    descricao = models.CharField(
        'Descrição',
        max_length=200,
        help_text='Descrição do motivo de exclusão'
    )
    ativo = models.BooleanField(
        'Ativo',
        default=True,
        db_index=True,
        help_text='Indica se o motivo está disponível para uso'
    )

    class Meta:
        db_table = 'motivo_exclusao_amostra'
        ordering = ('codigo',)
        verbose_name = 'Motivo de Exclusão de Amostra'
        verbose_name_plural = 'Motivos de Exclusão de Amostra'

    def __str__(self) -> str:
        return f'{self.codigo} - {self.descricao}'


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
    motivo_exclusao = models.ForeignKey(
        'MotivoExclusaoAmostra',
        on_delete=models.PROTECT,
        null=True,
        blank=True,
        related_name='logs_exclusao',
        verbose_name='Motivo de exclusão',
        help_text='Motivo da exclusão (apenas para exclusões)'
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
