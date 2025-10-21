import jsPDF from 'jspdf';
import JsBarcode from 'jsbarcode';

interface LabelData {
  sku: string;
  description?: string;
}

export class LabelGenerator {
  private static readonly LABEL_WIDTH_MM = 50;
  private static readonly LABEL_HEIGHT_MM = 25;
  
  private static readonly MARGIN_TOP_MM = 4;
  private static readonly GAP_SKU_DESC_MM = 3;
  private static readonly GAP_DESC_BAR_MM = 2;
  private static readonly BARCODE_BOTTOM_MM = 5;
  private static readonly SKU_BOTTOM_MM = 2;

  /**
   * Genera una vista previa HTML de la etiqueta con código de barras real
   */
  static generatePreviewHTML(labelData: LabelData): string {
    const { sku, description = "M's Down Sweater Hoody" } = labelData;
    
    // Crear un canvas temporal para el código de barras
    const canvas = document.createElement('canvas');
    const canvasId = `barcode-${Date.now()}`;
    canvas.id = canvasId;
    
    try {
      JsBarcode(canvas, sku, {
        format: "CODE128",
        width: 1,
        height: 40,
        displayValue: false,
        margin: 0
      });
      
      const barcodeDataURL = canvas.toDataURL();
      
      return `
        <div style="
          width: ${this.LABEL_WIDTH_MM}mm;
          height: ${this.LABEL_HEIGHT_MM}mm;
          border: 1px solid #ccc;
          background: white;
          position: relative;
          font-family: Arial, sans-serif;
          margin: 0 auto;
          box-sizing: border-box;
          padding: 2mm;
          display: flex;
          flex-direction: column;
          align-items: center;
        ">
          <!-- SKU Superior -->
          <div style="
            text-align: center;
            font-weight: bold;
            font-size: 8pt;
            margin-top: 1mm;
            margin-bottom: 1mm;
          ">
            ${sku}
          </div>
          
          <!-- Descripción -->
          <div style="
            text-align: center;
            font-size: 7pt;
            margin-bottom: 2mm;
            line-height: 1.1;
          ">
            ${description}
          </div>
          
          <!-- Código de barras real -->
          <div style="
            text-align: center;
            margin-bottom: 1mm;
            flex: 1;
            display: flex;
            align-items: center;
            justify-content: center;
          ">
            <img src="${barcodeDataURL}" style="max-width: 90%; max-height: 10mm;" alt="Código de barras" />
          </div>
          
          <!-- SKU Inferior -->
          <div style="
            text-align: center;
            font-size: 6pt;
            margin-top: auto;
          ">
            ${sku}
          </div>
        </div>
      `;
    } catch (error) {
      console.error('Error generando código de barras:', error);
      // Fallback sin código de barras
      return `
        <div style="
          width: ${this.LABEL_WIDTH_MM}mm;
          height: ${this.LABEL_HEIGHT_MM}mm;
          border: 1px solid #ccc;
          background: white;
          position: relative;
          font-family: Arial, sans-serif;
          margin: 0 auto;
          box-sizing: border-box;
          padding: 2mm;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
        ">
          <!-- SKU Superior -->
          <div style="
            text-align: center;
            font-weight: bold;
            font-size: 8pt;
            margin-top: ${this.MARGIN_TOP_MM - 2}mm;
          ">
            ${sku}
          </div>
          
          <!-- Descripción -->
          <div style="
            text-align: center;
            font-size: 7pt;
            margin-top: ${this.GAP_SKU_DESC_MM}mm;
            line-height: 1.1;
          ">
            ${description}
          </div>
          
          <!-- Placeholder para código de barras -->
          <div style="
            text-align: center;
            margin: ${this.GAP_DESC_BAR_MM}mm 0 ${this.BARCODE_BOTTOM_MM}mm 0;
            flex-grow: 1;
            display: flex;
            align-items: center;
            justify-content: center;
            background: #f0f0f0;
            min-height: 8mm;
            color: #666;
            font-size: 6pt;
          ">
            Código de barras
          </div>
          
          <!-- SKU Inferior -->
          <div style="
            text-align: center;
            font-size: 6pt;
            margin-bottom: ${this.SKU_BOTTOM_MM - 1}mm;
          ">
            ${sku}
          </div>
        </div>
      `;
    }
  }

