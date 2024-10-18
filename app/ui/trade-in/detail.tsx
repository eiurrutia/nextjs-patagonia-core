'use client';
import { useState, useEffect } from 'react';

export default function TradeInDetail({ id }: { id: string }) {
    const [record, setRecord] = useState<any>(null); // Estado para los datos del Trade-In
    const [isLoading, setIsLoading] = useState(true); // Para manejar la carga de datos del Trade-In

    // Función para obtener los datos del Trade-In por su ID
    const fetchTradeInRecord = async () => {
        try {
            const res = await fetch(`/api/trade-in/${id}`);
            const data = await res.json();
            setRecord(data);
            setIsLoading(false);
        } catch (error) {
            console.error('Error fetching trade-in record:', error);
            setIsLoading(false);
        }
    };

    // Fetch the Trade-In record when the component mounts
    useEffect(() => {
        fetchTradeInRecord();
    }, [id]);

    if (isLoading) {
        return <p>Cargando detalles del Trade-In...</p>;
    }

    if (!record) {
        return <div>No se encontró el registro.</div>;
    }

    return (
        <div className="mt-6 p-4 bg-gray-50 rounded-lg">
            <h1 className="text-2xl font-bold mb-4">Trade-In {id}</h1>
            <div className="flex flex-wrap -mx-3">
                <div className="w-full md:w-1/3 px-3 mb-6">
                    <h2 className="text-lg font-semibold">Nombre</h2>
                    <p>{record.FIRST_NAME} {record.LAST_NAME}</p>
                </div>
                <div className="w-full md:w-1/3 px-3 mb-6">
                    <h2 className="text-lg font-semibold">RUT</h2>
                    <p>{record.RUT}</p>
                </div>
                <div className="w-full md:w-1/3 px-3 mb-6">
                    <h2 className="text-lg font-semibold">Email</h2>
                    <p>{record.EMAIL}</p>
                </div>
                <div className="w-full md:w-1/3 px-3 mb-6">
                    <h2 className="text-lg font-semibold">Teléfono</h2>
                    <p>{record.PHONE}</p>
                </div>
                <div className="w-full md:w-1/3 px-3 mb-6">
                    <h2 className="text-lg font-semibold">Producto Seleccionado</h2>
                    <p>{record.SELECTED_ITEM_COLOR}</p>
                </div>
                <div className="w-full md:w-1/3 px-3 mb-6">
                    <h2 className="text-lg font-semibold">Dirección</h2>
                    <p>{record.ADDRESS}</p>
                </div>
                <div className="w-full md:w-1/3 px-3 mb-6">
                    <h2 className="text-lg font-semibold">Detalles de Casa</h2>
                    <p>{record.HOUSE_DETAILS}</p>
                </div>
                <div className="w-full md:w-1/3 px-3 mb-6">
                    <h2 className="text-lg font-semibold">Comentario</h2>
                    <p>{record.CLIENT_COMMENT || 'No comments'}</p>
                </div>
                <div className="w-full md:w-1/3 px-3 mb-6">
                    <h2 className="text-lg font-semibold">Comentario Admin</h2>
                    <p>{record.ADMIN_COMMENT || 'No admin comments'}</p>
                </div>
                <div className="w-full md:w-1/3 px-3 mb-6">
                    <h2 className="text-lg font-semibold">Fecha Actualización</h2>
                    <p>{record.SNOWFLAKE_UPDATED_AT}</p>
                </div>
            </div>
        </div>
    );
}
