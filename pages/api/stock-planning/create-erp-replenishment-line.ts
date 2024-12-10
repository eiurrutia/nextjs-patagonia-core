import { NextApiRequest, NextApiResponse } from 'next';
import { getERPToken, createERPLine } from '@/app/lib/stock-planning/replenishment/erpIntegration';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ message: 'Method not allowed' });

  const { transferOrderNumber, lineData } = req.body;
  if (!transferOrderNumber || !lineData) {
    return res.status(400).json({ message: 'Missing transferOrderNumber or lineData' });
  }

  try {
    const token = await getERPToken();
    const result = await createERPLine(token, transferOrderNumber, lineData);
    return res.status(200).json({ ERP_LINE_ID: result.ERP_LINE_ID });
  } catch (error) {
    console.error('Error creando línea ERP:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
}
