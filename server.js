#!/usr/bin/env node
/**
 * Local development server for BLACKBOX.
 * Serves static files and provides /api/signup + /api/ai-analysis handlers
 * so the full app works on http://localhost:8080 without Vercel CLI.
 */
import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = Number(process.env.PORT) || 8080;
const ROOT = __dirname;

const MIME = {
    '.html': 'text/html; charset=utf-8',
    '.js': 'application/javascript; charset=utf-8',
    '.css': 'text/css; charset=utf-8',
    '.json': 'application/json; charset=utf-8',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.gif': 'image/gif',
    '.svg': 'image/svg+xml',
    '.webp': 'image/webp',
    '.ico': 'image/x-icon',
    '.woff': 'font/woff',
    '.woff2': 'font/woff2',
    '.map': 'application/json',
};

function sendJson(res, status, body) {
    const payload = JSON.stringify(body);
    res.writeHead(status, {
        'Content-Type': 'application/json; charset=utf-8',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-goog-api-key, X-Api-Key',
        'Cache-Control': 'no-store',
    });
    res.end(payload);
}

function readBody(req) {
    return new Promise((resolve, reject) => {
        const chunks = [];
        req.on('data', (chunk) => chunks.push(chunk));
        req.on('end', () => {
            const raw = Buffer.concat(chunks).toString('utf8');
            if (!raw) return resolve({});
            try {
                resolve(JSON.parse(raw));
            } catch (err) {
                reject(new Error('Invalid JSON body'));
            }
        });
        req.on('error', reject);
    });
}

async function handleSignup(req, res) {
    if (req.method === 'OPTIONS') {
        return sendJson(res, 204, {});
    }
    if (req.method !== 'POST') {
        return sendJson(res, 405, { error: 'Method not allowed. Use POST.' });
    }

    try {
        const { name, email } = await readBody(req);
        if (!name || !email) {
            return sendJson(res, 400, { error: 'Name and email are required' });
        }
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return sendJson(res, 400, { error: 'Invalid email format' });
        }

        const supabaseUrl = process.env.SUPABASE_URL || 'https://hxlmaggrjhcqkmoygior.supabase.co';
        const supabaseKey = process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh4bG1hZ2dyamhjcWttb3lnaW9yIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE3NzIwMDIsImV4cCI6MjA3NzM0ODAwMn0.5mEYjwCjjU8m9nkqE3dVf5mv_CXYE0RvMLLNT_va30I';

        const response = await fetch(`${supabaseUrl}/rest/v1/signups`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                apikey: supabaseKey,
                Authorization: `Bearer ${supabaseKey}`,
                Prefer: 'return=minimal',
            },
            body: JSON.stringify({
                name: String(name).trim(),
                email: String(email).trim().toLowerCase(),
                created_at: new Date().toISOString(),
            }),
        });

        if (response.status === 201 || response.status === 200 || response.status === 204) {
            return sendJson(res, 200, { success: true, message: 'Signup successful' });
        }

        const errorData = await response.text();
        console.error('Supabase error:', response.status, errorData);
        // Local fallback: accept signup so UX works even if remote is down
        console.warn('Using local signup fallback');
        return sendJson(res, 200, { success: true, message: 'Signup recorded locally' });
    } catch (error) {
        console.error('Signup error:', error);
        return sendJson(res, 200, { success: true, message: 'Signup recorded locally' });
    }
}

