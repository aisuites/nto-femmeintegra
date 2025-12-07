import logging
import secrets
import string
from typing import Dict, List, Optional

from django.core.exceptions import ValidationError
from django.db import transaction

from .models import (
    DadosRequisicao,
    LogRecebimento,
    StatusRequisicao,
    RequisicaoStatusHistorico,
    Amostra,
    Unidade,
    PortadorRepresentante,
    Origem,
)

logger = logging.getLogger(__name__)


class RequisicaoService:
    """
    Serviço para gerenciar requisições.
    
    Centraliza toda a lógica de negócio relacionada a criação,
    validação e processamento de requisições.
    """
    
    @staticmethod
    def gerar_codigo_requisicao(tamanho: int = 10, max_tentativas: int = 10) -> str:
        """
        Gera código único alfanumérico para requisição.
        """
        chars = string.ascii_uppercase + string.digits
        
        for tentativa in range(max_tentativas):
            codigo = ''.join(secrets.choice(chars) for _ in range(tamanho))
            
            # Verificar se código já existe
            if not DadosRequisicao.objects.filter(cod_req=codigo).exists():
                logger.debug(
                    'Código gerado com sucesso: %s (tentativa %d/%d)',
                    codigo, tentativa + 1, max_tentativas
                )
                return codigo
        
        logger.error(
            'Falha ao gerar código único após %d tentativas',
            max_tentativas
        )
        raise ValueError(
            f'Não foi possível gerar código único após {max_tentativas} tentativas'
        )
    
    @staticmethod
    def validar_codigos_iguais(
        cod_barras_req: str,
        cod_barras_amostras: List[str]
    ) -> bool:
        if not cod_barras_amostras:
            return False
        
        todos_codigos = [cod_barras_req] + cod_barras_amostras
        codigos_unicos = set(todos_codigos)
        
        resultado = len(codigos_unicos) == 1
        
        if not resultado:
            logger.warning(
                'Códigos de barras diferentes detectados. '
                'Requisição: %s, Amostras: %s',
                cod_barras_req,
                cod_barras_amostras
            )
        
        return resultado
    
    @staticmethod
    def validar_codigo_barras_duplicado(cod_barras_req: str) -> bool:
        existe = LogRecebimento.objects.filter(
            cod_barras_req=cod_barras_req
        ).exists()
        
        if existe:
            logger.warning(
                'Código de barras duplicado detectado: %s',
                cod_barras_req
            )
        
        return existe
    
    @staticmethod
    def validar_foreign_keys(
        unidade_id: int,
        portador_id: int,
        origem_id: Optional[int] = None
    ) -> Dict[str, any]:
        try:
            unidade = Unidade.objects.get(id=unidade_id)
        except Unidade.DoesNotExist:
            logger.error('Unidade não encontrada: ID=%s', unidade_id)
            raise ValidationError(f'Unidade com ID {unidade_id} não encontrada')
        
        try:
            portador = PortadorRepresentante.objects.get(id=portador_id)
        except PortadorRepresentante.DoesNotExist:
            logger.error('Portador não encontrado: ID=%s', portador_id)
            raise ValidationError(
                f'Portador/Representante com ID {portador_id} não encontrado'
            )
        
        origem = None
        if origem_id:
            try:
                origem = Origem.objects.get(id=origem_id)
            except Origem.DoesNotExist:
                logger.error('Origem não encontrada: ID=%s', origem_id)
                raise ValidationError(f'Origem com ID {origem_id} não encontrada')
        
        try:
            status_inicial = StatusRequisicao.objects.get(codigo='1') # 1 = ABERTO NTO
        except StatusRequisicao.DoesNotExist:
            logger.critical('Status 1 (ABERTO_NTO) não encontrado no banco de dados!')
            raise ValidationError(
                'Configuração inválida: Status inicial (1) não encontrado. '
                'Contate o administrador.'
            )
        
        return {
            'unidade': unidade,
            'portador': portador,
            'origem': origem,
            'status_inicial': status_inicial,
        }
    
    @classmethod
    @transaction.atomic
    def criar_requisicao(
        cls,
        cod_barras_req: str,
        cod_barras_amostras: List[str],
        unidade_id: int,
        portador_id: int,
        origem_id: Optional[int],
        user,
    ) -> Dict[str, any]:
        if not cls.validar_codigos_iguais(cod_barras_req, cod_barras_amostras):
            return {
                'status': 'error',
                'message': 'Todos os códigos de barras devem ser iguais.',
            }
        
        if cls.validar_codigo_barras_duplicado(cod_barras_req):
            return {
                'status': 'error',
                'message': 'Já existe um registro com este código de barras.',
            }
        
        try:
            fks = cls.validar_foreign_keys(unidade_id, portador_id, origem_id)
        except ValidationError as e:
            return {
                'status': 'error',
                'message': str(e),
            }
        
        try:
            cod_req = cls.gerar_codigo_requisicao()
        except ValueError as e:
            logger.exception('Erro ao gerar código de requisição')
            return {
                'status': 'error',
                'message': 'Erro ao gerar código. Tente novamente.',
            }
        
        try:
            from django.utils import timezone
            
            # 1. Criar LogRecebimento (Log/JSON)
            dados_req = LogRecebimento.objects.create(
                cod_barras_req=cod_barras_req,
                dados={
                    'cod_barras_amostras': cod_barras_amostras,
                    'quantidade': len(cod_barras_amostras),
                },
            )
            
            # 2. Criar DadosRequisicao (Tabela Principal)
            requisicao = DadosRequisicao.objects.create(
                cod_req=cod_req,
                cod_barras_req=cod_barras_req,
                unidade=fks['unidade'],
                status=fks['status_inicial'],
                portador=fks['portador'],
                origem=fks['origem'],
                recebido_por=user,
                created_by=user,
                updated_by=user,
            )
            
            # 3. Criar Amostras
            data_atual = timezone.now()
            for idx, cod_amostra in enumerate(cod_barras_amostras, start=1):
                Amostra.objects.create(
                    requisicao=requisicao,
                    cod_barras_amostra=cod_amostra,
                    data_hora_bipagem=data_atual,
                    ordem=idx,
                    created_by=user,
                    updated_by=user
                )
            
            # 4. Histórico
            RequisicaoStatusHistorico.objects.create(
                requisicao=requisicao,
                cod_req=cod_req,
                status=fks['status_inicial'],
                usuario=user,
                observacao='Status inicial ao criar requisição',
            )
            
            logger.info(
                'Requisição criada com sucesso. '
                'Código: %s, Usuário: %s, Unidade: %s, Amostras: %d',
                cod_req,
                user.username,
                fks['unidade'].nome,
                len(cod_barras_amostras)
            )
            
            return {
                'status': 'success',
                'message': 'Requisição criada com sucesso.',
                'cod_req': cod_req,
                'requisicao_id': requisicao.id,
            }
            
        except Exception as e:
            logger.exception('Erro ao criar requisição')
            return {
                'status': 'error',
                'message': 'Erro ao salvar requisição. Tente novamente.',
            }


    @classmethod
    @transaction.atomic
    def atualizar_requisicao_transito(
        cls,
        requisicao_id: int,
        cod_barras_amostras: List[str],
        user,
    ) -> Dict[str, any]:
        """
        Atualiza requisição em trânsito (status 10) para recebida (status 1).
        
        Valida amostras bipadas contra as cadastradas e atualiza status.
        """
        try:
            # Buscar requisição
            requisicao = DadosRequisicao.objects.select_related('status').get(id=requisicao_id)
            
            # Validar status
            if requisicao.status.codigo != '10':
                return {
                    'status': 'error',
                    'message': f'Requisição não está em trânsito. Status atual: {requisicao.status.descricao}',
                }
            
            # Validar recebido_por (deve estar vazio)
            if requisicao.recebido_por:
                return {
                    'status': 'error',
                    'message': 'Requisição já foi recebida anteriormente.',
                }
            
            # Buscar amostras cadastradas
            amostras_cadastradas = set(
                requisicao.amostras.values_list('cod_barras_amostra', flat=True)
            )
            amostras_bipadas = set(cod_barras_amostras)
            
            # Validar quantidade
            if len(amostras_bipadas) != len(amostras_cadastradas):
                return {
                    'status': 'error',
                    'message': f'Quantidade de amostras divergente. Cadastradas: {len(amostras_cadastradas)}, Bipadas: {len(amostras_bipadas)}',
                }
            
            # Validar códigos (todas as bipadas devem existir nas cadastradas)
            amostras_faltando = amostras_cadastradas - amostras_bipadas
            amostras_extras = amostras_bipadas - amostras_cadastradas
            
            if amostras_faltando or amostras_extras:
                mensagem_erro = 'Divergência nas amostras bipadas.'
                if amostras_faltando:
                    mensagem_erro += f' Faltam: {", ".join(amostras_faltando)}.'
                if amostras_extras:
                    mensagem_erro += f' Extras: {", ".join(amostras_extras)}.'
                
                return {
                    'status': 'error',
                    'message': mensagem_erro,
                }
            
            # Buscar status "Aberto NTO" (código 1)
            try:
                status_aberto = StatusRequisicao.objects.get(codigo='1')
            except StatusRequisicao.DoesNotExist:
                logger.error('Status 1 (ABERTO NTO) não encontrado')
                return {
                    'status': 'error',
                    'message': 'Erro de configuração de status. Contate o suporte.',
                }
            
            # Atualizar requisição
            requisicao.status = status_aberto
            requisicao.recebido_por = user
            requisicao.updated_by = user
            requisicao.save()
            
            # Criar registro no histórico
            RequisicaoStatusHistorico.objects.create(
                requisicao=requisicao,
                status=status_aberto,
                observacao='Requisição recebida no NTO (atualizada de Em Trânsito)',
                created_by=user,
            )
            
            logger.info(
                'Requisição em trânsito atualizada: %s (ID: %d) por usuário %s',
                requisicao.cod_req, requisicao.id, user.username
            )
            
            return {
                'status': 'success',
                'message': 'Requisição recebida com sucesso.',
                'cod_req': requisicao.cod_req,
                'requisicao_id': requisicao.id,
            }
            
        except DadosRequisicao.DoesNotExist:
            logger.error('Requisição não encontrada: ID %d', requisicao_id)
            return {
                'status': 'error',
                'message': 'Requisição não encontrada.',
            }
        except Exception as e:
            logger.exception('Erro ao atualizar requisição em trânsito')
            return {
                'status': 'error',
                'message': 'Erro ao processar requisição. Tente novamente.',
            }

    @classmethod
    @transaction.atomic
    def finalizar_kit_recebimento(cls, user) -> Dict[str, any]:
        from django.utils import timezone
        
        try:
            status_aberto = StatusRequisicao.objects.get(codigo='1')
            status_recebido = StatusRequisicao.objects.get(codigo='2') 
        except StatusRequisicao.DoesNotExist:
            logger.error('Status 1 (ABERTO) ou 2 (RECEBIDO) não encontrados')
            return {
                'status': 'error',
                'message': 'Erro de configuração de status. Contate o suporte.',
            }
            
        requisicoes = DadosRequisicao.objects.filter(
            recebido_por=user,
            status=status_aberto
        )
        
        count = requisicoes.count()
        if count == 0:
            return {
                'status': 'success',
                'message': 'Nenhuma requisição pendente para finalizar.',
                'count': 0
            }
            
        agora = timezone.now()
        
        sucesso_count = 0
        
        for req in requisicoes:
            try:
                req.status = status_recebido
                req.data_recebimento_nto = agora
                req.updated_by = user
                req.save()
                
                RequisicaoStatusHistorico.objects.create(
                    requisicao=req,
                    cod_req=req.cod_req,
                    status=status_recebido,
                    usuario=user,
                    observacao='Recebimento finalizado em lote (kit)'
                )
                
                sucesso_count += 1
            except Exception as e:
                logger.exception('Erro ao finalizar requisição %s', req.cod_req)
                continue
                
        return {
            'status': 'success',
            'message': f'Recebimento finalizado com sucesso! {sucesso_count} requisições processadas.',
            'count': sucesso_count
        }


