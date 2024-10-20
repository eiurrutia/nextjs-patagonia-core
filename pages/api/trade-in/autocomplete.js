import { executeQuery } from '@/app/lib/snowflakeClient';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/pages/api/auth/[...nextauth]';

export default async function handler(req, res) {
  const session = await getServerSession(req, res, authOptions);
  if (!session) {
    console.log('No autorizado. Debes iniciar sesión.');
    return res.status(401).json({ message: 'No autorizado. Debes iniciar sesión.' });
  }

  const query = `
    SELECT DISTINCT ITEM_COLOR, IMAGE_SRC
    FROM PATAGONIA.CORE_TEST.SHOPIFY_PRODUCTS_IMAGE_EMBEDDINGS
    WHERE ITEM_COLOR NOT LIKE 'W%'
  `;
  
  try {
    const results = await executeQuery(query);
    const itemColorsWithImages = results.map(row => ({
      itemColor: row.ITEM_COLOR,
      imageSrc: row.IMAGE_SRC,
    }));

    res.status(200).json({ itemColors: itemColorsWithImages });
  } catch (error) {
    console.error('Error fetching ITEM_COLOR and IMAGE_SRC:', error);
    res.status(500).json({ error: 'Error fetching ITEM_COLOR and IMAGE_SRC' });
  }
}
