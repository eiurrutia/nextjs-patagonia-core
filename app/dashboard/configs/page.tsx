"use client";
import { useEffect, useState } from 'react';
import Link from 'next/link';
import EditConfigModal from '@/app/ui/configs/edit-config-modal';

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
    const [editingConfig, setEditingConfig] = useState<Config | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

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

    useEffect(() => {
        fetchConfigs();
    }, []);

    const handleEdit = (config: Config) => {
        setEditingConfig(config);
        setIsModalOpen(true);
    };

    const handleSave = (updatedConfig: Config) => {
        setConfigs(prevConfigs => 
            prevConfigs.map(config => 
                config.id === updatedConfig.id ? updatedConfig : config
            )
        );
    };

    const handleDelete = async (configId: string) => {
        if (!confirm('Are you sure you want to delete this configuration?')) {
            return;
        }

        try {
            const response = await fetch(`/api/configs/${configId}`, {
                method: 'DELETE',
            });

            if (!response.ok) {
                throw new Error('Failed to delete configuration');
            }

            // Remove the deleted config from the state
            setConfigs(prevConfigs => prevConfigs.filter(config => config.id !== configId));
        } catch (error) {
            console.error('Error deleting configuration:', error);
            alert('Error deleting configuration');
        }
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setEditingConfig(null);
    };

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
                        <th className="border-b px-4 py-2 text-left">Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {configs.map((config) => (
                        <tr key={config.id}>
                            <td className="border-b px-4 py-2">{config.config_key}</td>
                            <td className="border-b px-4 py-2">{config.config_name}</td>
                            <td className="border-b px-4 py-2">
                                <span className={`px-2 py-1 rounded text-sm ${
                                    config.config_value === 'true' 
                                        ? 'bg-green-100 text-green-800' 
                                        : config.config_value === 'false'
                                        ? 'bg-red-100 text-red-800'
                                        : 'bg-gray-100 text-gray-800'
                                }`}>
                                    {config.config_value}
                                </span>
                            </td>
                            <td className="border-b px-4 py-2">{config.description}</td>
                            <td className="border-b px-4 py-2">
                                <div className="flex space-x-2">
                                    <button
                                        onClick={() => handleEdit(config)}
                                        className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
                                    >
                                        Edit
                                    </button>
                                    <button
                                        onClick={() => handleDelete(config.id)}
                                        className="px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700"
                                    >
                                        Delete
                                    </button>
                                </div>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
            <div className="mt-4">
                <Link href="/configs/new" className="bg-blue-600 text-white px-4 py-2 rounded">Create New Configuration</Link>
            </div>
            
            <EditConfigModal
                config={editingConfig}
                isOpen={isModalOpen}
                onClose={closeModal}
                onSave={handleSave}
            />
        </div>
    );
}