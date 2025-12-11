/**
 * ============================================
 * GERENCIADOR DE ARQUIVOS - TRIAGEM
 * ============================================
 * Gerencia verificação, substituição e exclusão de arquivos
 */

const ArquivoManager = {
    _initialized: false,
    
    init() {
        if (this._initialized) return;
        this._initialized = true;
        console.log('✅ ArquivoManager inicializado');
    },
    /**
     * Verifica se já existe arquivo tipo REQUISICAO para a requisição
     */
    async verificarArquivoExistente(requisicaoId) {
        console.log('🔧 ArquivoManager.verificarArquivoExistente chamado com ID:', requisicaoId);
        try {
            const response = await fetch(
                `/operacao/upload/verificar-existente/?requisicao_id=${requisicaoId}`,
                {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-CSRFToken': this.getCsrfToken()
                    }
                }
            );

            if (!response.ok) {
                throw new Error('Erro ao verificar arquivo');
            }

            const data = await response.json();
            console.log('🔧 ArquivoManager.verificarArquivoExistente resultado:', data);
            return data;
        } catch (error) {
            console.error('❌ Erro ao verificar arquivo:', error);
            throw error;
        }
    },

    /**
     * Deleta um arquivo
     */
    async deletarArquivo(arquivoId) {
        try {
            const response = await fetch('/operacao/upload/deletar/', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRFToken': this.getCsrfToken()
                },
                body: JSON.stringify({ arquivo_id: arquivoId })
            });

            if (!response.ok) {
                throw new Error('Erro ao deletar arquivo');
            }

            const data = await response.json();
            return data;
        } catch (error) {
            console.error('Erro ao deletar arquivo:', error);
            throw error;
        }
    },

    /**
     * Mostra modal de confirmação de substituição
     */
    mostrarModalSubstituicao(arquivo, onConfirmar, onCancelar) {
        console.log('🔧 mostrarModalSubstituicao chamado');
        console.log('🔧 - arquivo:', arquivo);
        
        const modal = document.getElementById('modal-confirmar-substituicao');
        const nomeArquivo = document.getElementById('arquivo-existente-nome');
        const btnConfirmar = document.getElementById('btn-confirmar-substituicao');
        const btnCancelar = document.getElementById('btn-cancelar-substituicao');

        console.log('🔧 Elementos do modal:');
        console.log('🔧 - modal:', modal);
        console.log('🔧 - nomeArquivo:', nomeArquivo);
        console.log('🔧 - btnConfirmar:', btnConfirmar);
        console.log('🔧 - btnCancelar:', btnCancelar);

        if (!modal) {
            console.error('❌ Modal de substituição não encontrado!');
            return;
        }

        if (nomeArquivo && arquivo.nome_arquivo) {
            nomeArquivo.textContent = arquivo.nome_arquivo;
        }
        
        modal.style.display = 'flex';
        console.log('🔧 Modal exibido com display: flex');

        const confirmarHandler = async () => {
            console.log('🔧 Botão Confirmar clicado');
            btnConfirmar.removeEventListener('click', confirmarHandler);
            btnCancelar.removeEventListener('click', cancelarHandler);
            modal.style.display = 'none';
            
            try {
                await this.deletarArquivo(arquivo.id);
                if (onConfirmar) onConfirmar();
            } catch (error) {
                alert('Erro ao deletar arquivo anterior. Tente novamente.');
            }
        };

        const cancelarHandler = () => {
            console.log('🔧 Botão Cancelar clicado');
            btnConfirmar.removeEventListener('click', confirmarHandler);
            btnCancelar.removeEventListener('click', cancelarHandler);
            modal.style.display = 'none';
            if (onCancelar) onCancelar();
        };

        if (btnConfirmar) btnConfirmar.addEventListener('click', confirmarHandler);
        if (btnCancelar) btnCancelar.addEventListener('click', cancelarHandler);
    },

    /**
     * Mostra modal de confirmação de exclusão
     */
    mostrarModalExclusao(arquivo, onConfirmar) {
        console.log('🔧 mostrarModalExclusao chamado');
        console.log('🔧 - arquivo:', arquivo);
        
        const modal = document.getElementById('modal-confirmar-exclusao');
        const nomeArquivo = document.getElementById('arquivo-deletar-nome');
        const btnConfirmar = document.getElementById('btn-confirmar-exclusao');
        const btnCancelar = document.getElementById('btn-cancelar-exclusao');

        console.log('🔧 Elementos do modal exclusão:');
        console.log('🔧 - modal:', modal);
        console.log('🔧 - nomeArquivo:', nomeArquivo);
        console.log('🔧 - btnConfirmar:', btnConfirmar);
        console.log('🔧 - btnCancelar:', btnCancelar);

        if (!modal) {
            console.error('❌ Modal de exclusão não encontrado!');
            return;
        }

        if (nomeArquivo && arquivo.nome_arquivo) {
            nomeArquivo.textContent = arquivo.nome_arquivo;
            console.log('🔧 Nome do arquivo definido:', arquivo.nome_arquivo);
        }
        
        modal.style.display = 'flex';
        console.log('🔧 Modal de exclusão exibido');

        const confirmarHandler = async () => {
            console.log('🔧 Confirmou exclusão');
            btnConfirmar.removeEventListener('click', confirmarHandler);
            btnCancelar.removeEventListener('click', cancelarHandler);
            modal.style.display = 'none';
            
            try {
                await this.deletarArquivo(arquivo.id);
                this.mostrarNotificacao('Arquivo deletado com sucesso!');
                if (onConfirmar) onConfirmar();
            } catch (error) {
                console.error('❌ Erro ao deletar:', error);
                alert('Erro ao deletar arquivo. Tente novamente.');
            }
        };

        const cancelarHandler = () => {
            console.log('🔧 Cancelou exclusão');
            btnConfirmar.removeEventListener('click', confirmarHandler);
            btnCancelar.removeEventListener('click', cancelarHandler);
            modal.style.display = 'none';
        };

        if (btnConfirmar) btnConfirmar.addEventListener('click', confirmarHandler);
        if (btnCancelar) btnCancelar.addEventListener('click', cancelarHandler);
    },

    /**
     * Mostra notificação toast de sucesso
     */
    mostrarNotificacao(mensagem) {
        const toast = document.createElement('div');
        toast.className = 'toast-notification';
        toast.innerHTML = `
            <span style="font-size:20px;">✓</span>
            <span>${mensagem}</span>
        `;
        
        document.body.appendChild(toast);

        setTimeout(() => {
            toast.classList.add('toast-hide');
            setTimeout(() => {
                document.body.removeChild(toast);
            }, 300);
        }, 3000);
    },

    /**
     * Adiciona botão de exclusão a um item de arquivo
     */
    adicionarBotaoExclusao(arquivoElement, arquivo, onExcluir) {
        console.log('🔧 ArquivoManager.adicionarBotaoExclusao chamado');
        console.log('🔧 - arquivoElement:', arquivoElement);
        console.log('🔧 - arquivo:', arquivo);
        
        const btnDelete = document.createElement('button');
        btnDelete.className = 'btn-delete-arquivo';
        btnDelete.innerHTML = '×';
        btnDelete.title = 'Deletar arquivo';
        btnDelete.setAttribute('aria-label', 'Deletar arquivo');

        btnDelete.addEventListener('click', (e) => {
            console.log('🔧 DEBUG: Botão X CLICADO!');
            e.preventDefault();
            e.stopPropagation();
            this.mostrarModalExclusao(arquivo, onExcluir);
        });

        arquivoElement.style.position = 'relative';
        arquivoElement.appendChild(btnDelete);
        console.log('🔧 Botão X adicionado ao elemento');
    },

    /**
     * Obtém CSRF token
     */
    getCsrfToken() {
        // Tentar pegar do input hidden
        let token = document.querySelector('[name=csrfmiddlewaretoken]');
        if (token) return token.value;
        
        // Tentar pegar do cookie
        const cookieValue = document.cookie
            .split('; ')
            .find(row => row.startsWith('csrftoken='));
        
        if (cookieValue) {
            return cookieValue.split('=')[1];
        }
        
        console.warn('CSRF token não encontrado');
        return '';
    }
};

window.ArquivoManager = ArquivoManager;

// Inicializar quando o script carregar
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => ArquivoManager.init());
} else {
    ArquivoManager.init();
}
