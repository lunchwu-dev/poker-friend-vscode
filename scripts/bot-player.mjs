import { io } from 'socket.io-client';

const TOKEN = process.argv[2];
const ROOM_CODE = process.argv[3];
const SEAT = parseInt(process.argv[4] || '1', 10);

if (!TOKEN || !ROOM_CODE) {
  console.error('Usage: node bot-player.mjs <token> <roomCode> [seatIndex]');
  process.exit(1);
}

const socket = io('http://localhost:3000', {
  auth: { token: TOKEN },
  transports: ['websocket'],
});

socket.on('connect', () => {
  console.log('[Bot] Connected:', socket.id);

  // Join room
  socket.emit('room:join', { roomCode: ROOM_CODE });
});

socket.on('room:state', (state) => {
  console.log('[Bot] Room state received, seats occupied:', 
    state.seats.filter(s => s.status !== 'empty').length);
  
  // Check if already seated
  const alreadySeated = state.seats.some(s => s.playerId && s.nickname === 'BotPlayer');
  if (!alreadySeated) {
    console.log(`[Bot] Sitting at seat ${SEAT}...`);
    socket.emit('seat:sit', { seatIndex: SEAT, buyinAmount: 1000 });
  }
});

socket.on('game:action_on', (data) => {
  const a = data.availableActions || {};
  console.log('[Bot] Action on me!', JSON.stringify(a));
  if (a.canCheck) {
    console.log('[Bot] Checking...');
    socket.emit('game:action', { type: 'check' });
  } else if (a.canCall) {
    console.log('[Bot] Calling...');
    socket.emit('game:action', { type: 'call' });
  } else {
    console.log('[Bot] Folding...');
    socket.emit('game:action', { type: 'fold' });
  }
});

socket.on('game:hand_start', (data) => {
  console.log('[Bot] Hand started! Hand #', data.handNumber);
});

socket.on('game:deal_hole', (data) => {
  console.log('[Bot] My hole cards:', data.cards);
});

socket.on('game:deal_community', (data) => {
  console.log('[Bot] Community cards:', data.cards);
});

socket.on('game:hand_result', (data) => {
  console.log('[Bot] Hand result:', JSON.stringify(data.winners));
});

socket.on('game:error', (err) => {
  console.error('[Bot] Error:', err.message);
});

socket.on('disconnect', () => {
  console.log('[Bot] Disconnected');
});

// Keep alive
process.on('SIGINT', () => {
  socket.close();
  process.exit(0);
});
