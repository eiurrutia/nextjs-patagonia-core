"use client";
import { useEffect, useState } from 'react';
import Link from 'next/link';

interface Config {
  id: string;
  config_key: string;
  config_name: string;
  config_value: string;
  description: string;
}

export default function ConfigsPage() {
    const [configs, setConfigs] = useState<Config[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchConfigs = async () => {
            try {
                const response = await fetch('/api/configs/configs');
                const data = await response.json();
                setConfigs(data);
            } catch (error) {
                console.error('Error fetching configurations:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchConfigs();
    }, []);

    if (loading) return <p>Loading...</p>;

    return (
        <div>
            <h1 className="text-xl font-bold mb-4">Configurations</h1>
            <table className="min-w-full table-auto border-collapse">
                <thead>
                    <tr>
                        <th className="border-b px-4 py-2 text-left">Config Key</th>
                        <th className="border-b px-4 py-2 text-left">Config Name</th>
                        <th className="border-b px-4 py-2 text-left">Config Value</th>
                        <th className="border-b px-4 py-2 text-left">Description</th>
                    </tr>
                </thead>
                <tbody>
                    {configs.map((config) => (
                        <tr key={config.id}>
                            <td className="border-b px-4 py-2">{config.config_key}</td>
                            <td className="border-b px-4 py-2">{config.config_name}</td>
                            <td className="border-b px-4 py-2">{config.config_value}</td>
                            <td className="border-b px-4 py-2">{config.description}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
            <div className="mt-4">
                <Link href="/dashboard/configs/new" className="bg-blue-600 text-white px-4 py-2 rounded">Create New Configuration</Link>
            </div>
        </div>
    );
}