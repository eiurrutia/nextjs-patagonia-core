import { NextApiRequest, NextApiResponse } from 'next';
import { fetchCDStockData } from '@/app/lib/stock-planning/data';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const query = (req.query.query as string) || '';
  const page = parseInt(req.query.page as string, 10) || 1;

  try {
    const data = await fetchCDStockData(query, page);
    res.status(200).json(data);
  } catch (error) {
    console.error('Error fetching stock data:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
}
