const WebSocket = require('ws');
const wss = new WebSocket.Server({ port: process.env.port || 8080 },() => {
  console.log('WebSocket server is running on ws://localhost:8080');
});

const rooms = {};

function broadcast(room, message) {
  (rooms[room] || []).forEach(client => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify(message));
    }
  });
}

wss.on('connection', function connection(ws) {
  ws.on('message', function incoming(data) {
    const msg = JSON.parse(data);
    const time = new Date().toLocaleTimeString();

    if (msg.type === "join") {
      ws.username = msg.user;
      ws.room = msg.room;
      rooms[msg.room] = rooms[msg.room] || [];

      const userExists = rooms[msg.room].some(client => client.username === msg.user);
      if (userExists) {
        ws.send(JSON.stringify({ type: "error", message: "Username already taken in this room." }));
        return;
      }

      rooms[msg.room].push(ws);

      broadcast(ws.room, { type: "system", text: `${msg.user} joined the room.` });
      broadcast(ws.room, { type: "update-users", users: rooms[msg.room].map(c => c.username) });
    }

    if (msg.type === "message" && ws.room && ws.username) {
      broadcast(ws.room, { type: "message", user: ws.username, text: msg.text, time });
    }

    if (msg.type === "typing") {
      broadcast(ws.room, { type: "typing", user: msg.user });
    }

    if (msg.type === "stop-typing") {
      broadcast(ws.room, { type: "stop-typing", user: msg.user });
    }
  });

  ws.on('close', function () {
    if (ws.room && rooms[ws.room]) {
      rooms[ws.room] = rooms[ws.room].filter(client => client !== ws);
      broadcast(ws.room, { type: "system", text: `${ws.username} left the room.` });
      broadcast(ws.room, { type: "update-users", users: rooms[ws.room].map(c => c.username) });
    }
  });
});
