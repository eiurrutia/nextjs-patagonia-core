'use client';

import { useEffect, useRef, useState } from 'react';
import JsBarcode from 'jsbarcode';
import { LabelGenerator } from '@/app/lib/trade-in/label-generator';
import { 
  ArrowDownTrayIcon,
  PrinterIcon,
  TagIcon 
} from '@heroicons/react/24/outline';

interface GeneratedLabelCardProps {
  sku: string;
  description?: string;
  pdfBlobUrl?: string;
  onPrint?: () => void;
  onDownload?: () => void;
}

export default function GeneratedLabelCard({ 
  sku, 
  description = "Patagonia Product",
  pdfBlobUrl,
  onPrint,
  onDownload 
}: GeneratedLabelCardProps) {
  const barcodeRef = useRef<HTMLCanvasElement>(null);
  const [barcodeGenerated, setBarcodeGenerated] = useState(false);

  // Generar código de barras cuando el componente se monta
  useEffect(() => {
    if (barcodeRef.current && sku) {
      console.log('Generando código de barras en card para SKU:', sku);
      try {
        JsBarcode(barcodeRef.current, sku, {
          format: "CODE128",
          width: 1.5,
          height: 35,
          displayValue: false,
          margin: 3,
          background: "#ffffff",
          lineColor: "#000000"
        });
        console.log('Código de barras en card generado exitosamente');
        setBarcodeGenerated(true);
      } catch (error) {
        console.error('Error generando código de barras en card:', error);
        setBarcodeGenerated(false);
      }
    }
  }, [sku]);

  const handleDownload = () => {
    if (pdfBlobUrl) {
      // Si tenemos URL persistente, descargar directamente
      const link = document.createElement('a');
      link.href = pdfBlobUrl;
      link.download = `etiqueta-${sku}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      onDownload?.();
    } else {
      // Fallback: generar PDF temporal
      LabelGenerator.downloadPDF({ sku, description });
      onDownload?.();
    }
  };

  const handlePrint = () => {
    if (pdfBlobUrl) {
      window.open(pdfBlobUrl, '_blank');
      onPrint?.();
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border p-6">
      {/* Header */}
      <div className="flex items-center gap-2 mb-4">
        <TagIcon className="h-5 w-5 text-green-600" />
        <h3 className="text-lg font-semibold text-gray-900">Etiqueta Generada</h3>
      </div>

      {/* SKU Info */}
      <div className="mb-4 p-3 bg-gray-50 rounded-lg border border-gray-200">
        <p className="text-sm font-medium text-gray-900">
          SKU: <span className="font-mono">{sku}</span>
        </p>
        <p className="text-sm text-gray-700">Descripción: {description}</p>
      </div>

      {/* Preview del PDF Real */}
      <div className="mb-4 flex justify-center">
        {/* Mostrar el PDF real directamente */}
        <div className="w-2/3">
          {pdfBlobUrl ? (
            <div className="w-full border border-gray-300 rounded bg-white shadow-sm overflow-hidden">
              <iframe
                src={`${pdfBlobUrl}#toolbar=0&navpanes=0&scrollbar=0&zoom=100`}
                className="w-full"
                style={{ 
                  height: '150px',
                  border: 'none'
                }}
                title="Vista previa de la etiqueta"
              />
            </div>
          ) : (
            <div className="w-full h-32 flex items-center justify-center bg-gray-200 border border-gray-300 rounded text-sm text-gray-600">
              Cargando vista previa...
            </div>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="flex justify-center space-x-3">
        <button
          onClick={handlePrint}
          className="inline-flex items-center px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
        >
          <PrinterIcon className="h-4 w-4 mr-2" />
          Imprimir
        </button>
        
        <button
          onClick={handleDownload}
          className="inline-flex items-center px-3 py-2 text-sm font-medium text-white bg-green-600 border border-transparent rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
        >
          <ArrowDownTrayIcon className="h-4 w-4 mr-2" />
          Descargar PDF
        </button>
      </div>
    </div>
  );
}