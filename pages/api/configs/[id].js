import { db } from '@vercel/postgres';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/pages/api/auth/[...nextauth]';

export default async function handler(req, res) {
    const session = await getServerSession(req, res, authOptions);
    if (!session) {
        console.log('No autorizado. Debes iniciar sesión.');
        return res.status(401).json({ message: 'No autorizado. Debes iniciar sesión.' });
    }

    const { id } = req.query;

    if (req.method === 'GET') {
        try {
            const client = await db.connect();
            const { rows } = await client.sql`
                SELECT id, config_key, config_name, config_value, description
                FROM patcore_configurations
                WHERE id = ${id};
            `;
            client.release();

            if (rows.length === 0) {
                return res.status(404).json({ message: 'Configuration not found' });
            }

            return res.status(200).json(rows[0]);
        } catch (error) {
            console.error('Error fetching configuration:', error);
            return res.status(500).json({ message: 'Internal server error' });
        }
    } else if (req.method === 'PUT') {
        const { config_key, config_name, config_value, description } = req.body;

        if (!config_key || !config_name || config_value === undefined) {
            return res.status(400).json({ message: 'Missing required fields' });
        }

        try {
            const client = await db.connect();
            const result = await client.sql`
                UPDATE patcore_configurations 
                SET config_key = ${config_key}, 
                    config_name = ${config_name}, 
                    config_value = ${config_value}, 
                    description = ${description}
                WHERE id = ${id};
            `;
            client.release();

            if (result.rowCount === 0) {
                return res.status(404).json({ message: 'Configuration not found' });
            }

            return res.status(200).json({ message: 'Configuration updated successfully' });
        } catch (error) {
            console.error('Error updating configuration:', error);
            return res.status(500).json({ message: 'Internal server error' });
        }
    } else if (req.method === 'DELETE') {
        try {
            const client = await db.connect();
            const result = await client.sql`
                DELETE FROM patcore_configurations 
                WHERE id = ${id};
            `;
            client.release();

            if (result.rowCount === 0) {
                return res.status(404).json({ message: 'Configuration not found' });
            }

            return res.status(200).json({ message: 'Configuration deleted successfully' });
        } catch (error) {
            console.error('Error deleting configuration:', error);
            return res.status(500).json({ message: 'Internal server error' });
        }
    } else {
        return res.status(405).json({ message: 'Method not allowed' });
    }
}
