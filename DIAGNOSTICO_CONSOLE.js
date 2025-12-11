/**
 * SCRIPT DE DIAGNÓSTICO COMPLETO
 * Cole este código no console do navegador (F12) na página de triagem
 */

(function() {
    console.log('='.repeat(80));
    console.log('🔍 DIAGNÓSTICO COMPLETO - BOTÕES SCANNER E DELETE');
    console.log('='.repeat(80));

    // 1. VERIFICAR SCRIPTS CARREGADOS
    console.log('\n📦 1. SCRIPTS CARREGADOS:');
    console.log('- ArquivoManager:', typeof window.ArquivoManager !== 'undefined' ? '✅ CARREGADO' : '❌ NÃO CARREGADO');
    console.log('- DynamosoftScanner:', typeof window.DynamosoftScanner !== 'undefined' ? '✅ CARREGADO' : '❌ NÃO CARREGADO');

    // 2. VERIFICAR ELEMENTOS DO DOM
    console.log('\n🎯 2. ELEMENTOS DO DOM:');
    const _elementos = {
        'btn-scanner': document.getElementById('btn-scanner'),
        'modal-scanner-teste': document.getElementById('modal-scanner-teste'),
        'modal-confirmar-substituicao': document.getElementById('modal-confirmar-substituicao'),
        'modal-confirmar-exclusao': document.getElementById('modal-confirmar-exclusao'),
        'scanner-files-container': document.getElementById('scanner-files-container')
    };

    for (const [id, elemento] of Object.entries(_elementos)) {
        console.log(`- ${id}:`, elemento ? '✅ EXISTE' : '❌ NÃO EXISTE');
    }

    // 3. VERIFICAR VARIÁVEL GLOBAL requisicaoAtual
    console.log('\n📋 3. VARIÁVEL GLOBAL requisicaoAtual:');
    if (typeof requisicaoAtual !== 'undefined') {
        console.log('✅ EXISTE:', requisicaoAtual);
    } else {
        console.log('❌ NÃO DEFINIDA');
    }

    // 4. VERIFICAR EVENTOS DO BOTÃO SCANNER
    console.log('\n🎮 4. EVENTOS DO BOTÃO SCANNER:');
    const _btnScanner = document.getElementById('btn-scanner');
    if (_btnScanner) {
        // Tentar usar getEventListeners se disponível (Chrome DevTools)
        if (typeof getEventListeners === 'function') {
            const listeners = getEventListeners(_btnScanner);
            console.log('Listeners:', listeners);
            if (listeners.click && listeners.click.length > 0) {
                console.log('✅ Tem', listeners.click.length, 'listener(s) de click');
            } else {
                console.log('❌ SEM listeners de click');
            }
        } else {
            console.log('⚠️ getEventListeners não disponível (use Chrome)');
        }
    } else {
        console.log('❌ Botão não existe no DOM');
    }

    // 5. VERIFICAR ARQUIVOS NA LISTA
    console.log('\n📁 5. ARQUIVOS NA LISTA:');
    const _container = document.getElementById('scanner-files-container');
    if (_container) {
        const _arquivos = _container.querySelectorAll('.arquivo-item');
        console.log('Total de arquivos:', _arquivos.length);
        
        _arquivos.forEach((arquivo, index) => {
            console.log(`\nArquivo ${index + 1}:`);
            const _btnDelete = arquivo.querySelector('.btn-delete-arquivo');
            console.log('- Tem botão X:', _btnDelete ? '✅ SIM' : '❌ NÃO');
            
            if (_btnDelete) {
                if (typeof getEventListeners === 'function') {
                    const listeners = getEventListeners(_btnDelete);
                    console.log('- Listeners do botão X:', listeners.click ? listeners.click.length : 0);
                }
            }
        });
    } else {
        console.log('❌ Container de arquivos não existe');
    }

    // 6. TESTE MANUAL DO BOTÃO SCANNER
    console.log('\n🧪 6. TESTE MANUAL:');
    console.log('Execute estes comandos um de cada vez:');
    console.log('');
    console.log('// Testar clique no botão Scanner:');
    console.log('document.getElementById("btn-scanner").click();');
    console.log('');
    console.log('// Ver requisição atual:');
    console.log('console.log(requisicaoAtual);');
    console.log('');
    console.log('// Testar função abrirScanner diretamente:');
    console.log('abrirScanner();');

    console.log('\n' + '='.repeat(80));
    console.log('✅ DIAGNÓSTICO COMPLETO');
    console.log('='.repeat(80));
})();
