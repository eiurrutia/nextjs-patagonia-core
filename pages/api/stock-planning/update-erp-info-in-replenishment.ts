import { NextApiRequest, NextApiResponse } from 'next';
import { updateERPInfo } from '@/app/lib/stock-planning/data';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
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
