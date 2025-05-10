import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/pages/api/auth/[...nextauth]';
import { getOperationReplenishment } from '@/app/lib/stock-planning/data';

/**
 * API handler to fetch operation replenishment data.
 * @param req - The HTTP request object.
 * @param res - The HTTP response object.
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerSession(req, res, authOptions);
  if (!session) {
      console.log('No autorizado. Debes iniciar sesión.');
      return res.status(401).json({ message: 'No autorizado. Debes iniciar sesión.' });
  }

  const { id } = req.query;

  if (!id || typeof id !== 'string') {
    return res.status(400).json({ error: 'Missing or invalid required parameter: id' });
  }

  try {
    const data = await getOperationReplenishment(id);
    res.status(200).json(data);
  } catch (error) {
    console.error('Error fetching operation replenishment data:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}
