import { WebSocketServer, WebSocket } from 'ws';
import { v4 as uuidv4 } from 'uuid';
import { Game, Snapshot } from './core/game';
import dotenv from 'dotenv';

dotenv.config();

const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 4000;
const TICK = process.env.ROOM_TICK ? parseInt(process.env.ROOM_TICK, 10) : 100; // ms
const WINDOW_MS = process.env.CONSENSUS_WINDOW_MS ? parseInt(process.env.CONSENSUS_WINDOW_MS, 10) : 120;
const ROOM_CAPACITY = process.env.ROOM_CAPACITY ? parseInt(process.env.ROOM_CAPACITY, 10) : 2;

interface Room {
  id: string;
  players: string[];
  sockets: Map<string, WebSocket>;
  game: Game;
  interval: NodeJS.Timeout;
}

const rooms: Map<string, Room> = new Map();

function createRoom(): Room {
  const id = uuidv4();
  const game = new Game(WINDOW_MS, TICK);
  const room: Room = {
    id,
    players: [],
    sockets: new Map(),
    game,
    interval: setInterval(() => {
      const snapshot: Snapshot = game.tick();
      // Diffuse la mise à jour à tous les clients de la room
      for (const ws of room.sockets.values()) {
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify({ type: 'snapshot', data: snapshot }));
        }
      }
    }, TICK),
  };
  rooms.set(id, room);
  return room;
}

// Cherche une room disponible (capacité < ROOM_CAPACITY)
function getAvailableRoom(): Room {
  for (const room of rooms.values()) {
    if (room.players.length < ROOM_CAPACITY) {
      return room;
    }
  }
  return createRoom();
}

const wss = new WebSocketServer({ port: PORT });
console.log(`WebSocket server started on ws://localhost:${PORT}`);

wss.on('connection', (ws: WebSocket) => {
  // Attribue un identifiant unique au joueur
  const playerId = uuidv4();
  // Trouve ou crée une room disponible
  const room = getAvailableRoom();
  // Ajoute le joueur à la room
  room.players.push(playerId);
  room.sockets.set(playerId, ws);
  room.game.addPlayer(playerId);
  console.log(`Player ${playerId} joined room ${room.id}`);
  // Envoie un message de bienvenue avec l'ID du joueur et la room
  ws.send(JSON.stringify({ type: 'welcome', data: { playerId, roomId: room.id } }));
  // Lorsque nous recevons un message d'un client
  ws.on('message', (data: Buffer) => {
    try {
      const msg = JSON.parse(data.toString());
      if (msg.type === 'intent') {
        const intent = msg.data?.intent as string;
        // Type de données attendu : { type: 'intent', data: { intent: 'up'|'down'|'left'|'right'|'straight' } }
        if (['up', 'down', 'left', 'right', 'straight'].includes(intent)) {
          room.game.recordIntent(playerId, intent as any);
        }
      }
    } catch (err) {
      console.error('Invalid message from client:', err);
    }
  });
  // Gestion de la fermeture
  ws.on('close', () => {
    console.log(`Player ${playerId} disconnected from room ${room.id}`);
    room.sockets.delete(playerId);
    room.players = room.players.filter((p) => p !== playerId);
    // Nettoyage : si plus aucun joueur, supprimer la room
    if (room.players.length === 0) {
      clearInterval(room.interval);
      rooms.delete(room.id);
    }
  });
});
