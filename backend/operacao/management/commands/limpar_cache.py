"""
Comando para limpar o cache do sistema.

Uso:
    python manage.py limpar_cache
    python manage.py limpar_cache --all
    python manage.py limpar_cache --key recebimento:unidades
"""
from django.core.cache import cache
from django.core.management.base import BaseCommand


class Command(BaseCommand):
    help = 'Limpa o cache do sistema (unidades, portadores, etc.)'

    def add_arguments(self, parser):
        parser.add_argument(
            '--all',
            action='store_true',
            help='Limpa TODO o cache do sistema',
        )
        parser.add_argument(
            '--key',
            type=str,
            help='Limpa uma chave específica do cache',
        )

    def handle(self, *args, **options):
        if options['all']:
            # Limpar TODO o cache
            cache.clear()
            self.stdout.write(
                self.style.SUCCESS('✅ Todo o cache foi limpo com sucesso!')
            )
            return

        if options['key']:
            # Limpar chave específica
            key = options['key']
            cache.delete(key)
            self.stdout.write(
                self.style.SUCCESS(f'✅ Cache da chave "{key}" foi limpo com sucesso!')
            )
            return

        # Limpar caches específicos do recebimento (padrão)
        keys_to_clear = [
            'recebimento:unidades',
            'recebimento:portadores',
        ]
        
        cleared = []
        for key in keys_to_clear:
            if cache.delete(key):
                cleared.append(key)
        
        if cleared:
            self.stdout.write(
                self.style.SUCCESS(
                    f'✅ Cache limpo com sucesso!\n'
                    f'   Chaves removidas: {", ".join(cleared)}'
                )
            )
        else:
            self.stdout.write(
                self.style.WARNING('⚠️  Nenhuma chave de cache encontrada para limpar.')
            )
        
        self.stdout.write(
            self.style.SUCCESS(
                '\n💡 Dica: Use --all para limpar todo o cache ou --key <nome> para uma chave específica'
            )
        )
