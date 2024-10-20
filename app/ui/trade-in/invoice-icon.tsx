'use client';
import { useState, useEffect } from 'react';
import { DocumentCurrencyDollarIcon, DocumentArrowDownIcon } from '@heroicons/react/24/outline';

interface InvoiceIconProps {
  tradeInId: string;
}

export default function InvoiceIcon({ tradeInId }: InvoiceIconProps) {
  const [invoiceUrl, setInvoiceUrl] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  // Fetch the invoice URL when the component loads
  useEffect(() => {
    const fetchInvoiceUrl = async () => {
      try {
        const res = await fetch(`/api/trade-in/${tradeInId}`);
        const data = await res.json();
        console.log('Invoice URL:', data.INVOICE_URL);
        setInvoiceUrl(data.INVOICE_URL || null);
      } catch (error) {
        console.error('Error fetching invoice:', error);
      }
    };

    fetchInvoiceUrl();
  }, [tradeInId]);

  // Handle invoice generation and save the URL in Snowflake
  const handleGenerateInvoice = async () => {
    setIsGenerating(true);

    try {
        const folioRes = await fetch(`/api/trade-in/${tradeInId}/folio`);
        const { folio } = await folioRes.json();

        const invoiceRes = await fetch(`/api/trade-in/${tradeInId}/generate-invoice`, {
            method: 'POST',
            headers: {
            'Content-Type': 'application/json',
            },
            body: JSON.stringify({ folio }),
        });

        const { invoiceUrl } = await invoiceRes.json();
        setInvoiceUrl(invoiceUrl); // Update state with the new URL

        // Save the invoice URL in Snowflake
        await fetch(`/api/trade-in/${tradeInId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ INVOICE_URL: invoiceUrl }),
        });
        } catch (error) {
        console.error('Error generating invoice:', error);
        } finally {
        setIsGenerating(false);
        }
  };

  return (
    <div className="relative mr-80">
      {invoiceUrl ? (
        <a 
          href={invoiceUrl} 
          target="_blank" 
          rel="noopener noreferrer"
          className="flex items-center space-x-2"
        >
          <DocumentCurrencyDollarIcon className="h-8 w-8 text-blue-500 hover:text-blue-700 cursor-pointer" />
          <span className="text-sm font-medium text-blue-500 hover:text-blue-700">Descargar Factura</span>
        </a>
      ) : (
        <button 
          onClick={handleGenerateInvoice} 
          disabled={isGenerating} 
          className="flex items-center space-x-2"
        >
          <DocumentArrowDownIcon
            className={`h-8 w-8 ${
              isGenerating ? 'text-gray-400' : 'text-gray-600 hover:text-blue-500'
            } cursor-pointer`}
          />
          <span className="text-sm font-medium">
            {isGenerating ? 'Generando...' : 'Generar Factura'}
          </span>
        </button>
      )}
    </div>
  );

}
