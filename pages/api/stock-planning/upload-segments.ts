import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/pages/api/auth/[...nextauth]';
import { uploadStockSegments, truncateSegmentationTable } from '@/app/lib/stock-planning/data';

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '10mb',
    },
  },
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerSession(req, res, authOptions);
  if (!session) {
    console.log('No autorizado. Debes iniciar sesión.');
    return res.status(401).json({ message: 'No autorizado. Debes iniciar sesión.' });
  }
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  try {
    const data = req.body;
    await truncateSegmentationTable();
    await uploadStockSegments(data);
    res.status(200).json({ message: 'Upload successful' });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
}
