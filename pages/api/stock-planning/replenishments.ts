import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/pages/api/auth/[...nextauth]';
import { getReplenishments } from '@/app/lib/stock-planning/data';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerSession(req, res, authOptions);
  if (!session) {
    console.log('No autorizado. Debes iniciar sesión.');
    return res.status(401).json({ message: 'No autorizado. Debes iniciar sesión.' });
  }
  if (req.method === 'GET') {
    const { query = '', page = '1', limit = '10' } = req.query;

    try {
      const pageNumber = parseInt(page as string, 10) || 1;
      const pageLimit = parseInt(limit as string, 10) || 10;

      const { records, totalCount } = await getReplenishments(
        query as string,
        pageNumber,
        pageLimit
      );

      res.status(200).json({ records, totalCount });
    } catch (error) {
      console.error('Error fetching replenishments:', error);
      res.status(500).json({ message: 'Internal Server Error' });
    }
  } else {
    res.status(405).json({ message: 'Method Not Allowed' });
  }
}
