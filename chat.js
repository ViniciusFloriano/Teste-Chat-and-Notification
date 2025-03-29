// ============================================================================
// CONFIGURAÇÃO INICIAL E VARIÁVEIS GLOBAIS
// ============================================================================

/**
 * Estabelece conexão WebSocket com o servidor de chat
 * @type {WebSocket}
 */
const ws = new WebSocket("ws://localhost:8080/chat");

// Elementos DOM principais
const chatBox = document.getElementById("chat-box"); // Container das mensagens
const messageInput = document.getElementById("message"); // Campo de input
const notificationBadge = document.getElementById("notification-badge"); // Badge de contador
const notificationMenu = document.getElementById("notification-menu"); // Menu de notificações

// Variáveis de estado
let notificationCount = 0; // Contador de notificações não lidas
let username = "User" + Math.floor(Math.random() * 1000); // Nome aleatório para usuário
let myId = null; // ID único atribuído pelo servidor

// ============================================================================
// EVENTOS WEBSOCKET
// ============================================================================

/**
 * Evento disparado quando a conexão WebSocket é aberta
 */
ws.onopen = () => {
    console.log("Conectado ao servidor WebSocket.");
};

/**
 * Evento disparado quando uma mensagem é recebida do servidor
 * @param {MessageEvent} event - Objeto de evento com os dados recebidos
 */
ws.onmessage = (event) => {
    const msgData = JSON.parse(event.data);
    
    // Trata mensagens de identificação
    if (msgData.type === "id") {
        myId = msgData.id;
        console.log("Meu ID:", myId);
        return;
    }
    
    try {
        // Valida dados básicos da mensagem
        if (!msgData.text || !msgData.sender) return;
        
        // Cria elemento de mensagem
        const msg = document.createElement("div");
        // Adiciona classe base + classe de direção (enviada/recebida)
        msg.classList.add("message", msgData.sender === username || msgData.sender === myId ? "sent" : "received");

        // Estrutura HTML da mensagem
        const messageContent = `
            <div class="message-content">
                ${msgData.sender === username || msgData.sender === myId ? "" : `<span class="message-sender">${msgData.sender}:</span>`}
                <span class="message-text">${msgData.text.replace(/\n/g, "<br>")}</span>
            </div>
        `;
        
        // Configura indentação dinâmica para mensagens recebidas
        if (msgData.sender !== username && msgData.sender !== myId) {
            msg.style.setProperty("--sender-width", `${msgData.sender.length + 1}ch`); // +1 para o ":"
        }
        
        msg.innerHTML = messageContent;
        chatBox.appendChild(msg);
        // Rolagem automática para a última mensagem
        chatBox.scrollTop = chatBox.scrollHeight;

        // Adiciona notificação se a mensagem for de outro usuário
        if (msgData.sender !== username && msgData.sender !== myId) {
            addNotification(msgData.sender, msgData.text);
        }
    } catch (error) {
        console.error("Erro ao processar mensagem: ", error);
    }
};

// ============================================================================
// FUNÇÕES PRINCIPAIS
// ============================================================================

/**
 * Envia mensagem para o servidor via WebSocket
 */
function sendMessage() {
    const msg = messageInput.value.trim();
    if (msg !== "") {
        // Formata os dados da mensagem
        const messageData = JSON.stringify({ 
            text: msg, 
            sender: username 
        });
        ws.send(messageData);
        messageInput.value = ""; // Limpa o campo de input
    }
}

/**
 * Adiciona nova notificação ao menu
 * @param {string} sender - Nome do remetente
 * @param {string} message - Texto da mensagem
 */
function addNotification(sender, message) {
    // Atualiza contador
    notificationCount++;
    notificationBadge.textContent = notificationCount;
    notificationBadge.style.display = "inline";
    
    // Cria elemento da notificação
    const notificationItem = document.createElement("div");
    notificationItem.className = "notification-message";
    
    // Configura indentação dinâmica
    notificationItem.style.setProperty("--sender-width", `${sender.length + 1}ch`);
    
    // Estrutura HTML da notificação
    notificationItem.innerHTML = `
        <div class="notification-content">
            <span class="notification-sender">${sender}:</span>
            <span class="notification-text">${message.replace(/\n/g, "<br>")}</span>
        </div>
    `;
    
    // Adiciona no topo da lista (notificação mais recente primeiro)
    notificationMenu.insertBefore(notificationItem, notificationMenu.firstChild);
}

/**
 * Alterna a visibilidade do menu de notificações
 */
function toggleNotificationMenu() {
    if (notificationMenu.style.display === "block") {
        // Esconde o menu e reseta contador
        notificationMenu.style.display = "none";
        notificationCount = 0;
        notificationBadge.style.display = "none";
    } else {
        // Mostra o menu
        notificationMenu.style.display = "block";
    }
}

// ============================================================================
// EVENT LISTENERS
// ============================================================================

/**
 * Listener para envio de mensagem com Enter
 */
messageInput.addEventListener("keypress", (event) => {
    if (event.key === "Enter" && !event.shiftKey) {
        event.preventDefault(); // Impede quebra de linha
        sendMessage();
    }
});