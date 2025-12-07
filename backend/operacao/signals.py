"""
Signals para o app operacao.

Gerencia ações automáticas em resposta a eventos do Django,
como deleção em cascata de registros relacionados.
"""
import logging

from django.db.models.signals import post_delete
from django.dispatch import receiver

from .models import Requisicao, DadosRequisicao

logger = logging.getLogger(__name__)


@receiver(post_delete, sender=Requisicao)
def deletar_dados_requisicao(sender, instance, **kwargs):
    """
    Deleta DadosRequisicao quando uma Requisicao é deletada.
    
    Como não há FK direta entre Requisicao e DadosRequisicao
    (apenas o campo cod_barras_req em comum), precisamos
    deletar manualmente via signal.
    
    Args:
        sender: Model class (Requisicao)
        instance: Instância da Requisicao sendo deletada
        **kwargs: Argumentos adicionais do signal
    """
    try:
        # Buscar e deletar DadosRequisicao relacionado
        dados = DadosRequisicao.objects.filter(
            cod_barras_req=instance.cod_barras_req
        )
        
        if dados.exists():
            count = dados.count()
            dados.delete()
            logger.info(
                'DadosRequisicao deletado automaticamente. '
                'Requisicao: %s, Código de barras: %s, Registros deletados: %d',
                instance.cod_req,
                instance.cod_barras_req,
                count
            )
        else:
            logger.warning(
                'Nenhum DadosRequisicao encontrado para deletar. '
                'Requisicao: %s, Código de barras: %s',
                instance.cod_req,
                instance.cod_barras_req
            )
            
    except Exception as e:
        logger.exception(
            'Erro ao deletar DadosRequisicao automaticamente. '
            'Requisicao: %s, Erro: %s',
            instance.cod_req,
            str(e)
        )
