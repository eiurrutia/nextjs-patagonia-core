import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/pages/api/auth/[...nextauth]';
import { calculateReplenishment } from '@/app/lib/stock-planning/replenishment/calculateReplenishment';

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '10mb',
    },
  },
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerSession(req, res, authOptions);
  if (!session) {
    console.log('No autorizado. Debes iniciar sesión.');
    return res.status(401).json({ message: 'No autorizado. Debes iniciar sesión.' });
  }
  if (req.method === 'POST') {
    const { startDate, endDate, selectedDeliveryOptions, editedSegments, editedSales, storePriority } = req.body;

    try {
      const data = await calculateReplenishment(
        '',
        startDate,
        endDate,
        selectedDeliveryOptions,
        editedSegments,
        storePriority,
        editedSales
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
