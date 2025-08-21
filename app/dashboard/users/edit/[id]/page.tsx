'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/app/ui/button';
import StoreSelect from '@/app/ui/stores/store-select';

export default function EditUserPage({ params }: { params: { id: string } }) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('user');
  const [storeId, setStoreId] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const router = useRouter();
  const userId = params.id;

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const response = await fetch(`/api/users/${userId}`);
        if (!response.ok) {
          throw new Error('Error fetching user');
        }
        const data = await response.json();
        setName(data.name || '');
        setEmail(data.email || '');
        setRole(data.role || 'user');
        setStoreId(data.store_id || '');
      } catch (error) {
        console.error('Error fetching user:', error);
        setError('Error loading user data');
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, [userId]);

  const handleUpdateUser = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);

    try {
      const userData = {
        name,
        email,
        role,
        ...(password && { password }),
        ...(role === 'store' && storeId && { storeId }),
        ...(role !== 'store' && { storeId: null })
      };

      const response = await fetch(`/api/users/${userId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to update user');
      }

      router.push('/dashboard/users');
    } catch (error) {
      setError('Failed to update user');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-6"></div>
          <div className="space-y-6">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i}>
                <div className="h-4 bg-gray-200 rounded w-1/4 mb-2"></div>
                <div className="h-10 bg-gray-200 rounded"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Editar Usuario</h1>
      <form onSubmit={handleUpdateUser} className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Nombre <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-blue-500"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Email <span className="text-red-500">*</span>
          </label>
          <input
            type="email"
            className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-blue-500"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Nueva Contraseña (opcional)
          </label>
          <input
            type="password"
            className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-blue-500"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Dejar en blanco para mantener la actual"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Rol <span className="text-red-500">*</span>
          </label>
          <select
            className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-blue-500"
            value={role}
            onChange={(e) => {
              setRole(e.target.value);
              if (e.target.value !== 'store') {
                setStoreId('');
              }
            }}
          >
            <option value="user">Usuario</option>
            <option value="admin">Administrador</option>
            <option value="store">Tienda</option>
          </select>
        </div>

        {/* Store Selection - Only show if role is 'store' */}
        {role === 'store' && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tienda Asignada <span className="text-red-500">*</span>
            </label>
            <StoreSelect
              value={storeId}
              onChange={setStoreId}
              placeholder="Seleccionar tienda..."
            />
          </div>
        )}

        <div className="flex gap-4 pt-4">
          <Button type="submit" disabled={loading || (role === 'store' && !storeId)}>
            {loading ? 'Actualizando...' : 'Actualizar Usuario'}
          </Button>
          <Button 
            type="button" 
            onClick={() => router.push('/dashboard/users')}
            className="bg-gray-500 hover:bg-gray-600"
          >
            Cancelar
          </Button>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-700">{error}</p>
          </div>
        )}
      </form>
    </div>
  );
}
