import { useState, useEffect } from 'react';

interface Config {
  id: string;
  config_key: string;
  config_name: string;
  config_value: string;
  description: string;
}

interface EditConfigModalProps {
  config: Config | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (updatedConfig: Config) => void;
}

export default function EditConfigModal({ config, isOpen, onClose, onSave }: EditConfigModalProps) {
  const [formData, setFormData] = useState({
    config_key: '',
    config_name: '',
    config_value: '',
    description: ''
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (config) {
      setFormData({
        config_key: config.config_key,
        config_name: config.config_name,
        config_value: config.config_value,
        description: config.description || ''
      });
    }
  }, [config]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!config) return;

    setLoading(true);
    try {
      const response = await fetch(`/api/configs/${config.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        throw new Error('Failed to update configuration');
      }

      // Call the onSave callback with the updated config
      onSave({
        ...config,
        ...formData
      });

      onClose();
    } catch (error) {
      console.error('Error updating configuration:', error);
      alert('Error updating configuration');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  if (!isOpen || !config) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
        <h2 className="text-xl font-bold mb-4">Edit Configuration</h2>
        
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label htmlFor="config_key" className="block text-sm font-medium text-gray-700 mb-1">
              Config Key
            </label>
            <input
              type="text"
              id="config_key"
              name="config_key"
              value={formData.config_key}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          <div className="mb-4">
            <label htmlFor="config_name" className="block text-sm font-medium text-gray-700 mb-1">
              Config Name
            </label>
            <input
              type="text"
              id="config_name"
              name="config_name"
              value={formData.config_name}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          <div className="mb-4">
            <label htmlFor="config_value" className="block text-sm font-medium text-gray-700 mb-1">
              Config Value
            </label>
            <input
              type="text"
              id="config_value"
              name="config_value"
              value={formData.config_value}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          <div className="mb-6">
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-600 bg-gray-200 rounded-md hover:bg-gray-300"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
