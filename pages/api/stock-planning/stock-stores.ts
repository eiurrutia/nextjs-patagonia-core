import { NextApiRequest, NextApiResponse } from 'next';
import { fetchStoresStockData } from '@/app/lib/stock-planning/data';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const query = (req.query.query as string) || '';
  const page = parseInt(req.query.page as string) || 1;

  try {
    const data = await fetchStoresStockData(query, page);
    res.status(200).json(data);
  } catch (error) {
    console.error('Error fetching store stock data:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
}
