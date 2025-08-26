'use client';
import { useSession } from 'next-auth/react';
import { UserCircleIcon, BuildingStorefrontIcon, ShieldCheckIcon } from '@heroicons/react/24/outline';

export default function UserInfoCard() {
  const { data: session } = useSession();

  if (!session?.user) {
    return null;
  }

  const getRoleInfo = (role: string) => {
    switch (role) {
      case 'admin':
        return {
          label: 'Administrador',
          icon: <ShieldCheckIcon className="h-4 w-4" />,
          color: 'text-purple-600 bg-purple-50 border-purple-200'
        };
      case 'store':
        return {
          label: 'Tienda',
          icon: <BuildingStorefrontIcon className="h-4 w-4" />,
          color: 'text-green-600 bg-green-50 border-green-200'
        };
      case 'user':
      default:
        return {
          label: 'Usuario',
          icon: <UserCircleIcon className="h-4 w-4" />,
          color: 'text-blue-600 bg-blue-50 border-blue-200'
        };
    }
  };

  const roleInfo = getRoleInfo(session.user.role || 'user');

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-3">
      <div className="flex items-center space-x-3">
        <div className="flex-shrink-0">
          <UserCircleIcon className="h-8 w-8 text-gray-400" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-900 truncate">
            {session.user.name || session.user.email}
          </p>
          <div className="flex items-center space-x-2">
            <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium border ${roleInfo.color}`}>
              {roleInfo.icon}
              {roleInfo.label}
            </span>
          </div>
          {session.user.role === 'store' && session.user.store_name && (
            <p className="text-xs text-gray-500 mt-1">
              📍 {session.user.store_name}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
