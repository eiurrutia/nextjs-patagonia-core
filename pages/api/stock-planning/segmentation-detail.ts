import { NextApiRequest, NextApiResponse } from 'next';
import { getSegmentationDetail } from '@/app/lib/stock-planning/data';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { id } = req.query;

  if (!id) {
    return res.status(400).json({ message: 'Missing required parameter: id' });
  }

  try {
    const detail = await getSegmentationDetail(id as string);
    return res.status(200).json(detail);
  } catch (error) {
    console.error('Error fetching segmentation detail:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
}
