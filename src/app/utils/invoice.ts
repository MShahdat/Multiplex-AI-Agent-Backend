import PDFDocument from "pdfkit";

export interface InvoiceData {
  invoiceNumber: string;
  customerName: string;
  customerEmail: string;
  planName: string;
  billingCycle?: string;
  periodStart?: Date | string;
  periodEnd?: Date | string;
  amount: number | string;
  currency?: string;
  paymentMethod: string;
  transactionId?: string;
  paymentIntentId?: string;
  paidAt: Date | string;
  status?: string;
}

const COLORS = {
  primary: "#4F46E5",
  dark: "#111827",
  muted: "#6B7280",
  border: "#E5E7EB",
  light: "#F3F4F6",
  success: "#16A34A",
  white: "#FFFFFF",
};

const formatDate = (value?: Date | string): string => {
  if (!value) return "-";
  const d = value instanceof Date ? value : new Date(value);
  if (isNaN(d.getTime())) return String(value);
  return d.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const formatDateTime = (value?: Date | string): string => {
  if (!value) return "-";
  const d = value instanceof Date ? value : new Date(value);
  if (isNaN(d.getTime())) return String(value);
  return d.toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
};

const formatMoney = (amount: number | string, currency: string): string =>
  `${currency} ${Number(amount).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

export const generateInvoicePdf = (data: InvoiceData): Promise<Buffer> => {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: "A4", margin: 50 });
    const chunks: Buffer[] = [];

    doc.on("data", (chunk: Buffer) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    const currency = data.currency ?? "BDT";
    const status = (data.status ?? "PAID").toUpperCase();
    const left = 50;
    const right = doc.page.width - 50;
    const contentWidth = right - left;


    doc.rect(0, 0, doc.page.width, 110).fill(COLORS.primary);

    doc
      .fillColor(COLORS.white)
      .font("Helvetica-Bold")
      .fontSize(22)
      .text("Multiplex AI Agent", left, 38, { lineBreak: false });
    doc
      .font("Helvetica")
      .fontSize(10)
      .fillColor("#C7D2FE")
      .text("Payment Invoice", left, 68, { lineBreak: false });

    doc
      .font("Helvetica-Bold")
      .fontSize(28)
      .fillColor(COLORS.white)
      .text("INVOICE", right - 200, 36, {
        width: 200,
        align: "right",
        lineBreak: false,
      });


    let y = 140;

    doc
      .font("Helvetica-Bold")
      .fontSize(9)
      .fillColor(COLORS.muted)
      .text("BILLED TO", left, y, { lineBreak: false });
    doc
      .font("Helvetica-Bold")
      .fontSize(13)
      .fillColor(COLORS.dark)
      .text(data.customerName, left, y + 16, { width: 250, lineBreak: false });
    doc
      .font("Helvetica")
      .fontSize(10)
      .fillColor(COLORS.muted)
      .text(data.customerEmail, left, y + 35, { width: 250, lineBreak: false });

    const metaLabelX = right - 200;
    const metaRows: [string, string][] = [
      ["Invoice No", data.invoiceNumber],
      ["Invoice Date", formatDate(data.paidAt)],
    ];
    metaRows.forEach(([label, value], i) => {
      const rowY = y + i * 18;
      doc
        .font("Helvetica")
        .fontSize(10)
        .fillColor(COLORS.muted)
        .text(label, metaLabelX, rowY, { width: 80, lineBreak: false });
      doc
        .font("Helvetica-Bold")
        .fillColor(COLORS.dark)
        .text(value, metaLabelX + 80, rowY, {
          width: 120,
          align: "right",
          lineBreak: false,
        });
    });


    const badgeColor = status === "PAID" ? COLORS.success : COLORS.muted;
    doc.roundedRect(right - 70, y + 40, 70, 22, 4).fill(badgeColor);
    doc
      .font("Helvetica-Bold")
      .fontSize(10)
      .fillColor(COLORS.white)
      .text(status, right - 70, y + 46, {
        width: 70,
        align: "center",
        lineBreak: false,
      });


    y = 250;
    const colDesc = left + 12;
    const colPeriod = 320;
    const colAmountRight = right - 12;

    doc.rect(left, y, contentWidth, 28).fill(COLORS.light);
    doc.font("Helvetica-Bold").fontSize(9).fillColor(COLORS.muted);
    doc.text("DESCRIPTION", colDesc, y + 10, { lineBreak: false });
    doc.text("BILLING PERIOD", colPeriod, y + 10, { lineBreak: false });
    doc.text("AMOUNT", colAmountRight - 100, y + 10, {
      width: 100,
      align: "right",
      lineBreak: false,
    });

    y += 28;
    const rowHeight = 56;

    doc
      .font("Helvetica-Bold")
      .fontSize(11)
      .fillColor(COLORS.dark)
      .text(data.planName, colDesc, y + 12, { width: 240, lineBreak: false });
    if (data.billingCycle) {
      doc
        .font("Helvetica")
        .fontSize(9)
        .fillColor(COLORS.muted)
        .text(
          `${data.billingCycle.charAt(0)}${data.billingCycle
            .slice(1)
            .toLowerCase()} subscription`,
          colDesc,
          y + 30,
          { width: 240, lineBreak: false },
        );
    }

    const periodText =
      data.periodStart || data.periodEnd
        ? `${formatDate(data.periodStart)} - ${formatDate(data.periodEnd)}`
        : "-";
    doc
      .font("Helvetica")
      .fontSize(10)
      .fillColor(COLORS.dark)
      .text(periodText, colPeriod, y + 12, { width: 130, lineBreak: false });

    doc
      .font("Helvetica-Bold")
      .fontSize(11)
      .fillColor(COLORS.dark)
      .text(formatMoney(data.amount, currency), colAmountRight - 120, y + 12, {
        width: 120,
        align: "right",
        lineBreak: false,
      });

    y += rowHeight;
    doc
      .moveTo(left, y)
      .lineTo(right, y)
      .lineWidth(1)
      .strokeColor(COLORS.border)
      .stroke();


    y += 20;
    const totalsX = right - 220;

    doc
      .font("Helvetica")
      .fontSize(10)
      .fillColor(COLORS.muted)
      .text("Subtotal", totalsX, y, { width: 100, lineBreak: false });
    doc
      .fillColor(COLORS.dark)
      .text(formatMoney(data.amount, currency), totalsX + 100, y, {
        width: 120,
        align: "right",
        lineBreak: false,
      });

    y += 26;
    doc.roundedRect(totalsX - 10, y - 8, 230, 34, 4).fill(COLORS.primary);
    doc
      .font("Helvetica-Bold")
      .fontSize(11)
      .fillColor(COLORS.white)
      .text("Total Paid", totalsX, y + 3, { width: 100, lineBreak: false });
    doc.text(formatMoney(data.amount, currency), totalsX + 90, y + 3, {
      width: 120,
      align: "right",
      lineBreak: false,
    });


    y += 70;
    doc
      .font("Helvetica-Bold")
      .fontSize(9)
      .fillColor(COLORS.muted)
      .text("PAYMENT DETAILS", left, y, { lineBreak: false });

    y += 20;
    const boxHeight = 96;
    doc
      .roundedRect(left, y, contentWidth, boxHeight, 6)
      .lineWidth(1)
      .strokeColor(COLORS.border)
      .stroke();

    const details: [string, string][] = [
      ["Payment Method", data.paymentMethod],
      ["Transaction ID", data.transactionId ?? ''],
      ["Payment Intent ID", data.paymentIntentId ?? ''],
      ["Paid At", formatDateTime(data.paidAt)],
    ];
    details.forEach(([label, value], i) => {
      const rowY = y + 16 + i * 25;
      doc
        .font("Helvetica")
        .fontSize(10)
        .fillColor(COLORS.muted)
        .text(label, left + 16, rowY, { width: 140, lineBreak: false });
      doc
        .font("Helvetica-Bold")
        .fillColor(COLORS.dark)
        .text(value, left + 160, rowY, {
          width: contentWidth - 176,
          lineBreak: false,
        });
    });


    const footerY = 730;
    doc
      .moveTo(left, footerY)
      .lineTo(right, footerY)
      .lineWidth(1)
      .strokeColor(COLORS.border)
      .stroke();
    doc
      .font("Helvetica-Bold")
      .fontSize(10)
      .fillColor(COLORS.dark)
      .text("Thank you for your subscription!", left, footerY + 12, {
        width: contentWidth,
        align: "center",
        lineBreak: false,
      });
    doc
      .font("Helvetica")
      .fontSize(8)
      .fillColor(COLORS.muted)
      .text(
        `© ${new Date().getFullYear()} Multiplex AI Agent. All rights reserved`,
        left,
        footerY + 28,
        { width: contentWidth, align: "center", lineBreak: false },
      );

    doc.end();
  });
};