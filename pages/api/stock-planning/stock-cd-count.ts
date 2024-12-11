import { NextApiRequest, NextApiResponse } from 'next';
import { fetchCDStockCount } from '@/app/lib/stock-planning/data';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const query = (req.query.query as string) || '';

  try {
    const totalCount = await fetchCDStockCount(query);
    res.status(200).json({ totalCount });
  } catch (error) {
    console.error('Error fetching stock count:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
}
