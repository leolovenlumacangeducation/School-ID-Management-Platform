import QRCode from 'qrcode';
import { jsPDF } from 'jspdf';
import { IdTemplate, Teacher, Student, School, CanvasElement, PrintJobConfig } from '../types';

export interface CardRenderOptions {
  template: IdTemplate;
  side: 'FRONT' | 'BACK';
  record?: Teacher | Student;
  school?: School;
  scale?: number; // default 1
  dpi?: number; // default 300 for export
  baseUrl?: string;
}

export class CardRenderer {
  /**
   * Resolve variables in a template string given a record and school
   */
  public static resolveVariables(
    templateText: string,
    record?: Teacher | Student,
    school?: School
  ): string {
    if (!templateText) return '';
    let result = templateText;

    const isTeacher = record && 'employeeNo' in record;
    const isStudent = record && 'lrn' in record;

    const teacher = isTeacher ? (record as Teacher) : null;
    const student = isStudent ? (record as Student) : null;

    // School variables
    if (school) {
      result = result.replace(/\{\{school_name\}\}/gi, school.name || '');
      result = result.replace(/\{\{school_id\}\}/gi, school.schoolId || '');
      result = result.replace(/\{\{region\}\}/gi, school.region || '');
      result = result.replace(/\{\{division\}\}/gi, school.division || '');
      result = result.replace(/\{\{district\}\}/gi, school.district || '');
      result = result.replace(/\{\{principal_name\}\}/gi, school.principalName || '');
      result = result.replace(/\{\{school_email\}\}/gi, school.schoolEmail || '');
      result = result.replace(/\{\{school_contact\}\}/gi, school.contactNumber || '');
      result = result.replace(/\{\{contact_number\}\}/gi, school.contactNumber || '');
      result = result.replace(/\{\{school_address\}\}/gi, school.address || '');
    }

    // Teacher specific
    if (teacher) {
      result = result.replace(/\{\{employee_no\}\}/gi, teacher.employeeNo || '');
      result = result.replace(/\{\{first_name\}\}/gi, teacher.firstName || '');
      result = result.replace(/\{\{middle_name\}\}/gi, teacher.middleName || '');
      result = result.replace(/\{\{last_name\}\}/gi, teacher.lastName || '');
      result = result.replace(/\{\{suffix\}\}/gi, teacher.suffix || '');
      result = result.replace(/\{\{position\}\}/gi, teacher.position || '');
      result = result.replace(/\{\{department\}\}/gi, teacher.department || '');
      result = result.replace(/\{\{email\}\}/gi, teacher.email || '');
      result = result.replace(/\{\{contact_number\}\}/gi, teacher.contactNumber || '');
      result = result.replace(/\{\{date_hired\}\}/gi, teacher.dateHired || '');
      result = result.replace(/\{\{issued_date\}\}/gi, teacher.idCardIssuedAt ? new Date(teacher.idCardIssuedAt).toLocaleDateString() : '06/20/2025');
      result = result.replace(/\{\{blood_type\}\}/gi, teacher.customFields?.bloodType || 'O+');
      result = result.replace(/\{\{tin\}\}/gi, teacher.customFields?.tin || 'N/A');
      result = result.replace(/\{\{gsis\}\}/gi, teacher.customFields?.gsis || 'N/A');
      result = result.replace(/\{\{philhealth\}\}/gi, teacher.customFields?.philHealth || 'N/A');
      result = result.replace(/\{\{pagibig\}\}/gi, teacher.customFields?.pagibig || 'N/A');
      result = result.replace(/\{\{emergency_contact\}\}/gi, teacher.customFields?.emergencyContact || 'N/A');
      result = result.replace(/\{\{emergency_number\}\}/gi, teacher.customFields?.emergencyNumber || 'N/A');
      result = result.replace(/\{\{rfid_number\}\}/gi, teacher.customFields?.rfidNumber || 'N/A');
    }

    // Student specific
    if (student) {
      result = result.replace(/\{\{lrn\}\}/gi, student.lrn || '');
      result = result.replace(/\{\{first_name\}\}/gi, student.firstName || '');
      result = result.replace(/\{\{middle_name\}\}/gi, student.middleName || '');
      result = result.replace(/\{\{last_name\}\}/gi, student.lastName || '');
      result = result.replace(/\{\{suffix\}\}/gi, student.suffix || '');
      result = result.replace(/\{\{grade_level\}\}/gi, student.gradeLevel || '');
      result = result.replace(/\{\{guardian_name\}\}/gi, student.guardianName || '');
      result = result.replace(/\{\{guardian_contact\}\}/gi, student.guardianContact || '');
      result = result.replace(/\{\{blood_type\}\}/gi, student.customFields?.bloodType || 'O+');
      result = result.replace(/\{\{rfid_number\}\}/gi, student.customFields?.rfidNumber || 'N/A');
      result = result.replace(/\{\{issued_date\}\}/gi, student.idCardIssuedAt ? new Date(student.idCardIssuedAt).toLocaleDateString() : '06/25/2025');
      // Section name replacement
      result = result.replace(/\{\{section\}\}/gi, 'Einstein (STEM Advance)');
    }

    return result;
  }

