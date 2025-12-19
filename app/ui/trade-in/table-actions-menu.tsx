'use client';

import { useState, useRef, useEffect } from 'react';
import { 
  EllipsisVerticalIcon,
  ArrowDownTrayIcon,
  TableCellsIcon,
  DocumentTextIcon
} from '@heroicons/react/24/outline';

interface TableActionsMenuProps {
  type: 'requests' | 'products';
  filters: {
    requestNumber?: string;
    customer?: string;
    status?: string[];
    deliveryMethod?: string[];
    store?: string;
    dateFrom?: string;
    dateTo?: string;
    productStyle?: string;
    productState?: string;
  };
}

export default function TableActionsMenu({ type, filters }: TableActionsMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleExport = async (format: 'excel' | 'csv') => {
    setIsExporting(true);
    setIsOpen(false);
    
    try {
      // Build query params from filters
      const params = new URLSearchParams();
      params.set('type', type);
      params.set('format', format);
      
      if (filters.requestNumber) params.set('requestNumber', filters.requestNumber);
      if (filters.customer) params.set('customer', filters.customer);
      if (filters.status?.length) params.set('status', filters.status.join(','));
      if (filters.deliveryMethod?.length) params.set('deliveryMethod', filters.deliveryMethod.join(','));
      if (filters.store) params.set('store', filters.store);
      if (filters.dateFrom) params.set('dateFrom', filters.dateFrom);
      if (filters.dateTo) params.set('dateTo', filters.dateTo);
      if (filters.productStyle) params.set('productStyle', filters.productStyle);
      if (filters.productState) params.set('productState', filters.productState);

      const response = await fetch(`/api/trade-in/export?${params.toString()}`);
      
      if (!response.ok) {
        throw new Error('Error al exportar');
      }

      // Get filename from headers or generate one
      const contentDisposition = response.headers.get('Content-Disposition');
      let filename = `trade-in-${type}-${new Date().toISOString().split('T')[0]}`;
      
      if (contentDisposition) {
        const match = contentDisposition.match(/filename="?([^"]+)"?/);
        if (match) filename = match[1];
      } else {
        // Add extension if not present and no header
        if (format === 'excel') {
          filename += '.xlsx';
        } else if (format === 'csv') {
          filename += '.csv';
        }
      }

      // Create blob and download
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Export error:', error);
      alert('Error al exportar los datos. Por favor intenta de nuevo.');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        disabled={isExporting}
        className={`
          p-1.5 rounded-md border border-gray-200 hover:bg-gray-50 transition-colors flex items-center gap-1
          ${isExporting ? 'opacity-50 cursor-not-allowed' : ''}
        `}
        title="Acciones"
      >
        {isExporting ? (
          <svg className="animate-spin h-4 w-4 text-gray-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
        ) : (
          <EllipsisVerticalIcon className="h-5 w-5 text-gray-500" />
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-1 w-48 bg-white rounded-md shadow-lg border border-gray-200 py-1 z-50">
          <div className="px-3 py-1.5 text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-gray-100">
            Exportar
          </div>
          <button
            onClick={() => handleExport('excel')}
            className="w-full px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
          >
            <TableCellsIcon className="h-4 w-4 text-green-600" />
            <span>Exportar a Excel</span>
          </button>
          <button
            onClick={() => handleExport('csv')}
            className="w-full px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
          >
            <DocumentTextIcon className="h-4 w-4 text-blue-600" />
            <span>Exportar a CSV</span>
          </button>
        </div>
      )}
    </div>
  );
}
