const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');
const url = require('url');

const PORT = process.env.PORT || 3000;
// URL do teu servidor Centauro no PC (pode ser configurado no painel do Render nas "Environment Variables")
const BACKEND_URL = (process.env.BACKEND_URL || 'http://centaurocloud.duckdns.org').replace(/\/+$/, '');

const MIME_TYPES = {
    '.html': 'text/html; charset=utf-8',
    '.css': 'text/css; charset=utf-8',
    '.js': 'application/javascript; charset=utf-8',
    '.json': 'application/json; charset=utf-8',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.webp': 'image/webp',
    '.svg': 'image/svg+xml',
    '.ico': 'image/x-icon'
};

const server = http.createServer((req, res) => {
    // Cabeçalhos CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', '*');

    if (req.method === 'OPTIONS') {
        res.writeHead(204);
        return res.end();
    }

    // Health check para o Render
    if (req.url === '/health') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify({ status: 'ok', backend: BACKEND_URL, uptime: process.uptime() }));
    }

    // 1. REENCAMINHAR PEDIDOS DA API E WEBSITES PARA O COMPUTADOR DE CASA
    if (req.url.startsWith('/api/') || req.url.startsWith('/sites/')) {
        forwardToBackend(req, res);
        return;
    }

    // 2. SERVIR FRONTEND ESTÁTICO (INDEX.HTML E RECURSOS)
    let safePath = path.normalize(url.parse(req.url).pathname).replace(/^(\.\.[\/\\])+/, '');
    if (safePath === '/' || safePath === '\\') safePath = '/index.html';

    const filePath = path.join(__dirname, 'public', safePath);

    fs.stat(filePath, (err, stats) => {
        if (!err && stats.isFile()) {
            const ext = path.extname(filePath).toLowerCase();
            const contentType = MIME_TYPES[ext] || 'application/octet-stream';
            res.writeHead(200, {
                'Content-Type': contentType,
                'Content-Length': stats.size,
                'Cache-Control': 'public, max-age=3600'
            });
            fs.createReadStream(filePath).pipe(res);
        } else {
            // SPA fallback: se não encontrar o ficheiro, serve index.html
            const indexPath = path.join(__dirname, 'public', 'index.html');
            fs.readFile(indexPath, (readErr, content) => {
                if (readErr) {
                    res.writeHead(404, { 'Content-Type': 'text/plain' });
                    res.end('Página não encontrada.');
                } else {
                    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
                    res.end(content);
                }
            });
        }
    });
});

function forwardToBackend(req, res) {
    let targetParsed;
    try {
        targetParsed = new URL(req.url, BACKEND_URL);
    } catch (e) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify({ error: 'URL de destino inválido.' }));
    }

    const isHttps = targetParsed.protocol === 'https:';
    const client = isHttps ? https : http;

    const proxyHeaders = { ...req.headers };
    proxyHeaders['host'] = targetParsed.host;
    proxyHeaders['x-forwarded-for'] = req.socket.remoteAddress || '';
    proxyHeaders['x-forwarded-proto'] = 'https';

    const options = {
        protocol: targetParsed.protocol,
        hostname: targetParsed.hostname,
        port: targetParsed.port || (isHttps ? 443 : 80),
        method: req.method,
        path: targetParsed.pathname + targetParsed.search,
        headers: proxyHeaders,
        timeout: 120000 // 2 minutos para grandes uploads de fotos
    };

    const proxyReq = client.request(options, (proxyRes) => {
        res.writeHead(proxyRes.statusCode, proxyRes.headers);
        proxyRes.pipe(res);
    });

    proxyReq.on('timeout', () => {
        proxyReq.destroy();
        if (!res.headersSent) {
            res.writeHead(504, { 'Content-Type': 'application/json; charset=utf-8' });
            res.end(JSON.stringify({ error: 'Tempo limite excedido ao comunicar com o teu computador em casa.' }));
        }
    });

    proxyReq.on('error', (err) => {
        console.error('[Render Proxy Error]', err.message);
        if (!res.headersSent) {
            res.writeHead(502, { 'Content-Type': 'application/json; charset=utf-8' });
            res.end(JSON.stringify({
                error: 'Não foi possível ligar ao teu computador em casa. Verifica se o PC está ligado e se o endereço BACKEND_URL está correto.',
                detalhe: err.message
            }));
        }
    });

    // Encaminha stream de dados (suporta uploads gigantescos sem carregar tudo em memória)
    req.pipe(proxyReq);
}

server.listen(PORT, () => {
    console.log(`[Centauro Render Gateway] A correr na porta ${PORT}`);
    console.log(`[Centauro Render Gateway] A encaminhar pedidos para: ${BACKEND_URL}`);
});
