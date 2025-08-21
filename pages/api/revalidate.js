import { revalidatePath } from 'next/cache';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const path = req.query.path;
    
    if (!path) {
      return res.status(400).json({ message: 'Path is required' });
    }

    // Revalidate the specified path
    revalidatePath(path);
    
    return res.status(200).json({ 
      message: `Path ${path} revalidated successfully`,
      revalidated: true 
    });
    
  } catch (error) {
    console.error('Error revalidating path:', error);
    return res.status(500).json({ 
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}
