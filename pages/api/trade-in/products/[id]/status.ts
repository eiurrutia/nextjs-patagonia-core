import { NextApiRequest, NextApiResponse } from 'next';
import { updateProductStatus } from '@/app/lib/trade-in/sql-data';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/pages/api/auth/[...nextauth]';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query;
  const productId = parseInt(id as string);

  console.log('API called with product ID:', productId, 'Method:', req.method);

  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const session = await getServerSession(req, res, authOptions);
    console.log('Session:', session?.user?.email);
    
    if (!session?.user?.email) {
      return res.status(401).json({ 
        success: false, 
        message: 'Usuario no autenticado' 
      });
    }

    const { status } = req.body;
    console.log('Requested status change to:', status);

    if (!status || !['en_tienda', 'etiqueta_generada', 'empacado', 'enviado'].includes(status)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Estado inválido' 
      });
    }

    // Update product status
    console.log('Calling updateProductStatus...');
    await updateProductStatus(productId, status, session.user.email);
    console.log('Product status updated successfully');

    res.status(200).json({ 
      success: true, 
      message: 'Estado actualizado exitosamente' 
    });

  } catch (error) {
    console.error('Error updating product status:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error al actualizar el estado', 
      error: error instanceof Error ? error.message : 'Error desconocido'
    });
  }
}