  /**
   * Generate QR Code as DataURL
   */
  public static async generateQrDataUrl(text: string): Promise<string> {
    try {
      return await QRCode.toDataURL(text, {
        errorCorrectionLevel: 'M',
        margin: 1,
        width: 256,
        color: {
          dark: '#0f172a',
          light: '#ffffff',
        },
      });
    } catch (e) {
      console.error('QR generation error:', e);
      return '';
    }
  }

  /**
   * Render a complete card to an HTML5 canvas element
   */
  public static async renderToCanvas(
    canvas: HTMLCanvasElement,
    options: CardRenderOptions
  ): Promise<void> {
    const { template, side, record, school, scale = 1 } = options;
    const sideData = side === 'FRONT' ? template.frontData : template.backData;
    const isPortrait = template.orientation === 'PORTRAIT';

    // Standard CR80 base width and height in px (ratio ~ 1.586)
    // 378 x 600 px (Portrait) or 600 x 378 px (Landscape)
    const baseWidth = isPortrait ? 378 : 600;
    const baseHeight = isPortrait ? 600 : 378;

    canvas.width = baseWidth * scale;
    canvas.height = baseHeight * scale;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.save();
    ctx.scale(scale, scale);

    // Draw Background
    ctx.fillStyle = sideData.backgroundColor || '#ffffff';
    ctx.fillRect(0, 0, baseWidth, baseHeight);

    // Draw Background Image if present
    if (sideData.backgroundImageUrl) {
      try {
        const bgImg = await this.loadImage(sideData.backgroundImageUrl);
        ctx.drawImage(bgImg, 0, 0, baseWidth, baseHeight);
      } catch (e) {
        console.warn('Could not load background image:', e);
      }
    }

    // Render Canvas Elements
    for (const el of sideData.elements) {
      if (el.visible === false) continue;
      ctx.save();

      // Opacity
      if (el.opacity !== undefined) {
        ctx.globalAlpha = el.opacity;
      }

      // Rotation & Transform
      if (el.angle) {
        ctx.translate(el.left, el.top);
        ctx.rotate((el.angle * Math.PI) / 180);
        ctx.translate(-el.left, -el.top);
      }

      // Shadow
      if (el.shadow) {
        ctx.shadowColor = el.shadow.color;
        ctx.shadowBlur = el.shadow.blur;
        ctx.shadowOffsetX = el.shadow.offsetX;
        ctx.shadowOffsetY = el.shadow.offsetY;
      }

      if (el.type === 'rect') {
        ctx.fillStyle = el.fill || '#000000';
        if (el.rx || el.ry) {
          const r = el.rx || el.ry || 0;
          this.drawRoundedRect(ctx, el.left, el.top, el.width, el.height, r);
          ctx.fill();
          if (el.stroke && el.strokeWidth) {
            ctx.strokeStyle = el.stroke;
            ctx.lineWidth = el.strokeWidth;
            ctx.stroke();
          }
        } else {
          ctx.fillRect(el.left, el.top, el.width, el.height);
          if (el.stroke && el.strokeWidth) {
            ctx.strokeStyle = el.stroke;
            ctx.lineWidth = el.strokeWidth;
            ctx.strokeRect(el.left, el.top, el.width, el.height);
          }
        }
      } else if (el.type === 'circle') {
        ctx.fillStyle = el.fill || '#000000';
        ctx.beginPath();
        const radius = Math.min(el.width, el.height) / 2;
        ctx.arc(el.left + radius, el.top + radius, radius, 0, Math.PI * 2);
        ctx.fill();
        if (el.stroke && el.strokeWidth) {
          ctx.strokeStyle = el.stroke;
          ctx.lineWidth = el.strokeWidth;
          ctx.stroke();
        }
      } else if (el.type === 'line') {
        ctx.strokeStyle = el.stroke || '#000000';
        ctx.lineWidth = el.strokeWidth || 1;
        ctx.beginPath();
        ctx.moveTo(el.left, el.top);
        ctx.lineTo(el.left + el.width, el.top + (el.height > 2 ? el.height : 0));
        ctx.stroke();
      } else if (el.type === 'text') {
        const textContent = this.resolveVariables(el.variableBinding || el.text || '', record, school);
        const fontSize = el.fontSize || 14;
        const fontWeight = el.fontWeight || 'normal';
        const fontStyle = el.fontStyle || 'normal';
        const fontFamily = el.fontFamily || 'Plus Jakarta Sans';
        
        ctx.font = `${fontStyle} ${fontWeight} ${fontSize}px "${fontFamily}", sans-serif`;
        ctx.fillStyle = el.fill || '#0f172a';
        ctx.textAlign = (el.textAlign as CanvasTextAlign) || 'left';
        ctx.textBaseline = 'middle';

        let drawX = el.left;
        if (el.textAlign === 'center') {
          drawX = el.left;
        } else if (el.textAlign === 'right') {
          drawX = el.left + el.width;
        }

        // Multi-line support
        const lines = textContent.split('\n');
        const lineHeight = (el.lineHeight || 1.2) * fontSize;
        const totalHeight = lines.length * lineHeight;
        const startY = el.top + fontSize / 2;

        lines.forEach((line, i) => {
          ctx.fillText(line, drawX, startY + i * lineHeight);
          if (el.underline) {
            const metrics = ctx.measureText(line);
            ctx.beginPath();
            ctx.strokeStyle = el.fill || '#0f172a';
            ctx.lineWidth = 1;
            const uX = el.textAlign === 'center' ? drawX - metrics.width / 2 : drawX;
            ctx.moveTo(uX, startY + i * lineHeight + fontSize / 2 + 2);
            ctx.lineTo(uX + metrics.width, startY + i * lineHeight + fontSize / 2 + 2);
            ctx.stroke();
          }
        });
      } else if (el.type === 'image') {
        let imgSrc = el.src;
        if (el.isDynamicPhoto && record && record.photoUrl) {
          imgSrc = record.photoUrl;
        } else if (el.variableBinding === '{{signature}}' && record && 'signatureUrl' in record && record.signatureUrl) {
          imgSrc = record.signatureUrl;
        }

        if (imgSrc) {
          try {
            const img = await this.loadImage(imgSrc);
            if (el.rx || el.ry) {
              ctx.save();
              this.drawRoundedRect(ctx, el.left, el.top, el.width, el.height, el.rx || 8);
              ctx.clip();
              ctx.drawImage(img, el.left, el.top, el.width, el.height);
              ctx.restore();
            } else {
              ctx.drawImage(img, el.left, el.top, el.width, el.height);
            }
          } catch (e) {
            console.warn('Failed to load image element:', e);
          }
        }
      } else if (el.type === 'qrcode') {
        const verifyHash = record?.verifyHash || 'vfy-sample-credential-key-9988';
        const verifyUrl = `${window.location.origin}/verify/${verifyHash}`;
        try {
          const qrDataUrl = await this.generateQrDataUrl(verifyUrl);
          const qrImg = await this.loadImage(qrDataUrl);
          ctx.drawImage(qrImg, el.left, el.top, el.width, el.height);
        } catch (e) {
          console.warn('QR render error:', e);
        }
      } else if (el.type === 'barcode') {
        // Draw crisp simulated Code-128 barcode
        const barCodeText = this.resolveVariables(el.variableBinding || '109283746192', record, school);
        this.drawBarcode(ctx, el.left, el.top, el.width, el.height, barCodeText);
      }

      ctx.restore();
    }

    ctx.restore();
  }