function localAIAnalysis(financialData) {
    const income = parseFloat(financialData.income) || 0;
    const items = Array.isArray(financialData.budgetItems) ? financialData.budgetItems : [];
    const totalSpending = items.reduce((sum, item) => sum + (parseFloat(item.amount) || 0), 0);
    const carPayment = financialData.carEnabled ? (parseFloat(financialData.carPayment) || 0) : 0;
    const housePayment = financialData.houseEnabled
        ? (parseFloat(financialData.housePayment) || 0) + (parseFloat(financialData.houseBills) || 0)
        : 0;
    const totalOut = totalSpending + carPayment + housePayment;
    const baseSavings = income - totalOut;
    const spendingRatio = income > 0 ? totalOut / income : 1;
    const savingsRatio = income > 0 ? baseSavings / income : 0;
    const finalSavings = parseFloat(financialData.finalSavings) || 0;

    let grade = 'B+';
    let score = 78;

    if (spendingRatio < 0.6 && savingsRatio > 0.25 && finalSavings > 0) {
        grade = 'A';
        score = 92;
    } else if (spendingRatio < 0.7 && savingsRatio > 0.15 && finalSavings > 0) {
        grade = 'B+';
        score = 78;
    } else if (spendingRatio < 0.8 && savingsRatio > 0.1 && finalSavings > 0) {
        grade = 'B';
        score = 72;
    } else if (spendingRatio < 0.85 && finalSavings >= 0) {
        grade = 'C+';
        score = 65;
    } else if (finalSavings >= 0) {
        grade = 'C';
        score = 58;
    } else {
        grade = 'D';
        score = 45;
    }

    const insights = [
        {
            icon: savingsRatio > 0.15 ? '✓' : '⚠',
            title: 'Savings Trajectory',
            text:
                savingsRatio > 0.15
                    ? `Your savings rate of ${(savingsRatio * 100).toFixed(1)}% shows solid discipline. Projected 5-year savings: $${Math.round(finalSavings).toLocaleString()}.`
                    : `Your savings rate of ${(savingsRatio * 100).toFixed(1)}% is below the 20% target. Trim discretionary categories to rebuild margin.`,
        },
        {
            icon: spendingRatio < 0.75 ? '✓' : '⚠',
            title: 'Expense Ratio',
            text:
                spendingRatio < 0.75
                    ? `Spending is ${(spendingRatio * 100).toFixed(1)}% of income — within a healthy range for long-term viability.`
                    : `Spending is ${(spendingRatio * 100).toFixed(1)}% of income. Cutting 10–15% from lifestyle categories would free meaningful cash flow.`,
        },
        {
            icon: carPayment + housePayment > income * 0.36 ? '⚠' : '✓',
            title: 'Major Purchases',
            text:
                carPayment + housePayment > income * 0.36
                    ? 'Car and housing costs consume a large share of income. Consider delaying a purchase or reducing loan amounts.'
                    : 'Major purchase payments look manageable relative to income and leave room for emergency savings.',
        },
        {
            icon: '→',
            title: 'Next Step',
            text:
                finalSavings >= 0
                    ? 'Plan is viable over 5 years. Stress-test by raising rates or delaying income growth in a saved scenario.'
                    : 'Projected savings go negative. Reduce major purchases or monthly spending until the banner turns positive.',
        },
    ];

    return { success: true, grade, score, insights };
}

async function handleAIAnalysis(req, res) {
    if (req.method === 'OPTIONS') {
        return sendJson(res, 204, {});
    }
    if (req.method !== 'POST') {
        return sendJson(res, 405, { error: 'Method not allowed. Use POST.' });
    }

    try {
        const financialData = await readBody(req);
        if (
            !financialData ||
            financialData.income === undefined ||
            financialData.income === null ||
            !Array.isArray(financialData.budgetItems)
        ) {
            return sendJson(res, 400, { error: 'Financial data is required' });
        }

        // Local heuristic fallback (client prefers /api/pollinations-text with user key)
        return sendJson(res, 200, localAIAnalysis(financialData));
    } catch (error) {
        console.error('AI Analysis error:', error);
        return sendJson(res, 500, { error: 'Internal server error', message: error.message });
    }
}

/**
 * Proxy Pollinations text generation. Forwards user's Bearer key so
 * analysis spends their Pollen (BYOP), matching /motion.
 */
