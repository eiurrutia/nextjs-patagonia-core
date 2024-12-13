'use client';

import { useState, useEffect } from 'react';
import { lusitana } from '@/app/ui/fonts';
import {
  DndContext,
  useSensor,
  useSensors,
  PointerSensor,
  KeyboardSensor,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
  arrayMove,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { ChevronDownIcon, ChevronRightIcon } from '@heroicons/react/24/outline';

type StorePriorityProps = {
  stores: string[];
  onPriorityChange: (newOrder: string[]) => void;
};

function SortableItem({ id, index }: { id: string; index: number }) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <tr
      ref={setNodeRef}
      style={style as React.CSSProperties}
      {...attributes}
      {...listeners}
      className="border-b"
    >
      <td className="py-2 px-4">{index + 1}</td>
      <td className="py-2 px-4">{id}</td>
    </tr>
  );
}

export default function StorePriority({ stores, onPriorityChange }: StorePriorityProps) {
  const [storeOrder, setStoreOrder] = useState<string[]>([]);
  const [isCollapsed, setIsCollapsed] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [originalOrder, setOriginalOrder] = useState<string[]>([]);

  useEffect(() => {
    if (stores.length > 0) {
      setStoreOrder(stores.map((s) => s.trim()));
    }
  }, [stores]);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor)
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    setStoreOrder((prevStores) => {
      const oldIndex = prevStores.indexOf(active.id as string);
      const newIndex = prevStores.indexOf(over.id as string);
      return arrayMove(prevStores, oldIndex, newIndex);
    });
  };

  const handleCollapseToggle = () => {
    setIsCollapsed(!isCollapsed);
  };

  const handleEditClick = async () => {
    if (!isEditing) {
      setOriginalOrder([...storeOrder]);
    } else {
      setIsSaving(true);
      try {
        const resp = await fetch('/api/configs/configs', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            config_key: 'stock_planning_store_priority',
            config_name: 'Store Priority',
            config_value: storeOrder.join(', '),
            description: 'Store priority configuration for stock planning',
          }),
        });

        if (!resp.ok) {
          console.error('Error al guardar prioridades');
          alert('Error al guardar prioridades');
        } else {
          onPriorityChange(storeOrder);
        }
      } catch (error) {
        console.error('Error al guardar prioridades:', error);
      } finally {
        setIsSaving(false);
      }
    }
    setIsEditing(!isEditing);
  };

  const handleCancel = () => {
    setStoreOrder(originalOrder);
    setIsEditing(false);
  };

  return (
    <div className="mb-8">
      <div
        className="flex items-center justify-start cursor-pointer"
        onClick={handleCollapseToggle}
      >
        <h2 className={`${lusitana.className} text-2xl`}>
          {isCollapsed ? (
            <ChevronRightIcon className="inline h-6 w-6 mr-2" />
          ) : (
            <ChevronDownIcon className="inline h-6 w-6 mr-2" />
          )}
          Prioridad de Tiendas
        </h2>
      </div>

      {!isCollapsed && (
        <>
          <div className="mt-4 flex items-start justify-between">
            <div className="w-1/3 border rounded shadow p-4">
              {isEditing ? (
                <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
                  <SortableContext items={storeOrder} strategy={verticalListSortingStrategy}>
                    <table className="table-auto w-full border-collapse">
                      <thead>
                        <tr className="border-b bg-gray-100">
                          <th className="py-2 px-4 text-left">#</th>
                          <th className="py-2 px-4 text-left">Tienda</th>
                        </tr>
                      </thead>
                      <tbody>
                        {storeOrder.map((store, index) => (
                          <SortableItem key={store} id={store} index={index} />
                        ))}
                      </tbody>
                    </table>
                  </SortableContext>
                </DndContext>
              ) : (
                <table className="table-auto w-full border-collapse">
                  <thead>
                    <tr className="border-b bg-gray-100">
                      <th className="py-2 px-4 text-left">#</th>
                      <th className="py-2 px-4 text-left">Tienda</th>
                    </tr>
                  </thead>
                  <tbody>
                    {storeOrder.map((store, index) => (
                      <tr key={store} className="border-b">
                        <td className="py-2 px-4">{index + 1}</td>
                        <td className="py-2 px-4">{store}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            <div className="ml-4 flex-grow flex items-start justify-end gap-2">
              {isEditing && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleCancel();
                  }}
                  className="bg-gray-500 hover:bg-gray-600 text-white py-1 px-3 rounded flex items-center"
                  disabled={isSaving}
                >
                  <span className="font-bold mr-1">X</span> Cancelar
                </button>
              )}
              
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleEditClick();
                }}
                className="bg-blue-500 hover:bg-blue-600 text-white py-1 px-3 rounded flex items-center"
                disabled={isSaving}
              >
                {isSaving ? (
                  <>
                    <svg
                      className="animate-spin h-5 w-5 mr-2 text-white"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291l2.122-2.122A4 4 0 004 12H0c0 2.21.895 4.21 2.343 5.657l1.657 1.657z"
                      ></path>
                    </svg>
                    Guardando...
                  </>
                ) : (
                  isEditing ? 'Guardar' : 'Editar'
                )}
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
