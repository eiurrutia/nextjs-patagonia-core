import { NextApiRequest, NextApiResponse } from 'next';
import { getReplenishmentLines } from '@/app/lib/stock-planning/data';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { id, groupBy } = req.query;

  if (!id) {
    return res.status(400).json({ message: 'Missing required parameter: id' });
  }

  try {
    const lines = await getReplenishmentLines(id as string, groupBy as string);
    return res.status(200).json(lines);
  } catch (error) {
    console.error('Error fetching replenishment lines:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
}
