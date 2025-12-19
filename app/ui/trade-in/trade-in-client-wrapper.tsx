'use client';

import { useState } from 'react';
import Tabs from '@/app/ui/trade-in/tabs';
import AdvancedFilters from '@/app/ui/trade-in/advanced-filters';

interface Store {
  id: string;
  name: string;
  code: string;
}

interface TradeInClientWrapperProps {
  stores: Store[];
  children: React.ReactNode[];
}

export default function TradeInClientWrapper({ stores, children }: TradeInClientWrapperProps) {
  const [activeTab, setActiveTab] = useState<'requests' | 'products'>('requests');

  const handleTabChange = (index: number) => {
    setActiveTab(index === 0 ? 'requests' : 'products');
  };

  return (
    <>
      <AdvancedFilters activeTab={activeTab} stores={stores} />
      
      <Tabs 
        tabLabels={['Solicitudes', 'Productos']}
        tabIcons={['clipboard', 'tag']}
        onTabChange={handleTabChange}
      >
        {children}
      </Tabs>
    </>
  );
}
