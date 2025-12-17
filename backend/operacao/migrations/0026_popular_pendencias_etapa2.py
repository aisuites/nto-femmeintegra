"""
Migration para popular a tabela TipoPendenciaEtapa com os tipos de pendência da Etapa 2.

Códigos configurados para Etapa 2:
- 2: CPF EM BRANCO
- 5: ASSINATURA DO PACIENTE EM BRANCO
- 4: ASSINATURA MÉDICO EM BRANCO
- 8: CARIMBO MÉDICO EM BRANCO
- 3: DADOS CONVÊNIO INCOMPLETOS
- 13: NOME PACIENTE EM BRANCO/RASURADO
- 14: EXAMES EM BRANCO
- 15: REQUISIÇÃO EM BRANCO
"""
from django.db import migrations


def popular_pendencias_etapa2(apps, schema_editor):
    """Popula a tabela tipo_pendencia_etapa com os tipos da Etapa 2."""
    TipoPendencia = apps.get_model('operacao', 'TipoPendencia')
    TipoPendenciaEtapa = apps.get_model('operacao', 'TipoPendenciaEtapa')
    
    # Códigos das pendências para Etapa 2, na ordem desejada
    codigos_etapa2 = [
        (2, 1),   # CPF EM BRANCO - ordem 1
        (5, 2),   # ASSINATURA DO PACIENTE EM BRANCO - ordem 2
        (4, 3),   # ASSINATURA MÉDICO EM BRANCO - ordem 3
        (8, 4),   # CARIMBO MÉDICO EM BRANCO - ordem 4
        (3, 5),   # DADOS CONVÊNIO INCOMPLETOS - ordem 5
        (13, 6),  # NOME PACIENTE EM BRANCO/RASURADO - ordem 6
        (14, 7),  # EXAMES EM BRANCO - ordem 7
        (15, 8),  # REQUISIÇÃO EM BRANCO - ordem 8
    ]
    
    for codigo_pendencia, ordem in codigos_etapa2:
        try:
            tipo = TipoPendencia.objects.get(codigo=codigo_pendencia)
            TipoPendenciaEtapa.objects.get_or_create(
                tipo_pendencia=tipo,
                etapa=2,
                defaults={'ordem': ordem, 'ativo': True}
            )
        except TipoPendencia.DoesNotExist:
            print(f"AVISO: TipoPendencia com código {codigo_pendencia} não encontrado.")


def reverter_pendencias_etapa2(apps, schema_editor):
    """Remove os registros da Etapa 2."""
    TipoPendenciaEtapa = apps.get_model('operacao', 'TipoPendenciaEtapa')
    TipoPendenciaEtapa.objects.filter(etapa=2).delete()


class Migration(migrations.Migration):

    dependencies = [
        ('operacao', '0025_criar_tipo_pendencia_etapa'),
    ]

    operations = [
        migrations.RunPython(
            popular_pendencias_etapa2,
            reverter_pendencias_etapa2
        ),
    ]
