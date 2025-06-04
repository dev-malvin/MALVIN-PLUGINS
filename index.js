const express = require('express');
const { makeWASocket, useMultiFileAuthState, DisconnectReason } = require('@whiskeysockets/baileys');
const qrcode = require('qrcode-terminal');

// --- Your module imports ---
const {
    AntiDelDB, initializeAntiDeleteSettings, setAnti, getAnti, getAllAntiDeleteSettings
} = require('./data/antidel');
const {
    saveContact, loadMessage, getName, getChatSummary, saveGroupMetadata, getGroupMetadata,
    saveMessageCount, getInactiveGroupMembers, getGroupMembersMessageCount, saveMessage
} = require('./data/store');
const {
    DeletedText, DeletedMedia, AntiDelete
} = require('./lib/antidel');
const {
    getBuffer, getGroupAdmins, getRandom, h2k, isUrl, Json, runtime, sleep, fetchJson
} = require('./lib/functions');
const { sms, downloadMediaMessage } = require('./lib/msg');

// --- Minimal Express web server for Render port binding ---
const app = express();
const PORT = process.env.PORT || 3000;
app.get('/', (req, res) => res.send('Kingx-firev2 WhatsApp bot is running!'));
app.listen(PORT, () => {
    console.log(`Web server running on port ${PORT}`);
});

// --- Baileys WhatsApp bot setup ---
async function startBot() {
    const { state, saveCreds } = await useMultiFileAuthState('auth_info_baileys');
    const sock = makeWASocket({ auth: state });

    sock.ev.on('creds.update', saveCreds);

    // Print QR code in terminal
    sock.ev.on('connection.update', (update) => {
        const { connection, lastDisconnect, qr } = update;
        if (qr) {
            qrcode.generate(qr, { small: true });
        }
        if (connection === 'close') {
            const shouldReconnect = lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut;
            if (shouldReconnect) {
                startBot();
            } else {
                console.log('Logged out.');
            }
        } else if (connection === 'open') {
            console.log('✅ Connected to WhatsApp');
            initializeAntiDeleteSettings();
        }
    });

    // MESSAGE RECEIVED
    sock.ev.on('messages.upsert', async ({ messages, type }) => {
        if (type !== 'notify') return;
        for (const msg of messages) {
            try {
                await saveMessage(msg);

                // Run anti-delete if enabled
                if (await getAnti(msg.key.remoteJid)) {
                    await AntiDelete(msg, sock);
                }

                // Save contact (if available)
                if (msg.pushName || msg.key.participant)
                    await saveContact(msg.pushName || msg.key.participant);

                // Add your command and feature handling here

            } catch (e) {
                console.error('Error handling message:', e);
            }
        }
    });

    // MESSAGE DELETION (ANTI-DELETE)
    sock.ev.on('messages.delete', async (item) => {
        for (const key of item.keys) {
            if (await getAnti(key.remoteJid)) {
                const deletedMsg = await loadMessage(key.id);
                if (deletedMsg) {
                    await sock.sendMessage(key.remoteJid, { text: `Anti-delete: Message restored\n${JSON.stringify(deletedMsg)}` });
                }
            }
        }
    });

    // GROUP PARTICIPANTS UPDATE
    sock.ev.on('group-participants.update', async (update) => {
        try {
            await saveGroupMetadata(update.id, update.participants || []);
            // Add your custom group join/leave logic here
        } catch (e) {
            console.error('Error in group participants update:', e);
        }
    });

    // GROUP UPDATE
    sock.ev.on('groups.update', async (updates) => {
        for (const update of updates) {
            try {
                await saveGroupMetadata(update.id, update.participants || []);
                // Custom logic for group subject, settings, etc.
            } catch (e) {
                console.error('Error in groups.update:', e);
            }
        }
    });

    // CALL EVENTS (optional, extend as needed)
    sock.ev.on('call', async (callEvents) => {
        // Example: handle call events (auto-block, logging, etc.)
    });

    // PRESENCE UPDATES (optional)
    sock.ev.on('presence.update', async (presence) => {
        // Handle presence updates (typing, online, offline)
    });

    // BLOCKLIST UPDATES (optional)
    sock.ev.on('blocklist.set', async (blocklist) => {
        // Handle blocklist updates
    });

    // BATTERY STATUS (optional)
    sock.ev.on('battery.update', (info) => {
        // info.level, info.isCharging
    });
}

startBot().catch(console.error);
