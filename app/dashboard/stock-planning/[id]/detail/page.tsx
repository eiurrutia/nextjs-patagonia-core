'use client';
import { useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import ReplenishmentSummary from '@/app/ui/stock-planning/replenishment-summary';
import ReplenishmentLinesTable from '@/app/ui/stock-planning/replenishment-lines-table';
import SegmentationDetailTable from '@/app/ui/stock-planning/segmentation-detail-table';
import OperationsExportTable from '@/app/ui/stock-planning/operation-export-table';
import { EllipsisVerticalIcon } from '@heroicons/react/24/outline';

export default function ReplenishmentDetailPage() {
  const [showMenu, setShowMenu] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [confirmationId, setConfirmationId] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();
  const pathname = usePathname();
  const replenishmentId = pathname ? pathname.split('/').slice(-2)[0] || '' : '';

  const handleDelete = async () => {
    if (confirmationId !== replenishmentId) {
      setError('El ID ingresado no coincide con el ID de la reposición');
      return;
    }

    try {
      setIsDeleting(true);
      const response = await fetch(`/api/stock-planning/delete-replenishment?replenishmentId=${replenishmentId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error al eliminar la reposición');
      }

      // Redireccionar a la lista de reposiciones
      router.push('/stock-planning');
    } catch (error) {
      console.error('Error al eliminar la reposición:', error);
      setError(error instanceof Error ? error.message : 'Error al eliminar la reposición');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="p-6 relative">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Detalle de Reposición</h1>
        
        {/* Menú de opciones */}
        <div className="relative">
          <button
            onClick={() => setShowMenu(!showMenu)}
            className="p-2 rounded-full hover:bg-gray-100"
          >
            <EllipsisVerticalIcon className="h-6 w-6 text-gray-500" />
          </button>
          
          {showMenu && (
            <div className="absolute right-0 mt-1 w-48 bg-white rounded-md shadow-lg z-10 py-1">
              <button
                onClick={() => {
                  setShowMenu(false);
                  setShowDeleteModal(true);
                }}
                className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100"
              >
                Eliminar reposición
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Modal de confirmación para eliminar reposición */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-lg p-6 w-1/2 max-w-md shadow-lg">
            <h3 className="text-xl font-bold mb-4">¿Estás seguro de eliminar la reposición?</h3>
            <p className="mb-4 text-gray-600">Esta acción no se puede deshacer. Se eliminarán tanto la reposición como todas sus líneas asociadas.</p>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Favor ingresar el id de la reposición para confirmar la eliminación:
              </label>
              <input
                type="text"
                className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={confirmationId}
                onChange={(e) => {
                  setConfirmationId(e.target.value);
                  setError('');
                }}
                placeholder={replenishmentId}
              />
              {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
            </div>

            <div className="flex justify-end space-x-3">
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setConfirmationId('');
                  setError('');
                }}
                className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300"
                disabled={isDeleting}
              >
                Cancelar
              </button>
              <button
                onClick={handleDelete}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 flex items-center"
                disabled={isDeleting}
              >
                {isDeleting ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Eliminando...
                  </>
                ) : (
                  'Eliminar'
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Summary */}
      <ReplenishmentSummary />

      {/* Replenishment Lines */}
      <div className="mt-6">
        <h2 className="text-2xl font-bold mb-4">Líneas de Reposición</h2>
        <ReplenishmentLinesTable />
      </div>

      {/* Segmentation Detail */}
      <div className="mt-6">
        <SegmentationDetailTable />
      </div>

      {/* Export Table */}
      <div className="mt-20">
        <h2 className="text-2xl font-bold mb-4">Tabla para exportar</h2>
        <OperationsExportTable />
      </div>
    </div>
  );
}
