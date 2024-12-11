import { NextApiRequest, NextApiResponse } from 'next';
import { fetchAllDeliveryOptions } from '@/app/lib/stock-planning/data';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const deliveryOptions = await fetchAllDeliveryOptions();
    res.status(200).json(deliveryOptions);
  } catch (error) {
    console.error('Error fetching delivery options:', error);
    res.status(500).json({ message: 'Error fetching delivery options' });
  }
}
