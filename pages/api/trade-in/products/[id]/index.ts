import { NextApiRequest, NextApiResponse } from 'next';
import { getTradeInProductById } from '@/app/lib/trade-in/sql-data';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query;
  const productId = parseInt(id as string);

  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const product = await getTradeInProductById(productId);

    if (!product) {
      return res.status(404).json({ 
        success: false, 
        message: 'Producto no encontrado' 
      });
    }

    res.status(200).json(product);

  } catch (error) {
    console.error('Error fetching product:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error al obtener el producto', 
      error: error instanceof Error ? error.message : 'Error desconocido'
    });
  }
}