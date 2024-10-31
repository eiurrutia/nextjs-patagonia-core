'use client';
import { useEffect, useState } from 'react';
import { CardSkeleton } from '../skeletons';

interface SalesData {
  SKU: string;
  CD: number;
  COYHAIQUE: number;
  LASCONDES: number;
  MALLSPORT: number;
  COSTANERA: number;
  CONCEPCION: number;
  PTOVARAS: number;
  LADEHESA: number;
  PUCON: number;
  TEMUCO: number;
  OSORNO: number;
  ALERCE: number;
  BNAVENTURA: number;
}

interface SalesTableProps {
  startDate: string;
  endDate: string;
  query: string;
  currentPage: number;
}

export default function SalesTable({ startDate, endDate, query, currentPage }: SalesTableProps) {
  const [salesData, setSalesData] = useState<SalesData[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(currentPage);

  useEffect(() => {
    async function fetchSalesData() {
      setLoading(true);
      try {
        const response = await fetch(
          `/api/stock-planning/sales?startDate=${startDate}&endDate=${endDate}&query=${encodeURIComponent(query)}&page=${page}`
        );
        const data: SalesData[] = await response.json();
        setSalesData(data);
      } catch (error) {
        console.error('Error fetching sales data:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchSalesData();
  }, [startDate, endDate, query, page]);

  if (loading) return <CardSkeleton />;

  return (
    <div className="w-full overflow-auto mt-4">
      <table className="min-w-full border-collapse border border-gray-300">
        <thead>
          <tr>
            <th className="border px-4 py-2">SKU</th>
            <th className="border px-4 py-2">CD</th>
            <th className="border px-4 py-2">COYHAIQUE</th>
            <th className="border px-4 py-2">LASCONDES</th>
            <th className="border px-4 py-2">MALLSPORT</th>
            <th className="border px-4 py-2">COSTANERA</th>
            <th className="border px-4 py-2">CONCEPCION</th>
            <th className="border px-4 py-2">PTOVARAS</th>
            <th className="border px-4 py-2">LADEHESA</th>
            <th className="border px-4 py-2">PUCON</th>
            <th className="border px-4 py-2">TEMUCO</th>
            <th className="border px-4 py-2">OSORNO</th>
            <th className="border px-4 py-2">ALERCE</th>
            <th className="border px-4 py-2">BNAVENTURA</th>
          </tr>
        </thead>
        <tbody>
          {salesData
            .filter((sale) => sale.SKU.includes(query.toUpperCase()))
            .map((sale) => (
              <tr key={sale.SKU}>
                <td className="border px-4 py-2">{sale.SKU}</td>
                <td className="border px-4 py-2">{sale.CD}</td>
                <td className="border px-4 py-2">{sale.COYHAIQUE}</td>
                <td className="border px-4 py-2">{sale.LASCONDES}</td>
                <td className="border px-4 py-2">{sale.MALLSPORT}</td>
                <td className="border px-4 py-2">{sale.COSTANERA}</td>
                <td className="border px-4 py-2">{sale.CONCEPCION}</td>
                <td className="border px-4 py-2">{sale.PTOVARAS}</td>
                <td className="border px-4 py-2">{sale.LADEHESA}</td>
                <td className="border px-4 py-2">{sale.PUCON}</td>
                <td className="border px-4 py-2">{sale.TEMUCO}</td>
                <td className="border px-4 py-2">{sale.OSORNO}</td>
                <td className="border px-4 py-2">{sale.ALERCE}</td>
                <td className="border px-4 py-2">{sale.BNAVENTURA}</td>
              </tr>
            ))}
        </tbody>
      </table>
    </div>
  );
}
