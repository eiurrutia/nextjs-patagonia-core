import { NextApiRequest, NextApiResponse } from 'next';
import { fetchStockSegments } from '@/app/lib/stock-planning/data';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { query = '', currentPage = 1 } = req.query;

  try {
    const data = await fetchStockSegments(query as string, Number(currentPage));
    res.status(200).json(data);
  } catch (error) {
    console.error('Error fetching stock segments:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
}
