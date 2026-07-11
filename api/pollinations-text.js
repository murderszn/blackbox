/**
 * Proxy to Pollinations text / OpenAI-compatible chat completions.
 * Uses a server-side shared key when configured, while retaining optional
 * caller authorization for local/backward-compatible deployments.
 */
export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    if (req.method === 'OPTIONS') {
        return res.status(204).end();
    }

    if (req.method !== 'POST') {
        res.setHeader('Allow', 'POST, OPTIONS');
        return res.status(405).json({ error: 'Method not allowed. Use POST.' });
    }

    try {
        const body = req.body || {};
        const authHeader = req.headers.authorization || req.headers.Authorization || '';
        const keyFromBody = typeof body.apiKey === 'string' ? body.apiKey.trim() : '';
        const callerBearer = authHeader.startsWith('Bearer ')
            ? authHeader.slice(7).trim()
            : (authHeader.trim() || keyFromBody);
        const bearer = process.env.POLLINATIONS_API_KEY || process.env.POLLINATIONS_KEY || callerBearer;

        const messages = Array.isArray(body.messages) ? body.messages : null;
        if (!messages || messages.length === 0) {
            return res.status(400).json({ error: 'messages array is required' });
        }

        const model = body.model || 'openai';
        const wantStream = body.stream === true;
        const payload = {
            model,
            messages,
            temperature: body.temperature ?? 0.3,
            max_tokens: body.max_tokens ?? 1024,
            stream: wantStream,
        };

        const headers = {
            'Content-Type': 'application/json',
        };
        if (bearer) {
            headers.Authorization = `Bearer ${bearer}`;
        }

        let upstream = await fetch('https://gen.pollinations.ai/v1/chat/completions', {
            method: 'POST',
            headers,
            body: JSON.stringify(payload),
        });

        if (!upstream.ok) {
            upstream = await fetch('https://gen.pollinations.ai/v1/chat/completions', {
                method: 'POST',
                headers,
                body: JSON.stringify({ ...payload, stream: false }),
            });
        }

        if (!upstream.ok) {
            upstream = await fetch('https://text.pollinations.ai/openai', {
                method: 'POST',
                headers,
                body: JSON.stringify({ messages, model }),
            });
        }

        const contentType = upstream.headers.get('content-type') || '';

        if (!upstream.ok) {
            const errText = await upstream.text();
            console.error('Pollinations upstream error:', upstream.status, errText.slice(0, 500));
            return res.status(upstream.status).json({
                error: 'Pollinations request failed',
                status: upstream.status,
                details: errText.slice(0, 800),
            });
        }

        if (wantStream && contentType.includes('text/event-stream') && upstream.body) {
            res.setHeader('Content-Type', 'text/event-stream; charset=utf-8');
            res.setHeader('Cache-Control', 'no-cache, no-transform');
            res.setHeader('Connection', 'keep-alive');
            const reader = upstream.body.getReader();
            const decoder = new TextDecoder();
            while (true) {
                const { done, value } = await reader.read();
                if (done) break;
                res.write(typeof value === 'string' ? value : decoder.decode(value, { stream: true }));
            }
            return res.end();
        }

        const text = await upstream.text();

        let content = text;
        if (contentType.includes('application/json') || text.trim().startsWith('{')) {
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

        if (wantStream) {
            res.setHeader('Content-Type', 'text/event-stream; charset=utf-8');
            res.setHeader('Cache-Control', 'no-cache, no-transform');
            res.setHeader('Connection', 'keep-alive');
            const full = typeof content === 'string' ? content : JSON.stringify(content);
            const parts = full.split(/(\s+)/).filter(Boolean);
            let buf = '';
            for (let i = 0; i < parts.length; i++) {
                buf += parts[i];
                if (buf.length >= 12 || i === parts.length - 1) {
                    res.write(`data: ${JSON.stringify({ choices: [{ delta: { content: buf } }] })}\n\n`);
                    buf = '';
                }
            }
            res.write('data: [DONE]\n\n');
            return res.end();
        }

        return res.status(200).json({
            success: true,
            content: typeof content === 'string' ? content : JSON.stringify(content),
            provider: 'pollinations',
        });
    } catch (error) {
        console.error('Pollinations proxy error:', error);
        return res.status(500).json({
            error: 'Internal server error',
            message: error.message,
        });
    }
}
