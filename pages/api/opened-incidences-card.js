import { fetchOpenedIncidences } from '@/app/lib/incidences/data';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/pages/api/auth/[...nextauth]';


export default async function handler(req, res) {
    const session = await getServerSession(req, res, authOptions);
    if (!session) {
        console.log('No autorizado. Debes iniciar sesión.');
        return res.status(401).json({ message: 'No autorizado. Debes iniciar sesión.' });
    }

    
    try {
        let { startDate, endDate } = req.query;
        startDate = startDate.replace(/\//g, '-');
        endDate = endDate.replace(/\//g, '-');
        const data = await fetchOpenedIncidences(startDate, endDate);
        res.status(200).json(data);
    } catch (error) {
        res.status(500).json({ error: "Failed to fetch data" });
    }
}