"use client";
import { useState } from 'react';
import { Button } from '@/app/ui/button';

interface CreateConfigFormProps {
  onSubmit: (configData: { config_key: string; config_name: string; config_value: string; description: string }) => void;
  loading: boolean;
  error: string;
}

export default function CreateConfigForm({ onSubmit, loading, error }: CreateConfigFormProps) {
  const [configKey, setConfigKey] = useState('');
  const [configName, setConfigName] = useState('');
  const [configValue, setConfigValue] = useState('');
  const [description, setDescription] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
        config_name: configName, config_key: configKey,
        config_value: configValue, description });
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className="rounded-md bg-gray-50 p-4 md:p-6">
        {/* Config Key */}
        <div className="mb-4">
          <label htmlFor="configKey" className="mb-2 block text-sm font-medium">
            Config Key
          </label>
          <input
            id="configKey"
            name="configKey"
            type="text"
            value={configKey}
            onChange={(e) => setConfigKey(e.target.value)}
            placeholder="Enter config key"
            className="block w-full rounded-md border border-gray-200 py-2 pl-3 text-sm"
            required
          />
        </div>

        {/* Config Name */}
        <div className="mb-4">
          <label htmlFor="configName" className="mb-2 block text-sm font-medium">
            Config Name
          </label>
          <input
            id="configName"
            name="configName"
            type="text"
            value={configName}
            onChange={(e) => setConfigName(e.target.value)}
            placeholder="Enter config name"
            className="block w-full rounded-md border border-gray-200 py-2 pl-3 text-sm"
            required
          />
        </div>

        {/* Config Value */}
        <div className="mb-4">
          <label htmlFor="configValue" className="mb-2 block text-sm font-medium">
            Config Value
          </label>
          <input
            id="configValue"
            name="configValue"
            type="text"
            value={configValue}
            onChange={(e) => setConfigValue(e.target.value)}
            placeholder="Enter config value"
            className="block w-full rounded-md border border-gray-200 py-2 pl-3 text-sm"
            required
          />
        </div>

        {/* Description */}
        <div className="mb-4">
          <label htmlFor="description" className="mb-2 block text-sm font-medium">
            Description
          </label>
          <textarea
            id="description"
            name="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Enter description"
            className="block w-full rounded-md border border-gray-200 py-2 pl-3 text-sm"
          />
        </div>

        {/* Feedback Messages */}
        {error && <p className="text-red-500 text-sm">{error}</p>}
      </div>
      <div className="mt-6 flex justify-end gap-4">
        <Button type="submit" disabled={loading}>
          {loading ? 'Creating...' : 'Create Configuration'}
        </Button>
      </div>
    </form>
  );
}