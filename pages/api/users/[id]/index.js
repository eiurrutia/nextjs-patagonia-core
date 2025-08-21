import { db } from '@vercel/postgres';
import bcryptjs from 'bcryptjs';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/pages/api/auth/[...nextauth]';


export default async function handler(req, res) {
  const { id } = req.query;
  const session = await getServerSession(req, res, authOptions);
  if (!session) {
    console.log('No autorizado. Debes iniciar sesión.');
    return res.status(401).json({ message: 'No autorizado. Debes iniciar sesión.' });
  }

  if (req.method === 'GET') {
    try {
      const client = await db.connect();

      // Consultar el usuario por ID con información de la tienda
      const { rows } = await client.sql`
        SELECT u.id, u.name, u.email, u.role, u.store_id,
               s.name as store_name, s.code as store_code
        FROM users u
        LEFT JOIN stores s ON u.store_id = s.id
        WHERE u.id = ${id};
      `;
      client.release();

      if (rows.length === 0) {
        return res.status(404).json({ message: 'User not found' });
      }

      return res.status(200).json(rows[0]);
    } catch (error) {
      console.error('Error fetching user:', error);
      return res.status(500).json({ message: 'Internal server error' });
    }
  } else if (req.method === 'PUT') {
    const { name, email, role, password, storeId } = req.body;

    if (!name || !email || !role) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    // Validate that store users have a store assigned
    if (role === 'store' && !storeId) {
      return res.status(400).json({ message: 'Store employees must have a store assigned' });
    }

    try {
      const client = await db.connect();
      
      // Verify store exists if storeId is provided
      if (storeId) {
        const storeCheck = await client.sql`
          SELECT id FROM stores WHERE id = ${storeId};
        `;
        if (storeCheck.rows.length === 0) {
          client.release();
          return res.status(400).json({ message: 'Invalid store ID' });
        }
      }

      let result;

      if (password) {
        const hashedPassword = await bcryptjs.hash(password, 10);
        result = await client.sql`
          UPDATE users
          SET name = ${name}, email = ${email}, password = ${hashedPassword}, role = ${role}, store_id = ${storeId || null}
          WHERE id = ${id};
        `;
      } else {
        result = await client.sql`
          UPDATE users
          SET name = ${name}, email = ${email}, role = ${role}, store_id = ${storeId || null}
          WHERE id = ${id};
        `;
      }
      client.release();

      if (result.rowCount === 0) {
        return res.status(404).json({ message: 'User not found' });
      }

      return res.status(200).json({ message: 'User updated successfully' });
    } catch (error) {
      console.error('Error updating user:', error);
      return res.status(500).json({ message: 'Internal server error' });
    }
  } else {
    return res.status(405).json({ message: 'Method not allowed' });
  }
}
