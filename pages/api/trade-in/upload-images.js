// Temporary fallback when BLOB_READ_WRITE_TOKEN is not configured
// This will store images as base64 in the database until blob storage is configured

import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]';

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '50mb',
    },
  },
};

export default async function handler(req, res) {
  try {
    // Check authentication
    const session = await getServerSession(req, res, authOptions);
    if (!session) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    if (req.method !== 'POST') {
      return res.status(405).json({ message: 'Method not allowed' });
    }

    const { images, tradeInId, productId } = req.body;

    if (!images || !Array.isArray(images) || images.length === 0) {
      return res.status(400).json({ message: 'No images provided' });
    }

    if (!tradeInId || !productId) {
      return res.status(400).json({ message: 'Missing tradeInId or productId' });
    }

    // Check if blob storage is configured
    if (!process.env.BLOB_READ_WRITE_TOKEN || process.env.BLOB_READ_WRITE_TOKEN === 'your_blob_token_here') {
      console.log('Blob storage not configured, using fallback storage');
      
      // For now, return the base64 images as they are
      // In production, you should configure proper blob storage
      const imageUrls = images.map((image, index) => {
        // Validate base64 format
        if (!image.startsWith('data:image/')) {
          throw new Error(`Invalid image format at index ${index}`);
        }
        return image; // Return base64 as-is for now
      });

      return res.status(200).json({
        message: `Successfully processed ${imageUrls.length} images (fallback mode)`,
        urls: imageUrls,
        fallback: true
      });
    }

    // If blob storage is configured, use it
    const { put } = await import('@vercel/blob');
    
    const uploadPromises = images.map(async (image, index) => {
      if (!image.startsWith('data:image/')) {
        throw new Error(`Invalid image format at index ${index}`);
      }

      // Extract file extension from base64
      const mimeMatch = image.match(/data:image\/([^;]+);base64,/);
      if (!mimeMatch) {
        throw new Error(`Invalid base64 format at index ${index}`);
      }

      const extension = mimeMatch[1];
      const base64Data = image.split(',')[1];
      const buffer = Buffer.from(base64Data, 'base64');

      const filename = `trade-in/${tradeInId}/${productId}/image-${index}-${Date.now()}.${extension}`;

      const blob = await put(filename, buffer, {
        access: 'public',
        contentType: `image/${extension}`,
      });

      return blob.url;
    });

    const imageUrls = await Promise.all(uploadPromises);

    res.status(200).json({
      message: `Successfully uploaded ${imageUrls.length} images`,
      urls: imageUrls
    });

  } catch (error) {
    console.error('Error uploading images:', error);
    res.status(500).json({ 
      message: 'Error uploading images', 
      error: error.message 
    });
  }
}
