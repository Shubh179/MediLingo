import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  // Simple health check
  if (req.url === '/' && req.method === 'GET') {
    return res.status(200).json({
      status: 'ok',
      message: 'MediLingo API is running',
      timestamp: new Date().toISOString(),
      version: '1.0.0'
    });
  }

  // Placeholder endpoints
  if (req.url === '/api/auth' && req.method === 'POST') {
    return res.status(200).json({
      status: 'auth',
      message: 'Auth endpoint ready'
    });
  }

  // Default 404
  return res.status(404).json({
    error: 'Endpoint not found',
    path: req.url,
    method: req.method
  });
}
