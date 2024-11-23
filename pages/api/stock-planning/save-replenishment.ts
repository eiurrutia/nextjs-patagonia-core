import { NextApiRequest, NextApiResponse } from 'next';
import { saveReplenishment } from '@/app/lib/stock-planning/data';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const {
    ID,
    totalReplenishment,
    totalBreakQty,
    selectedDeliveries,
    startDate,
    endDate,
    storesConsidered,
    replenishmentData,
  } = req.body;

  if (
    !ID ||
    !totalReplenishment ||
    !selectedDeliveries ||
    !startDate ||
    !endDate ||
    !storesConsidered ||
    !replenishmentData
  ) {
    return res.status(400).json({ message: 'Missing required fields' });
  }

  try {
    await saveReplenishment({
      ID,
      totalReplenishment,
      totalBreakQty,
      selectedDeliveries,
      startDate,
      endDate,
      storesConsidered,
      replenishmentData,
    });

    return res.status(201).json({ message: 'Replenishment saved successfully' });
  } catch (error) {
    console.error('Error saving replenishment:', error);
    return res.status(500).json({ message: 'Error saving replenishment' });
  }
}
