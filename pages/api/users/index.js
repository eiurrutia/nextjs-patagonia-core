import { db } from '@vercel/postgres';
import bcryptjs from 'bcryptjs';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/pages/api/auth/[...nextauth]';

export default async function handler(req, res) {
  const session = await getServerSession(req, res, authOptions);
  if (!session) {
    console.log('No autorizado. Debes iniciar sesión.');
    return res.status(401).json({ message: 'No autorizado. Debes iniciar sesión.' });
  }


  if (req.method === 'GET') {
    try {
      const client = await db.connect();
      const { rows } = await client.sql`
        SELECT id, name, email, role
        FROM users
        ORDER BY name;
      `;
      client.release();

      return res.status(200).json(rows);
    } catch (error) {
      console.error('Error fetching users:', error);
      return res.status(500).json({ message: 'Internal server error' });
    }
  } else if (req.method === 'POST') {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    try {
      const client = await db.connect();
      const hashedPassword = await bcryptjs.hash(password, 10);

      const result = await client.sql`
        INSERT INTO users (name, email, password)
        VALUES (${name}, ${email}, ${hashedPassword})
        ON CONFLICT (email) DO NOTHING;
      `;

      client.release();

      if (result.rowCount === 0) {
        return res.status(409).json({ message: 'User already exists' });
      }

      return res.status(201).json({ message: 'User created successfully' });
    } catch (error) {
      console.error('Error creating user:', error);
      return res.status(500).json({ message: 'Internal server error' });
    }
  } else {
    return res.status(405).json({ message: 'Method not allowed' });
  }
}
