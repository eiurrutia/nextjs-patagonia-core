import { NextApiRequest, NextApiResponse } from 'next';
import { calculateReplenishment } from '@/app/lib/stock-planning/replenishment/calculateReplenishment';

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '10mb',
    },
  },
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'POST') {
    const { startDate, endDate, selectedDeliveryOptions, editedSegments } = req.body;

    try {
      const data = await calculateReplenishment(
        '',
        startDate,
        endDate,
        selectedDeliveryOptions,
        editedSegments
      );
      res.status(200).json(data);
    } catch (error) {
      console.error('Error calculating replenishment:', error);
      res.status(500).json({ message: 'Internal Server Error' });
    }
  } else {
    res.status(405).json({ message: 'Method Not Allowed' });
  }
}
