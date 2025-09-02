'use client';

import { useState } from 'react';
import Image from 'next/image';
import { TrashIcon, PencilIcon, EyeIcon } from '@heroicons/react/24/outline';
import { getConditionOptionLabel } from '@/app/lib/trade-in/condition-images';
import { getStateDisplayColors } from '@/app/lib/trade-in/product-condition-evaluator';

export interface ProductFormData {
  id: string;
  product_style: string;
  product_size: string;
  credit_range?: string;
  usage_signs: string;
  pilling_level: string;
  tears_holes_level: string;
  repairs_level: string;
  meets_minimum_requirements: boolean;
  product_images?: string[];
  calculated_state?: string;
}

interface ProductsTableProps {
  products: ProductFormData[];
  onEdit: (productId: string) => void;
  onDelete: (productId: string) => void;
  onView?: (productId: string) => void;
}

export default function ProductsTable({ products, onEdit, onDelete, onView }: ProductsTableProps) {
  const [expandedProduct, setExpandedProduct] = useState<string | null>(null);

  const toggleExpanded = (productId: string) => {
    setExpandedProduct(expandedProduct === productId ? null : productId);
  };

  // Generate Patagonia image URL from product style
  const generatePatagoniaImageUrl = (productStyle: string) => {
    if (!productStyle || productStyle.length < 8) return null;
    
    // Replace dash with underscore for Patagonia URL format
    const formattedStyle = productStyle.replace('-', '_');
    
    // Generate Patagonia image URL
    return `https://production-us2.patagonia.com/dw/image/v2/BDJB_PRD/on/demandware.static/-/Sites-patagonia-master/default/images/hi-res/${formattedStyle}.jpg?sw=2000&sh=2000&sfrm=png&q=95&bgcolor=f5f5f5`;
  };

  if (products.length === 0) {
    return (
      <div className="border border-gray-200 rounded-lg p-8 text-center">
        <div className="text-gray-400 mb-2">
          <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
          </svg>
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-1">No hay productos agregados</h3>
        <p className="text-gray-500">Agrega tu primer producto para comenzar con tu solicitud de Trade-in</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">
          Productos Agregados ({products.length})
        </h3>
      </div>

      <div className="space-y-3">
        {products.map((product, index) => (
          <div key={product.id} className="border border-gray-200 rounded-lg overflow-hidden">
            {/* Product Summary Row */}
            <div className="bg-white p-4">
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-4">
                    <div className="flex-shrink-0">
                      <div className="w-12 h-12 bg-gray-100 rounded-lg overflow-hidden flex items-center justify-center">
                        {(() => {
                          const imageUrl = generatePatagoniaImageUrl(product.product_style);
                          return imageUrl ? (
                            <Image
                              src={imageUrl}
                              alt={`${product.product_style}`}
                              width={48}
                              height={48}
                              className="object-cover w-full h-full"
                              onError={(e) => {
                                // Fallback to number if image fails
                                const target = e.target as HTMLImageElement;
                                target.style.display = 'none';
                                const parent = target.parentElement;
                                if (parent) {
                                  parent.innerHTML = `<span class="text-lg font-semibold text-gray-600">${index + 1}</span>`;
                                }
                              }}
                            />
                          ) : (
                            <span className="text-lg font-semibold text-gray-600">
                              {index + 1}
                            </span>
                          );
                        })()}
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-medium text-gray-900 truncate">
                        {product.product_style}
                      </h4>
                      <div className="flex items-center space-x-4 mt-1">
                        <span className="text-xs text-gray-500">
                          Estilo: <span className="font-medium">{product.product_style}</span>
                        </span>
                        <span className="text-xs text-gray-500">
                          Talla: <span className="font-medium">{product.product_size}</span>
                        </span>
                        {product.credit_range && (
                          <span className="text-xs text-gray-500">
                            Crédito: <span className="font-medium">{product.credit_range}</span>
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  {/* Calculated State Indicator */}
                  {product.calculated_state && (
                    <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                      getStateDisplayColors(product.calculated_state as any).bg
                    } ${getStateDisplayColors(product.calculated_state as any).text}`}>
                      {product.calculated_state}
                    </div>
                  )}

                  {/* Action Buttons */}
                  <button
                    type="button"
                    onClick={() => toggleExpanded(product.id)}
                    className="p-1 text-gray-400 hover:text-gray-600"
                    title="Ver detalles"
                  >
                    <EyeIcon className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => onEdit(product.id)}
                    className="p-1 text-gray-400 hover:text-blue-600"
                    title="Editar producto"
                  >
                    <PencilIcon className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => onDelete(product.id)}
                    className="p-1 text-gray-400 hover:text-red-600"
                    title="Eliminar producto"
                  >
                    <TrashIcon className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>

            {/* Expanded Details */}
            {expandedProduct === product.id && (
              <div className="border-t border-gray-200 bg-gray-50 p-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Product Condition */}
                  <div>
                    <h5 className="text-sm font-medium text-gray-900 mb-2">Condición del Producto</h5>
                    <div className="space-y-2 text-xs">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Señales de uso:</span>
                        <span className="font-medium">{getConditionOptionLabel('usage_signs', product.usage_signs)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Nivel de pilling:</span>
                        <span className="font-medium">{getConditionOptionLabel('pilling_level', product.pilling_level)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Rasgaduras y hoyos:</span>
                        <span className="font-medium">{getConditionOptionLabel('tears_holes_level', product.tears_holes_level)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Reparaciones:</span>
                        <span className="font-medium">{getConditionOptionLabel('repairs_level', product.repairs_level)}</span>
                      </div>
                      {product.calculated_state && (
                        <div className="flex justify-between pt-2 border-t border-gray-200 mt-2">
                          <span className="text-gray-600">Estado evaluado:</span>
                          <span className={`font-medium px-2 py-0.5 rounded text-xs ${
                            getStateDisplayColors(product.calculated_state as any).bg
                          } ${getStateDisplayColors(product.calculated_state as any).text}`}>
                            {product.calculated_state}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Product Images */}
                  {product.product_images && product.product_images.length > 0 && (
                    <div>
                      <h5 className="text-sm font-medium text-gray-900 mb-2">
                        Imágenes ({product.product_images.length})
                      </h5>
                      <div className="grid grid-cols-3 gap-2">
                        {product.product_images.slice(0, 6).map((imageUrl, imgIndex) => (
                          <div key={imgIndex} className="relative h-16 bg-gray-100 rounded overflow-hidden">
                            <Image
                              src={imageUrl}
                              alt={`${product.product_style} - Imagen ${imgIndex + 1}`}
                              fill
                              className="object-cover"
                              onError={(e) => {
                                const target = e.target as HTMLImageElement;
                                target.src = '/images/placeholder-product.jpg';
                              }}
                            />
                          </div>
                        ))}
                        {product.product_images.length > 6 && (
                          <div className="h-16 bg-gray-100 rounded flex items-center justify-center">
                            <span className="text-xs text-gray-500">
                              +{product.product_images.length - 6}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Summary */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-center justify-center text-sm">
          <span className="text-blue-800">
            Total de productos: <span className="font-semibold">{products.length}</span>
          </span>
        </div>
      </div>
    </div>
  );
}
