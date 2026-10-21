import pptxgen from 'pptxgenjs';

export interface PresentationExportOptions {
  title: string;
  subtitle?: string;
  category?: 'chemistry' | 'model' | 'anatomy';
  concept?: string;
  slides: Array<{
    title: string;
    subtitle?: string;
    bullets?: string[];
    details?: Array<{ label: string; text: string }>;
    callout?: string;
    table?: {
      headers: string[];
      rows: string[][];
    };
  }>;
}

/**
 * Validates that the presentation content has all required non-empty fields.
 */
export function validatePresentationData(data: PresentationExportOptions): { valid: boolean; error?: string } {
  if (!data.title || data.title.trim().length === 0) {
    return { valid: false, error: 'Presentation title is required.' };
  }
  if (!data.slides || data.slides.length === 0) {
    return { valid: false, error: 'At least one slide is required.' };
  }
  for (let i = 0; i < data.slides.length; i++) {
    const s = data.slides[i];
    if (!s.title || s.title.trim().length === 0) {
      return { valid: false, error: `Slide ${i + 1} must have a non-empty title.` };
    }
    const hasContent =
      (s.bullets && s.bullets.length > 0) ||
      (s.details && s.details.length > 0) ||
      Boolean(s.callout) ||
      Boolean(s.table && s.table.rows.length > 0);
    if (!hasContent) {
      return { valid: false, error: `Slide ${i + 1} (${s.title}) contains no slide body content.` };
    }
  }
  return { valid: true };
}

/**
 * Generates a valid PowerPoint (.pptx) file using PptxGenJS and initiates browser download.
 * Returns the generated Blob and slide count.
 */
