const socket = io();
let currentRoom = "";
let username = "";

// Function to create a room
function createRoom() {
  const roomId = Math.random().toString(36).substr(2, 8);
  const password = Math.random().toString(36).substr(2, 8);

  currentRoom = roomId;

  document.getElementById("room-info").classList.remove("hidden");
  document.getElementById(
    "room-info"
  ).innerText = `Room ID: ${roomId}, Password: ${password}`;

  // Notify the server about the new room
  socket.emit("create-room", { roomId, password });
}

// Function to join a room
function joinRoom() {
  const roomId = document.getElementById("room-id").value.trim();
  const password = document.getElementById("room-password").value.trim();
  username = document.getElementById("username").value.trim();

  if (!roomId || !password || !username) {
    alert("Please fill in all fields!");
    return;
  }

  // Request to join the room
  socket.emit("join-room", { roomId, password, username }, (response) => {
    if (response.success) {
      currentRoom = roomId;

      // Switch to the chat screen
      document.getElementById("login-screen").classList.add("hidden");
      document.getElementById("chat-screen").classList.remove("hidden");
      document.getElementById("room-name").innerText = `Room: ${roomId}`;
    } else {
      alert(response.message);
    }
  });
}

// Function to leave a room
function leaveRoom() {
  socket.emit("leave-room", { roomId: currentRoom, username });
  location.reload();
}

// Function to send a message
function sendMessage() {
  const message = document.getElementById("chat-input").value.trim();
  if (message) {
    socket.emit("send-message", { roomId: currentRoom, username, message });
    addMessage(username, message, true);
    document.getElementById("chat-input").value = "";
  }
}

// Add a message to the chat
function addMessage(user, content, self = false) {
  const messagesDiv = document.getElementById("chat-messages");
  const messageDiv = document.createElement("div");

  messageDiv.className = self ? "message self" : "message other";
  messageDiv.innerHTML = `<strong>${user}:</strong> ${content}`;
  messagesDiv.appendChild(messageDiv);

  messagesDiv.scrollTop = messagesDiv.scrollHeight;
}

// Handle incoming messages
socket.on("receive-message", (data) => {
  addMessage(data.username, data.message, false);
});

socket.on("system-message", (message) => {
  addMessage("System", message, false);
});
