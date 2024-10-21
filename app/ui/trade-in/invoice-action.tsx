'use client';
import { useState, useEffect } from 'react';
import { DocumentCurrencyDollarIcon, DocumentArrowDownIcon } from '@heroicons/react/24/outline';

interface InvoiceIconProps {
    tradeInId: string;
}

export default function InvoiceIconAction({ tradeInId }: InvoiceIconProps) {
    const [invoiceUrl, setInvoiceUrl] = useState<string | null>(null);
    const [isGenerating, setIsGenerating] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false); // Estado para mostrar/ocultar modal

    useEffect(() => {
        const fetchInvoiceUrl = async () => {
            try {
                const res = await fetch(`/api/trade-in/${tradeInId}`);
                const data = await res.json();
                setInvoiceUrl(data.INVOICE_URL || null);
            } catch (error) {
                console.error('Error fetching invoice:', error);
            }
        };

        fetchInvoiceUrl();
    }, [tradeInId]);

    const handleGenerateInvoice = async () => {
        setIsGenerating(true);
        setIsModalOpen(false); // Cierra el modal

        try {
            const folioRes = await fetch(`/api/trade-in/${tradeInId}/folio`);
            const { folio } = await folioRes.json();

            const invoiceRes = await fetch(`/api/trade-in/${tradeInId}/generate-invoice`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ folio }),
            });

            const { invoiceUrl } = await invoiceRes.json();
            setInvoiceUrl(invoiceUrl);

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

    const openModal = () => setIsModalOpen(true);
    const closeModal = () => setIsModalOpen(false);

    return (
        <>
            {/* Modal de confirmación */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-gray-800 bg-opacity-50 flex items-center justify-center">
                    <div className="bg-white p-6 rounded-lg shadow-lg">
                        <h2 className="text-lg font-semibold mb-4">Confirmación</h2>
                        <p>¿Estás seguro de que deseas generar la factura?</p>
                        <div className="mt-4 flex justify-end space-x-4">
                            <button
                                onClick={closeModal}
                                className="px-4 py-2 bg-gray-300 rounded-lg"
                            >
                                No
                            </button>
                            <button
                                onClick={handleGenerateInvoice}
                                className="px-4 py-2 bg-blue-500 text-white rounded-lg"
                            >
                                Sí, Generar
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Componente principal */}
            <div className="flex items-center justify-between w-full">
                {invoiceUrl ? (
                    <h2 className="text-base font-semibold">Descargar Factura</h2>
                ) : (
                    <h2 className="text-base font-semibold">Generar Factura</h2>
                )}

                <div className="flex items-center space-x-2">
                    {invoiceUrl ? (
                        <a
                            href={invoiceUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm font-medium text-blue-500 hover:text-blue-700"
                        >
                            <DocumentCurrencyDollarIcon className="h-8 w-8 cursor-pointer" />
                        </a>
                    ) : (
                        <button
                            onClick={openModal} // Abre el modal al hacer clic
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
            </div>
        </>
    );
}
