const http = require('http');
const { WebSocketServer } = require('ws');

const server = http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/plain' });
  res.end('Signaling server is running!\n');
});

const wss = new WebSocketServer({ server });
const clients = new Map(); // Список подключенных клиентов: ID -> WebSocket

wss.on('connection', (ws) => {
  ws.on('message', (message) => {
    try {
      const data = JSON.parse(message);

      // Регистрация клиента
      if (data.type === 'register') {
        clients.set(data.id, ws);
        ws.userId = data.id;
        console.log(`Пользователь зарегистрирован с ID: ${data.id}`);
        return;
      }

      // Пересылка сообщения конкретному получателю
      if (data.targetId && clients.has(data.targetId)) {
        const targetWs = clients.get(data.targetId);
        if (targetWs.readyState === WebSocket.OPEN) {
          targetWs.send(JSON.stringify({
            ...data,
            senderId: ws.userId
          }));
        }
      }
    } catch (e) {
      console.error('Ошибка обработки сообщения:', e);
    }
  });

  ws.on('close', () => {
    if (ws.userId) {
      clients.delete(ws.userId);
      console.log(`Пользователь отключился: ${ws.userId}`);
    }
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Сервер запущен на порту ${PORT}`);
});