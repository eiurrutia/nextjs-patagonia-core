import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/pages/api/auth/[...nextauth]';
import { fetchStockSegments } from '@/app/lib/stock-planning/data';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerSession(req, res, authOptions);
  if (!session) {
    console.log('No autorizado. Debes iniciar sesión.');
    return res.status(401).json({ message: 'No autorizado. Debes iniciar sesión.' });
  }
  const { query = '', currentPage = 1, selectedDeliveryOptions = '[]', sortKey, sortDirection } = req.query;

  try {
    const parsedDeliveryOptions = JSON.parse(selectedDeliveryOptions as string);
    const data = await fetchStockSegments(
      query as string,
      Number(currentPage),
      parsedDeliveryOptions,
      false,
      sortKey as string,
      sortDirection as 'asc' | 'desc'
    );
    res.status(200).json(data);
  } catch (error) {
    console.error('Error fetching stock segments:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
}
