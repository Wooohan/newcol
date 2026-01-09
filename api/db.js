
/**
 * Supabase Cloud Relay v3.8
 * Project: fiuodbhgvmylvbanbfve
 */

const SUPABASE_URL = "https://fiuodbhgvmylvbanbfve.supabase.co";
// Using the 'messenger' secret key exactly as shown in your settings screenshot
const SUPABASE_KEY = "sb_secret_x33xGa8YmioWvfyvDtWNXA_fT_8VL9V";

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, x-client-info, apikey, Authorization');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { action, collection, filter, update } = req.body;
  
  if (!SUPABASE_URL || !SUPABASE_KEY) {
    return res.status(500).json({ 
      error: "Relay Configuration Missing", 
      details: "Missing URL or Secret Key in api/db.js" 
    });
  }

  const table = collection || 'provisioning_logs';
  
  // Standard headers for all Supabase Data API requests
  const headers = {
    'apikey': SUPABASE_KEY,
    'Authorization': `Bearer ${SUPABASE_KEY}`,
    'Content-Type': 'application/json',
    'Prefer': 'return=representation'
  };

  try {
    switch (action) {
      case 'ping':
        // Querying 'agents' table specifically, as confirmed working in your Python script.
        // This confirms the Key has full Service Role access to the data layer.
        const probe = await fetch(`${SUPABASE_URL}/rest/v1/agents?select=id&limit=1`, { 
          method: 'GET', 
          headers: {
            'apikey': SUPABASE_KEY,
            'Authorization': `Bearer ${SUPABASE_KEY}`
          } 
        });
        
        // 200/204 = Table exists and key is valid.
        // 404 = Key is valid but table doesn't exist (Setup needed).
        // 401/403 = Key is rejected.
        const isAuthorized = probe.status !== 401 && probe.status !== 403;
        const schemaReady = probe.status === 200 || probe.status === 204;
        
        return res.status(200).json({ 
          ok: isAuthorized,
          status: probe.status,
          schemaReady: schemaReady,
          project: 'fiuodbhgvmylvbanbfve',
          details: isAuthorized ? "Handshake successful" : "Supabase rejected the secret key. Check your Service Role settings."
        });

      case 'find':
        const queryUrl = `${SUPABASE_URL}/rest/v1/${table}${filter?.id ? `?id=eq.${filter.id}` : '?select=*'}`;
        const findRes = await fetch(queryUrl, { 
          method: 'GET', 
          headers 
        });
        
        if (!findRes.ok) {
           const errText = await findRes.text();
           return res.status(findRes.status).json({ 
             error: `Table [${table}] Error`, 
             details: errText,
             status: findRes.status 
           });
        }
        
        const docs = await findRes.json();
        return res.status(200).json({ documents: Array.isArray(docs) ? docs : [] });

      case 'updateOne':
        const payload = update?.$set || {};
        const upsertRes = await fetch(`${SUPABASE_URL}/rest/v1/${table}`, {
          method: 'POST',
          headers: {
            ...headers,
            'Prefer': 'resolution=merge-duplicates,return=representation'
          },
          body: JSON.stringify(payload)
        });

        if (!upsertRes.ok) {
          const errorMsg = await upsertRes.text();
          throw new Error(`Upsert Failed: ${errorMsg}`);
        }

        const upsertResult = await upsertRes.json();
        return res.status(200).json({ ok: true, upsertedId: upsertResult[0]?.id });

      case 'deleteOne':
        const delRes = await fetch(`${SUPABASE_URL}/rest/v1/${table}?id=eq.${filter.id}`, {
          method: 'DELETE',
          headers: { 
            ...headers, 
            'Prefer': 'return=minimal' 
          }
        });
        return res.status(200).json({ ok: delRes.ok });

      case 'listCollections':
        const tables = ['agents', 'pages', 'conversations', 'messages', 'links', 'media', 'provisioning_logs'];
        const stats = await Promise.all(tables.map(async (t) => {
          const check = await fetch(`${SUPABASE_URL}/rest/v1/${t}?select=count`, { 
            method: 'GET', 
            headers: { 
              ...headers, 
              'Prefer': 'count=exact' 
            } 
          });
          return { 
            name: t, 
            exists: check.status === 200 || check.status === 206,
            count: check.ok ? parseInt(check.headers.get('content-range')?.split('/')[1] || '0') : 0 
          };
        }));
        return res.status(200).json({ ok: true, collections: stats });

      default:
        return res.status(400).json({ error: 'Invalid operation' });
    }
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}
