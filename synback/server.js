import 'dotenv/config';
import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import http from 'http';
import { WebSocketServer } from 'ws';

import authRoutes from './routes/auth.js';
import notesRoutes from './routes/notes.js';
import blogsRoutes from './routes/blogs.js';
import geminiRoutes from './routes/gemini.js';
import paymentRoutes from './routes/payment.js';
import courseRoutes from './routes/courses.js';

const app = express();
const server = http.createServer(app);

// Middleware
app.use(cors());
app.use(express.json());

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/syntaxshiksha')
    .then(() => console.log('Connected to MongoDB'))
    .catch(err => console.error('MongoDB connection error:', err));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/notes', notesRoutes);
app.use('/api/blogs', blogsRoutes);
app.use('/api/gemini', geminiRoutes);
app.use('/api/payment', paymentRoutes);
app.use('/api/courses', courseRoutes);

const PORT = process.env.PORT || 5000;

const wss = new WebSocketServer({ server });

wss.on('connection', (ws) => {
    console.log('Client connected to WebSocket');
    ws.on('close', () => {
        console.log('Client disconnected from WebSocket');
    });
});

server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});

export { wss };