class BuscaService:
    @staticmethod
    def buscar_codigo_barras(cod_barras: str) -> Dict[str, any]:
        """
        Busca código de barras e retorna status apropriado.
        
        Retornos possíveis:
        - not_found: Código não existe (criar nova requisição)
        - found: Código já foi recebido (duplicado)
        - in_transit: Código existe com status 10 (atualizar requisição)
        """
        # Verificar se já foi recebido (existe no log)
        existe_log = LogRecebimento.objects.filter(
            cod_barras_req=cod_barras
        ).exists()
        
        if existe_log:
            logger.info('Código de barras já recebido anteriormente: %s', cod_barras)
            return {'status': 'found'}
        
        # Verificar se está em trânsito (status 10)
        try:
            requisicao = DadosRequisicao.objects.select_related(
                'unidade', 'origem', 'status'
            ).get(
                cod_barras_req=cod_barras,
                status__codigo='10'  # EM TRÂNSITO
            )
            
            # Buscar amostras da requisição
            amostras = list(requisicao.amostras.values_list('cod_barras_amostra', flat=True))
            
            logger.info(
                'Requisição em trânsito encontrada: %s (ID: %d, %d amostras)',
                cod_barras, requisicao.id, len(amostras)
            )
            
            return {
                'status': 'in_transit',
                'requisicao_id': requisicao.id,
                'cod_req': requisicao.cod_req,
                'unidade_nome': requisicao.unidade.nome,
                'origem_descricao': requisicao.origem.descricao if requisicao.origem else None,
                'qtd_amostras': len(amostras),
                'cod_barras_amostras': amostras,
            }
        except DadosRequisicao.DoesNotExist:
            logger.debug('Código de barras não encontrado: %s', cod_barras)
            return {'status': 'not_found'}
