import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/pages/api/auth/[...nextauth]';
import { getERPToken, createERPHeader } from '@/app/lib/stock-planning/replenishment/erpIntegration';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerSession(req, res, authOptions);
  if (!session) {
      console.log('No autorizado. Debes iniciar sesión.');
      return res.status(401).json({ message: 'No autorizado. Debes iniciar sesión.' });
  }
    
  if (req.method !== 'POST') return res.status(405).json({ message: 'Method not allowed' });

  const { replenishmentID, store } = req.body;
  if (!replenishmentID || !store) {
    return res.status(400).json({ message: 'Missing replenishmentID or store' });
  }

  try {
    const token = await getERPToken();
    const transferOrderNumber = await createERPHeader(token, store);
    return res.status(200).json({ TransferOrderNumber: transferOrderNumber });
  } catch (error) {
    console.error('Error creando encabezado ERP:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
}
