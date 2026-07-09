/**
 * Proxy to Pollinations text / OpenAI-compatible chat completions.
 * Forwards the caller's Authorization (user's Pollinations key / Pollen).
 * Client never needs CORS access to gen.pollinations.ai.
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
        const bearer = authHeader.startsWith('Bearer ')
            ? authHeader.slice(7).trim()
            : (authHeader.trim() || keyFromBody);

        const messages = Array.isArray(body.messages) ? body.messages : null;
        if (!messages || messages.length === 0) {
            return res.status(400).json({ error: 'messages array is required' });
        }

        const model = body.model || 'openai';
        const payload = {
            model,
            messages,
            temperature: body.temperature ?? 0.3,
            max_tokens: body.max_tokens ?? 1024,
        };

        const headers = {
            'Content-Type': 'application/json',
        };
        if (bearer) {
            headers.Authorization = `Bearer ${bearer}`;
        }

        // Prefer OpenAI-compatible gen endpoint; fall back to text.pollinations.ai
        let upstream = await fetch('https://gen.pollinations.ai/v1/chat/completions', {
            method: 'POST',
            headers,
            body: JSON.stringify(payload),
        });

        if (!upstream.ok) {
            // Legacy text endpoint used by /motion
            upstream = await fetch('https://text.pollinations.ai/openai', {
                method: 'POST',
                headers,
                body: JSON.stringify({
                    messages,
                    model,
                }),
            });
        }

        const text = await upstream.text();
        const contentType = upstream.headers.get('content-type') || '';

        if (!upstream.ok) {
            console.error('Pollinations upstream error:', upstream.status, text.slice(0, 500));
            return res.status(upstream.status).json({
                error: 'Pollinations request failed',
                status: upstream.status,
                details: text.slice(0, 800),
            });
        }

        // Normalize to { content: string } for the client
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
