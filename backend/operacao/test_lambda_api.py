"""
Script de teste para API Lambda de Signed URL

Testa a integração com a API Lambda da AWS para geração de URLs pré-assinadas.
"""

import os
import sys
import json
import requests
from pathlib import Path

# Adicionar o diretório backend ao path
backend_dir = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(backend_dir))

# Carregar variáveis de ambiente
from dotenv import load_dotenv
env_path = backend_dir.parent / '.env'
load_dotenv(env_path)


def test_lambda_signed_url():
    """Testa chamada à API Lambda para obter signed URL."""
    
    print("=" * 60)
    print("TESTE: API Lambda - Signed URL")
    print("=" * 60)
    
    # Obter URL da API
    aws_signed_url_api = os.getenv('AWS_SIGNED_URL_API')
    
    if not aws_signed_url_api:
        print("❌ ERRO: AWS_SIGNED_URL_API não configurada no .env")
        return False
    
    print(f"\n📍 URL da API: {aws_signed_url_api}")
    
    # Preparar payload de teste
    test_payload = {
        'process_id': 'TEST001',
        'files': [
            {
                'name': 'test-image',
                'type': 'image/jpeg',
                'filename': 'test-image.jpg'
            }
        ]
    }
    
    print(f"\n📤 Payload enviado:")
    print(json.dumps(test_payload, indent=2))
    
    # Fazer requisição
    try:
        print("\n⏳ Enviando requisição...")
        
        response = requests.post(
            aws_signed_url_api,
            json=test_payload,
            headers={
                'Content-Type': 'application/json',
                'User-Agent': 'FEMME-Integra-Test/1.0'
            },
            timeout=10
        )
        
        print(f"\n📊 Status Code: {response.status_code}")
        print(f"📊 Headers: {dict(response.headers)}")
        
        # Verificar resposta
        if response.status_code == 200:
            print("\n✅ Requisição bem-sucedida!")
            
            try:
                data = response.json()
                print(f"\n📥 Resposta JSON:")
                print(json.dumps(data, indent=2))
                
                # Validar estrutura da resposta
                # API retorna: { "filename": { "key": "...", "url": "...", "name": "..." } }
                
                if not data or len(data) == 0:
                    print("\n⚠️ AVISO: Nenhum arquivo retornado na resposta")
                    return False
                
                # Pegar primeira chave (nome do arquivo)
                file_name_key = list(data.keys())[0]
                file_data = data[file_name_key]
                
                signed_url = file_data.get('url')
                file_key = file_data.get('key')
                
                print(f"\n✅ Signed URL obtida:")
                print(f"   URL: {signed_url[:80]}..." if signed_url and len(signed_url) > 80 else f"   URL: {signed_url}")
                print(f"   Key: {file_key}")
                
                if signed_url:
                    print("\n✅ TESTE PASSOU: API Lambda funcionando corretamente!")
                    return True
                else:
                    print("\n❌ TESTE FALHOU: signed_url não encontrada na resposta")
                    return False
                    
            except json.JSONDecodeError as e:
                print(f"\n❌ ERRO: Resposta não é JSON válido")
                print(f"   Resposta raw: {response.text}")
                return False
        else:
            print(f"\n❌ ERRO: Status code {response.status_code}")
            print(f"   Resposta: {response.text}")
            return False
            
    except requests.exceptions.Timeout:
        print("\n❌ ERRO: Timeout ao chamar API Lambda")
        return False
        
    except requests.exceptions.ConnectionError as e:
        print(f"\n❌ ERRO: Falha de conexão com API Lambda")
        print(f"   Detalhes: {str(e)}")
        return False
        
    except Exception as e:
        print(f"\n❌ ERRO INESPERADO: {str(e)}")
        import traceback
        traceback.print_exc()
        return False


if __name__ == '__main__':
    print("\n🧪 Iniciando teste da API Lambda...\n")
    
    success = test_lambda_signed_url()
    
    print("\n" + "=" * 60)
    if success:
        print("✅ RESULTADO: TESTE PASSOU")
    else:
        print("❌ RESULTADO: TESTE FALHOU")
    print("=" * 60 + "\n")
    
    sys.exit(0 if success else 1)
