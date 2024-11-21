import { NextApiRequest, NextApiResponse } from 'next';
import { saveSegmentationHistory } from '@/app/lib/stock-planning/data';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  console.log('Saving segmentation history:', req.body);

  const { stockSegments, segID } = req.body;

  try {
    await saveSegmentationHistory(stockSegments, segID);
    res.status(200).json({ message: 'Segmentation history saved successfully' });
  } catch (error) {
    console.error('Error saving segmentation history:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
}