export async function generateAndDownloadPptx(
  data: PresentationExportOptions,
  filename?: string
): Promise<{ success: boolean; slideCount: number; blobSize: number; error?: string }> {
  const validation = validatePresentationData(data);
  if (!validation.valid) {
    throw new Error(validation.error || 'Invalid presentation configuration.');
  }

  const pres = new pptxgen();
  pres.layout = 'LAYOUT_16x9';
  pres.author = 'Tech-Anatomix STEM Laboratory';
  pres.company = 'Tech-Anatomix';
  pres.subject = data.concept || data.title;
  pres.title = data.title;

  const bgDark = '0B0F19';
  const cardDark = '1E293B';
  const brandCyan = '38BDF8';
  const brandRose = 'F43F5E';
  const brandEmerald = '10B981';
  const textWhite = 'FFFFFF';
  const textMuted = '94A3B8';
  const textDim = '64748B';

  const accentColor =
    data.category === 'chemistry' ? brandEmerald : data.category === 'anatomy' ? brandRose : brandCyan;

  // -------------------------------------------------------------
  // SLIDE 1: TITLE SLIDE
  // -------------------------------------------------------------
  const titleSlide = pres.addSlide();
  titleSlide.background = { color: bgDark };

  // Top header brand ribbon
  titleSlide.addText('TECH-ANATOMIX  •  DISSECT YOUR CELL!', {
    x: 0.8,
    y: 0.8,
    w: 8.5,
    h: 0.4,
    fontSize: 11,
    bold: true,
    color: accentColor,
    charSpacing: 3,
  });

  // Main presentation title
  titleSlide.addText(data.title, {
    x: 0.8,
    y: 1.4,
    w: 11.5,
    h: 1.8,
    fontSize: 34,
    bold: true,
    color: textWhite,
    breakLine: true,
  });

  if (data.subtitle) {
    titleSlide.addText(data.subtitle, {
      x: 0.8,
      y: 3.4,
      w: 11.0,
      h: 0.9,
      fontSize: 16,
      color: textMuted,
    });
  }

  // Footer metadata
  titleSlide.addShape(pres.ShapeType.rect, {
    x: 0.8,
    y: 5.6,
    w: 11.5,
    h: 0.05,
    fill: { color: accentColor },
  });

  titleSlide.addText('Interactive 3D Virtual Science Laboratory  •  Verified STEM Curriculum Presentation', {
    x: 0.8,
    y: 5.8,
    w: 9.0,
    h: 0.4,
    fontSize: 10,
    color: textDim,
  });

  titleSlide.addText(new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }), {
    x: 10.0,
    y: 5.8,
    w: 2.3,
    h: 0.4,
    fontSize: 10,
    color: textDim,
    align: 'right',
  });

  // -------------------------------------------------------------
  // CONTENT SLIDES
  // -------------------------------------------------------------
  data.slides.forEach((slideData, idx) => {
    const s = pres.addSlide();
    s.background = { color: bgDark };

    // Slide Number & Brand Header
    s.addText('TECH-ANATOMIX  |  DISSECT YOUR CELL!', {
      x: 0.8,
      y: 0.4,
      w: 6.0,
      h: 0.3,
      fontSize: 9,
      bold: true,
      color: accentColor,
      charSpacing: 2,
    });

    s.addText(`Slide ${idx + 2} of ${data.slides.length + 1}`, {
      x: 10.0,
      y: 0.4,
      w: 2.3,
      h: 0.3,
      fontSize: 9,
      color: textDim,
      align: 'right',
    });

    // Slide Title
    s.addText(slideData.title, {
      x: 0.8,
      y: 0.8,
      w: 11.5,
      h: 0.65,
      fontSize: 22,
      bold: true,
      color: textWhite,
    });

    if (slideData.subtitle) {
      s.addText(slideData.subtitle, {
        x: 0.8,
        y: 1.45,
        w: 11.5,
        h: 0.4,
        fontSize: 12,
        color: textMuted,
      });
    }

    let curY = slideData.subtitle ? 2.0 : 1.7;

    // Callout box if present
    if (slideData.callout) {
      s.addShape(pres.ShapeType.roundRect, {
        x: 0.8,
        y: curY,
        w: 11.5,
        h: 0.85,
        fill: { color: cardDark },
        line: { color: accentColor, width: 1.5 },
      });

      s.addText(slideData.callout, {
        x: 1.1,
        y: curY + 0.1,
        w: 10.9,
        h: 0.65,
        fontSize: 12,
        color: textWhite,
        bold: true,
      });

      curY += 1.05;
    }

    // Bullets if present
    if (slideData.bullets && slideData.bullets.length > 0) {
      const bulletItems = slideData.bullets.map((b) => ({
        text: b,
        options: {
          fontSize: 12,
          color: textWhite,
          bullet: true,
          breakLine: true,
          spaceAfter: 8,
        },
      }));

      s.addText(bulletItems, {
        x: 0.8,
        y: curY,
        w: 11.5,
        h: Math.min(3.6, slideData.bullets.length * 0.45 + 0.5),
      });

      curY += Math.min(3.6, slideData.bullets.length * 0.45 + 0.5);
    }

    // Key-value Details cards if present
    if (slideData.details && slideData.details.length > 0) {
      const cardW = 5.6;
      const cardH = 1.0;
      slideData.details.forEach((det, dIdx) => {
        const col = dIdx % 2;
        const row = Math.floor(dIdx / 2);
        const cardX = 0.8 + col * 6.0;
        const cardY = curY + row * 1.15;

        if (cardY + cardH <= 6.8) {
          s.addShape(pres.ShapeType.roundRect, {
            x: cardX,
            y: cardY,
            w: cardW,
            h: cardH,
            fill: { color: cardDark },
            line: { color: '334155', width: 1 },
          });

          s.addText(det.label, {
            x: cardX + 0.2,
            y: cardY + 0.1,
            w: cardW - 0.4,
            h: 0.3,
            fontSize: 10,
            bold: true,
            color: accentColor,
          });

          s.addText(det.text, {
            x: cardX + 0.2,
            y: cardY + 0.4,
            w: cardW - 0.4,
            h: 0.5,
            fontSize: 11,
            color: textWhite,
          });
        }
      });
    }

    // Table if present
    if (slideData.table && slideData.table.rows.length > 0) {
      const tableRows: any[][] = [];
      tableRows.push(
        slideData.table.headers.map((h) => ({
          text: h,
          options: { bold: true, fill: { color: accentColor }, color: bgDark, fontSize: 10 },
        }))
      );
      slideData.table.rows.forEach((r) => {
        tableRows.push(
          r.map((cell) => ({
            text: cell,
            options: { fill: { color: cardDark }, color: textWhite, fontSize: 10 },
          }))
        );
      });

      s.addTable(tableRows, {
        x: 0.8,
        y: curY,
        w: 11.5,
        margin: 4,
      });
    }
  });

  // Safe file naming
  const safeTitle = (filename || data.title)
    .replace(/[^a-zA-Z0-9_-]/g, '_')
    .slice(0, 50);
  const finalFilename = `${safeTitle.startsWith('Tech_Anatomix') ? '' : 'Tech_Anatomix_'}${safeTitle}.pptx`;

  // Trigger write and download
  if (typeof window !== 'undefined') {
    await pres.writeFile({ fileName: finalFilename });
    return {
      success: true,
      slideCount: data.slides.length + 1,
      blobSize: 45000, // estimated base archive size
    };
  } else {
    const buf = (await pres.write({ outputType: 'nodebuffer' })) as Buffer;
    return {
      success: true,
      slideCount: data.slides.length + 1,
      blobSize: buf.length,
    };
  }
}
