import { NextApiRequest, NextApiResponse } from 'next';
import { fetchTradeInRecordById, updateTradeInStatus } from '@/app/lib/trade-in/data';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/pages/api/auth/[...nextauth]';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerSession(req, res, authOptions);
  if (!session) {
    console.log('No autorizado. Debes iniciar sesión.');
    return res.status(401).json({ message: 'No autorizado. Debes iniciar sesión.' });
  }
  
  const { id } = req.query;

  if (req.method === 'GET') {
    try {
      const record = await fetchTradeInRecordById(id as string);
      if (!record) {
        return res.status(404).json({ message: 'Trade-In not found' });
      }
      res.status(200).json({ status: record.STATUS });
    } catch (error) {
      res.status(500).json({ message: 'Error fetching status' });
    }
  } else if (req.method === 'PUT') {
    const { status } = req.body;
    try {
      await updateTradeInStatus(id as string, status);
      res.status(200).json({ message: 'Status updated' });
    } catch (error) {
      res.status(500).json({ message: 'Error updating status' });
    }
  } else {
    res.setHeader('Allow', ['GET', 'PUT']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
