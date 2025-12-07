"""
Signals para o app operacao.

Gerencia ações automáticas em resposta a eventos do Django,
como deleção em cascata de registros relacionados.
"""
import logging

from django.db.models.signals import post_delete
from django.dispatch import receiver

from .models import DadosRequisicao, LogRecebimento

logger = logging.getLogger(__name__)


@receiver(post_delete, sender=DadosRequisicao)
def deletar_log_recebimento(sender, instance, **kwargs):
    """
    Deleta LogRecebimento quando um DadosRequisicao é deletado.
    
    Como não há FK direta entre eles (apenas o campo cod_barras_req em comum),
    precisamos deletar manualmente via signal.
    
    Args:
        sender: Model class (DadosRequisicao)
        instance: Instância sendo deletada
        **kwargs: Argumentos adicionais do signal
    """
    try:
        # Buscar e deletar LogRecebimento relacionado
        logs = LogRecebimento.objects.filter(
            cod_barras_req=instance.cod_barras_req
        )
        
        if logs.exists():
            count = logs.count()
            logs.delete()
            logger.info(
                'LogRecebimento deletado automaticamente. '
                'DadosRequisicao: %s, Código de barras: %s, Registros deletados: %d',
                instance.cod_req,
                instance.cod_barras_req,
                count
            )
        else:
            logger.warning(
                'Nenhum LogRecebimento encontrado para deletar. '
                'DadosRequisicao: %s, Código de barras: %s',
                instance.cod_req,
                instance.cod_barras_req
            )
            
    except Exception as e:
        logger.exception(
            'Erro ao deletar LogRecebimento automaticamente. '
            'DadosRequisicao: %s, Erro: %s',
            instance.cod_req,
            str(e)
        )
