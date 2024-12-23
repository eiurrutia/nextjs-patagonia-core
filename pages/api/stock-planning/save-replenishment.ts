import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/pages/api/auth/[...nextauth]';
import { saveReplenishment } from '@/app/lib/stock-planning/data';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerSession(req, res, authOptions);
  if (!session) {
    console.log('UNAUTHORIZED. YOU MUST LOG IN.');
    return res.status(401).json({ MESSAGE: 'UNAUTHORIZED. YOU MUST LOG IN.' });
  }
  if (req.method !== 'POST') {
    return res.status(405).json({ MESSAGE: 'METHOD NOT ALLOWED' });
  }

  const {
    ID,
    TOTAL_REPLENISHMENT,
    TOTAL_BREAK_QTY,
    SELECTED_DELIVERIES,
    START_DATE,
    END_DATE,
    STORES_CONSIDERED,
    REPLENISHMENT_DATA,
  } = req.body;

  if (
    !ID ||
    !TOTAL_REPLENISHMENT ||
    !SELECTED_DELIVERIES ||
    !START_DATE ||
    !END_DATE ||
    !STORES_CONSIDERED ||
    !REPLENISHMENT_DATA
  ) {
    return res.status(400).json({ MESSAGE: 'MISSING REQUIRED FIELDS' });
  }

  try {
    await saveReplenishment({
      ID,
      TOTAL_REPLENISHMENT,
      TOTAL_BREAK_QTY,
      SELECTED_DELIVERIES,
      START_DATE,
      END_DATE,
      STORES_CONSIDERED,
      REPLENISHMENT_DATA,
    });

    return res.status(201).json({ MESSAGE: 'REPLENISHMENT SAVED SUCCESSFULLY' });
  } catch (error) {
    console.error('Error saving replenishment:', error);
    return res.status(500).json({ MESSAGE: 'ERROR SAVING REPLENISHMENT' });
  }
}
