const ws = new WebSocket("ws://localhost:8080/chat");
const chatBox = document.getElementById("chat-box");
const messageInput = document.getElementById("message");
const notificationBadge = document.getElementById("notification-badge");
const notificationMenu = document.getElementById("notification-menu");

let myId = null;

ws.onopen = () => {
    console.log("Conectado ao servidor WebSocket.");
};

ws.onmessage = (event) => {
    const msgData = JSON.parse(event.data);

    // Se for uma mensagem de ID, salva o ID do cliente
    if (msgData.type === "id") {
        myId = msgData.id;
        console.log("Meu ID:", myId);
        return;
    }

    const msg = document.createElement("div");
    msg.textContent = msgData.text;

    // Se o sender for o mesmo ID, é mensagem enviada, senão é recebida
    msg.classList.add("message", msgData.sender == myId ? "sent" : "received");

    chatBox.appendChild(msg);
    chatBox.scrollTop = chatBox.scrollHeight;

    if (msgData.sender !== myId) {
        addNotification(msgData.text);
    }
};

function sendMessage() {
    const msg = messageInput.value.trim();
    if (msg !== "") {
        const messageData = JSON.stringify({ text: msg, sender: myId });
        ws.send(messageData);
        messageInput.value = "";
    }
}

messageInput.addEventListener("keypress", (event) => {
    if (event.key === "Enter") {
        sendMessage();
    }
});

function addNotification(message) {
    notificationCount++;
    notificationBadge.textContent = notificationCount;
    notificationBadge.style.display = "inline";
    
    const notificationItem = document.createElement("div");
    notificationItem.textContent = message;
    notificationMenu.appendChild(notificationItem);
}

function toggleNotificationMenu() {
    if (notificationMenu.style.display === "block") {
        notificationMenu.style.display = "none";
        notificationCount = 0;
        notificationBadge.style.display = "none";
    } else {
        notificationMenu.style.display = "block";
    }
}