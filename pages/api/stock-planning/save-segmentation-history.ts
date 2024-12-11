import { NextApiRequest, NextApiResponse } from 'next';
import { saveSegmentationHistory } from '@/app/lib/stock-planning/data';

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '10mb',
    },
  },
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }
  const { stockSegments, repID } = req.body;
  try {
    const batchStartTime = Date.now();
    await saveSegmentationHistory(stockSegments, repID);
    const batchEndTime = Date.now();

    res.status(200).json({
      message: 'Batch saved successfully',
      rowsProcessed: stockSegments.length,
      timeTaken: `${batchEndTime - batchStartTime}ms`,
    });
  } catch (error) {
    console.error('Error processing batch:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
}

