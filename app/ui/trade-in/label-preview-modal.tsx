'use client';

import { useState, useEffect, useRef } from 'react';
import { LabelGenerator } from '@/app/lib/trade-in/label-generator';
import JsBarcode from 'jsbarcode';
import { 
  XMarkIcon,
  ArrowDownTrayIcon,
  PrinterIcon 
} from '@heroicons/react/24/outline';

interface LabelPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  sku: string;
  productId: number;
  description?: string;
  onLabelGenerated?: (pdfBlobUrl: string) => void;
}

export default function LabelPreviewModal({ 
  isOpen, 
  onClose, 
  sku, 
  productId,
  description = "Patagonia Product",
  onLabelGenerated 
}: LabelPreviewModalProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [isPrinting, setIsPrinting] = useState(false);
  const barcodeRef = useRef<HTMLCanvasElement>(null);
  const [barcodeGenerated, setBarcodeGenerated] = useState(false);
  const [pdfBlobUrl, setPdfBlobUrl] = useState<string | null>(null);

  // Generar PDF blob URL cuando el modal se abre (solo para vista previa temporal)
  useEffect(() => {
    if (isOpen && sku && !pdfBlobUrl) {
      console.log('Generando vista previa temporal para:', sku);
      try {
        // Generar PDF temporal solo para vista previa (NO se guarda en BD)
        const pdfBlob = LabelGenerator.generatePDFBlob({ sku, description });
        const blobUrl = URL.createObjectURL(pdfBlob);
        setPdfBlobUrl(blobUrl);
        console.log('Vista previa temporal generada');
        
        // NO notificamos al padre aún, solo cuando se descargue o imprima
      } catch (error) {
        console.error('Error generando vista previa:', error);
      }
    } else if (!isOpen) {
      // Limpiar cuando se cierra el modal solo si es blob URL temporal
      if (pdfBlobUrl && pdfBlobUrl.startsWith('blob:')) {
        URL.revokeObjectURL(pdfBlobUrl);
        setPdfBlobUrl(null);
      }
      setBarcodeGenerated(false);
    }
  }, [isOpen, sku, description, pdfBlobUrl]);

  if (!isOpen) return null;

  const handleDownload = async () => {
    setIsGenerating(true);
    try {
      // Generar y subir PDF a Vercel Blob para persistencia
      const uploadedUrl = await LabelGenerator.generateAndUploadPDF({ sku, description }, productId);
      
      // Descargar el PDF desde la URL persistente
      const link = document.createElement('a');
      link.href = uploadedUrl;
      link.download = `etiqueta-${sku}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // Actualizar estado con URL persistente
      setPdfBlobUrl(uploadedUrl);
      onLabelGenerated?.(uploadedUrl);
      
      console.log('PDF generado y guardado con URL persistente:', uploadedUrl);
    } catch (error) {
      console.error('Error generando PDF:', error);
      alert('Error al generar el PDF');
    } finally {
      setIsGenerating(false);
    }
  };

  const handlePrint = async () => {
    setIsPrinting(true);
    
    try {
      console.log('Generando PDF para imprimir...');
      
      // Verificar si ya tenemos URL persistente (no blob temporal)
      let urlToUse = pdfBlobUrl;
      
      // Si no tenemos URL persistente O si es un blob temporal, generar y subir
      if (!urlToUse || urlToUse.startsWith('blob:')) {
        console.log('Generando y subiendo PDF a Vercel Blob...');
        urlToUse = await LabelGenerator.generateAndUploadPDF({ sku, description }, productId);
        setPdfBlobUrl(urlToUse);
        
        // Notificar que se generó la etiqueta persistente
        onLabelGenerated?.(urlToUse);
        console.log('PDF guardado en Vercel Blob:', urlToUse);
      }
      
      // Abrir el PDF en una nueva ventana para imprimir
      // Agregamos parámetros para que se abra optimizado para impresión
      window.open(`${urlToUse}#view=FitH`, '_blank');
      
      console.log('PDF abierto para imprimir');
      
    } catch (error) {
      console.error('Error preparando PDF para imprimir:', error);
      alert('Error al preparar el PDF para imprimir: ' + (error instanceof Error ? error.message : String(error)));
    } finally {
      setIsPrinting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">
            Vista Previa de Etiqueta
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        {/* SKU Info */}
        <div className="mb-4 p-3 bg-gray-50 rounded-lg">
          <p className="text-sm font-medium text-gray-900">SKU: <span className="font-mono">{sku}</span></p>
          <p className="text-sm text-gray-600">Descripción: {description}</p>
        </div>

        {/* Preview */}
        <div className="mb-6 p-4 bg-gray-100 rounded-lg">
          <p className="text-sm text-gray-600 mb-3 text-center">Vista Previa (50x25mm)</p>
          
          {/* Vista previa del PDF */}
          <div className="mx-auto" style={{ width: '300px', height: '150px' }}>
            {pdfBlobUrl ? (
              // Usar vista previa HTML en lugar de iframe bloqueado
              <div 
                className="w-full h-full border border-gray-300 rounded bg-white flex items-center justify-center p-2"
                style={{ fontSize: '10px' }}
                dangerouslySetInnerHTML={{ 
                  __html: LabelGenerator.generatePreviewHTML({ sku, description }).replace(
                    'width: 50mm; height: 25mm;',
                    'width: 100%; height: 100%; transform: scale(0.6);'
                  )
                }}
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gray-200 border border-gray-300 rounded" style={{
                fontSize: '14px',
                color: '#666'
              }}>
                Generando vista previa...
              </div>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end space-x-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
          >
            Cerrar
          </button>
          
          <button
            onClick={handlePrint}
            disabled={isPrinting}
            className="inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <PrinterIcon className="h-4 w-4 mr-2" />
            {isPrinting ? 'Imprimiendo...' : 'Imprimir'}
          </button>
          
          <button
            onClick={handleDownload}
            disabled={isGenerating}
            className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ArrowDownTrayIcon className="h-4 w-4 mr-2" />
            {isGenerating ? 'Generando...' : 'Descargar PDF'}
          </button>
        </div>

        {/* Instrucciones */}
        <div className="mt-4 p-3 bg-blue-50 rounded-lg">
          <p className="text-xs text-blue-800">
            <strong>Instrucciones:</strong> La etiqueta está diseñada para impresión en 50x25mm. 
            Asegúrate de configurar tu impresora para este tamaño antes de imprimir.
          </p>
        </div>
      </div>
    </div>
  );
}