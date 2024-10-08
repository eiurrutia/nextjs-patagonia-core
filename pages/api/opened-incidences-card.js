import { fetchOpenedIncidences } from '@/app/lib/incidences/data';

export default async function handler(req, res) {
    try {
        console.log('### va a llamar la api ahora sii')
        let { startDate, endDate } = req.query;
        startDate = startDate.replace(/\//g, '-');
        endDate = endDate.replace(/\//g, '-');
        const data = await fetchOpenedIncidences(startDate, endDate);
        res.status(200).json(data);
    } catch (error) {
        res.status(500).json({ error: "Failed to fetch data" });
    }
}