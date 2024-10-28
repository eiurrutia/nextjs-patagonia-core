import { NextApiRequest, NextApiResponse } from 'next';
import { fetchTradeInRecordById, updateTradeInRecord } from '@/app/lib/trade-in/data';
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
      res.status(200).json(record);
    } catch (error) {
      console.error('Error fetching Trade-In record:', error);
      res.status(500).json({ message: 'Error fetching Trade-In record' });
    }
  } else if (req.method === 'PUT') {
      const updates = req.body;
      try {
        await updateTradeInRecord(id as string, updates);
        res.status(200).json({ message: 'Trade-In record updated' });
      } catch (error) {
        console.error('Error updating Trade-In record:', error);
        res.status(500).json({ error: 'Error updating Trade-In record' });
      }
  } else {
    res.setHeader('Allow', ['GET','PUT']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
