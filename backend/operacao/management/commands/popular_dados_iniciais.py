"""
Comando para popular dados iniciais no banco de dados.

Uso:
    python manage.py popular_dados_iniciais
    python manage.py popular_dados_iniciais --limpar
"""
from django.core.management.base import BaseCommand
from django.db import transaction

from operacao.models import StatusRequisicao, Origem, TipoArquivo


class Command(BaseCommand):
    help = 'Popula dados iniciais no banco de dados (Status, Origens e Tipos de Arquivo)'

    def add_arguments(self, parser):
        parser.add_argument(
            '--limpar',
            action='store_true',
            help='Limpa os dados existentes antes de popular',
        )

    @transaction.atomic
    def handle(self, *args, **options):
        if options['limpar']:
            self.stdout.write(self.style.WARNING('⚠️  Limpando dados existentes...'))
            StatusRequisicao.objects.all().delete()
            Origem.objects.all().delete()
            TipoArquivo.objects.all().delete()
            self.stdout.write(self.style.SUCCESS('✅ Dados limpos!'))

        # ========================================
        # STATUS DE REQUISIÇÃO
        # ========================================
        self.stdout.write('\n📋 Criando Status de Requisição...')
        
        status_data = [
            {'codigo': '1', 'descricao': 'ABERTO NTO', 'ordem': 1, 'permite_edicao': True},
            {'codigo': '2', 'descricao': 'RECEBIDO', 'ordem': 2, 'permite_edicao': True},
            {'codigo': '3', 'descricao': 'CAIXA LIDERANÇA', 'ordem': 3, 'permite_edicao': True},
            {'codigo': '4', 'descricao': 'CAIXA BO', 'ordem': 4, 'permite_edicao': True},
            {'codigo': '5', 'descricao': 'CAIXA BARRADOS', 'ordem': 5, 'permite_edicao': True},
            {'codigo': '6', 'descricao': 'PENDÊNCIA', 'ordem': 6, 'permite_edicao': True},
            {'codigo': '7', 'descricao': 'TRIAGEM1-OK', 'ordem': 7, 'permite_edicao': False},
            {'codigo': '8', 'descricao': 'TRIAGEM2-OK', 'ordem': 8, 'permite_edicao': False},
            {'codigo': '10', 'descricao': 'EM TRÂNSITO', 'ordem': 10, 'permite_edicao': True},
        ]
        
        status_criados = 0
        status_existentes = 0
        
        for data in status_data:
            status, created = StatusRequisicao.objects.get_or_create(
                codigo=data['codigo'],
                defaults={
                    'descricao': data['descricao'],
                    'ordem': data['ordem'],
                    'permite_edicao': data['permite_edicao'],
                }
            )
            if created:
                status_criados += 1
                self.stdout.write(
                    self.style.SUCCESS(f'  ✅ Status criado: {data["codigo"]} - {data["descricao"]}')
                )
            else:
                status_existentes += 1
                self.stdout.write(
                    self.style.WARNING(f'  ⚠️  Status já existe: {data["codigo"]} - {data["descricao"]}')
                )
        
        # ========================================
        # ORIGENS (PAPABRASIL)
        # ========================================
        self.stdout.write('\n🏢 Criando Origens (Papabrasil)...')
        
        origens_data = [
            {'codigo': '1', 'descricao': 'FEMME', 'tipo': 'PAPABRASIL'},
            {'codigo': '16', 'descricao': 'PP BRASIL RIO DE JANEIRO', 'tipo': 'PAPABRASIL'},
            {'codigo': '17', 'descricao': 'PP BRASIL CURITIBA', 'tipo': 'PAPABRASIL'},
            {'codigo': '18', 'descricao': 'PP BRASIL SALVADOR', 'tipo': 'PAPABRASIL'},
            {'codigo': '19', 'descricao': 'PP BRASIL RIBEIRÃO PRETO', 'tipo': 'PAPABRASIL'},
            {'codigo': '20', 'descricao': 'PP BRASIL PORTO ALEGRE', 'tipo': 'PAPABRASIL'},
            {'codigo': '21', 'descricao': 'PP BRASIL RECIFE', 'tipo': 'PAPABRASIL'},
            {'codigo': '22', 'descricao': 'PP BRASIL BRASÍLIA', 'tipo': 'PAPABRASIL'},
            {'codigo': '23', 'descricao': 'PP BRASIL PIRACABA', 'tipo': 'PAPABRASIL'},
            {'codigo': '24', 'descricao': 'PP BRASIL AMERICANA', 'tipo': 'PAPABRASIL'},
            {'codigo': '25', 'descricao': 'PP BRASIL LIMEIRA', 'tipo': 'PAPABRASIL'},
            {'codigo': '26', 'descricao': 'PP BRASIL BELO HORIZONTE', 'tipo': 'PAPABRASIL'},
            {'codigo': '27', 'descricao': 'PP BRASIL SANTA BARBARA D\'OESTE', 'tipo': 'PAPABRASIL'},
            {'codigo': '28', 'descricao': 'PP BRASIL RIO CLARO', 'tipo': 'PAPABRASIL'},
        ]
        
        origens_criadas = 0
        origens_existentes = 0
        
        for data in origens_data:
            origem, created = Origem.objects.get_or_create(
                codigo=data['codigo'],
                defaults={
                    'descricao': data['descricao'],
                    'tipo': data['tipo'],
                    'ativo': True,
                }
            )
            if created:
                origens_criadas += 1
                self.stdout.write(
                    self.style.SUCCESS(f'  ✅ Origem criada: {data["codigo"]} - {data["descricao"]}')
                )
            else:
                origens_existentes += 1
                self.stdout.write(
                    self.style.WARNING(f'  ⚠️  Origem já existe: {data["codigo"]} - {data["descricao"]}')
                )
        
        # ========================================
        # TIPOS DE ARQUIVO
        # ========================================
        self.stdout.write('\n📎 Criando Tipos de Arquivo...')
        
        tipos_arquivo_data = [
            'Requisição',
            'Laudo',
            'Resultado',
            'Documento de Identificação',
            'Comprovante de Endereço',
            'Pedido Médico',
            'Cartão SUS',
            'Carteirinha Convênio',
            'Prontuário',
            'Termo de Consentimento',
            'Nota Fiscal',
            'Outros',
        ]
        
        tipos_criados = 0
        tipos_existentes = 0
        
        for descricao in tipos_arquivo_data:
            tipo, created = TipoArquivo.objects.get_or_create(
                descricao=descricao,
                defaults={'ativo': True}
            )
            if created:
                tipos_criados += 1
                self.stdout.write(
                    self.style.SUCCESS(f'  ✅ Tipo criado: {descricao}')
                )
            else:
                tipos_existentes += 1
                self.stdout.write(
                    self.style.WARNING(f'  ⚠️  Tipo já existe: {descricao}')
                )
        
        # ========================================
        # RESUMO
        # ========================================
        self.stdout.write('\n' + '='*60)
        self.stdout.write(self.style.SUCCESS('✅ DADOS POPULADOS COM SUCESSO!'))
        self.stdout.write('='*60)
        self.stdout.write(f'\n📊 Resumo:')
        self.stdout.write(f'  • Status criados: {status_criados}')
        self.stdout.write(f'  • Status já existentes: {status_existentes}')
        self.stdout.write(f'  • Origens criadas: {origens_criadas}')
        self.stdout.write(f'  • Origens já existentes: {origens_existentes}')
        self.stdout.write(f'  • Tipos de arquivo criados: {tipos_criados}')
        self.stdout.write(f'  • Tipos de arquivo já existentes: {tipos_existentes}')
        self.stdout.write(f'\n  Total de Status: {StatusRequisicao.objects.count()}')
        self.stdout.write(f'  Total de Origens: {Origem.objects.count()}')
        self.stdout.write(f'  Total de Tipos de Arquivo: {TipoArquivo.objects.count()}')
        self.stdout.write('\n💡 Dica: Use --limpar para remover dados existentes antes de popular')
        self.stdout.write('')
