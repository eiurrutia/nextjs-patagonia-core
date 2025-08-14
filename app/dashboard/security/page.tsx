'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { 
  ShieldCheckIcon, 
  ExclamationTriangleIcon,
  ClockIcon,
  ComputerDesktopIcon,
  EnvelopeIcon,
  TrashIcon,
  LockClosedIcon,
  LockOpenIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline';

interface RateLimitInfo {
  count: number;
  lastAttempt: number;
  blocked: boolean;
  blockExpires?: number;
  temporalBlocksCount: number;
  permanentlyBlocked: boolean;
}

interface SecurityRecord {
  identifier: string;
  info: RateLimitInfo;
}

interface SecurityStats {
  totalRecords: number;
  activeBlocks: number;
  permanentBlocks: number;
  temporalBlocks: number;
  recentAttempts: number;
  emailBlocks: number;
  ipBlocks: number;
}

export default function SecurityManagement() {
  const { data: session } = useSession();
  const [records, setRecords] = useState<SecurityRecord[]>([]);
  const [stats, setStats] = useState<SecurityStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [newBlockIdentifier, setNewBlockIdentifier] = useState('');
  const [newBlockPermanent, setNewBlockPermanent] = useState(false);

  // Load data
  const fetchSecurityData = async () => {
    try {
      const response = await fetch('/api/security');
      if (response.ok) {
        const data = await response.json();
        setRecords(data.records);
        setStats(data.stats);
      } else {
        console.error('Error al cargar datos de seguridad');
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSecurityData();
  }, []);

  // Ejecutar acción
  const executeAction = async (action: string, identifier: string, permanent?: boolean) => {
    setActionLoading(identifier);
    try {
      const response = await fetch('/api/security', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action, identifier, permanent }),
      });

      if (response.ok) {
        const result = await response.json();
        alert(result.message);
        fetchSecurityData(); // Reload data
      } else {
        const error = await response.json();
        alert(`Error: ${error.message}`);
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Error al ejecutar la acción');
    } finally {
      setActionLoading(null);
    }
  };

  // Block new identifier
  const handleNewBlock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBlockIdentifier.trim()) return;

    await executeAction('block', newBlockIdentifier, newBlockPermanent);
    setNewBlockIdentifier('');
    setNewBlockPermanent(false);
  };

  // Format date
  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleString('es-ES');
  };

  // Format identifier
  const formatIdentifier = (identifier: string) => {
    if (identifier.startsWith('email:')) {
      return identifier.replace('email:', '');
    }
    if (identifier.startsWith('ip:')) {
      return identifier.replace('ip:', '');
    }
    return identifier;
  };

  // Get icon by type
  const getTypeIcon = (identifier: string) => {
    if (identifier.startsWith('email:')) {
      return <EnvelopeIcon className="h-5 w-5 text-blue-500" />;
    }
    if (identifier.startsWith('ip:')) {
      return <ComputerDesktopIcon className="h-5 w-5 text-green-500" />;
    }
    return <ExclamationTriangleIcon className="h-5 w-5 text-gray-500" />;
  };

  // Verify if the user is admin
  if (session?.user?.role !== 'admin') {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <ExclamationTriangleIcon className="mx-auto h-12 w-12 text-red-500" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">Acceso denegado</h3>
          <p className="mt-1 text-sm text-gray-500">Solo los administradores pueden acceder a esta sección.</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <ArrowPathIcon className="h-8 w-8 animate-spin text-blue-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="sm:flex sm:items-center">
        <div className="sm:flex-auto">
          <h1 className="text-xl font-semibold text-gray-900">Gestión de Seguridad</h1>
          <p className="mt-2 text-sm text-gray-700">
            Administra los bloqueos de seguridad y monitorea intentos de acceso fallidos.
          </p>
        </div>
      </div>

      {/* Estadísticas */}
      {stats && (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <ShieldCheckIcon className="h-6 w-6 text-gray-400" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Total Registros</dt>
                    <dd className="text-lg font-medium text-gray-900">{stats.totalRecords}</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <ExclamationTriangleIcon className="h-6 w-6 text-red-400" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Bloqueos Activos</dt>
                    <dd className="text-lg font-medium text-gray-900">{stats.activeBlocks}</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <EnvelopeIcon className="h-6 w-6 text-blue-400" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Emails Bloqueados</dt>
                    <dd className="text-lg font-medium text-gray-900">{stats.emailBlocks}</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <ComputerDesktopIcon className="h-6 w-6 text-green-400" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">IPs Bloqueadas</dt>
                    <dd className="text-lg font-medium text-gray-900">{stats.ipBlocks}</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Formulario para nuevo bloqueo */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900">Bloquear Nuevo Identificador</h3>
          <div className="mt-2 max-w-xl text-sm text-gray-500">
            <p>Bloquea manualmente una dirección de email o IP. Usa el formato: email:usuario@ejemplo.com o ip:192.168.1.1</p>
          </div>
          <form className="mt-5 sm:flex sm:items-center" onSubmit={handleNewBlock}>
            <div className="w-full sm:max-w-xs">
              <input
                type="text"
                className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                placeholder="email:user@example.com"
                value={newBlockIdentifier}
                onChange={(e) => setNewBlockIdentifier(e.target.value)}
              />
            </div>
            <div className="mt-3 sm:mt-0 sm:ml-3 sm:flex-shrink-0">
              <label className="inline-flex items-center">
                <input
                  type="checkbox"
                  className="rounded border-gray-300 text-indigo-600 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
                  checked={newBlockPermanent}
                  onChange={(e) => setNewBlockPermanent(e.target.checked)}
                />
                <span className="ml-2 text-sm text-gray-600">Permanente</span>
              </label>
            </div>
            <div className="mt-3 sm:mt-0 sm:ml-3 sm:flex-shrink-0">
              <button
                type="submit"
                className="w-full bg-indigo-600 border border-transparent rounded-md py-2 px-4 flex justify-center text-sm font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Bloquear
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Acciones globales */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900">Acciones Globales</h3>
          <div className="mt-5">
            <button
              onClick={() => executeAction('cleanup', 'global')}
              className="bg-yellow-600 border border-transparent rounded-md py-2 px-4 text-sm font-medium text-white hover:bg-yellow-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500"
            >
              Limpiar Registros Antiguos
            </button>
          </div>
        </div>
      </div>

      {/* Tabla de registros */}
      <div className="bg-white shadow overflow-hidden sm:rounded-md">
        <div className="px-4 py-5 sm:px-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900">Registros de Seguridad</h3>
          <p className="mt-1 max-w-2xl text-sm text-gray-500">
            Lista de todos los intentos fallidos y bloqueos activos.
          </p>
        </div>
        <ul className="divide-y divide-gray-200">
          {records.map((record) => (
            <li key={record.identifier}>
              <div className="px-4 py-4 flex items-center justify-between">
                <div className="flex items-center">
                  {getTypeIcon(record.identifier)}
                  <div className="ml-4">
                    <div className="flex items-center">
                      <p className="text-sm font-medium text-gray-900">
                        {formatIdentifier(record.identifier)}
                      </p>
                      {record.info.permanentlyBlocked && (
                        <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                          Bloqueado Permanente
                        </span>
                      )}
                      {record.info.blocked && !record.info.permanentlyBlocked && (
                        <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                          Bloqueado Temporal
                        </span>
                      )}
                    </div>
                    <div className="mt-1 flex items-center text-sm text-gray-500">
                      <ClockIcon className="flex-shrink-0 mr-1.5 h-4 w-4" />
                      <p>
                        Último intento: {formatDate(record.info.lastAttempt)} | 
                        Intentos: {record.info.count} | 
                        Bloqueos temporales: {record.info.temporalBlocksCount}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  {(record.info.blocked || record.info.permanentlyBlocked) && (
                    <button
                      onClick={() => executeAction('unblock', record.identifier)}
                      disabled={actionLoading === record.identifier}
                      className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50"
                    >
                      <LockOpenIcon className="h-4 w-4 mr-1" />
                      Desbloquear
                    </button>
                  )}
                  {!record.info.blocked && !record.info.permanentlyBlocked && (
                    <button
                      onClick={() => executeAction('block', record.identifier, false)}
                      disabled={actionLoading === record.identifier}
                      className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-yellow-600 hover:bg-yellow-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500 disabled:opacity-50"
                    >
                      <LockClosedIcon className="h-4 w-4 mr-1" />
                      Bloquear
                    </button>
                  )}
                  <button
                    onClick={() => executeAction('delete', record.identifier)}
                    disabled={actionLoading === record.identifier}
                    className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50"
                  >
                    <TrashIcon className="h-4 w-4 mr-1" />
                    Eliminar
                  </button>
                </div>
              </div>
            </li>
          ))}
        </ul>
        {records.length === 0 && (
          <div className="text-center py-12">
            <ShieldCheckIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No hay registros</h3>
            <p className="mt-1 text-sm text-gray-500">No se han detectado intentos fallidos aún.</p>
          </div>
        )}
      </div>
    </div>
  );
}
