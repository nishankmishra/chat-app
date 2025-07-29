let socket;
let username = "";
let currentRoom = "";
let typingTimeout;

function enterChat() {
  username = document.getElementById("username").value;
  if (!username) return alert("Please enter a username.");
  document.getElementById("login-screen").style.display = "none";
  document.getElementById("chat-container").style.display = "block";

  socket = new WebSocket("https://chat-app-pp39.onrender.com/");

  socket.onmessage = function(event) {
    const msg = JSON.parse(event.data);
    const messages = document.getElementById("messages");

    if (msg.type === "message") {
      const typingNotice = document.getElementById("typing-notice");
      if (typingNotice) typingNotice.remove();
      messages.innerHTML += `<div><strong>${msg.user}</strong>: ${msg.text} <span style="font-size:0.8em;color:gray;">(${msg.time})</span></div>`;
      messages.scrollTop = messages.scrollHeight;
    } else if (msg.type === "system") {
      messages.innerHTML += `<div class='system-message'>${msg.text}</div>`;
    } else if (msg.type === "typing") {
      if (!document.getElementById("typing-notice")) {
        const typingDiv = document.createElement("div");
        typingDiv.id = "typing-notice";
        typingDiv.className = "system-message";
        typingDiv.textContent = `${msg.user} is typing...`;
        messages.appendChild(typingDiv);
        messages.scrollTop = messages.scrollHeight;
      }
    } else if (msg.type === "stop-typing") {
      const typingDiv = document.getElementById("typing-notice");
      if (typingDiv) typingDiv.remove();
    } else if (msg.type === "update-users") {
      const panel = document.getElementById("online-users-panel");
      panel.innerHTML = `<h3>Online Users</h3><ul>${msg.users.map(user => `<li>${user}</li>`).join("")}</ul>`;
    } else if (msg.type === "error") {
      alert(msg.message);
      location.reload();
    }
  };
}

function joinRoom() {
  currentRoom = document.getElementById("room-name").value;
  if (!currentRoom) return alert("Enter a room name.");
  socket.send(JSON.stringify({ type: "join", room: currentRoom, user: username }));
}

function sendMessage() {
  const input = document.getElementById("message-input");
  if (!input.value.trim()) return;
  socket.send(JSON.stringify({ type: "message", room: currentRoom, user: username, text: input.value }));
  input.value = "";
  socket.send(JSON.stringify({ type: "stop-typing", user: username, room: currentRoom }));
}

document.getElementById("message-input").addEventListener("input", () => {
  if (socket && socket.readyState === WebSocket.OPEN) {
    socket.send(JSON.stringify({ type: "typing", user: username, room: currentRoom }));
    clearTimeout(typingTimeout);
    typingTimeout = setTimeout(() => {
      socket.send(JSON.stringify({ type: "stop-typing", user: username, room: currentRoom }));
    }, 2000);
  }
});