  /**
   * Draw Code-128 styled barcode on canvas
   */
  private static drawBarcode(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    width: number,
    height: number,
    text: string
  ): void {
    ctx.save();
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(x, y, width, height);

    ctx.fillStyle = '#0f172a';
    const barHeight = height - 14;
    const numBars = 48;
    const barWidth = width / (numBars * 1.4);

    // Deterministic pseudo pattern based on string hash
    let hash = 0;
    for (let i = 0; i < text.length; i++) {
      hash = (hash << 5) - hash + text.charCodeAt(i);
    }

    let curX = x + 8;
    for (let i = 0; i < numBars && curX < x + width - 8; i++) {
      const isThick = ((hash >> (i % 16)) & 1) === 1 || i % 3 === 0;
      const w = isThick ? barWidth * 1.8 : barWidth * 0.9;
      ctx.fillRect(curX, y + 2, w, barHeight);
      curX += w + barWidth * (i % 2 === 0 ? 1 : 1.5);
    }

    // Draw caption under barcode
    ctx.font = '9px "JetBrains Mono", monospace';
    ctx.fillStyle = '#475569';
    ctx.textAlign = 'center';
    ctx.fillText(text, x + width / 2, y + height - 2);
    ctx.restore();
  }

  private static drawRoundedRect(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    width: number,
    height: number,
    radius: number
  ): void {
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + width - radius, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
    ctx.lineTo(x + width, y + height - radius);
    ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
    ctx.lineTo(x + radius, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
    ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y);
    ctx.closePath();
  }

