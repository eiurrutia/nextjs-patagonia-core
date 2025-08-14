import { getConfigValue } from '@/app/lib/trade-in/sql-data';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/pages/api/auth/[...nextauth]';

/**
 * API route handler for getting trade-in configuration
 * @param req - The HTTP request object
 * @param res - The HTTP response object
 */
export default async function handler(req, res) {
  // Check if the request is authenticated
  const session = await getServerSession(req, res, authOptions);
  if (!session) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    // Get image detection configuration
    const imageDetectionEnabled = await getConfigValue('trade_in_image_detection');
    
    return res.status(200).json({
      imageDetectionEnabled: imageDetectionEnabled === 'true'
    });

  } catch (error) {
    console.error('Error fetching trade-in config:', error);
    return res.status(500).json({ 
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}
