import express from 'express';
const { createProxyMiddleware } = require('http-proxy-middleware');
const cookieParser = require('cookie-parser');
const cors = require('cors');
const fs = require('fs');
const https = require('https');

const PORT = 3000;
const API_SERVICE_URL = ''; // "https://example.com/api";

// SSL
const credentials = {
    cert: fs.readFileSync(__dirname + '/certs/_wildcard.custom-url.pem'),
    key: fs.readFileSync(__dirname + '/certs/_wildcard.custom-url-key.pem')
}

// Allowed origins for cors configuration
const allowOrigins = ['https://example.com', 'https://example.another.com'];

// Proxy configuration
const myProxy = createProxyMiddleware({
    target: API_SERVICE_URL,
    changeOrigin: true,
    secure: true,
    cookieDomainRewrite: { "*": ""},
    debug: true,
    followRedirects: true,
    logger: console,
    cert: credentials.cert,
    key: credentials.key
})

function corsOptionsDelegate (req, callback) {
    const isOriginDefined = !!req.header('origin');
    const isDomainAllowed = allowOrigins.indexOf(req.header('origin')) !== -1;
    let corsOptions;

    if (!isDomainAllowed && isOriginDefined) {
        callback(new Error('Not allowed by CORS'))
        return;
    }
    // Enable CORS for this request and set origin
    corsOptions = { credentials: true, origin: req.header('Origin') || true }
    callback(null, corsOptions);
}

const app = express();
app.use(cors(corsOptionsDelegate));
app.use(cookieParser());

// Use proxy configuration
app.use('*',myProxy);

// Start the Proxy
const httpsServer = https.createServer(credentials, app);

httpsServer.listen(PORT,() => {
    console.log("server starting on: " + PORT);
});