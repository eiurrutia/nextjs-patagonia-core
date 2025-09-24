import { NextApiRequest, NextApiResponse } from 'next';
import { getTradeInComments, addTradeInComment } from '@/app/lib/trade-in/sql-data';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/pages/api/auth/[...nextauth]';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query;

  try {
    if (req.method === 'GET') {
      // Get comments for the trade-in request
      const comments = await getTradeInComments(parseInt(id as string));

      res.status(200).json({ 
        success: true, 
        comments: comments 
      });

    } else if (req.method === 'POST') {
      // Add a new manual comment
      const session = await getServerSession(req, res, authOptions);
      
      if (!session?.user?.email) {
        return res.status(401).json({ 
          success: false, 
          message: 'Usuario no autenticado' 
        });
      }

      const { comment } = req.body;

      if (!comment || comment.trim() === '') {
        return res.status(400).json({ 
          success: false, 
          message: 'El comentario no puede estar vacío' 
        });
      }

      // Add the manual comment
      const newComment = await addTradeInComment(
        parseInt(id as string), 
        comment.trim(), 
        session.user.email, 
        'manual_comment'
      );

      res.status(201).json({ 
        success: true, 
        comment: newComment,
        message: 'Comentario agregado exitosamente' 
      });

    } else {
      return res.status(405).json({ message: 'Method not allowed' });
    }

  } catch (error) {
    console.error('Error handling trade-in comments:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error al procesar la solicitud', 
      error: error instanceof Error ? error.message : 'Error desconocido'
    });
  }
}