  private static loadImage(url: string): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => resolve(img);
      img.onerror = e => reject(e);
      img.src = url;
    });
  }

  /**
   * Export a single card side as high-res PNG DataURL
   */
  public static async exportCardImage(options: CardRenderOptions): Promise<string> {
    const canvas = document.createElement('canvas');
    await this.renderToCanvas(canvas, { ...options, scale: 2 });
    return canvas.toDataURL('image/png', 1.0);
  }

  /**
   * Generate multi-up PDF Print Sheet with Bleed and Cut Marks
   */
  public static async generatePrintSheetPdf(
    config: PrintJobConfig,
    template: IdTemplate,
    records: (Teacher | Student)[],
    school: School
  ): Promise<jsPDF> {
    const isLandscapeCard = template.orientation === 'LANDSCAPE';
    const cardWidthMm = isLandscapeCard ? 85.6 : 53.98;
    const cardHeightMm = isLandscapeCard ? 53.98 : 85.6;

    // PDF Sheet dimensions (mm)
    let pageWidthMm = 210; // A4 default
    let pageHeightMm = 297;
    let orientation: 'p' | 'l' = 'p';

    if (config.paperSize === 'LETTER') {
      pageWidthMm = 215.9;
      pageHeightMm = 279.4;
    } else if (config.paperSize === 'LEGAL') {
      pageWidthMm = 215.9;
      pageHeightMm = 355.6;
    }

    const doc = new jsPDF({
      orientation,
      unit: 'mm',
      format: [pageWidthMm, pageHeightMm],
    });

    // Layout rows and columns
    let cols = 2;
    let rows = 4; // default 8-up on A4
    if (config.layout === '1_UP') {
      cols = 1;
      rows = 1;
    } else if (config.layout === '2_UP') {
      cols = 1;
      rows = 2;
    } else if (config.layout === '4_UP') {
      cols = 2;
      rows = 2;
    } else if (config.layout === '8_UP') {
      cols = 2;
      rows = 4;
    } else if (config.layout === '10_UP') {
      cols = 2;
      rows = 5;
    }

    const cardsPerPage = cols * rows;
    const marginX = (pageWidthMm - cols * cardWidthMm) / (cols + 1);
    const marginY = (pageHeightMm - rows * cardHeightMm) / (rows + 1);

    for (let i = 0; i < records.length; i++) {
      const pageIndex = Math.floor(i / cardsPerPage);
      const slotIndex = i % cardsPerPage;
      const col = slotIndex % cols;
      const row = Math.floor(slotIndex / cols);

      if (slotIndex === 0 && pageIndex > 0) {
        doc.addPage();
      }

      const x = marginX + col * (cardWidthMm + marginX / 2);
      const y = marginY + row * (cardHeightMm + marginY / 2);

      const record = records[i];

      // Render Front
      const frontImgData = await this.exportCardImage({
        template,
        side: 'FRONT',
        record,
        school,
        scale: 2,
      });

      doc.addImage(frontImgData, 'PNG', x, y, cardWidthMm, cardHeightMm);

      // Draw Cut Marks if enabled
      if (config.showCropMarks) {
        doc.setDrawColor(180, 180, 180);
        doc.setLineWidth(0.2);
        // Top-left
        doc.line(x - 3, y, x - 0.5, y);
        doc.line(x, y - 3, x, y - 0.5);
        // Top-right
        doc.line(x + cardWidthMm + 0.5, y, x + cardWidthMm + 3, y);
        doc.line(x + cardWidthMm, y - 3, x + cardWidthMm, y - 0.5);
        // Bottom-left
        doc.line(x - 3, y + cardHeightMm, x - 0.5, y + cardHeightMm);
        doc.line(x, y + cardHeightMm + 0.5, x, y + cardHeightMm + 3);
        // Bottom-right
        doc.line(x + cardWidthMm + 0.5, y + cardHeightMm, x + cardWidthMm + 3, y + cardHeightMm);
        doc.line(x + cardWidthMm, y + cardHeightMm + 0.5, x + cardWidthMm, y + cardHeightMm + 3);
      }
    }

    return doc;
  }
}
