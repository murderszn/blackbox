export default async function handler(req, res) {
    // Enable CORS for all requests
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    // Handle preflight OPTIONS request
    if (req.method === 'OPTIONS') {
        return res.status(204).end();
    }

    // Only allow POST requests
    if (req.method !== 'POST') {
        res.setHeader('Allow', 'POST, OPTIONS');
        return res.status(405).json({ error: 'Method not allowed. Use POST.' });
    }

    try {
        const { name, email } = req.body;

        // Validate input
        if (!name || !email) {
            return res.status(400).json({ error: 'Name and email are required' });
        }

        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({ error: 'Invalid email format' });
        }

        // Get Supabase credentials from environment variables
        const supabaseUrl = process.env.SUPABASE_URL || 'https://hxlmaggrjhcqkmoygior.supabase.co';
        const supabaseKey = process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh4bG1hZ2dyamhjcWttb3lnaW9yIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE3NzIwMDIsImV4cCI6MjA3NzM0ODAwMn0.5mEYjwCjjU8m9nkqE3dVf5mv_CXYE0RvMLLNT_va30I';

        if (!supabaseUrl || !supabaseKey) {
            console.error('Missing Supabase credentials');
            return res.status(500).json({ error: 'Server configuration error' });
        }

        // Insert into Supabase
        const response = await fetch(`${supabaseUrl}/rest/v1/signups`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'apikey': supabaseKey,
                'Authorization': `Bearer ${supabaseKey}`,
                'Prefer': 'return=minimal'
            },
            body: JSON.stringify({
                name: name.trim(),
                email: email.trim().toLowerCase(),
                created_at: new Date().toISOString()
            })
        });

        // Supabase returns 201 for successful inserts, or 200 if rows are returned
        if (response.status === 201 || response.status === 200 || response.status === 204) {
            return res.status(200).json({ 
                success: true, 
                message: 'Signup successful'
            });
        }

        // Handle errors
        const errorData = await response.text();
        console.error('Supabase error:', response.status, errorData);
        return res.status(response.status).json({ 
            error: 'Failed to save signup',
            details: errorData 
        });

    } catch (error) {
        console.error('Signup error:', error);
        return res.status(500).json({ 
            error: 'Internal server error',
            message: error.message 
        });
    }
}
