import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/pages/api/auth/[...nextauth]';
import { updateERPInfo } from '@/app/lib/stock-planning/data';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerSession(req, res, authOptions);
  if (!session) {
    console.log('No autorizado. Debes iniciar sesión.');
    return res.status(401).json({ message: 'No autorizado. Debes iniciar sesión.' });
  }
  if (req.method !== 'POST') return res.status(405).json({ message: 'Method not allowed' });

  const { repID, erpTRs, lines } = req.body;
  if (!repID || !erpTRs || !lines) {
    return res.status(400).json({ message: 'Missing required fields' });
  }

  try {
    await updateERPInfo(repID, erpTRs, lines);
    return res.status(200).json({ message: 'ERP info updated successfully' });
  } catch (error) {
    console.error('Error updating ERP info:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
}
