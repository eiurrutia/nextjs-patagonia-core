import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]';
import { executeQuery } from '@/app/lib/snowflakeClient';

/**
 * Endpoint para eliminar una reposición y sus líneas asociadas
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Verificar sesión del usuario
  const session = await getServerSession(req, res, authOptions);
  if (!session) {
    return res.status(401).json({ error: 'No autenticado' });
  }

  // Solo permitir método DELETE
  if (req.method !== 'DELETE') {
    return res.status(405).json({ error: 'Método no permitido' });
  }

  try {
    const { replenishmentId } = req.query;

    if (!replenishmentId) {
      return res.status(400).json({ error: 'Se requiere el ID de la reposición' });
    }

    // Primero eliminar las líneas de reposición asociadas
    await executeQuery(`
      DELETE FROM PATCORE_REPLENISHMENTS_LINE
      WHERE REPLENISHMENT_ID = ?
    `, [replenishmentId]);

    // Luego eliminar la reposición principal
    const result = await executeQuery<{ affectedRows?: number }>(`
      DELETE FROM PATCORE_REPLENISHMENTS
      WHERE ID = ?
    `, [replenishmentId]);

    // Verificar si la reposición existía
    if (result[0]?.affectedRows === 0) {
      return res.status(404).json({ error: 'No se encontró la reposición con el ID proporcionado' });
    }

    return res.status(200).json({ success: true, message: 'Reposición eliminada correctamente' });
  } catch (error) {
    console.error('Error al eliminar la reposición:', error);
    return res.status(500).json({ error: 'Error interno del servidor', details: error instanceof Error ? error.message : 'Error desconocido' });
  }
}
