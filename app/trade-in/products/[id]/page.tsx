'use client';

import { useState, useEffect } from 'react';
import { notFound } from 'next/navigation';
import ProductDetailInfo from '@/app/ui/trade-in/product-detail-info';
import ProductStatusTimeline from '@/app/ui/trade-in/product-status-timeline';
import Link from 'next/link';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';
import { CardSkeleton } from '@/app/ui/skeletons';

type ProductStatus = 'en_tienda' | 'etiqueta_generada' | 'empacado' | 'enviado';

interface ProductData {
  id: number;
  product_style: string;
  product_size: string;
  confirmed_sku?: string;
  product_status?: ProductStatus;
  [key: string]: any; // For other product properties
}

export default function ProductDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const [product, setProduct] = useState<ProductData | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFoundError, setNotFoundError] = useState(false);

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const response = await fetch(`/api/trade-in/products/${params.id}`);
        
        if (!response.ok) {
          if (response.status === 404) {
            setNotFoundError(true);
            return;
          }
          throw new Error('Failed to fetch product');
        }
        
        const data = await response.json();
        setProduct(data);
      } catch (error) {
        console.error('Error fetching product:', error);
        setNotFoundError(true);
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [params.id]);

  const handleStatusChange = (newStatus: ProductStatus) => {
    if (product) {
      const updatedProduct = {
        ...product,
        product_status: newStatus
      };
      setProduct(updatedProduct);
    }
  };

  if (loading) {
    return (
      <div className="w-full p-20">
        <div className="mb-6">
          <Link
            href="/trade-in"
            className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-800 mb-4"
          >
            <ArrowLeftIcon className="h-4 w-4" />
            Volver al listado
          </Link>
        </div>
        <CardSkeleton />
      </div>
    );
  }

  if (notFoundError || !product) {
    notFound();
  }

  return (
    <div className="w-full p-20">
      {/* Header */}
      <div className="mb-6">
        <Link
          href="/trade-in"
          className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-800 mb-4"
        >
          <ArrowLeftIcon className="h-4 w-4" />
          Volver al listado
        </Link>
        
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Detalle del Producto
            </h1>
            {product.confirmed_sku && (
              <div className="mt-1">
                <span className="text-lg font-mono font-medium text-gray-600">
                  {product.confirmed_sku}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left Column - Product Information */}
        <div className="space-y-6">
          <ProductDetailInfo product={product} />
        </div>

        {/* Right Column - Status Timeline */}
        <div className="space-y-6">
          <ProductStatusTimeline 
            product={product} 
            onStatusChange={handleStatusChange}
          />
        </div>
      </div>
    </div>
  );
}