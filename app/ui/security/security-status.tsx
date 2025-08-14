'use client';

import { useState, useEffect } from 'react';
import { 
  ShieldCheckIcon, 
  ExclamationTriangleIcon,
  ClockIcon
} from '@heroicons/react/24/outline';

interface SecurityStats {
  totalRecords: number;
  activeBlocks: number;
  permanentBlocks: number;
  temporalBlocks: number;
  recentAttempts: number;
  emailBlocks: number;
  ipBlocks: number;
}

interface SecurityStatusProps {
  refreshInterval?: number;
}

export default function SecurityStatus({ refreshInterval = 30000 }: SecurityStatusProps) {
  const [stats, setStats] = useState<SecurityStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/security');
      if (response.ok) {
        const data = await response.json();
        setStats(data.stats);
        setLastUpdate(new Date());
      }
    } catch (error) {
      console.error('Error al obtener estadísticas de seguridad:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
    
    const interval = setInterval(fetchStats, refreshInterval);
    
    return () => clearInterval(interval);
  }, [refreshInterval]);

  if (loading) {
    return (
      <div className="bg-white shadow rounded-lg p-4">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-2"></div>
          <div className="h-8 bg-gray-200 rounded w-1/2"></div>
        </div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="bg-white shadow rounded-lg p-4">
        <div className="flex items-center">
          <ExclamationTriangleIcon className="h-5 w-5 text-red-500 mr-2" />
          <span className="text-sm text-gray-600">Error al cargar estadísticas</span>
        </div>
      </div>
    );
  }

  const getStatusColor = () => {
    if (stats.activeBlocks > 10) return 'text-red-600';
    if (stats.activeBlocks > 5) return 'text-yellow-600';
    return 'text-green-600';
  };

  const getStatusIcon = () => {
    if (stats.activeBlocks > 10) {
      return <ExclamationTriangleIcon className="h-5 w-5 text-red-500" />;
    }
    return <ShieldCheckIcon className="h-5 w-5 text-green-500" />;
  };

  return (
    <div className="bg-white shadow rounded-lg p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          {getStatusIcon()}
          <div className="ml-3">
            <h3 className="text-sm font-medium text-gray-900">Estado de Seguridad</h3>
            <p className={`text-lg font-semibold ${getStatusColor()}`}>
              {stats.activeBlocks} bloqueos activos
            </p>
          </div>
        </div>
        <div className="text-right">
          <div className="text-xs text-gray-500 flex items-center">
            <ClockIcon className="h-3 w-3 mr-1" />
            {lastUpdate ? lastUpdate.toLocaleTimeString('es-ES') : 'N/A'}
          </div>
        </div>
      </div>
      
      {stats.recentAttempts > 0 && (
        <div className="mt-3 pt-3 border-t border-gray-200">
          <p className="text-xs text-gray-600">
            <span className="font-medium text-orange-600">{stats.recentAttempts}</span> intentos recientes detectados
          </p>
        </div>
      )}
    </div>
  );
}
