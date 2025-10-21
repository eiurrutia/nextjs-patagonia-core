import { NextRequest, NextResponse } from 'next/server';
import { put } from '@vercel/blob';
import { updateProductLabelPdfUrl } from '@/app/lib/trade-in/sql-data';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const productId = formData.get('productId') as string;
    
    if (!file || !productId) {
      return NextResponse.json(
        { error: 'File and productId are required' },
        { status: 400 }
      );
    }

    // Generar nombre único para el archivo
    const timestamp = Date.now();
    const filename = `trade-in-labels/label-${productId}-${timestamp}.pdf`;

    // Subir a Vercel Blob
    const blob = await put(filename, file, {
      access: 'public',
      addRandomSuffix: false,
    });

    // Actualizar base de datos con la URL
    await updateProductLabelPdfUrl(parseInt(productId), blob.url);

    return NextResponse.json({
      url: blob.url,
      success: true
    });

  } catch (error) {
    console.error('Error uploading label PDF:', error);
    return NextResponse.json(
      { error: 'Failed to upload label PDF' },
      { status: 500 }
    );
  }
}