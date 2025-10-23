'use client';

import Link from 'next/link';
import {
  CheckIcon,
  ClockIcon,
  CurrencyDollarIcon,
  UserCircleIcon,
} from '@heroicons/react/24/outline';
import { Button } from '@/app/ui/button';
import { createProductMaster } from '@/app/lib/trade-in/product-master-actions';
import { useFormState } from 'react-dom';

export default function Form() {
  const initialState = { message: null, errors: {} };
  const [state, dispatch] = useFormState(createProductMaster, initialState);

  return (
    <form action={dispatch}>
      <div className="rounded-md bg-gray-50 p-4 md:p-6">
        {/* Style Code */}
        <div className="mb-4">
          <label htmlFor="styleCode" className="mb-2 block text-sm font-medium">
            Código de Estilo
          </label>
          <div className="relative mt-2 rounded-md">
            <div className="relative">
              <input
                id="styleCode"
                name="styleCode"
                type="text"
                placeholder="Ingrese el código de estilo"
                className="peer block w-full rounded-md border border-gray-200 py-2 pl-10 text-sm outline-2 placeholder:text-gray-500"
                aria-describedby="styleCode-error"
              />
              <UserCircleIcon className="pointer-events-none absolute left-3 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-gray-500 peer-focus:text-gray-900" />
            </div>
          </div>
          <div id="styleCode-error" aria-live="polite" aria-atomic="true">
            {state.errors?.styleCode &&
              state.errors.styleCode.map((error: string) => (
                <p className="mt-2 text-sm text-red-500" key={error}>
                  {error}
                </p>
              ))}
          </div>
        </div>

        {/* Product Name */}
        <div className="mb-4">
          <label htmlFor="productName" className="mb-2 block text-sm font-medium">
            Nombre del Producto
          </label>
          <div className="relative mt-2 rounded-md">
            <div className="relative">
              <input
                id="productName"
                name="productName"
                type="text"
                placeholder="Ingrese el nombre del producto"
                className="peer block w-full rounded-md border border-gray-200 py-2 pl-10 text-sm outline-2 placeholder:text-gray-500"
                aria-describedby="productName-error"
              />
              <UserCircleIcon className="pointer-events-none absolute left-3 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-gray-500 peer-focus:text-gray-900" />
            </div>
          </div>
          <div id="productName-error" aria-live="polite" aria-atomic="true">
            {state.errors?.productName &&
              state.errors.productName.map((error: string) => (
                <p className="mt-2 text-sm text-red-500" key={error}>
                  {error}
                </p>
              ))}
          </div>
        </div>

        {/* Condition State */}
        <div className="mb-4">
          <label htmlFor="conditionState" className="mb-2 block text-sm font-medium">
            Estado de Condición
          </label>
          <div className="relative">
            <select
              id="conditionState"
              name="conditionState"
              className="peer block w-full cursor-pointer rounded-md border border-gray-200 py-2 pl-10 text-sm outline-2 placeholder:text-gray-500"
              defaultValue=""
              aria-describedby="conditionState-error"
            >
              <option value="" disabled>
                Seleccione un estado
              </option>
              <option value="CN">Como Nuevo</option>
              <option value="DU">Detalles de Uso</option>
              <option value="RP">Reparado</option>
            </select>
            <ClockIcon className="pointer-events-none absolute left-3 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-gray-500" />
          </div>
          <div id="conditionState-error" aria-live="polite" aria-atomic="true">
            {state.errors?.conditionState &&
              state.errors.conditionState.map((error: string) => (
                <p className="mt-2 text-sm text-red-500" key={error}>
                  {error}
                </p>
              ))}
          </div>
        </div>

        {/* Credit Amount */}
        <div className="mb-4">
          <label htmlFor="creditAmount" className="mb-2 block text-sm font-medium">
            Monto de Crédito
          </label>
          <div className="relative mt-2 rounded-md">
            <div className="relative">
              <input
                id="creditAmount"
                name="creditAmount"
                type="number"
                step="0.01"
                placeholder="Ingrese el monto de crédito"
                className="peer block w-full rounded-md border border-gray-200 py-2 pl-10 text-sm outline-2 placeholder:text-gray-500"
                aria-describedby="creditAmount-error"
              />
              <CurrencyDollarIcon className="pointer-events-none absolute left-3 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-gray-500 peer-focus:text-gray-900" />
            </div>
          </div>
          <div id="creditAmount-error" aria-live="polite" aria-atomic="true">
            {state.errors?.creditAmount &&
              state.errors.creditAmount.map((error: string) => (
                <p className="mt-2 text-sm text-red-500" key={error}>
                  {error}
                </p>
              ))}
          </div>
        </div>

        <div aria-live="polite" aria-atomic="true">
          {state.message && (
            <p className="mt-2 text-sm text-red-500">
              {state.message}
            </p>
          )}
        </div>
      </div>
      <div className="mt-6 flex justify-end gap-4">
        <Link
          href="/dashboard/trade-in/config"
          className="flex h-10 items-center rounded-lg bg-gray-100 px-4 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-200"
        >
          Cancelar
        </Link>
        <Button type="submit">Crear Producto</Button>
      </div>
    </form>
  );
}