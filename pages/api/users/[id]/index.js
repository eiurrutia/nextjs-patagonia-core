import { db } from '@vercel/postgres';
import bcryptjs from 'bcryptjs';

export default async function handler(req, res) {
  const { id } = req.query; // Obtener el ID del usuario desde la URL

  if (req.method === 'GET') {
    try {
      const client = await db.connect();

      // Consultar el usuario por ID
      const { rows } = await client.sql`
        SELECT id, name, email, role
        FROM users
        WHERE id = ${id};
      `;
      client.release();

      if (rows.length === 0) {
        return res.status(404).json({ message: 'User not found' });
      }

      return res.status(200).json(rows[0]); // Devolver el usuario encontrado
    } catch (error) {
      console.error('Error fetching user:', error);
      return res.status(500).json({ message: 'Internal server error' });
    }
  } else if (req.method === 'PUT') {
    const { name, email, role, password } = req.body;

    if (!name || !email || !role) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    try {
      const client = await db.connect();
      
      let result;

      if (password) {
        const hashedPassword = await bcryptjs.hash(password, 10);
        result = await client.sql`
          UPDATE users
          SET name = ${name}, email = ${email}, password = ${hashedPassword}, role = ${role}
          WHERE id = ${id};
        `;
      } else {
        result = await client.sql`
          UPDATE users
          SET name = ${name}, email = ${email}, role = ${role}
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
