/**
 * API pour purger le cache Cloudflare
 * À appeler quand les plans sont modifiés dans Supabase
 * 
 * Usage: POST /api/purge-cache
 * Headers: Authorization: Bearer {secret}
 */

export async function onRequestPost({ request, env }) {
  // Vérification du secret
  const authHeader = request.headers.get('Authorization');
  const expectedSecret = env.PURGE_SECRET;
  
  if (!expectedSecret || authHeader !== `Bearer ${expectedSecret}`) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  try {
    const body = await request.json();
    const { tags } = body; // tags: ['plans', 'catalogue']
    
    // Purge via Cloudflare API si ZONE_ID et TOKEN sont configurés
    if (env.CLOUDFLARE_ZONE_ID && env.CLOUDFLARE_API_TOKEN && tags?.length) {
      const purgeRes = await fetch(
        `https://api.cloudflare.com/client/v4/zones/${env.CLOUDFLARE_ZONE_ID}/purge_cache`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${env.CLOUDFLARE_API_TOKEN}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ tags })
        }
      );
      
      const result = await purgeRes.json();
      
      return new Response(JSON.stringify({ 
        success: true, 
        purged: tags,
        cfResult: result 
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    // Fallback: renvoie succès même sans purge Cloudflare
    return new Response(JSON.stringify({ 
      success: true, 
      message: 'Cache purge requested (no CF API configured)',
      tags 
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
    
  } catch (err) {
    return new Response(JSON.stringify({ 
      error: 'Purge failed', 
      details: err.message 
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

export async function onRequest({ request }) {
  return new Response(JSON.stringify({ 
    message: 'Use POST to purge cache',
    required: {
      headers: { 'Authorization': 'Bearer {secret}' },
      body: { tags: ['plans'] }
    }
  }), {
    status: 405,
    headers: { 'Content-Type': 'application/json' }
  });
}
