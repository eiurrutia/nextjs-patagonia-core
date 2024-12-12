'use client';

import { useState, useEffect } from 'react';
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

  const handleEditClick = () => {
    if (isEditing) {
      onPriorityChange(storeOrder);
    }
    setIsEditing(!isEditing);
  };

  const handleCollapseToggle = () => {
    setIsCollapsed(!isCollapsed);
  };

  return (
    <div className="mt-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Prioridad de Tiendas</h2>
        <button
          onClick={handleCollapseToggle}
          className="bg-gray-200 hover:bg-gray-300 text-gray-700 py-1 px-3 rounded"
        >
          {isCollapsed ? 'Mostrar' : 'Ocultar'}
        </button>
      </div>

      {!isCollapsed && (
        <div className="mt-4 w-1/3 border rounded shadow p-4 relative">
          <div className="absolute top-2 right-2">
            <button
              onClick={handleEditClick}
              className="bg-blue-500 hover:bg-blue-600 text-white py-1 px-3 rounded"
            >
              {isEditing ? 'Guardar' : 'Editar'}
            </button>
          </div>

          {isEditing ? (
            // Edition mode: with DnD
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
            // Normal mode: just show the list
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
      )}
    </div>
  );
}
