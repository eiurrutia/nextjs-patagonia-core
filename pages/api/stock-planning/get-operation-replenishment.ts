import { NextApiRequest, NextApiResponse } from 'next';
import { getOperationReplenishment } from '@/app/lib/stock-planning/data';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') return res.status(405).json({ message: 'Method not allowed' });

  const { id } = req.query;
  if (!id || typeof id !== 'string') return res.status(400).json({ message: 'Missing id' });

  try {
    const lines = await getOperationReplenishment(id);
    return res.status(200).json(lines);
  } catch (error) {
    console.error('Error getting operation replenishment:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
}
