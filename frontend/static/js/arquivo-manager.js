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
    },
    /**
     * Verifica se já existe arquivo tipo REQUISICAO para a requisição
     */
    async verificarArquivoExistente(requisicaoId) {
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

            return await response.json();
        } catch (error) {
            console.error('Erro ao verificar arquivo:', error);
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
        const modal = document.getElementById('modal-confirmar-substituicao');
        const nomeArquivo = document.getElementById('arquivo-existente-nome');
        const btnConfirmar = document.getElementById('btn-confirmar-substituicao');
        const btnCancelar = document.getElementById('btn-cancelar-substituicao');

        if (!modal) {
            console.error('Modal de substituição não encontrado');
            return;
        }

        // Aceitar tanto 'nome_arquivo' (da API de verificação) quanto 'nome' (da API de listagem)
        const nomeDoArquivo = arquivo.nome_arquivo || arquivo.nome;
        if (nomeArquivo && nomeDoArquivo) {
            nomeArquivo.textContent = nomeDoArquivo;
        }
        
        modal.style.display = 'flex';

        const confirmarHandler = async () => {
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
        const modal = document.getElementById('modal-confirmar-exclusao');
        const nomeArquivo = document.getElementById('arquivo-deletar-nome');
        const btnConfirmar = document.getElementById('btn-confirmar-exclusao');
        const btnCancelar = document.getElementById('btn-cancelar-exclusao');

        if (!modal) {
            console.error('Modal de exclusão não encontrado');
            return;
        }

        // Aceitar tanto 'nome_arquivo' (da API de verificação) quanto 'nome' (da API de listagem)
        const nomeDoArquivo = arquivo.nome_arquivo || arquivo.nome;
        if (nomeArquivo && nomeDoArquivo) {
            nomeArquivo.textContent = nomeDoArquivo;
        }
        
        modal.style.display = 'flex';

        const confirmarHandler = async () => {
            btnConfirmar.removeEventListener('click', confirmarHandler);
            btnCancelar.removeEventListener('click', cancelarHandler);
            modal.style.display = 'none';
            
            try {
                await this.deletarArquivo(arquivo.id);
                this.mostrarNotificacao('Arquivo deletado com sucesso!');
                if (onConfirmar) onConfirmar();
            } catch (error) {
                console.error('Erro ao deletar arquivo:', error);
                alert('Erro ao deletar arquivo. Tente novamente.');
            }
        };

        const cancelarHandler = () => {
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
        const btnDelete = document.createElement('button');
        btnDelete.className = 'btn-delete-arquivo';
        btnDelete.innerHTML = '×';
        btnDelete.title = 'Deletar arquivo';
        btnDelete.setAttribute('aria-label', 'Deletar arquivo');

        btnDelete.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            this.mostrarModalExclusao(arquivo, onExcluir);
        });

        arquivoElement.style.position = 'relative';
        arquivoElement.appendChild(btnDelete);
    },

    /**
     * Obtém CSRF token - usa FemmeUtils global
     */
    getCsrfToken() {
        return FemmeUtils.getCsrfToken();
    }
};

window.ArquivoManager = ArquivoManager;

// Inicializar quando o script carregar
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => ArquivoManager.init());
} else {
    ArquivoManager.init();
}
