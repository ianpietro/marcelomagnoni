import { obterAgenda } from './firebase-config.js';

document.addEventListener('DOMContentLoaded', () => {
    // 1. Carrega e Renderiza a Agenda da Semana
    carregarAgenda();

    // 2. Animação de Revelação de Seções (Fade-In on Scroll)
    initScrollAnimations();

    // 3. Efeito Parallax sutil no background do Hero (opcional/interativo)
    initHeroParallax();
});

/**
 * Busca a agenda do provedor de dados e renderiza os elementos na página.
 */
async function carregarAgenda() {
    try {
        const agenda = await obterAgenda();
        const diasSemana = ['segunda', 'terca', 'quarta', 'quinta', 'sexta', 'sabado', 'domingo'];
        
        diasSemana.forEach(dia => {
            const localEl = document.getElementById(`agenda-${dia}-local`);
            const horarioEl = document.getElementById(`agenda-${dia}-horario`);
            
            if (agenda[dia]) {
                if (localEl) {
                    localEl.textContent = agenda[dia].local || 'Atendimento Fechado';
                    // Adiciona destaque para locais ativos vs fechados
                    if (agenda[dia].local && agenda[dia].local.toLowerCase().includes('fechado')) {
                        localEl.classList.add('text-muted');
                        localEl.classList.remove('text-accent');
                    } else {
                        localEl.classList.remove('text-muted');
                        localEl.classList.add('text-accent');
                    }
                }
                if (horarioEl) {
                    horarioEl.textContent = agenda[dia].horario || '—';
                }
            }
        });
        
        console.log('Frontend: Agenda renderizada com sucesso.');
    } catch (error) {
        console.error('Frontend: Erro ao carregar e renderizar agenda:', error);
    }
}

/**
 * Inicializa a animação de fade-in para elementos à medida que aparecem na tela.
 */
function initScrollAnimations() {
    const fadeSections = document.querySelectorAll('.fade-in-section');
    
    if ('IntersectionObserver' in window) {
        const observerOptions = {
            root: null, // viewport do navegador
            rootMargin: '0px',
            threshold: 0.15 // Dispara quando 15% do elemento está visível
        };
        
        const sectionObserver = new IntersectionObserver((entries, observer) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('is-visible');
                    // Uma vez visível, cancela a observação do elemento para melhorar performance
                    observer.unobserve(entry.target);
                }
            });
        }, observerOptions);
        
        fadeSections.forEach(section => {
            sectionObserver.observe(section);
        });
    } else {
        // Fallback para navegadores antigos
        fadeSections.forEach(section => {
            section.classList.add('is-visible');
        });
    }
}

/**
 * Efeito de movimento elegante na imagem do hero baseado no movimento do mouse
 */
function initHeroParallax() {
    const heroSection = document.querySelector('.hero');
    const heroImage = document.querySelector('.hero-image');
    
    if (heroSection && heroImage && window.innerWidth > 1024) {
        heroSection.addEventListener('mousemove', (e) => {
            const mouseX = e.clientX / window.innerWidth;
            const mouseY = e.clientY / window.innerHeight;
            
            // Deslocamento sutil (máximo de 15px)
            const moveX = (mouseX - 0.5) * 20;
            const moveY = (mouseY - 0.5) * 20;
            
            heroImage.style.transform = `scale(1.05) translate(${moveX}px, ${moveY}px)`;
        });
        
        // Reseta a escala e posição quando o mouse sai
        heroSection.addEventListener('mouseleave', () => {
            heroImage.style.transform = 'scale(1.02) translate(0, 0)';
            heroImage.style.transition = 'transform 0.8s ease-out';
        });
        
        heroSection.addEventListener('mouseenter', () => {
            heroImage.style.transition = 'none';
        });
    }
}
