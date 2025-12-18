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


class ConfiguracaoEmail(TimeStampedModel):
    """
    Configuração de templates de email para diferentes tipos de notificação.
    Permite configurar destinatários, assunto e corpo do email via Admin.
    """
    
    class TipoEmail(models.TextChoices):
        MEDICO_DUPLICADO = 'medico_duplicado', 'Médico Duplicado'
        MEDICO_NAO_ENCONTRADO = 'medico_nao_encontrado', 'Médico Não Encontrado'
        NOTIFICACAO_GERAL = 'notificacao_geral', 'Notificação Geral'
    
    tipo = models.CharField(
        'Tipo',
        max_length=50,
        choices=TipoEmail.choices,
        unique=True,
        help_text='Tipo de email (define quando este template será usado)'
    )
    nome = models.CharField(
        'Nome',
        max_length=100,
        help_text='Nome descritivo para identificação'
    )
    email_destino = models.TextField(
        'Email(s) Destino',
        help_text='Email(s) de destino separados por vírgula. Ex: email1@femme.com.br, email2@femme.com.br'
    )
    email_resposta = models.EmailField(
        'Email para Resposta (Reply-To)',
        blank=True,
        default='',
        help_text='Email que receberá as respostas. Ex: gestora@femme.com.br. Se vazio, usa o email de envio padrão.'
    )
    assunto_padrao = models.CharField(
        'Assunto Padrão',
        max_length=200,
        help_text='Assunto padrão do email. Pode usar placeholders: {crm}, {uf}, {data}'
    )
    corpo_padrao = models.TextField(
        'Corpo Padrão',
        help_text='Corpo padrão do email (HTML permitido). Placeholders: {crm}, {uf}, {medicos}, {usuario}, {data}'
    )
    ativo = models.BooleanField(
        'Ativo',
        default=True,
        help_text='Desmarque para desativar este template'
    )
    
    class Meta:
        db_table = 'core_configuracao_email'
        verbose_name = 'Configuração de Email'
        verbose_name_plural = 'Configurações de Email'
        ordering = ['tipo']
    
    def __str__(self):
        return f"{self.nome} ({self.get_tipo_display()})"
    
    def get_emails_destino_list(self):
        """Retorna lista de emails de destino."""
        return [email.strip() for email in self.email_destino.split(',') if email.strip()]
    
    def renderizar_assunto(self, contexto: dict) -> str:
        """Renderiza o assunto com os placeholders substituídos."""
        assunto = self.assunto_padrao
        for chave, valor in contexto.items():
            assunto = assunto.replace(f'{{{chave}}}', str(valor))
        return assunto
    
    def renderizar_corpo(self, contexto: dict) -> str:
        """Renderiza o corpo com os placeholders substituídos."""
        corpo = self.corpo_padrao
        for chave, valor in contexto.items():
            corpo = corpo.replace(f'{{{chave}}}', str(valor))
        return corpo


class LogEnvioEmail(TimeStampedModel):
    """
    Log de todos os emails enviados pelo sistema.
    Registra sucesso/erro e permite auditoria.
    """
    
    class StatusEnvio(models.TextChoices):
        SUCESSO = 'sucesso', 'Sucesso'
        ERRO = 'erro', 'Erro'
        PENDENTE = 'pendente', 'Pendente'
    
    tipo = models.CharField(
        'Tipo',
        max_length=100,
        help_text='Área/módulo relacionado. Ex: Cadastro Protocolo, Triagem'
    )
    descricao = models.CharField(
        'Descrição',
        max_length=200,
        help_text='Descrição do motivo do email. Ex: medico_duplicado, medico_nao_encontrado'
    )
    destinatario = models.TextField(
        'Destinatário(s)',
        help_text='Email(s) de destino'
    )
    assunto = models.CharField(
        'Assunto',
        max_length=300
    )
    corpo = models.TextField(
        'Corpo',
        help_text='Conteúdo completo do email enviado'
    )
    status = models.CharField(
        'Status',
        max_length=20,
        choices=StatusEnvio.choices,
        default=StatusEnvio.PENDENTE
    )
    erro_mensagem = models.TextField(
        'Mensagem de Erro',
        blank=True,
        default='',
        help_text='Detalhes do erro caso o envio tenha falhado'
    )
    enviado_em = models.DateTimeField(
        'Enviado em',
        null=True,
        blank=True,
        help_text='Data/hora do envio efetivo'
    )
    enviado_por = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='emails_enviados',
        verbose_name='Enviado por'
    )
    
    class Meta:
        db_table = 'core_log_envio_email'
        verbose_name = 'Log de Envio de Email'
        verbose_name_plural = 'Logs de Envio de Email'
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.tipo} - {self.descricao} ({self.status})"
