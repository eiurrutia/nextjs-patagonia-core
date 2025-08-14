import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/pages/api/auth/[...nextauth]';
import { 
  getAllRateLimitRecords, 
  getSecurityStats,
  manualUnblock,
  manualBlock,
  deleteRecord,
  cleanupOldRecords
} from '@/app/lib/auth/rate-limit-db';

export default async function handler(req, res) {
  // Verificar autenticación
  const session = await getServerSession(req, res, authOptions);
  if (!session) {
    return res.status(401).json({ message: 'No autorizado. Debes iniciar sesión.' });
  }

  // Solo admins pueden acceder a la gestión de seguridad
  if (session.user.role !== 'admin') {
    return res.status(403).json({ message: 'Acceso denegado. Solo administradores.' });
  }

  try {
    switch (req.method) {
      case 'GET':
        // Obtener todos los registros y estadísticas
        const records = await getAllRateLimitRecords();
        const stats = await getSecurityStats();
        
        return res.status(200).json({
          records,
          stats,
          message: 'Registros de seguridad obtenidos exitosamente'
        });

      case 'POST':
        const { action, identifier, permanent } = req.body;

        if (!action || !identifier) {
          return res.status(400).json({ message: 'Acción e identificador son requeridos' });
        }

        switch (action) {
          case 'unblock':
            const unblocked = await manualUnblock(identifier);
            if (!unblocked) {
              return res.status(404).json({ message: 'Registro no encontrado' });
            }
            return res.status(200).json({ 
              message: `${identifier} desbloqueado exitosamente` 
            });

          case 'block':
            await manualBlock(identifier, permanent || false);
            return res.status(200).json({ 
              message: `${identifier} bloqueado ${permanent ? 'permanentemente' : 'temporalmente'}` 
            });

          case 'delete':
            const deleted = await deleteRecord(identifier);
            if (!deleted) {
              return res.status(404).json({ message: 'Registro no encontrado' });
            }
            return res.status(200).json({ 
              message: `Registro ${identifier} eliminado exitosamente` 
            });

          case 'cleanup':
            const deletedCount = await cleanupOldRecords();
            return res.status(200).json({ 
              message: `${deletedCount} registros antiguos eliminados` 
            });

          default:
            return res.status(400).json({ message: 'Acción no válida' });
        }

      default:
        res.setHeader('Allow', ['GET', 'POST']);
        return res.status(405).json({ message: `Método ${req.method} no permitido` });
    }
  } catch (error) {
    console.error('Error en API de seguridad:', error);
    return res.status(500).json({ 
      message: 'Error interno del servidor',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}
