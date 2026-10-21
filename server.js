const http = require('http');
const { WebSocketServer, WebSocket } = require('ws');

const server = http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/plain; charset=utf-8' });
  res.end('Сигнальный сервер работает!\n');
});

const wss = new WebSocketServer({ server });
const clients = new Map(); // Хранилище: ID -> WebSocket

wss.on('connection', (ws) => {
  ws.on('message', (message) => {
    try {
      const data = JSON.parse(message);

      // 1. Пинг от клиента для удержания связи
      if (data.type === 'ping') {
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify({ type: 'pong' }));
        }
        return;
      }

      // 2. Регистрация нового ID
      if (data.type === 'register') {
        clients.set(data.id, ws);
        ws.userId = data.id;
        console.log(`[Онлайн] Зарегистрирован ID: ${data.id}`);
        return;
      }

      // 3. Пересылка чат-сообщений или вызовов
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
      console.error('Ошибка обработки:', e);
    }
  });

  ws.on('close', () => {
    if (ws.userId) {
      clients.delete(ws.userId);
      console.log(`[Офлайн] Отключился ID: ${ws.userId}`);
    }
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Сервер запущен на порту ${PORT}`);
});
