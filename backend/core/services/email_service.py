"""
Serviço de envio de emails.

Este módulo fornece funções para envio de emails com logging automático.
Suporta templates configuráveis via Admin e registro de todos os envios.

@version 1.0.0
@date 2024-12-18
"""

import logging
from datetime import datetime
from typing import Optional, List, Dict, Any

from django.conf import settings
from django.core.mail import EmailMessage, EmailMultiAlternatives
from django.utils import timezone

from core.models import ConfiguracaoEmail, LogEnvioEmail

logger = logging.getLogger(__name__)


class EmailService:
    """
    Serviço para envio de emails com logging automático.
    
    Uso:
        service = EmailService()
        
        # Enviar email usando template configurado
        result = service.enviar_por_tipo(
            tipo='medico_duplicado',
            contexto={'crm': '12345', 'uf': 'SP', 'medicos': '...'},
            usuario=request.user
        )
        
        # Enviar email customizado (modal editável)
        result = service.enviar_customizado(
            tipo='Cadastro Protocolo',
            descricao='medico_duplicado',
            destinatarios=['email@example.com'],
            assunto='Assunto do email',
            corpo='Corpo do email',
            usuario=request.user
        )
    """
    
    def __init__(self):
        self.from_email = settings.DEFAULT_FROM_EMAIL
    
    def enviar_por_tipo(
        self,
        tipo: str,
        contexto: Dict[str, Any],
        usuario=None,
        destinatarios_extras: Optional[List[str]] = None
    ) -> Dict[str, Any]:
        """
        Envia email usando template configurado no Admin.
        
        Args:
            tipo: Tipo do email (ex: 'medico_duplicado', 'medico_nao_encontrado')
            contexto: Dicionário com valores para substituir placeholders
            usuario: Usuário que está enviando (para log)
            destinatarios_extras: Emails adicionais além dos configurados
        
        Returns:
            Dict com 'success', 'message' e 'log_id'
        """
        try:
            # Buscar configuração
            config = ConfiguracaoEmail.objects.filter(tipo=tipo, ativo=True).first()
            
            if not config:
                logger.warning(f"Configuração de email não encontrada para tipo: {tipo}")
                return {
                    'success': False,
                    'message': f'Configuração de email não encontrada para tipo: {tipo}'
                }
            
            # Adicionar data ao contexto se não existir
            if 'data' not in contexto:
                contexto['data'] = datetime.now().strftime('%d/%m/%Y %H:%M')
            
            # Adicionar usuário ao contexto se não existir
            if 'usuario' not in contexto and usuario:
                contexto['usuario'] = usuario.get_full_name() or usuario.username
            
            # Renderizar template
            assunto = config.renderizar_assunto(contexto)
            corpo = config.renderizar_corpo(contexto)
            
            # Montar lista de destinatários
            destinatarios = config.get_emails_destino_list()
            if destinatarios_extras:
                destinatarios.extend(destinatarios_extras)
            
            # Remover duplicados
            destinatarios = list(set(destinatarios))
            
            if not destinatarios:
                return {
                    'success': False,
                    'message': 'Nenhum destinatário configurado.'
                }
            
            # Enviar
            return self.enviar_customizado(
                tipo='Cadastro Protocolo',  # Área do sistema
                descricao=tipo,  # Tipo específico
                destinatarios=destinatarios,
                assunto=assunto,
                corpo=corpo,
                usuario=usuario
            )
            
        except Exception as e:
            logger.exception(f"Erro ao enviar email por tipo {tipo}: {e}")
            return {
                'success': False,
                'message': f'Erro ao enviar email: {str(e)}'
            }
    
    def enviar_customizado(
        self,
        tipo: str,
        descricao: str,
        destinatarios: List[str],
        assunto: str,
        corpo: str,
        usuario=None,
        html: bool = True
    ) -> Dict[str, Any]:
        """
        Envia email customizado (usado pelo modal editável).
        
        Args:
            tipo: Área/módulo do sistema (ex: 'Cadastro Protocolo')
            descricao: Descrição do motivo (ex: 'medico_duplicado')
            destinatarios: Lista de emails de destino
            assunto: Assunto do email
            corpo: Corpo do email (pode ser HTML)
            usuario: Usuário que está enviando
            html: Se True, envia como HTML
        
        Returns:
            Dict com 'success', 'message' e 'log_id'
        """
        # Criar log antes de enviar
        log = LogEnvioEmail.objects.create(
            tipo=tipo,
            descricao=descricao,
            destinatario=', '.join(destinatarios),
            assunto=assunto,
            corpo=corpo,
            status=LogEnvioEmail.StatusEnvio.PENDENTE,
            enviado_por=usuario
        )
        
        try:
            # Criar mensagem
            if html:
                email = EmailMultiAlternatives(
                    subject=assunto,
                    body=corpo,  # Versão texto
                    from_email=self.from_email,
                    to=destinatarios
                )
                email.attach_alternative(corpo, "text/html")
            else:
                email = EmailMessage(
                    subject=assunto,
                    body=corpo,
                    from_email=self.from_email,
                    to=destinatarios
                )
            
            # Enviar
            email.send(fail_silently=False)
            
            # Atualizar log com sucesso
            log.status = LogEnvioEmail.StatusEnvio.SUCESSO
            log.enviado_em = timezone.now()
            log.save()
            
            logger.info(f"Email enviado com sucesso: {tipo}/{descricao} para {destinatarios}")
            
            return {
                'success': True,
                'message': 'Email enviado com sucesso.',
                'log_id': log.id
            }
            
        except Exception as e:
            # Atualizar log com erro
            log.status = LogEnvioEmail.StatusEnvio.ERRO
            log.erro_mensagem = str(e)
            log.save()
            
            logger.error(f"Erro ao enviar email: {e}")
            
            return {
                'success': False,
                'message': f'Erro ao enviar email: {str(e)}',
                'log_id': log.id
            }
    
    def obter_template(self, tipo: str) -> Optional[Dict[str, Any]]:
        """
        Obtém template de email para pré-preenchimento do modal.
        
        Args:
            tipo: Tipo do email
        
        Returns:
            Dict com 'destinatarios', 'assunto', 'corpo' ou None
        """
        try:
            config = ConfiguracaoEmail.objects.filter(tipo=tipo, ativo=True).first()
            
            if not config:
                return None
            
            return {
                'destinatarios': config.get_emails_destino_list(),
                'assunto': config.assunto_padrao,
                'corpo': config.corpo_padrao
            }
            
        except Exception as e:
            logger.error(f"Erro ao obter template de email: {e}")
            return None


def get_email_service() -> EmailService:
    """
    Retorna instância do serviço de email.
    
    Returns:
        EmailService configurado
    """
    return EmailService()
