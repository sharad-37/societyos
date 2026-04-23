// src/lib/receipt-pdf.ts
// ============================================================
// PROFESSIONAL PDF RECEIPT GENERATOR
// ============================================================

interface ReceiptData {
  receiptNumber: string;
  billNumber: string;
  residentName: string;
  flatNumber: string;
  societyName: string;
  billingMonth: string;
  billingYear: number;
  amount: number;
  lateFee: number;
  totalAmount: number;
  paymentMethod: string;
  paymentDate: string;
  transactionId?: string;
  upiRefNumber?: string;
  confirmedBy?: string;
  status: string;
}

function formatINRPDF(amount: number): string {
  return `Rs. ${amount.toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function formatDatePDF(dateStr: string): string {
  try {
    return new Date(dateStr).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    });
  } catch {
    return dateStr;
  }
}

export async function generateReceiptPDF(data: ReceiptData): Promise<void> {
  const { default: jsPDF } = await import("jspdf");

  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  const pageW = 210;
  const marginL = 20;
  const marginR = 20;
  const contentW = pageW - marginL - marginR;
  let y = 0;

  // ── BACKGROUND ──────────────────────────────────────────────
  doc.setFillColor(250, 250, 252);
  doc.rect(0, 0, pageW, 297, "F");

  // ── HEADER SECTION ───────────────────────────────────────────
  // Dark header background
  doc.setFillColor(28, 28, 30);
  doc.rect(0, 0, pageW, 52, "F");

  // App icon circle
  doc.setFillColor(0, 113, 227);
  doc.circle(marginL + 8, 20, 8, "F");

  // App icon text
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(255, 255, 255);
  doc.text("OS", marginL + 5, 23);

  // App name
  doc.setFont("helvetica", "bold");
  doc.setFontSize(20);
  doc.setTextColor(255, 255, 255);
  doc.text("SocietyOS", marginL + 20, 22);

  // Tagline
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(142, 142, 147);
  doc.text("Housing Society Management Platform", marginL + 20, 29);

  // RECEIPT label (right side)
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(255, 255, 255);
  doc.text("PAYMENT RECEIPT", pageW - marginR, 20, {
    align: "right",
  });

  // Receipt number
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(142, 142, 147);
  doc.text(`#${data.receiptNumber}`, pageW - marginR, 27, {
    align: "right",
  });

  // Generated date
  doc.text(
    `Generated: ${formatDatePDF(new Date().toISOString())}`,
    pageW - marginR,
    34,
    { align: "right" },
  );

  y = 65;

  // ── PAYMENT STATUS BADGE ─────────────────────────────────────
  // Green confirmed badge
  doc.setFillColor(52, 199, 89);
  doc.roundedRect(marginL, y - 8, 35, 10, 3, 3, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(255, 255, 255);
  doc.text("✓ CONFIRMED", marginL + 3, y - 1);

  // Amount (large display)
  doc.setFont("helvetica", "bold");
  doc.setFontSize(32);
  doc.setTextColor(28, 28, 30);
  doc.text(formatINRPDF(data.totalAmount), pageW - marginR, y, {
    align: "right",
  });

  y += 8;

  // Amount label
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(110, 110, 115);
  doc.text("Total Amount Paid", pageW - marginR, y, {
    align: "right",
  });

  y += 16;

  // ── DIVIDER ──────────────────────────────────────────────────
  doc.setDrawColor(229, 229, 234);
  doc.setLineWidth(0.5);
  doc.line(marginL, y, pageW - marginR, y);

  y += 12;

  // ── TWO COLUMN INFO SECTION ──────────────────────────────────
  const col1X = marginL;
  const col2X = pageW / 2 + 5;

  // Column headers
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(110, 110, 115);
  doc.text("RESIDENT DETAILS", col1X, y);
  doc.text("PAYMENT DETAILS", col2X, y);

  y += 6;

  // Resident info
  const residentInfo = [
    { label: "Name", value: data.residentName },
    { label: "Flat", value: data.flatNumber },
    { label: "Society", value: data.societyName },
  ];

  const paymentInfo = [
    { label: "Bill Number", value: data.billNumber },
    {
      label: "Period",
      value: `${data.billingMonth} ${data.billingYear}`,
    },
    { label: "Method", value: data.paymentMethod },
  ];

  const rowH = 7;

  residentInfo.forEach((item, i) => {
    const rowY = y + i * rowH;

    // Alternate row background
    if (i % 2 === 0) {
      doc.setFillColor(245, 245, 250);
      doc.rect(col1X - 2, rowY - 4, contentW / 2 - 3, rowH, "F");
    }

    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(110, 110, 115);
    doc.text(item.label, col1X, rowY);

    doc.setFont("helvetica", "bold");
    doc.setTextColor(28, 28, 30);
    doc.text(item.value, col1X, rowY + 3.5);
  });

  paymentInfo.forEach((item, i) => {
    const rowY = y + i * rowH;

    if (i % 2 === 0) {
      doc.setFillColor(245, 245, 250);
      doc.rect(col2X - 2, rowY - 4, contentW / 2 - 3, rowH, "F");
    }

    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(110, 110, 115);
    doc.text(item.label, col2X, rowY);

    doc.setFont("helvetica", "bold");
    doc.setTextColor(28, 28, 30);
    doc.text(item.value, col2X, rowY + 3.5);
  });

  y += residentInfo.length * rowH + 10;

  // ── DIVIDER ──────────────────────────────────────────────────
  doc.setDrawColor(229, 229, 234);
  doc.line(marginL, y, pageW - marginR, y);
  y += 10;

  // ── PAYMENT BREAKDOWN TABLE ───────────────────────────────────
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(28, 28, 30);
  doc.text("Payment Breakdown", col1X, y);
  y += 8;

  // Table header
  doc.setFillColor(28, 28, 30);
  doc.rect(marginL, y - 5, contentW, 8, "F");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(255, 255, 255);
  doc.text("Description", marginL + 3, y);
  doc.text("Amount", pageW - marginR - 3, y, {
    align: "right",
  });

  y += 5;

  // Table rows
  const breakdownRows = [
    {
      desc: "Maintenance Charge",
      amount: data.amount,
      isTotal: false,
    },
    ...(data.lateFee > 0
      ? [
          {
            desc: "Late Payment Fee",
            amount: data.lateFee,
            isTotal: false,
          },
        ]
      : []),
    {
      desc: "Total Amount",
      amount: data.totalAmount,
      isTotal: true,
    },
  ];

  breakdownRows.forEach((row, i) => {
    const rowY = y + i * 9;

    if (row.isTotal) {
      doc.setFillColor(0, 113, 227);
      doc.rect(marginL, rowY - 4, contentW, 9, "F");
      doc.setFont("helvetica", "bold");
      doc.setFontSize(9);
      doc.setTextColor(255, 255, 255);
    } else {
      if (i % 2 === 0) {
        doc.setFillColor(248, 248, 252);
        doc.rect(marginL, rowY - 4, contentW, 9, "F");
      }
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      doc.setTextColor(28, 28, 30);
    }

    doc.text(row.desc, marginL + 3, rowY);
    doc.text(formatINRPDF(row.amount), pageW - marginR - 3, rowY, {
      align: "right",
    });
  });

  y += breakdownRows.length * 9 + 12;

  // ── TRANSACTION DETAILS BOX ───────────────────────────────────
  if (data.transactionId || data.upiRefNumber) {
    doc.setFillColor(240, 253, 244);
    doc.setDrawColor(134, 239, 172);
    doc.setLineWidth(0.5);
    doc.roundedRect(marginL, y, contentW, 22, 4, 4, "FD");

    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.setTextColor(22, 101, 52);
    doc.text("Transaction Reference", marginL + 4, y + 7);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(28, 28, 30);

    if (data.transactionId) {
      doc.text(`Transaction ID: ${data.transactionId}`, marginL + 4, y + 14);
    }
    if (data.upiRefNumber) {
      doc.text(
        `UPI Ref: ${data.upiRefNumber}`,
        marginL + 4,
        y + (data.transactionId ? 20 : 14),
      );
    }

    y += 30;
  }

  // ── PAYMENT DATE ─────────────────────────────────────────────
  doc.setFillColor(245, 245, 250);
  doc.roundedRect(marginL, y, contentW, 14, 3, 3, "F");

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(110, 110, 115);
  doc.text("Payment Date", marginL + 4, y + 5);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(28, 28, 30);
  doc.text(formatDatePDF(data.paymentDate), marginL + 4, y + 11);

  if (data.confirmedBy) {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(110, 110, 115);
    doc.text("Confirmed By", pageW - marginR - 4, y + 5, {
      align: "right",
    });
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.setTextColor(28, 28, 30);
    doc.text(data.confirmedBy, pageW - marginR - 4, y + 11, { align: "right" });
  }

  y += 22;

  // ── IMPORTANT NOTE ───────────────────────────────────────────
  doc.setFillColor(255, 247, 237);
  doc.setDrawColor(251, 191, 36);
  doc.setLineWidth(0.5);
  doc.roundedRect(marginL, y, contentW, 16, 3, 3, "FD");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(7);
  doc.setTextColor(146, 64, 14);
  doc.text("📋 IMPORTANT", marginL + 4, y + 6);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(7);
  doc.text(
    "Please keep this receipt for your records. This is a computer-generated receipt and does not require a signature.",
    marginL + 4,
    y + 11,
    { maxWidth: contentW - 8 },
  );

  y += 24;

  // ── FOOTER ───────────────────────────────────────────────────
  // Footer line
  doc.setDrawColor(229, 229, 234);
  doc.setLineWidth(0.5);
  doc.line(marginL, 272, pageW - marginR, 272);

  // Footer content
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7);
  doc.setTextColor(142, 142, 147);

  doc.text(
    "🏢 SocietyOS — Housing Society Management Platform",
    pageW / 2,
    278,
    { align: "center" },
  );

  doc.text(
    `Receipt No: ${data.receiptNumber}  |  Bill: ${data.billNumber}  |  This receipt is valid`,
    pageW / 2,
    283,
    { align: "center" },
  );

  // QR placeholder (decorative)
  doc.setFillColor(240, 240, 245);
  doc.roundedRect(pageW - marginR - 18, y - 10, 18, 18, 2, 2, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(6);
  doc.setTextColor(142, 142, 147);
  doc.text("VERIFIED", pageW - marginR - 9, y - 1, {
    align: "center",
  });

  // ── SAVE ─────────────────────────────────────────────────────
  const fileName = `SocietyOS-Receipt-${data.receiptNumber}.pdf`;
  doc.save(fileName);
}
