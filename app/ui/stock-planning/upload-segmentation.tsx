'use client';
import { useState } from 'react';

export default function UploadSegmentation() {
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const detectDelimiter = (text: string): string => {
    const firstLine = text.split('\n')[0];
    const commaCount = (firstLine.match(/,/g) || []).length;
    const semicolonCount = (firstLine.match(/;/g) || []).length;
    return commaCount >= semicolonCount ? ',' : ';';
  };

  const handleFileUpload = async () => {
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      setIsUploading(true);
      const text = event.target?.result as string;
      const delimiter = detectDelimiter(text);

      const rows = text
        .split('\n')
        .slice(1)
        .filter((row) => row.trim() !== '')
        .map((row) => row.split(delimiter));

      const data = rows.map((row) => ({
        SKU: row[0],
        COYHAIQUE: Number(row[1]) || 0,
        LASCONDES: Number(row[2]) || 0,
        MALLSPORT: Number(row[3]) || 0,
        COSTANERA: Number(row[4]) || 0,
        CONCEPCION: Number(row[5]) || 0,
        PTOVARAS: Number(row[6]) || 0,
        LADEHESA: Number(row[7]) || 0,
        PUCON: Number(row[8]) || 0,
        TEMUCO: Number(row[9]) || 0,
        OSORNO: Number(row[10]) || 0,
        ALERCE: Number(row[11]) || 0,
        BNAVENTURA: Number(row[12]) || 0,
      }));

      try {
        const response = await fetch('/api/stock-planning/upload-segments', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        });

        if (!response.ok) {
          throw new Error('Failed to upload stock segmentation');
        }

        alert('File uploaded successfully!');
      } catch (error) {
        console.error('Error uploading file:', error);
        alert('Failed to upload file.');
      } finally {
        setIsUploading(false);
        setFile(null);
      }
    };

    reader.readAsText(file);
  };

  return (
    <div className="flex items-center gap-2">
      <input
        type="file"
        accept=".csv"
        onChange={(e) => setFile(e.target.files?.[0] || null)}
        className="border p-1"
        disabled={isUploading}
      />
      <button
        onClick={handleFileUpload}
        className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
        disabled={isUploading}
      >
        {isUploading ? 'Uploading...' : 'Upload'}
      </button>
    </div>
  );
}
