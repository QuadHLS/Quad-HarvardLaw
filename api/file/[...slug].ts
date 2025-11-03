import { createClient } from '@supabase/supabase-js';

const getContentType = (name: string) => {
  const n = name.toLowerCase();
  // Images
  if (n.endsWith('.jpg') || n.endsWith('.jpeg')) return 'image/jpeg';
  if (n.endsWith('.png')) return 'image/png';
  if (n.endsWith('.gif')) return 'image/gif';
  if (n.endsWith('.webp')) return 'image/webp';
  if (n.endsWith('.svg')) return 'image/svg+xml';
  // Documents
  if (n.endsWith('.pdf')) return 'application/pdf';
  if (n.endsWith('.docx')) return 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
  if (n.endsWith('.doc')) return 'application/msword';
  return 'application/octet-stream';
};

export default async function handler(req: any, res: any) {
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

  const slug = req.query.slug;
  if (!slug || !Array.isArray(slug) || slug.length < 2) {
    return res.status(400).json({ error: 'Missing bucket or file path. Expected format: /api/file/[bucket]/[filename]' });
  }

  // Extract bucket (first segment) and file path (rest of segments)
  // URL format: /api/file/Avatar/filename.jpg -> slug = ['Avatar', 'filename.jpg']
  const bucket = decodeURIComponent(slug[0]);
  const path = slug.slice(1).map(segment => decodeURIComponent(segment)).join('/'); // file path inside the bucket

  try {
    // Initialize Supabase admin client with service role key
    const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('Missing Supabase credentials');
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
    
    // Improve MIME type detection for images
    const contentType = getContentType(path);
    const filename = path.split('/').pop() || 'file';

    // Set headers for proper content delivery and CORS
    res.setHeader('Content-Type', contentType);
    res.setHeader(
      'Content-Disposition',
      `inline; filename="${encodeURIComponent(filename)}"`
    );
    res.setHeader('Cache-Control', 'public, max-age=3600, immutable');
    res.setHeader('X-From', 'supabase-file-proxy');
    // CORS headers for iframe embedding
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Expose-Headers', 'Content-Type, Content-Disposition');

    // Send the file
    return res.status(200).send(buffer);
  } catch (error: any) {
    console.error('Error proxying file:', error);
    return res.status(500).json({ error: 'Internal server error', message: error?.message });
  }
}

