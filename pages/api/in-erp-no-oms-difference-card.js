import { fetchInErpNoOmsDifference } from '@/app/lib/orders/data';

export default async function handler(req, res) {
    try {
        let { startDate, endDate } = req.query;
        startDate = startDate.replace(/\//g, '-');
        endDate = endDate.replace(/\//g, '-');
        const data = await fetchInErpNoOmsDifference(startDate, endDate);
        res.status(200).json(data);
    } catch (error) {
        res.status(500).json({ error: "Failed to fetch data" });
    }
}