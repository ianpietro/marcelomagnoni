// ==========================================================================
// Configuração do Firebase & Fallback LocalStorage
// ==========================================================================

// Cole aqui suas configurações reais obtidas no painel do Firebase Console.
// Se as chaves abaixo começarem com "SEU_" ou estiverem vazias, o sistema
// entrará automaticamente no modo offline LocalStorage para testes locais.
const firebaseConfig = {
    apiKey: "SEU_API_KEY_AQUI",
    authDomain: "SEU_AUTH_DOMAIN_AQUI",
    projectId: "SEU_PROJECT_ID_AQUI",
    storageBucket: "SEU_STORAGE_BUCKET_AQUI",
    messagingSenderId: "SEU_MESSAGING_SENDER_ID_AQUI",
    appId: "SEU_APP_ID_AQUI"
};

// Credenciais do Administrador para o Modo Fallback Local (Offline)
const LOCAL_ADMIN_EMAIL = "admin@marcelomagnoni.com.br";
const LOCAL_ADMIN_PASS = "magnoni123";

// Agenda Padrão Inicial
const DEFAULT_AGENDA = {
    segunda: { local: "Studio Icaraí", horario: "09h às 19h" },
    terca:   { local: "Studio Icaraí", horario: "09h às 19h" },
    quarta:  { local: "Consultorias Externas", horario: "Atendimento Sob Demanda" },
    quinta:  { local: "Studio Icaraí", horario: "09h às 19h" },
    sexta:   { local: "Studio Icaraí", horario: "09h às 20h" },
    sabado:  { local: "Studio Icaraí", horario: "09h às 17h" },
    domingo: { local: "Atendimento Fechado", horario: "—" }
};

let db = null;
let auth = null;
let useFirebase = false;

// Função para checar se o Firebase está configurado com chaves reais
function isFirebaseConfigured() {
    return firebaseConfig.apiKey && 
           !firebaseConfig.apiKey.startsWith("SEU_") && 
           firebaseConfig.apiKey !== "";
}

// Inicialização Assíncrona do Firebase ou Fallback
async function initPersistence() {
    if (isFirebaseConfigured()) {
        try {
            // Importações dinâmicas dos módulos do Firebase via CDN oficial
            const { initializeApp } = await import("https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js");
            const { getAuth } = await import("https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js");
            const { getFirestore } = await import("https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js");
            
            const app = initializeApp(firebaseConfig);
            auth = getAuth(app);
            db = getFirestore(app);
            useFirebase = true;
            console.log("Persistence: Firebase inicializado com sucesso.");
        } catch (error) {
            console.warn("Persistence: Falha ao inicializar o Firebase. Ativando fallback para LocalStorage.", error);
            useFirebase = false;
        }
    } else {
        console.log("Persistence: Configurações do Firebase ausentes ou padrões. Utilizando LocalStorage (Modo Offline).");
        useFirebase = false;
    }
}

// Inicializa a persistência imediatamente
const initPromise = initPersistence();

// ==========================================================================
// API Unificada de Dados da Agenda
// ==========================================================================

export async function obterAgenda() {
    await initPromise;
    
    if (useFirebase && db) {
        try {
            const { doc, getDoc } = await import("https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js");
            const docRef = doc(db, "configuracoes", "agenda");
            const docSnap = await getDoc(docRef);
            
            if (docSnap.exists()) {
                return docSnap.data();
            } else {
                // Se o documento não existe no Firestore ainda, retorna a padrão
                return DEFAULT_AGENDA;
            }
        } catch (error) {
            console.error("Erro ao obter agenda do Firebase, tentando LocalStorage:", error);
        }
    }
    
    // Fallback: LocalStorage
    const localData = localStorage.getItem("magnoni_agenda");
    if (localData) {
        try {
            return JSON.parse(localData);
        } catch (e) {
            return DEFAULT_AGENDA;
        }
    }
    
    // Se não houver dados, salvar e retornar os padrões
    localStorage.setItem("magnoni_agenda", JSON.stringify(DEFAULT_AGENDA));
    return DEFAULT_AGENDA;
}

export async function salvarAgenda(dadosAgenda) {
    await initPromise;
    
    if (useFirebase && db) {
        try {
            const { doc, setDoc } = await import("https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js");
            const docRef = doc(db, "configuracoes", "agenda");
            await setDoc(docRef, dadosAgenda);
            console.log("Agenda salva com sucesso no Firebase.");
            return true;
        } catch (error) {
            console.error("Erro ao salvar agenda no Firebase:", error);
            throw error;
        }
    }
    
    // Fallback: LocalStorage
    localStorage.setItem("magnoni_agenda", JSON.stringify(dadosAgenda));
    console.log("Agenda salva localmente no LocalStorage.");
    return true;
}

// ==========================================================================
// API Unificada de Autenticação
// ==========================================================================

export async function login(email, senha) {
    await initPromise;
    
    if (useFirebase && auth) {
        try {
            const { signInWithEmailAndPassword } = await import("https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js");
            const userCredential = await signInWithEmailAndPassword(auth, email, senha);
            return userCredential.user;
        } catch (error) {
            console.error("Erro de login no Firebase:", error);
            throw error;
        }
    }
    
    // Fallback: Autenticação mockada local
    if (email === LOCAL_ADMIN_EMAIL && senha === LOCAL_ADMIN_PASS) {
        const user = { email: LOCAL_ADMIN_EMAIL, uid: "local-admin-uid" };
        localStorage.setItem("magnoni_local_user", JSON.stringify(user));
        return user;
    } else {
        throw new Error("Credenciais locais incorretas.");
    }
}

export async function logout() {
    await initPromise;
    
    if (useFirebase && auth) {
        try {
            const { signOut } = await import("https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js");
            await signOut(auth);
            return true;
        } catch (error) {
            console.error("Erro ao fazer logout no Firebase:", error);
            throw error;
        }
    }
    
    // Fallback
    localStorage.removeItem("magnoni_local_user");
    return true;
}

export async function obterUsuarioAtual() {
    await initPromise;
    
    if (useFirebase && auth) {
        return auth.currentUser;
    }
    
    // Fallback
    const localUser = localStorage.getItem("magnoni_local_user");
    return localUser ? JSON.parse(localUser) : null;
}

export async function onAuthStateChangedCustom(callback) {
    await initPromise;
    
    if (useFirebase && auth) {
        const { onAuthStateChanged } = await import("https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js");
        onAuthStateChanged(auth, (user) => {
            callback(user);
        });
    } else {
        // Mock de verificação imediata para modo offline
        const checkLocalUser = () => {
            const user = localStorage.getItem("magnoni_local_user");
            callback(user ? JSON.parse(user) : null);
        };
        checkLocalUser();
        // Listener simples no storage para refletir mudanças entre abas se houver
        window.addEventListener("storage", (e) => {
            if (e.key === "magnoni_local_user") {
                checkLocalUser();
            }
        });
    }
}

export function isLocalMode() {
    return !useFirebase;
}
