import { executeQuery } from '@/app/lib/snowflakeClient';

/**
 * API endpoint for cascading autocomplete from ERP_PRODUCTS table.
 * 
 * Query params:
 * - type: 'styles' | 'colors' | 'sizes'
 * - style: (optional) filter colors/sizes by style
 * - color: (optional) filter sizes by color
 * - search: (optional) search term for filtering
 */
export default async function handler(req, res) {
  const { type, style, color, search } = req.query;

  try {
    let query = '';
    let binds = [];

    if (type === 'styles') {
      // Get distinct item numbers (styles)
      query = `
        SELECT DISTINCT ITEMNUMBER
        FROM PATAGONIA.CORE_TEST.ERP_PRODUCTS
        WHERE ITEMNUMBER IS NOT NULL
        ${search ? `AND ITEMNUMBER LIKE ?` : ''}
        ORDER BY ITEMNUMBER
        LIMIT 100
      `;
      if (search) {
        binds.push(`%${search}%`);
      }

      const results = await executeQuery(query, binds);
      const styles = results.map(row => row.ITEMNUMBER);
      return res.status(200).json({ styles });

    } else if (type === 'colors') {
      // Get distinct colors for a style with color names
      // COLORNAME contains the color name (e.g., "Black" for code "BLK")
      query = `
        SELECT 
          COLOR,
          MAX(COLORNAME) as COLORNAME
        FROM PATAGONIA.CORE_TEST.ERP_PRODUCTS
        WHERE COLOR IS NOT NULL
        ${style ? `AND ITEMNUMBER = ?` : ''}
        ${search ? `AND COLOR LIKE ?` : ''}
        GROUP BY COLOR
        ORDER BY COLOR
        LIMIT 100
      `;
      if (style) binds.push(style);
      if (search) binds.push(`%${search}%`);

      const results = await executeQuery(query, binds);
      const colors = results.map(row => ({
        code: row.COLOR,
        name: row.COLORNAME || row.COLOR
      }));
      return res.status(200).json({ colors });

    } else if (type === 'sizes') {
      // Get distinct sizes for a style-color combination
      query = `
        SELECT DISTINCT SIZE
        FROM PATAGONIA.CORE_TEST.ERP_PRODUCTS
        WHERE SIZE IS NOT NULL
        ${style ? `AND ITEMNUMBER = ?` : ''}
        ${color ? `AND COLOR = ?` : ''}
        ${search ? `AND SIZE LIKE ?` : ''}
        ORDER BY SIZE
        LIMIT 100
      `;
      if (style) binds.push(style);
      if (color) binds.push(color);
      if (search) binds.push(`%${search}%`);

      const results = await executeQuery(query, binds);
      const sizes = results.map(row => row.SIZE);
      return res.status(200).json({ sizes });

    } else if (type === 'first-color') {
      // Get the first available color for a style (for image preview)
      query = `
        SELECT COLOR
        FROM PATAGONIA.CORE_TEST.ERP_PRODUCTS
        WHERE ITEMNUMBER = ?
        AND COLOR IS NOT NULL
        ORDER BY COLOR
        LIMIT 1
      `;
      binds.push(style);

      const results = await executeQuery(query, binds);
      const firstColor = results.length > 0 ? results[0].COLOR : null;
      return res.status(200).json({ color: firstColor });

    } else {
      return res.status(400).json({ error: 'Invalid type parameter. Use: styles, colors, sizes, or first-color' });
    }

  } catch (error) {
    console.error('Error in ERP autocomplete:', error);
    res.status(500).json({ error: 'Error fetching autocomplete data' });
  }
}
