import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/pages/api/auth/[...nextauth]';
import { getSegmentationDetail } from '@/app/lib/stock-planning/data';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerSession(req, res, authOptions);
  if (!session) {
    console.log('No autorizado. Debes iniciar sesión.');
    return res.status(401).json({ message: 'No autorizado. Debes iniciar sesión.' });
  }
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { id, groupBy } = req.query;

  if (!id) {
    return res.status(400).json({ message: 'Missing required parameter: id' });
  }

  try {
    const detail = await getSegmentationDetail(id as string, groupBy as string);
    return res.status(200).json(detail);
  } catch (error) {
    console.error('Error fetching segmentation detail:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
}
