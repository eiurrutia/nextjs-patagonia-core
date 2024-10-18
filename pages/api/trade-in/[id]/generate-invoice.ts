import { NextApiRequest, NextApiResponse } from 'next';
import { generateInvoice } from '@/app/lib/trade-in/data';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query;

  if (req.method === 'POST') {
    const { folio } = req.body;

    try {
      const invoiceUrl = await generateInvoice(id as string, folio);
      if (!invoiceUrl) {
        return res.status(500).json({ message: 'Error generating invoice' });
      }
      res.status(200).json({ invoiceUrl });
    } catch (error) {
      res.status(500).json({ message: 'Error generating invoice' });
    }
  } else {
    res.setHeader('Allow', ['POST']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
