import { NextApiRequest, NextApiResponse } from 'next';
import { calculateReplenishment } from '@/app/lib/stock-planning/replenishment/calculateReplenishment';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const startDate = req.query.startDate as string;
  const endDate = req.query.endDate as string;
  const selectedDeliveryOptions = JSON.parse(req.query.selectedDeliveryOptions as string || '[]');

  try {
    const data = await calculateReplenishment('', startDate, endDate, selectedDeliveryOptions);
    res.status(200).json(data);
  } catch (error) {
    console.error('Error calculating replenishment:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
}
