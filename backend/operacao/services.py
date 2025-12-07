"""
Serviços de lógica de negócio para o app operacao.

Este módulo contém toda a lógica de negócio relacionada a requisições,
separando-a das views para melhor organização e testabilidade.
"""
import logging
import secrets
import string
from typing import Dict, List, Optional

from django.db import transaction
from django.core.exceptions import ValidationError

from .models import (
    Requisicao,
    DadosRequisicao,
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
        
        Args:
            tamanho: Número de caracteres do código (padrão: 10)
            max_tentativas: Número máximo de tentativas para gerar código único
            
        Returns:
            str: Código gerado (ex: 'A3B9C2D1E4')
            
        Raises:
            ValueError: Se não conseguir gerar código único após max_tentativas
            
        Examples:
            >>> codigo = RequisicaoService.gerar_codigo_requisicao()
            >>> len(codigo)
            10
            >>> codigo.isalnum()
            True
        """
        chars = string.ascii_uppercase + string.digits
        
        for tentativa in range(max_tentativas):
            codigo = ''.join(secrets.choice(chars) for _ in range(tamanho))
            
            # Verificar se código já existe
            if not Requisicao.objects.filter(cod_req=codigo).exists():
                logger.debug(
                    'Código gerado com sucesso: %s (tentativa %d/%d)',
                    codigo, tentativa + 1, max_tentativas
                )
                return codigo
        
        # Se chegou aqui, não conseguiu gerar código único
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
        """
        Valida se todos os códigos de barras são iguais.
        
        Args:
            cod_barras_req: Código de barras da requisição
            cod_barras_amostras: Lista de códigos das amostras
            
        Returns:
            bool: True se todos os códigos são iguais, False caso contrário
            
        Examples:
            >>> RequisicaoService.validar_codigos_iguais('ABC123', ['ABC123', 'ABC123'])
            True
            >>> RequisicaoService.validar_codigos_iguais('ABC123', ['ABC123', 'XYZ789'])
            False
        """
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
        """
        Verifica se código de barras já existe no sistema.
        
        Args:
            cod_barras_req: Código de barras a verificar
            
        Returns:
            bool: True se código já existe, False caso contrário
        """
        existe = DadosRequisicao.objects.filter(
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
        """
        Valida e retorna objetos de foreign keys.
        
        Args:
            unidade_id: ID da unidade
            portador_id: ID do portador/representante
            origem_id: ID da origem (opcional)
            
        Returns:
            dict: Dicionário com objetos validados
            
        Raises:
            ValidationError: Se alguma FK não existir
        """
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
        """
        Cria uma nova requisição com todas as validações necessárias.
        
        Este método é a interface principal para criação de requisições.
        Realiza todas as validações, gera código único e cria os registros
        necessários de forma atômica.
        
        Args:
            cod_barras_req: Código de barras da requisição
            cod_barras_amostras: Lista de códigos das amostras
            unidade_id: ID da unidade de origem
            portador_id: ID do portador/representante
            origem_id: ID da origem (opcional)
            user: Usuário que está criando a requisição
            
        Returns:
            dict: Resultado da operação com estrutura:
                {
                    'status': 'success' | 'error',
                    'message': str,
                    'cod_req': str (apenas se success),
                    'requisicao_id': int (apenas se success)
                }
                
        Raises:
            ValidationError: Se validação de FKs falhar
            ValueError: Se não conseguir gerar código único
            
        Examples:
            >>> resultado = RequisicaoService.criar_requisicao(
            ...     cod_barras_req='ABC123',
            ...     cod_barras_amostras=['ABC123', 'ABC123'],
            ...     unidade_id=1,
            ...     portador_id=2,
            ...     origem_id=3,
            ...     user=request.user
            ... )
            >>> resultado['status']
            'success'
        """
        # Validação 1: Códigos iguais
        if not cls.validar_codigos_iguais(cod_barras_req, cod_barras_amostras):
            return {
                'status': 'error',
                'message': 'Todos os códigos de barras devem ser iguais.',
            }
        
        # Validação 2: Código duplicado
        if cls.validar_codigo_barras_duplicado(cod_barras_req):
            return {
                'status': 'error',
                'message': 'Já existe um registro com este código de barras.',
            }
        
        # Validação 3: Foreign Keys
        try:
            fks = cls.validar_foreign_keys(unidade_id, portador_id, origem_id)
        except ValidationError as e:
            return {
                'status': 'error',
                'message': str(e),
            }
        
        # Gerar código único
        try:
            cod_req = cls.gerar_codigo_requisicao()
        except ValueError as e:
            logger.exception('Erro ao gerar código de requisição')
            return {
                'status': 'error',
                'message': 'Erro ao gerar código. Tente novamente.',
            }
        
        # Criar registros (transação atômica)
        try:
            from django.utils import timezone # Import local para garantir data correta
            
            # 1. Criar DadosRequisicao (Log/JSON)
            dados_req = DadosRequisicao.objects.create(
                cod_barras_req=cod_barras_req,
                dados={
                    'cod_barras_amostras': cod_barras_amostras,
                    'quantidade': len(cod_barras_amostras),
                },
            )
            
            # 2. Criar Requisicao (Tabela Principal)
            requisicao = Requisicao.objects.create(
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
            
            # 3. Criar Amostras (Tabela Relacional)
            # Essencial para rastreabilidade e relatórios
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
            
            # 4. Criar registro no histórico de status
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
    def finalizar_kit_recebimento(cls, user) -> Dict[str, any]:
        """
        Finaliza o recebimento das requisições do usuário atual.
        
        Atualiza o status das requisições recém-criadas (ABERTO_NTO) para RECEBIDO (ID 2),
        define a data de recebimento e gera histórico.
        
        Args:
            user: Usuário que está finalizando o kit
            
        Returns:
            dict: Resultado da operação
        """
        from django.utils import timezone
        
        try:
            # Busca status inicial e final
            # 1 = ABERTO NTO (Inicial)
            # 2 = RECEBIDO (Finalização do kit)
            status_aberto = StatusRequisicao.objects.get(codigo='1')
            status_recebido = StatusRequisicao.objects.get(codigo='2') 
        except StatusRequisicao.DoesNotExist:
            logger.error('Status 1 (ABERTO) ou 2 (RECEBIDO) não encontrados')
            return {
                'status': 'error',
                'message': 'Erro de configuração de status. Contate o suporte.',
            }
            
        # Buscar requisições pendentes deste usuário (status 1)
        # Filtramos por recebido_por=user para garantir que só finalize as deste usuário
        requisicoes = Requisicao.objects.filter(
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
            
        agora = timezone.now() # Django trata conversão para DateField se necessário
        
        sucesso_count = 0
        
        for req in requisicoes:
            try:
                # Atualizar status e data
                req.status = status_recebido
                req.data_recebimento_nto = agora
                req.updated_by = user
                req.save()
                
                # Criar histórico
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
                # Não interrompe o loop, tenta finalizar as outras
                continue
                
        return {
            'status': 'success',
            'message': f'Recebimento finalizado com sucesso! {sucesso_count} requisições processadas.',
            'count': sucesso_count
        }


class BuscaService:
    """
    Serviço para buscas e consultas de requisições.
    """
    
    @staticmethod
    def buscar_codigo_barras(cod_barras: str) -> Dict[str, any]:
        """
        Busca código de barras no sistema.
        
        Args:
            cod_barras: Código de barras a buscar
            
        Returns:
            dict: Resultado da busca com status 'found' ou 'not_found'
        """
        existe = DadosRequisicao.objects.filter(
            cod_barras_req=cod_barras
        ).exists()
        
        if existe:
            logger.info('Código de barras encontrado: %s', cod_barras)
            return {'status': 'found'}
        else:
            logger.debug('Código de barras não encontrado: %s', cod_barras)
            return {'status': 'not_found'}
