import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/pages/api/auth/[...nextauth]';
import { fetchStoresStockData } from '@/app/lib/stock-planning/data';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerSession(req, res, authOptions);
  if (!session) {
    console.log('No autorizado. Debes iniciar sesión.');
    return res.status(401).json({ message: 'No autorizado. Debes iniciar sesión.' });
  }
  const query = (req.query.query as string) || '';
  const page = parseInt(req.query.page as string) || 1;
  const sortKey = req.query.sortKey as string;
  const sortDirection = req.query.sortDirection as 'asc' | 'desc';

  try {
    const data = await fetchStoresStockData(query, page, false, sortKey, sortDirection);
    res.status(200).json(data);
  } catch (error) {
    console.error('Error fetching store stock data:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
}

