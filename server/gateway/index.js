const express = require('express');
const cookieParser = require('cookie-parser');
const cors = require('cors');
require('dotenv').config();

const Eureka = require('eureka-js-client').Eureka;
const eurekaConfig = require('./config/eureka.config');
const { authMiddleware } = require('./middlewares/AuthMiddleware');
const { createProxyMiddleware } = require('http-proxy-middleware');

// --------------------------------------------------------
// Eureka Client
// --------------------------------------------------------
const eurekaClient = new Eureka(eurekaConfig);

// --------------------------------------------------------
// App Setup
// NOTE: Do NOT use express.json() globally — it consumes the
// Explination: 
// express.json() work with body-parser that consumes the stream and converts it to a JS object, 
// while the proxy pipes the raw stream forward. 
// The problem is that after body-parser drinks the stream, 
// there's simply nothing left for the proxy to pipe.
// so that's the main prblm i had it's like the gateway was pasing an empty body to the auth service and that's why i had 400 bad request error
// --------------------------------------------------------
const app = express();
app.use(cookieParser());

// Configure CORS properly — tighten origins in production
app.use(cors({
    origin: true,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
}));

// --------------------------------------------------------
// Health / Info / Debug — these non-proxy routes can use **JSON parsing**
// --------------------------------------------------------
app.get('/health', (req, res) => res.json({ status: 'UP' }));

app.get('/info', (req, res) =>
    res.json({ service: 'Node GATEWAY', status: 'UP', version: '1.0.0' })
);

