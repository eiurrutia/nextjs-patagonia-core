import { NextApiRequest, NextApiResponse } from 'next';
import { getFolio } from '@/app/lib/trade-in/data';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    try {
      const folio = await getFolio();
      if (!folio) {
        return res.status(500).json({ message: 'Error obtaining folio' });
      }
      res.status(200).json({ folio });
    } catch (error) {
      res.status(500).json({ message: 'Error fetching folio' });
    }
  } else {
    res.setHeader('Allow', ['GET']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
