import { NextApiRequest, NextApiResponse } from 'next';
import { fetchStockSegmentsCount } from '@/app/lib/stock-planning/data';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const query = (req.query.query as string) || '';
  const selectedDeliveryOptions = req.query.selectedDeliveryOptions
    ? JSON.parse(req.query.selectedDeliveryOptions as string)
    : [];

  try {
    const totalCount = await fetchStockSegmentsCount(query, selectedDeliveryOptions);
    res.status(200).json({ totalCount });
  } catch (error) {
    console.error('Error fetching stock segments count:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
}
