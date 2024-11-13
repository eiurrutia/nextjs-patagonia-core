'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import CreateConfigForm from '@/app/ui/configs/form';

export default function NewConfigPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const router = useRouter();

  const handleCreateConfig = async (configData: { config_key: string; config_name: string; config_value: string; description: string }) => {
    setLoading(true);

    try {
      const response = await fetch('/api/configs/configs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(configData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Error creating config');
      }

      router.push('/dashboard/configs');
    } catch (error) {
      if (error instanceof Error) {
        setError(error.message);
      } else {
        setError('An unknown error occurred');
      }
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h1 className="text-xl font-bold mb-4">Create New Configuration</h1>
      <CreateConfigForm onSubmit={handleCreateConfig} loading={loading} error={error} />
    </div>
  );
}