  /**
   * Genera el PDF de la etiqueta usando jsPDF con código de barras real
   */
  static generatePDF(labelData: LabelData): jsPDF {
    const { sku, description = "M's Down Sweater Hoody" } = labelData;
    
    // Crear PDF con tamaño de etiqueta
    const pdf = new jsPDF({
      orientation: 'landscape',
      unit: 'mm',
      format: [this.LABEL_WIDTH_MM, this.LABEL_HEIGHT_MM]
    });

    // Configurar fuente
    pdf.setFont('helvetica');

    // SKU superior (negrita, 8pt)
    pdf.setFontSize(8);
    pdf.setFont('helvetica', 'bold');
    const skuTopY = this.LABEL_HEIGHT_MM - this.MARGIN_TOP_MM;
    pdf.text(sku, this.LABEL_WIDTH_MM / 2, skuTopY, { align: 'center' });

    // Descripción (normal, 7pt)
    pdf.setFontSize(7);
    pdf.setFont('helvetica', 'normal');
    const descY = skuTopY - this.GAP_SKU_DESC_MM;
    pdf.text(description, this.LABEL_WIDTH_MM / 2, descY, { align: 'center' });

    // Generar código de barras en canvas y agregarlo al PDF
    try {
      const canvas = document.createElement('canvas');
      JsBarcode(canvas, sku, {
        format: "CODE128",
        width: 1.5,
        height: 35,
        displayValue: false,
        margin: 0
      });
      
      const barcodeDataURL = canvas.toDataURL();
      const barcodeY = descY - this.GAP_DESC_BAR_MM;
      const barcodeHeight = barcodeY - this.BARCODE_BOTTOM_MM - 3;
      const barcodeWidth = this.LABEL_WIDTH_MM - 10; // margen total
      const barcodeX = (this.LABEL_WIDTH_MM - barcodeWidth) / 2;
      
      pdf.addImage(barcodeDataURL, 'PNG', barcodeX, this.BARCODE_BOTTOM_MM + 3, barcodeWidth, barcodeHeight);
    } catch (error) {
      console.error('Error generando código de barras para PDF:', error);
      // Fallback con barras simuladas
      const barcodeY = descY - this.GAP_DESC_BAR_MM;
      const barcodeHeight = barcodeY - this.BARCODE_BOTTOM_MM - 3;
      const barcodeStartX = 5;
      const barcodeWidth = this.LABEL_WIDTH_MM - 10;
      
      this.drawBarcode(pdf, sku, barcodeStartX, this.BARCODE_BOTTOM_MM + 3, barcodeWidth, barcodeHeight);
    }

    // SKU inferior (6pt)
    pdf.setFontSize(6);
    pdf.text(sku, this.LABEL_WIDTH_MM / 2, this.SKU_BOTTOM_MM + 1, { align: 'center' });

    return pdf;
  }

  /**
   * Simula un código de barras Code128 con líneas
   */
  private static drawBarcode(pdf: jsPDF, text: string, x: number, y: number, width: number, height: number) {
    const barCount = text.length * 8; // Aproximación para Code128
    const barWidth = width / barCount;
    
    // Patrón simple de barras (alternado con variaciones basadas en el texto)
    for (let i = 0; i < barCount; i++) {
      const charCode = text.charCodeAt(i % text.length);
      const isThick = (charCode + i) % 3 === 0;
      const isDark = i % 2 === 0;
      
      if (isDark) {
        const currentBarWidth = isThick ? barWidth * 2 : barWidth;
        pdf.setFillColor(0, 0, 0);
        pdf.rect(x + (i * barWidth), y, currentBarWidth, height, 'F');
      }
    }
  }

  /**
   * Genera y descarga el PDF
   */
  static downloadPDF(labelData: LabelData, filename?: string): void {
    const pdf = this.generatePDF(labelData);
    const fileName = filename || `etiqueta_${labelData.sku}.pdf`;
    pdf.save(fileName);
  }

  /**
   * Genera el PDF como blob para vista previa
   */
  static generatePDFBlob(labelData: LabelData): Blob {
    const pdf = this.generatePDF(labelData);
    return pdf.output('blob');
  }

  /**
   * Genera el PDF y lo sube a Vercel Blob para almacenamiento persistente
   */
  static async generateAndUploadPDF(labelData: LabelData, productId: number): Promise<string> {
    try {
      const pdfBlob = this.generatePDFBlob(labelData);
      
      // Crear FormData para upload
      const formData = new FormData();
      formData.append('file', pdfBlob, `label-${productId}-${labelData.sku}.pdf`);
      formData.append('productId', productId.toString());

      // Upload a la API
      const response = await fetch('/api/trade-in/upload-label', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`Upload failed: ${response.statusText}`);
      }

      const result = await response.json();
      return result.url;

    } catch (error) {
      console.error('Error uploading PDF:', error);
      throw error;
    }
  }
}