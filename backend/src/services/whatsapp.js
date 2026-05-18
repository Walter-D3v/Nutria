import pkg from 'whatsapp-web.js';
import fs from 'fs';
import path from 'path';
const { Client, LocalAuth } = pkg;

let whatsappClient = null;
let isReady = false;
let ioRef = null;

const AUTH_DIR = './.wwebjs_auth/session-default';

export function setIo(io) {
    ioRef = io;
}

export function getClient() {
    return whatsappClient;
}

export function getIsReady() {
    return isReady;
}

export function initWhatsApp() {
    if (whatsappClient) {
        if (isReady) {
            ioRef?.emit('ready', { status: 'Conectado exitosamente' });
        }
        return;
    }

    const execPath = process.env.PUPPETEER_EXECUTABLE_PATH;
    const finalExecPath = execPath === '/nix/store/chromium' ? 'chromium' : (execPath || undefined);

    whatsappClient = new Client({
        authStrategy: new LocalAuth({ dataPath: AUTH_DIR }),
        puppeteer: {
            executablePath: finalExecPath,
            args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
        }
    });

    whatsappClient.on('qr', (qr) => {
        console.log(`\n--- ESCANEA EL CÓDIGO QR EN LA WEB ---\n`);
        ioRef?.emit('qr', { qr });
    });

    whatsappClient.on('authenticated', () => {
        console.log(`Autenticación exitosa.`);
        ioRef?.emit('loading', { message: 'Autenticando...' });
    });

    whatsappClient.on('loading_screen', (percent, message) => {
        console.log(`Cargando WhatsApp GUI: ${percent}% ${message}`);
        ioRef?.emit('loading', { message: `Cargando interfaz... ${percent}%` });
    });

    whatsappClient.on('ready', () => {
        isReady = true;
        console.log(`\n¡CONEXIÓN EXITOSA! ✅ El cliente está listo.`);
        ioRef?.emit('ready', { status: 'Conectado exitosamente' });
    });

    whatsappClient.on('auth_failure', (msg) => {
        console.error(`Fallo en la autenticación`, msg);
        ioRef?.emit('auth_failure', { error: 'Fallo al autenticar', details: msg });
        isReady = false;
    });

    whatsappClient.on('disconnected', (reason) => {
        console.log(`Cliente desconectado:`, reason);
        ioRef?.emit('disconnected', { reason });
        isReady = false;
        if (whatsappClient) {
            whatsappClient.destroy();
            whatsappClient = null;
        }
    });

    console.log(`Iniciando cliente de WhatsApp global...`);
    isReady = false;
    whatsappClient.initialize();
}

/**
 * Envía un mensaje a un número.
 * @param {string} phone 
 * @param {string} text 
 */
export async function sendWhatsAppMessage(phone, text) {
    if (!whatsappClient || !isReady) {
        throw new Error(`WhatsApp no está conectado.`);
    }
    const numberId = await whatsappClient.getNumberId(phone);
    if (!numberId) {
        throw new Error(`El número ${phone} no está registrado en WhatsApp.`);
    }
    await whatsappClient.sendMessage(numberId._serialized, text);
}

export async function logoutWhatsApp() {
    if (whatsappClient) {
        console.log(`Cerrando sesión de WhatsApp global...`);
        try {
            if (isReady) await whatsappClient.logout();
        } catch (e) {
            console.error(`Error logout:`, e.message);
        }
        try {
            await whatsappClient.destroy();
        } catch (e) {
            console.error(`Error destroy:`, e.message);
        }
        whatsappClient = null;
        isReady = false;
    }
    
    if (fs.existsSync(AUTH_DIR)) {
        try {
            fs.rmSync(AUTH_DIR, { recursive: true, force: true });
            console.log(`Carpeta de sesión eliminada.`);
        } catch (e) {
            console.error(`Error borrar carpeta:`, e.message);
        }
    }
    
    ioRef?.emit('disconnected', { reason: 'Cierre de sesión manual' });
}
