import { createClient } from '@supabase/supabase-js';
import type { VercelRequest, VercelResponse } from '@vercel/node';

const mime = (name: string) => {
  const n = name.toLowerCase();
  if (n.endsWith('.pdf')) return 'application/pdf';
  if (n.endsWith('.docx')) return 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
  if (n.endsWith('.doc')) return 'application/msword';
  return 'application/octet-stream';
};

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    return res.status(200).end();
  }

  // Only allow GET requests
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const bucket = req.query.bucket as string;
  if (!bucket) {
    return res.status(400).json({ error: 'Missing bucket parameter' });
  }

  const slug = req.query.slug;
  if (!slug || !Array.isArray(slug) || slug.length === 0) {
    return res.status(400).json({ error: 'Missing file path' });
  }

  const path = slug.join('/'); // file path inside the bucket

  try {
    // Initialize Supabase admin client with service role key
    // Vercel serverless functions use process.env directly
    const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('Missing Supabase credentials', {
        hasUrl: !!supabaseUrl,
        hasKey: !!supabaseServiceKey,
        envKeys: Object.keys(process.env).filter(k => k.includes('SUPABASE'))
      });
      return res.status(500).json({ error: 'Server configuration error' });
    }

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        persistSession: false,
      },
      global: {
        headers: { 'x-application-name': 'file-proxy' },
      },
    });

    // Download file from Supabase Storage
    const { data, error } = await supabaseAdmin.storage.from(bucket).download(path);

    if (error || !data) {
      console.error('Supabase download error:', error, { bucket, path });
      return res.status(404).json({ error: 'File not found' });
    }

    // Convert blob to buffer for Response
    const arrayBuffer = await data.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const contentType = mime(path);
    const filename = path.split('/').pop() || 'file';

    // Set headers for proper content delivery and CORS
    res.setHeader('Content-Type', contentType);
    res.setHeader(
      'Content-Disposition',
      `inline; filename="${encodeURIComponent(filename)}"`
    );
    res.setHeader('Cache-Control', 'public, max-age=3600, immutable');
    res.setHeader('X-From', 'supabase-file-proxy');
    // CORS headers for Office Online Viewer
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    res.setHeader('Access-Control-Expose-Headers', 'Content-Type, Content-Disposition');

    // Send the file
    return res.status(200).send(buffer);
  } catch (error) {
    console.error('Error proxying file:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

