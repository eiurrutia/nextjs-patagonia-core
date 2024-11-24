'use client';
import ReplenishmentSummary from '@/app/ui/stock-planning/replenishment-summary';
import ReplenishmentLinesTable from '@/app/ui/stock-planning/replenishment-lines-table';
import SegmentationDetailTable from '@/app/ui/stock-planning/segmentation-detail-table';
import OperationsExportTable from '@/app/ui/stock-planning/operation-export-table';

export default function ReplenishmentDetailPage() {
  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-6">Detalle de Reposición</h1>

      {/* Summary */}
      <ReplenishmentSummary />

      {/* Replenishment Lines */}
      <div className="mt-6">
        <h2 className="text-2xl font-bold mb-4">Líneas de Reposición</h2>
        <ReplenishmentLinesTable />
      </div>

      {/* Segmentation Detail */}
      <div className="mt-6">
        <SegmentationDetailTable />
      </div>

      {/* Export Table */}
      <div className="mt-20">
        <h2 className="text-2xl font-bold mb-4">Tabla para exportar</h2>
        <OperationsExportTable />
      </div>
    </div>
  );
}