app.get('/debug/services', express.json(), (req, res) => {
    try {
        const instances = eurekaClient.getInstancesByAppId(process.env.AUTH_SERVICE_NAME);
        res.json({
            serviceName: process.env.AUTH_SERVICE_NAME,
            instances: instances || [],
            allApps: eurekaClient
                .getApplications()
                .getRegisteredApplications()
                .map(a => a.name),
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// --------------------------------------------------------
// Eureka Service URL Resolver
// --------------------------------------------------------
const getServiceUrl = async (serviceName, retries = 5, delay = 3000) => {
    for (let i = 0; i < retries; i++) {
        console.log(`[Eureka] Looking for: ${serviceName} (attempt ${i + 1}/${retries})`);

        const instances = eurekaClient.getInstancesByAppId(serviceName);

        if (instances && instances.length > 0) {
            // Simple round-robin instance pick
            const instance = instances[Math.floor(Math.random() * instances.length)];

            // Prefer hostName over ipAddr when not loopback, to avoid 127.0.0.1 in containers
            const host = instance.hostName && instance.hostName !== 'localhost'
                ? instance.hostName
                : instance.ipAddr;

            const port = instance.port.$;
            const isSecure = instance.securePort?.['@enabled'] === 'true';
            const protocol = isSecure ? 'https' : 'http';

            const url = `${protocol}://${host}:${port}`;
            console.log(`[Eureka] Resolved ${serviceName} → ${url}`);
            return url;
        }

        console.warn(`[Eureka] No instances for ${serviceName}, retrying in ${delay / 1000}s...`);
        await new Promise(resolve => setTimeout(resolve, delay));
    }

    console.error(`[Eureka] Service ${serviceName} not found after ${retries} attempts`);
    return null;
};

// --------------------------------------------------------
// Strip upstream CORS headers to prevent duplicate header conflicts
// --------------------------------------------------------
const stripUpstreamCorsHeaders = (proxyRes) => {
    delete proxyRes.headers['access-control-allow-origin'];
    delete proxyRes.headers['access-control-allow-credentials'];
    delete proxyRes.headers['access-control-allow-methods'];
    delete proxyRes.headers['access-control-allow-headers'];
};

// --------------------------------------------------------
// Proxy Error Handler
// --------------------------------------------------------
const proxyErrorHandler = (serviceName) => (err, req, res) => {
    console.error(`[Proxy:${serviceName}] Error: ${err.message}`);
    if (!res.headersSent) {
        res.status(504).json({
            error: `${serviceName} unavailable`,
            details: err.message,
        });
    }
};

// --------------------------------------------------------
// Start: Register with Eureka → Resolve Services → Mount Proxies → Listen
// --------------------------------------------------------
eurekaClient.start(async (error) => {
    if (error) {
        console.error('[Eureka] Failed to register:', error);
        process.exit(1);
    }

    console.log('[Eureka] Gateway registered successfully');

    // Resolve AUTH service URL
    const authServiceUrl = await getServiceUrl(process.env.AUTH_SERVICE_NAME);

    if (!authServiceUrl) {
        console.error('[Gateway] AUTH service unavailable. Exiting.');
        process.exit(1);
    }

    console.log(`[Gateway] AUTH service ready at: ${authServiceUrl}`);

    // -------------------------------------------------------
    // AUTH PROXY — public routes, no auth middleware
    // -------------------------------------------------------
    app.use(
        '/auth',
        createProxyMiddleware({
            target: authServiceUrl,
            changeOrigin: true,
            pathRewrite: { '^/auth': '' },
            on: {
                proxyRes: stripUpstreamCorsHeaders,
                error: proxyErrorHandler('AUTH'),
            },
        })
    );

    // -------------------------------------------------------
    // USERS PROXY — protected, requires valid JWT
    // -------------------------------------------------------
    app.use('/users', authMiddleware, createProxyMiddleware({
        target: authServiceUrl,
        changeOrigin: true,
        pathRewrite: { '^/users': '/' },
        on: {
            proxyReq: (proxyReq, req) => {
                if (req.user) {
                    proxyReq.setHeader('X-User-Id', req.user.userId);
                    proxyReq.setHeader('X-User-Name', req.user.userName);
                }
            },
            proxyRes: stripUpstreamCorsHeaders,
            error: proxyErrorHandler('USERS'),
        },

    }));

    // Resolve Posts service URL
    const postsServiceUrl = await getServiceUrl(process.env.POSTS_SERVICE_NAME);

    if (!postsServiceUrl) {
        console.error('[Gateway] Posts service unavailable. Exiting.');
        process.exit(1);
    }

    console.log(`[Gateway] Posts service ready at: ${postsServiceUrl}`);

    app.use('/posts', authMiddleware, createProxyMiddleware({
        target: postsServiceUrl,
        changeOrigin: true,
        pathRewrite: { '^/posts': '/' },
        on: {
            proxyReq: (proxyReq, req) => {
                if (req.user) {
                    proxyReq.setHeader('X-User-Id', req.user.userId);
                    proxyReq.setHeader('X-User-Name', req.user.userName);
                }
            },
            proxyRes: stripUpstreamCorsHeaders,
            error: proxyErrorHandler('USERS'),
        },

    }));

    const notifServiceUrl = await getServiceUrl(process.env.NOTIFICATIONS_SERVICE_NAME);

    if (!notifServiceUrl) {
        console.error('[Gateway] Notifications service unavailable. Exiting.');
        process.exit(1);
    }

    console.log(`[Gateway] Notifications service ready at: ${notifServiceUrl}`);

    app.use('/notifications', authMiddleware, createProxyMiddleware({
        target: notifServiceUrl,
        changeOrigin: true,
        pathRewrite: { '^/notifications': '/' },
        on: {
            proxyReq: (proxyReq, req) => {
                if (req.user) {
                    proxyReq.setHeader('X-User-Id', req.user.userId);
                    proxyReq.setHeader('X-User-Name', req.user.userName);
                }
            },
            proxyRes: stripUpstreamCorsHeaders,
            error: proxyErrorHandler('USERS'),
        },

    }));

    const contentServiceUrl = await getServiceUrl(process.env.CONTENT_SERVICE_NAME);

    if (!contentServiceUrl) {
        console.error('[Gateway] Content service unavailable. Exiting.');
        process.exit(1);
    }

    console.log(`[Gateway] Content service ready at: ${contentServiceUrl}`);

    app.use('/content', authMiddleware, createProxyMiddleware({
        target: contentServiceUrl,
        changeOrigin: true,
        pathRewrite: { '^/content': '/' },
        on: {
            proxyReq: (proxyReq, req) => {
                if (req.user) {
                    proxyReq.setHeader('X-User-Id', req.user.userId);
                    proxyReq.setHeader('X-User-Name', req.user.userName);
                }
            },
            proxyRes: stripUpstreamCorsHeaders,
            error: proxyErrorHandler('USERS'),
        },

    }));

    // -------------------------------------------------------
    // Global Error Handler — must be after all routes
    // -------------------------------------------------------
    app.use((err, req, res, next) => {
        console.error('[Gateway] Unhandled error:', err);
        if (!res.headersSent) {
            res.status(500).json({ error: 'Internal Gateway Error' });
        }
    });

    // -------------------------------------------------------
    // Start HTTP Server
    // -------------------------------------------------------
    const PORT = process.env.PORT || 8080;
    app.listen(PORT, () => {
        console.log(`[Gateway] Running on port ${PORT}`);
    });
});

// --------------------------------------------------------
// Graceful Shutdown
// --------------------------------------------------------
process.on('SIGINT', () => {
    console.log('[Gateway] Shutting down, deregistering from Eureka...');
    eurekaClient.stop(() => {
        console.log('[Gateway] Eureka client stopped');
        process.exit(0);
    });
});