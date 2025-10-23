'use client';

import { useState, useRef } from 'react';
import { DocumentArrowUpIcon } from '@heroicons/react/24/outline';
import Papa from 'papaparse';
import { bulkUploadProductMaster } from '@/app/lib/trade-in/product-master-actions';
import { TradeInProductMasterCSV } from '@/app/lib/definitions';

interface UploadResult {
  success: boolean;
  created: number;
  updated: number;
  errors: string[];
  message: string;
}

interface ChunkProgress {
  currentChunk: number;
  totalChunks: number;
  currentChunkProgress: string;
}

export function CSVUpload() {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState<UploadResult | null>(null);
  const [uploadProgress, setUploadProgress] = useState<string>('');
  const [chunkProgress, setChunkProgress] = useState<ChunkProgress | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    console.log('📁 Starting CSV upload:', file.name, file.size, 'bytes');
    setIsUploading(true);
    setUploadResult(null);
    setUploadProgress('Iniciando...');

    try {
      setUploadProgress('Parseando archivo CSV...');
      console.log('📊 Parsing CSV file...');
      const csvData = await new Promise<TradeInProductMasterCSV[]>((resolve, reject) => {
        Papa.parse(file, {
          delimiter: ';',
          header: true,
          skipEmptyLines: true,
          complete: (results) => {
            console.log('✅ CSV parsed successfully:', results.data.length, 'rows');
            if (results.errors.length > 0) {
              console.error('⚠️ CSV parsing errors:', results.errors);
              reject(new Error(`CSV parsing errors: ${results.errors.map(e => e.message).join(', ')}`));
            } else {
              resolve(results.data as TradeInProductMasterCSV[]);
            }
          },
          error: (error) => {
            console.error('❌ CSV parsing failed:', error);
            reject(error);
          }
        });
      });

      // Validate CSV structure
      if (csvData.length === 0) {
        throw new Error('El archivo CSV está vacío o no tiene datos válidos.');
      }

      console.log('🔍 Validating CSV structure...');
      setUploadProgress('Validando estructura del archivo...');
      // Check required headers
      const firstRow = csvData[0];
      const requiredFields = ['Estilo', 'PRODUCT NAME', 'Estado', 'Credito'];
      const missingFields = requiredFields.filter(field => !(field in firstRow));
      
      if (missingFields.length > 0) {
        throw new Error(`Faltan columnas requeridas: ${missingFields.join(', ')}`);
      }

      // Split into chunks for processing
      const CHUNK_SIZE = 100; // Process 100 products at a time (safe for Vercel limits)
      const chunks: TradeInProductMasterCSV[][] = [];
      
      for (let i = 0; i < csvData.length; i += CHUNK_SIZE) {
        chunks.push(csvData.slice(i, i + CHUNK_SIZE));
      }

      console.log(`📦 Split into ${chunks.length} chunks of max ${CHUNK_SIZE} products each`);
      setUploadProgress(`Dividiendo en ${chunks.length} lotes para procesamiento seguro...`);

      // Process chunks sequentially
      let totalCreated = 0;
      let totalUpdated = 0;
      const allErrors: string[] = [];

      for (let chunkIndex = 0; chunkIndex < chunks.length; chunkIndex++) {
        const chunk = chunks[chunkIndex];
        const chunkNumber = chunkIndex + 1;
        
        setChunkProgress({
          currentChunk: chunkNumber,
          totalChunks: chunks.length,
          currentChunkProgress: `Procesando lote ${chunkNumber}/${chunks.length} (${chunk.length} productos)...`
        });
        
        console.log(`🚀 Processing chunk ${chunkNumber}/${chunks.length} with ${chunk.length} products`);

        try {
          // Add timeout per chunk (45 seconds for 100 products - safe for Vercel)
          const chunkUploadPromise = bulkUploadProductMaster(chunk);
          const chunkTimeoutPromise = new Promise<never>((_, reject) => {
            setTimeout(() => reject(new Error(`Chunk ${chunkNumber} timeout - tardó más de 45 segundos`)), 45000);
          });
          
          const chunkResult = await Promise.race([chunkUploadPromise, chunkTimeoutPromise]);
          
          totalCreated += chunkResult.created;
          totalUpdated += chunkResult.updated;
          allErrors.push(...chunkResult.errors);
          
          console.log(`✅ Chunk ${chunkNumber} completed:`, chunkResult);
          
          // Small delay between chunks to be gentle with the server
          if (chunkNumber < chunks.length) {
            await new Promise(resolve => setTimeout(resolve, 1000));
          }
          
        } catch (chunkError) {
          console.error(`❌ Chunk ${chunkNumber} failed:`, chunkError);
          allErrors.push(`Chunk ${chunkNumber}: ${chunkError instanceof Error ? chunkError.message : 'Error desconocido'}`);
          
          // Continue with next chunk even if this one failed
          continue;
        }
      }

      console.log('✅ All chunks processed:', { totalCreated, totalUpdated, totalErrors: allErrors.length });
      
      setUploadResult({
        success: true,
        created: totalCreated,
        updated: totalUpdated,
        errors: allErrors,
        message: `Upload completed successfully! Created: ${totalCreated}, Updated: ${totalUpdated}${allErrors.length > 0 ? `, Errors: ${allErrors.length}` : ''}`
      });

    } catch (error) {
      console.error('💥 Upload failed:', error);
      setUploadResult({
        success: false,
        created: 0,
        updated: 0,
        errors: [error instanceof Error ? error.message : 'Error desconocido'],
        message: 'Error al procesar el archivo CSV.'
      });
    } finally {
      console.log('🏁 Upload process finished');
      setIsUploading(false);
      setUploadProgress('');
      setChunkProgress(null);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="relative">
      <input
        ref={fileInputRef}
        type="file"
        accept=".csv"
        onChange={handleFileUpload}
        className="hidden"
        disabled={isUploading}
      />
      
      <button
        onClick={triggerFileInput}
        disabled={isUploading}
        className="flex h-10 w-48 items-center justify-between rounded-lg bg-green-600 px-4 text-sm font-medium text-white transition-colors hover:bg-green-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-green-600 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <span className="hidden md:block">
          {isUploading ? (uploadProgress || 'Subiendo...') : 'Subir CSV'}
        </span>
        <DocumentArrowUpIcon className="h-5" />
      </button>

      {/* Progress indicator */}
      {isUploading && (
        <div className="mt-2 space-y-2">
          <div className="text-sm text-blue-600">
            <div className="flex items-center">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
              {uploadProgress}
            </div>
          </div>
          
          {/* Chunk progress */}
          {chunkProgress && (
            <div className="text-xs text-gray-600">
              <div className="flex items-center justify-between mb-1">
                <span>Lote {chunkProgress.currentChunk} de {chunkProgress.totalChunks}</span>
                <span>{Math.round((chunkProgress.currentChunk / chunkProgress.totalChunks) * 100)}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300" 
                  style={{ width: `${(chunkProgress.currentChunk / chunkProgress.totalChunks) * 100}%` }}
                ></div>
              </div>
              <p className="mt-1 text-xs">{chunkProgress.currentChunkProgress}</p>
            </div>
          )}
        </div>
      )}

      {/* Upload Result Modal */}
      {uploadResult && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4 max-h-96 overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">
                Resultado de la Carga
              </h3>
              <button
                onClick={() => setUploadResult(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>
            
            <div className="space-y-3">
              <div className={`p-3 rounded-md ${uploadResult.success ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'}`}>
                {uploadResult.message}
              </div>
              
              {uploadResult.success && (
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="bg-blue-50 p-3 rounded-md">
                    <span className="font-semibold text-blue-800">Creados:</span>
                    <span className="ml-2 text-blue-600">{uploadResult.created}</span>
                  </div>
                  <div className="bg-yellow-50 p-3 rounded-md">
                    <span className="font-semibold text-yellow-800">Actualizados:</span>
                    <span className="ml-2 text-yellow-600">{uploadResult.updated}</span>
                  </div>
                </div>
              )}
              
              {uploadResult.errors.length > 0 && (
                <div className="bg-red-50 p-3 rounded-md">
                  <h4 className="font-semibold text-red-800 mb-2">Errores:</h4>
                  <ul className="text-sm text-red-600 space-y-1 max-h-32 overflow-y-auto">
                    {uploadResult.errors.map((error, index) => (
                      <li key={index} className="list-disc list-inside">
                        {error}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
            
            <div className="mt-4 flex justify-end">
              <button
                onClick={() => setUploadResult(null)}
                className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Instructions */}
      <div className="mt-2 text-xs text-gray-500">
        <p>Formato CSV: Estilo;PRODUCT NAME;Estado;Credito</p>
        <p>Estados válidos: CN, DU, RP</p>
        <p>Crédito: Acepta números o formato $30.000</p>
      </div>
    </div>
  );
}