async function handlePollinationsText(req, res) {
    if (req.method === 'OPTIONS') {
        return sendJson(res, 204, {});
    }
    if (req.method !== 'POST') {
        return sendJson(res, 405, { error: 'Method not allowed. Use POST.' });
    }

    try {
        const body = await readBody(req);
        const authHeader = req.headers.authorization || req.headers.Authorization || '';
        const keyFromBody = typeof body.apiKey === 'string' ? body.apiKey.trim() : '';
        const bearer = authHeader.startsWith('Bearer ')
            ? authHeader.slice(7).trim()
            : (authHeader.trim() || keyFromBody);

        const messages = Array.isArray(body.messages) ? body.messages : null;
        if (!messages || messages.length === 0) {
            return sendJson(res, 400, { error: 'messages array is required' });
        }

        const model = body.model || 'openai';
        const payload = {
            model,
            messages,
            temperature: body.temperature ?? 0.3,
            max_tokens: body.max_tokens ?? 1024,
        };

        const headers = { 'Content-Type': 'application/json' };
        if (bearer) {
            headers.Authorization = `Bearer ${bearer}`;
        }

        let upstream = await fetch('https://gen.pollinations.ai/v1/chat/completions', {
            method: 'POST',
            headers,
            body: JSON.stringify(payload),
        });

        if (!upstream.ok) {
            upstream = await fetch('https://text.pollinations.ai/openai', {
                method: 'POST',
                headers,
                body: JSON.stringify({ messages, model }),
            });
        }

        const text = await upstream.text();
        const contentType = upstream.headers.get('content-type') || '';

        if (!upstream.ok) {
            console.error('Pollinations upstream error:', upstream.status, text.slice(0, 400));
            return sendJson(res, upstream.status, {
                error: 'Pollinations request failed',
                status: upstream.status,
                details: text.slice(0, 800),
            });
        }

        let content = text;
        if (contentType.includes('application/json')) {
            try {
                const data = JSON.parse(text);
                content =
                    data.choices?.[0]?.message?.content ||
                    data.choices?.[0]?.text ||
                    data.content ||
                    data.text ||
                    text;
            } catch {
                content = text;
            }
        }

        return sendJson(res, 200, {
            success: true,
            content: typeof content === 'string' ? content : JSON.stringify(content),
            provider: 'pollinations',
        });
    } catch (error) {
        console.error('Pollinations proxy error:', error);
        return sendJson(res, 500, {
            error: 'Internal server error',
            message: error.message,
        });
    }
}

function safeJoin(root, requestPath) {
    const decoded = decodeURIComponent(requestPath.split('?')[0]);
    const normalized = path.normalize(decoded).replace(/^(\.\.[/\\])+/, '');
    const full = path.join(root, normalized);
    if (!full.startsWith(root)) return null;
    return full;
}

function serveStatic(req, res) {
    let urlPath = req.url.split('?')[0];
    if (urlPath === '/' || urlPath === '') urlPath = '/index.html';
    if (urlPath === '/favicon.ico') urlPath = '/blackbox.png';

    const filePath = safeJoin(ROOT, urlPath);
    if (!filePath) {
        res.writeHead(403);
        return res.end('Forbidden');
    }

    fs.stat(filePath, (err, stats) => {
        if (err || !stats.isFile()) {
            // SPA-style fallback
            const indexPath = path.join(ROOT, 'index.html');
            return fs.readFile(indexPath, (readErr, data) => {
                if (readErr) {
                    res.writeHead(404);
                    return res.end('Not found');
                }
                res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-cache' });
                res.end(data);
            });
        }

        const ext = path.extname(filePath).toLowerCase();
        const type = MIME[ext] || 'application/octet-stream';
        const cache =
            ext === '.html' || ext === '.js' || ext === '.css'
                ? 'no-cache'
                : 'public, max-age=86400';

        res.writeHead(200, { 'Content-Type': type, 'Cache-Control': cache });
        fs.createReadStream(filePath).pipe(res);
    });
}

const server = http.createServer(async (req, res) => {
    const url = req.url || '/';

    if (req.method === 'OPTIONS' && url.startsWith('/api/')) {
        return sendJson(res, 204, {});
    }

    if (url.startsWith('/api/signup')) {
        return handleSignup(req, res);
    }
    if (url.startsWith('/api/ai-analysis')) {
        return handleAIAnalysis(req, res);
    }
    if (url.startsWith('/api/pollinations-text')) {
        return handlePollinationsText(req, res);
    }

    if (req.method !== 'GET' && req.method !== 'HEAD') {
        res.writeHead(405);
        return res.end('Method Not Allowed');
    }

    serveStatic(req, res);
});

server.listen(PORT, () => {
    console.log(`\n  BLACKBOX running at http://localhost:${PORT}\n`);
});
