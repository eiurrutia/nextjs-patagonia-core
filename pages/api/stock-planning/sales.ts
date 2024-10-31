import { NextApiRequest, NextApiResponse } from 'next';
import { fetchSalesData } from '@/app/lib/stock-planning/data';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { startDate, endDate } = req.query;

  try {
    const data = await fetchSalesData(startDate as string, endDate as string);
    res.status(200).json(data);
  } catch (error) {
    console.error('Error fetching sales data:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
}
