import { 
    login, 
    logout, 
    obterAgenda, 
    salvarAgenda, 
    onAuthStateChangedCustom, 
    isLocalMode 
} from './firebase-config.js';

// Elementos da DOM
const loginFormContainer = document.getElementById('login-container');
const dashboardContainer = document.getElementById('dashboard-container');
const loginForm = document.getElementById('login-form');
const agendaForm = document.getElementById('agenda-form');
const btnLogout = document.getElementById('btn-logout');
const feedbackLogin = document.getElementById('feedback-login');
const feedbackDashboard = document.getElementById('feedback-dashboard');
const statusDot = document.getElementById('status-dot');
const statusText = document.getElementById('status-text');

document.addEventListener('DOMContentLoaded', () => {
    // 1. Inicializar indicador de Conexão (Local vs Firebase)
    atualizarIndicadorStatus();

    // 2. Observar estado de autenticação
    onAuthStateChangedCustom((user) => {
        if (user) {
            exibirDashboard();
        } else {
            exibirLoginForm();
        }
    });

    // 3. Listener do Formulário de Login
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            limparFeedbacks();
            
            const email = document.getElementById('email').value.trim();
            const password = document.getElementById('password').value;
            
            try {
                mostrarLoadingButton(loginForm.querySelector('button'), 'Autenticando...');
                await login(email, password);
                exibirFeedback(feedbackLogin, 'Sucesso! Redirecionando...', 'success');
            } catch (error) {
                console.error('Erro de autenticação:', error);
                exibirFeedback(feedbackLogin, 'Credenciais incorretas ou falha de conexão.', 'error');
                resetButton(loginForm.querySelector('button'), 'Acessar Painel');
            }
        });
    }

    // 4. Listener do Formulário de Agenda
    if (agendaForm) {
        agendaForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            limparFeedbacks();
            
            const dadosAgenda = {
                segunda: {
                    local: document.getElementById('segunda-local').value.trim(),
                    horario: document.getElementById('segunda-horario').value.trim()
                },
                terca: {
                    local: document.getElementById('terca-local').value.trim(),
                    horario: document.getElementById('terca-horario').value.trim()
                },
                quarta: {
                    local: document.getElementById('quarta-local').value.trim(),
                    horario: document.getElementById('quarta-horario').value.trim()
                },
                quinta: {
                    local: document.getElementById('quinta-local').value.trim(),
                    horario: document.getElementById('quinta-horario').value.trim()
                },
                sexta: {
                    local: document.getElementById('sexta-local').value.trim(),
                    horario: document.getElementById('sexta-horario').value.trim()
                },
                sabado: {
                    local: document.getElementById('sabado-local').value.trim(),
                    horario: document.getElementById('sabado-horario').value.trim()
                },
                domingo: {
                    local: document.getElementById('domingo-local').value.trim(),
                    horario: document.getElementById('domingo-horario').value.trim()
                }
            };
            
            try {
                mostrarLoadingButton(agendaForm.querySelector('button'), 'Salvando Alterações...');
                await salvarAgenda(dadosAgenda);
                exibirFeedback(feedbackDashboard, 'Agenda atualizada com sucesso!', 'success');
                // Scroll para o topo das mensagens de feedback
                feedbackDashboard.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
            } catch (error) {
                console.error('Erro ao salvar agenda:', error);
                exibirFeedback(feedbackDashboard, 'Ocorreu um erro ao salvar os dados.', 'error');
            } finally {
                resetButton(agendaForm.querySelector('button'), 'Salvar Alterações da Semana');
            }
        });
    }

    // 5. Listener de Logout
    if (btnLogout) {
        btnLogout.addEventListener('click', async () => {
            try {
                await logout();
            } catch (error) {
                console.error('Erro ao fazer logout:', error);
            }
        });
    }
});

/**
 * Atualiza o badge indicando se o sistema está rodando localmente (LocalStorage)
 * ou conectado ao banco de dados em nuvem do Firebase.
 */
function atualizarIndicadorStatus() {
    if (statusDot && statusText) {
        if (isLocalMode()) {
            statusDot.className = 'status-dot local';
            statusText.textContent = 'Modo de Homologação Local (LocalStorage)';
        } else {
            statusDot.className = 'status-dot firebase';
            statusText.textContent = 'Conectado ao Firebase Cloud';
        }
    }
}

/**
 * Exibe a tela de login e oculta o painel.
 */
function exibirLoginForm() {
    if (loginFormContainer) loginFormContainer.style.display = 'block';
    if (dashboardContainer) dashboardContainer.style.display = 'none';
    limparFeedbacks();
    if (loginForm) {
        loginForm.reset();
        resetButton(loginForm.querySelector('button'), 'Acessar Painel');
    }
}

/**
 * Exibe o painel administrativo e oculta o login, preenchendo os dados da agenda.
 */
async function exibirDashboard() {
    if (loginFormContainer) loginFormContainer.style.display = 'none';
    if (dashboardContainer) dashboardContainer.style.display = 'block';
    limparFeedbacks();
    
    try {
        const agenda = await obterAgenda();
        const dias = ['segunda', 'terca', 'quarta', 'quinta', 'sexta', 'sabado', 'domingo'];
        
        dias.forEach(dia => {
            const localInput = document.getElementById(`${dia}-local`);
            const horarioInput = document.getElementById(`${dia}-horario`);
            
            if (agenda[dia]) {
                if (localInput) localInput.value = agenda[dia].local || '';
                if (horarioInput) horarioInput.value = agenda[dia].horario || '';
            }
        });
    } catch (error) {
        console.error('Erro ao preencher dashboard com dados da agenda:', error);
        exibirFeedback(feedbackDashboard, 'Erro ao carregar dados atuais do servidor.', 'error');
    }
}

/**
 * Exibe mensagens de feedback na interface.
 */
function exibirFeedback(elemento, mensagem, tipo) {
    if (!elemento) return;
    elemento.textContent = mensagem;
    elemento.className = `feedback-msg ${tipo}`;
    elemento.style.display = 'block';
}

/**
 * Oculta e limpa mensagens de feedback.
 */
function limparFeedbacks() {
    [feedbackLogin, feedbackDashboard].forEach(el => {
        if (el) {
            el.textContent = '';
            el.className = 'feedback-msg';
            el.style.display = 'none';
        }
    });
}

/**
 * Helpers para feedback visual de Loading nos botões
 */
function mostrarLoadingButton(btn, texto) {
    if (!btn) return;
    btn.disabled = true;
    btn.dataset.originalText = btn.textContent;
    btn.textContent = texto;
}

function resetButton(btn, textoPadrao) {
    if (!btn) return;
    btn.disabled = false;
    btn.textContent = textoPadrao || btn.dataset.originalText || 'Enviar';
}
