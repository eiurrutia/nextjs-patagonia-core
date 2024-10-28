'use client';
import { useState, useEffect } from 'react';
import { UserIcon, IdentificationIcon, EnvelopeIcon, PhoneIcon, HomeIcon, PencilIcon } from '@heroicons/react/24/outline';
import { CardSkeleton } from '@/app/ui/skeletons';

const fieldIcons = {
    name: <UserIcon className="h-6 w-6 text-gray-500" />,
    rut: <IdentificationIcon className="h-6 w-6 text-gray-500" />,
    email: <EnvelopeIcon className="h-6 w-6 text-gray-500" />,
    phone: <PhoneIcon className="h-6 w-6 text-gray-500" />,
    address: <HomeIcon className="h-6 w-6 text-gray-500" />,
    comment: <PencilIcon className="h-6 w-6 text-gray-500" />
};

export default function TradeInDetail({ id }: { id: string }) {
    const [record, setRecord] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
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

        fetchTradeInRecord();
    }, [id]);

    if (isLoading) return <><CardSkeleton /></>;
    if (!record) return <div>No se encontró el registro.</div>;

    return (
        <div className="p-2 pt-6 bg-gray-50 rounded-lg">
            <h1 className="text-xl font-bold mb-4 pl-4">Trade-In {id}</h1>
            <div className="space-y-4 bg-white m-1 p-4 rounded-lg">
                <div className="flex items-center space-x-4">
                    {fieldIcons.name}
                    <p>{record.FIRST_NAME} {record.LAST_NAME}</p>
                </div>
                <div className="flex items-center space-x-4">
                    {fieldIcons.rut}
                    <p>{record.RUT}</p>
                </div>
                <div className="flex items-center space-x-4">
                    {fieldIcons.email}
                    <p>{record.EMAIL}</p>
                </div>
                <div className="flex items-center space-x-4">
                    {fieldIcons.phone}
                    <p>{record.PHONE}</p>
                </div>
                <div className="flex items-center space-x-4">
                    {fieldIcons.address}
                    <p>{record.ADDRESS} - {record.HOUSE_DETAILS}</p>
                </div>
                <div className="flex items-center space-x-4">
                    {fieldIcons.comment}
                    <p>{record.CLIENT_COMMENT || 'No comments'}</p>
                </div>
            </div>
        </div>
    );
}
