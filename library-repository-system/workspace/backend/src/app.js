import express from 'express';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import os from 'os';
import authRoutes from './routes/authRoutes.js';
import bookRoutes from './routes/bookRoutes.js';
import borrowingRoutes from './routes/borrowingRoutes.js';
import { errorHandler, requestLogger } from './middleware/errorHandler.js';

const app = express();
const PORT = process.env.PORT || 5000;

// Request logging middleware
app.use(requestLogger);

// Rate limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
    message: {
        error: 'Too many requests from this IP, please try again later.',
        retryAfter: '15 minutes'
    },
    standardHeaders: true,
    legacyHeaders: false,
});
app.use(limiter);

// Body parser with size limits
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// CORS configuration - Updated for local network access
const corsOptions = {
    origin: function (origin, callback) {
        if (!origin) return callback(null, true);
        
        const allowedOrigins = [
            'http://localhost:8080',
            'http://127.0.0.1:8080',
            /^http:\/\/192\.168\.\d{1,3}\.\d{1,3}:8080$/,
            /^http:\/\/10\.\d{1,3}\.\d{1,3}\.\d{1,3}:8080$/,
            /^http:\/\/172\.(1[6-9]|2[0-9]|3[0-1])\.\d{1,3}\.\d{1,3}:8080$/,
            /^http:\/\/[\w.-]+:8080$/
        ];
        
        const isAllowed = allowedOrigins.some(pattern => {
            if (typeof pattern === 'string') {
                return pattern === origin;
            }
            return pattern.test(origin);
        });
        
        callback(null, isAllowed);
    },
    credentials: true,
    optionsSuccessStatus: 200
};
app.use(cors(corsOptions));

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({ 
        status: 'OK', 
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        version: process.env.npm_package_version || '1.0.0'
    });
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/books', bookRoutes);
app.use('/api/borrowings', borrowingRoutes);

// 404 handler for unknown routes
app.use('*', (req, res) => {
    res.status(404).json({ 
        message: `Route ${req.originalUrl} not found`,
        method: req.method 
    });
});

// Error handler (MUST BE LAST)
app.use(errorHandler);

// Graceful shutdown
process.on('SIGTERM', () => {
    console.log('SIGTERM received. Shutting down gracefully...');
    process.exit(0);
});

process.on('SIGINT', () => {
    console.log('SIGINT received. Shutting down gracefully...');
    process.exit(0);
});

// Start server - Simplified version to avoid any syntax issues
const HOST = process.env.HOST || '0.0.0.0';
app.listen(PORT, HOST, () => {
    console.log(`🚀 Server running on:`);
    console.log(`   - Local: http://localhost:${PORT}`);
    console.log(`   - Network: http://127.0.0.1:${PORT}`);
    console.log(`   - All interfaces: http://0.0.0.0:${PORT}`);
    console.log(`📊 Health check available at /api/health`);
    console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`💡 To find your network IP, run: ipconfig`);
});