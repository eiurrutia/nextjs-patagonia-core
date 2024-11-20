import { db } from '@vercel/postgres';
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
                SELECT id, config_key, config_name, config_value, description
                FROM patcore_configurations
                ORDER BY config_key;
            `;
            client.release();

            return res.status(200).json(rows);
        } catch (error) {
            console.error('Error fetching configurations:', error);
            return res.status(500).json({ message: 'Internal server error' });
        }
    } else if (req.method === 'POST') {
        const { config_key, config_name, config_value, description } = req.body;
        console.log('## req.body');
        console.log(req.body);

        if (!config_key || !config_name || !config_value) {
            return res.status(400).json({ message: 'Missing required fields' });
        }

        try {
            const client = await db.connect();
            const result = await client.sql`
                INSERT INTO patcore_configurations (config_key, config_name, config_value, description)
                VALUES (${config_key}, ${config_name}, ${config_value}, ${description})
                ON CONFLICT (config_key)
                DO UPDATE SET
                    config_name = EXCLUDED.config_name,
                    config_value = EXCLUDED.config_value,
                    description = EXCLUDED.description;
            `;
            client.release();

            if (result.rowCount === 0) {
                return res.status(409).json({ message: 'Configuration already exists but could not be updated' });
            }

            return res.status(201).json({ message: 'Configuration created or updated successfully' });
        } catch (error) {
            console.error('Error creating or updating configuration:', error);
            return res.status(500).json({ message: 'Internal server error' });
        }
    } else {
        return res.status(405).json({ message: 'Method not allowed' });
    }
}
