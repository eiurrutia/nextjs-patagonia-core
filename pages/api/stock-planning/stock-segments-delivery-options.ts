import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/pages/api/auth/[...nextauth]';
import { fetchAllDeliveryOptions } from '@/app/lib/stock-planning/data';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerSession(req, res, authOptions);
  if (!session) {
    console.log('No autorizado. Debes iniciar sesión.');
    return res.status(401).json({ message: 'No autorizado. Debes iniciar sesión.' });
  }
  try {
    const deliveryOptions = await fetchAllDeliveryOptions();
    res.status(200).json(deliveryOptions);
  } catch (error) {
    console.error('Error fetching delivery options:', error);
    res.status(500).json({ message: 'Error fetching delivery options' });
  }
}
