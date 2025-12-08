"""
Comando para criar requisição de teste em trânsito.

Uso:
    python manage.py criar_requisicao_teste
    python manage.py criar_requisicao_teste --limpar  # Remove antes de criar
"""
from django.core.management.base import BaseCommand
from django.db import transaction
from django.utils import timezone
from datetime import datetime

from operacao.models import (
    DadosRequisicao,
    RequisicaoAmostra,
    RequisicaoStatusHistorico,
    StatusRequisicao,
    PortadorRepresentante,
    Unidade,
    Origem,
)


class Command(BaseCommand):
    help = 'Cria requisição de teste em trânsito para validação do fluxo'

    def add_arguments(self, parser):
        parser.add_argument(
            '--limpar',
            action='store_true',
            help='Remove requisição de teste antes de criar nova',
        )

    def handle(self, *args, **options):
        COD_BARRAS_TESTE = '999'
        
        # Limpar se solicitado
        if options['limpar']:
            self.stdout.write('🗑️  Removendo requisições de teste...')
            count_req = DadosRequisicao.objects.filter(cod_barras_req=COD_BARRAS_TESTE).count()
            DadosRequisicao.objects.filter(cod_barras_req=COD_BARRAS_TESTE).delete()
            self.stdout.write(self.style.SUCCESS(f'✅ {count_req} requisição(ões) removida(s)'))
        
        # Verificar se já existe
        if DadosRequisicao.objects.filter(cod_barras_req=COD_BARRAS_TESTE).exists():
            self.stdout.write(
                self.style.WARNING(
                    f'⚠️  Requisição com código {COD_BARRAS_TESTE} já existe!\n'
                    f'   Use --limpar para remover antes de criar nova.'
                )
            )
            return
        
        try:
            self._criar_requisicao_teste()
        except Exception as e:
            self.stdout.write(self.style.ERROR(f'❌ Erro ao criar requisição: {str(e)}'))
            raise

    @transaction.atomic
    def _criar_requisicao_teste(self):
        """Cria requisição de teste com todos os dados relacionados."""
        
        self.stdout.write('📦 Criando requisição de teste...\n')
        
        # 1. Buscar Maria (representante)
        try:
            maria = PortadorRepresentante.objects.get(nome__icontains='maria')
            self.stdout.write(f'✅ Representante: {maria.nome}')
        except PortadorRepresentante.DoesNotExist:
            self.stdout.write(self.style.ERROR('❌ Representante Maria não encontrada!'))
            return
        except PortadorRepresentante.MultipleObjectsReturned:
            maria = PortadorRepresentante.objects.filter(nome__icontains='maria').first()
            self.stdout.write(f'⚠️  Múltiplas Marias encontradas, usando: {maria.nome}')
        
        # 2. Buscar unidade e origem da Maria
        unidade = maria.unidade
        origem = maria.origem
        self.stdout.write(f'✅ Unidade: {unidade.nome}')
        self.stdout.write(f'✅ Origem: {origem.descricao if origem else "Sem origem"}')
        
        # 3. Buscar status "Em Trânsito" (código 10)
        try:
            status_transito = StatusRequisicao.objects.get(codigo='10')
            self.stdout.write(f'✅ Status: {status_transito.descricao}')
        except StatusRequisicao.DoesNotExist:
            self.stdout.write(self.style.ERROR('❌ Status "Em Trânsito" (código 10) não encontrado!'))
            return
        
        # 4. Definir datas
        data_cadastro = timezone.make_aware(datetime(2024, 12, 1, 10, 0, 0))
        data_envio = timezone.make_aware(datetime(2024, 12, 3, 14, 30, 0))
        
        # 5. Criar requisição
        requisicao = DadosRequisicao.objects.create(
            cod_req='REQ-TESTE-999',
            cod_barras_req='999',
            unidade=unidade,
            portador_representante=maria,
            origem=origem,
            status=status_transito,
            data_cadastro_representante=data_cadastro.date(),
            data_envio_representante=data_envio.date(),
            recebido_por=None,  # Vazio - ainda não foi recebido
        )
        self.stdout.write(f'✅ Requisição criada: {requisicao.cod_req}')
        
        # 6. Criar amostras (mesmo código de barras para todas)
        amostras_dados = [
            {'cod_barras': '999', 'ordem': 1},
            {'cod_barras': '999', 'ordem': 2},
        ]
        
        for amostra_data in amostras_dados:
            amostra = RequisicaoAmostra.objects.create(
                requisicao=requisicao,
                cod_barras_amostra=amostra_data['cod_barras'],
                data_hora_bipagem=data_cadastro,
                ordem=amostra_data['ordem'],
            )
            self.stdout.write(f'✅ Amostra criada: {amostra.cod_barras_amostra}')
        
        # 7. Criar histórico de status
        historico = RequisicaoStatusHistorico.objects.create(
            requisicao=requisicao,
            cod_req=requisicao.cod_req,
            status=status_transito,
            observacao='Requisição enviada pela representante (TESTE)',
        )
        # Atualizar data manualmente (auto_now_add define automaticamente)
        RequisicaoStatusHistorico.objects.filter(id=historico.id).update(data_registro=data_envio)
        self.stdout.write(f'✅ Histórico criado: {historico.status.descricao}')
        
        # 8. Resumo final
        self.stdout.write('\n' + '='*60)
        self.stdout.write(self.style.SUCCESS('✅ REQUISIÇÃO DE TESTE CRIADA COM SUCESSO!'))
        self.stdout.write('='*60)
        self.stdout.write(f'\n📋 DADOS PARA TESTE:')
        self.stdout.write(f'   Código de barras: {requisicao.cod_barras_req}')
        self.stdout.write(f'   Código requisição: {requisicao.cod_req}')
        self.stdout.write(f'   Representante: {maria.nome}')
        self.stdout.write(f'   Unidade: {unidade.nome}')
        self.stdout.write(f'   Origem: {origem.descricao if origem else "-"}')
        self.stdout.write(f'   Status: {status_transito.descricao}')
        self.stdout.write(f'   Qtd amostras: 2')
        self.stdout.write(f'   Amostras: 999, 999 (mesmo código)')
        self.stdout.write(f'   Data cadastro: {data_cadastro.strftime("%d/%m/%Y %H:%M")}')
        self.stdout.write(f'   Data envio: {data_envio.strftime("%d/%m/%Y %H:%M")}')
        self.stdout.write(f'\n🧪 COMO TESTAR:')
        self.stdout.write(f'   1. Acesse a página de recebimento')
        self.stdout.write(f'   2. Bipe o código: 999')
        self.stdout.write(f'   3. Modal deve mostrar "📦 REQUISIÇÃO EM TRÂNSITO"')
        self.stdout.write(f'   4. Bipe as amostras: 999 e 999 (mesmo código)')
        self.stdout.write(f'   5. Clique em Validar')
        self.stdout.write(f'   6. Requisição deve ser recebida com sucesso!')
        self.stdout.write(f'\n🔄 PARA TESTAR NOVAMENTE:')
        self.stdout.write(f'   python manage.py criar_requisicao_teste --limpar')
        self.stdout.write('='*60 + '\n')
