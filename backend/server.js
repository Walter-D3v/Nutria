import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import { generateTestMessage, generateMessageForProfile } from './src/services/ai.js';
import { setIo, getClient, getIsReady, initWhatsApp, sendWhatsAppMessage, logoutWhatsApp } from './src/services/whatsapp.js';
import prisma from './src/config/db.js';
import profileRoutes from './src/routes/profile.routes.js';
import snapshotRoutes from './src/routes/snapshot.routes.js';
import messageRoutes from './src/routes/message.routes.js';
import appointmentRoutes from './src/routes/appointment.routes.js';
import authRoutes from './src/routes/auth.routes.js';
import { requireAuth } from './src/middlewares/auth.middleware.js';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'nutria_super_secret_key_2026';

const app = express();

// --- CORS Configuración ---
const whitelist = [
    'http://localhost:3000',
    'https://nutria-rosy.vercel.app',
    'https://nutria-git-main-walter-d3vs-projects.vercel.app'
];

app.use(cors({
    origin: function (origin, callback) {
        if (!origin || whitelist.indexOf(origin) !== -1 || true) { // Temporalmente permitiendo todo, o true
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'ngrok-skip-browser-warning'],
    credentials: true,
}));

app.use(express.json());


// --- API REST ---
app.use('/api/auth', authRoutes); // Público

app.use('/api/profiles', requireAuth, profileRoutes); // Protegido
app.use('/api/profiles/:id/snapshots', requireAuth, snapshotRoutes); // Protegido
app.use('/api/messages', requireAuth, messageRoutes); // Protegido
app.use('/api/appointments', requireAuth, appointmentRoutes); // Protegido

const httpServer = createServer(app);
const io = new Server(httpServer, {
    cors: {
        origin: whitelist,
        methods: ["GET", "POST"],
        credentials: true
    }
});

// Registrar io en el singleton de WhatsApp y en la app (para las rutas)
setIo(io);
app.set('io', io);

// Configuración de rutas básicas
app.get('/', (req, res) => {
    res.send({ status: 'API is running', multiClient: true });
});

// Iniciar sesión bajo demanda a través de Websockets
io.use((socket, next) => {
    const token = socket.handshake.auth?.token;
    if (!token) {
        return next(new Error('Authentication error: Token missing'));
    }
    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        socket.user = decoded; // { id, email }
        next();
    } catch (e) {
        return next(new Error('Authentication error: Invalid token'));
    }
});

io.on('connection', (socket) => {
    const userId = socket.user.id;
    console.log(`Cliente web conectado: ${socket.id} (Usuario ID: ${userId})`);
    
    // Devolver el estado actual a este cliente
    if (getClient() && getIsReady()) {
        socket.emit('ready', { status: 'Conectado exitosamente' });
    }

    socket.on('start-connection', () => {
        if (!getClient()) {
            initWhatsApp();
        } else if (getIsReady()) {
            socket.emit('ready', { status: 'Ya conectado' });
        } else {
            console.log(`El cliente global ya está en proceso de inicio.`);
        }
    });

    socket.on('send_message', async (data) => {
        if (getClient() && getIsReady()) {
            let profile = null;
            let text = null;
            let status = 'failed';
            try {
                const { profileId, number, patientName, topic } = data;

                if (profileId) {
                    profile = await prisma.profile.findUnique({ where: { id: parseInt(profileId) } });
                }

                if (profile) {
                    text = await generateMessageForProfile(profile);
                } else {
                    text = await generateTestMessage(patientName, topic);
                }

                console.log(`Mensaje generado para enviar:`, text);

                const targetNumber = profile?.phone || number;
                await sendWhatsAppMessage(targetNumber, text);
                status = 'sent';
                socket.emit('message_sent', { success: true, to: targetNumber });
            } catch (e) {
                console.error(`Error al enviar mensaje desde la UI:`, e);
                socket.emit('message_sent', { success: false, error: e.message });
            } finally {
                if (profile && text) {
                    await prisma.messageLog.create({
                        data: { profileId: profile.id, content: text, status }
                    }).catch(err => console.error('Error al guardar historial de mensaje:', err));
                }
            }
        } else {
            socket.emit('message_sent', { success: false, error: 'WhatsApp no está conectado' });
        }
    });

    socket.on('logout', async () => {
        await logoutWhatsApp();
    });

    socket.on('disconnect', () => {
        console.log(`Cliente web desconectado: ${socket.id}`);
    });
});

const PORT = process.env.PORT || 3001;

prisma.$connect()
    .then(() => {
        console.log('✅ Base de datos conectada exitosamente a Azure');
        httpServer.listen(PORT, () => {
            console.log(`Servidor Backend escuchando en el puerto ${PORT}`);
        });
    })
    .catch((error) => {
        console.error('❌ Error al conectar a la base de datos:', error);
        process.exit(1);
    });
