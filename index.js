// index.js

// 1. Load required modules
const { SESSION_ID } = require('./settings');
const fs = require('fs');
const path = require('path');

// 2. Helper: Decode SESSION_ID to session folder
function decodeAuthState(sessionString, dir = 'session') {
    if (!sessionString) return;
    if (!fs.existsSync(dir)) fs.mkdirSync(dir);
    const data = JSON.parse(Buffer.from(sessionString, 'base64').toString());
    for (const [f, content] of Object.entries(data)) {
        fs.writeFileSync(path.join(dir, f), content, 'utf8');
    }
}

// 3. On startup, if SESSION_ID is set and session folder is missing, restore session
if (SESSION_ID && !fs.existsSync('session')) {
    console.log('[INFO] Restoring WhatsApp session from SESSION_ID...');
    decodeAuthState(SESSION_ID, 'session');
}

// 4. Baileys initialization
const {
    default: makeWASocket,
    useMultiFileAuthState,
    DisconnectReason,
    fetchLatestBaileysVersion,
    makeInMemoryStore
} = require('@whiskeysockets/baileys');

const P = require('pino');
const store = makeInMemoryStore({ logger: P().child({ level: 'silent', stream: 'store' }) });

async function startBot() {
    // Use multi-file auth state with the 'session' folder
    const { state, saveCreds } = await useMultiFileAuthState('session');

    // Fetch latest Baileys version (optional but recommended)
    const { version, isLatest } = await fetchLatestBaileysVersion();
    console.log(`[INFO] Using Baileys version: ${version.join('.')}, latest: ${isLatest}`);

    // Create socket (WhatsApp connection)
    const sock = makeWASocket({
        version,
        logger: P({ level: 'silent' }),
        printQRInTerminal: !fs.existsSync('session'), // Show QR only if session is missing
        auth: state,
        browser: ['Kingx-firev2', 'Chrome', '1.0.0']
    });

    store.bind(sock.ev);

    // Save credentials on update
    sock.ev.on('creds.update', saveCreds);

    // Connection updates
    sock.ev.on('connection.update', (update) => {
        const { connection, lastDisconnect } = update;
        if (connection === 'close') {
            const reason = lastDisconnect?.error?.output?.statusCode;
            if (reason === DisconnectReason.loggedOut) {
                console.log('[WARN] You have been logged out.');
                // Optionally, remove session folder here
                fs.rmSync('session', { recursive: true, force: true });
            } else {
                console.log('[INFO] Connection closed. Reconnecting...');
                startBot();
            }
        } else if (connection === 'open') {
            console.log('[SUCCESS] Connected to WhatsApp!');
        }
    });

    // Example: simple message handler
    sock.ev.on('messages.upsert', async (m) => {
        const msg = m.messages[0];
        if (!msg.message || msg.key.fromMe) return;
        if (msg.message.conversation === 'ping') {
            await sock.sendMessage(msg.key.remoteJid, { text: 'pong' }, { quoted: msg });
        }
    });
}

startBot();
