// src/lib/receipt-pdf.ts

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

function fmtINR(n: number): string {
  return (
    "Rs. " +
    n.toLocaleString("en-IN", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })
  );
}

function fmtDate(s: string): string {
  try {
    return new Date(s).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    });
  } catch {
    return s;
  }
}

export async function generateReceiptPDF(data: ReceiptData): Promise<void> {
  const { default: jsPDF } = await import("jspdf");

  const doc = new jsPDF("portrait", "mm", "a4");
  const W = 210;
  const ML = 18;
  const MR = 18;
  const CW = W - ML - MR;
  let y = 0;

  // ─── PAGE BACKGROUND ────────────────────────────────────────
  doc.setFillColor(252, 252, 253);
  doc.rect(0, 0, W, 297, "F");

  // ─── HEADER BAR ─────────────────────────────────────────────
  doc.setFillColor(28, 28, 30);
  doc.rect(0, 0, W, 48, "F");

  // Blue accent line at top
  doc.setFillColor(0, 113, 227);
  doc.rect(0, 0, W, 2, "F");

  // App Name
  doc.setFont("helvetica", "bold");
  doc.setFontSize(22);
  doc.setTextColor(255, 255, 255);
  doc.text("SocietyOS", ML, 22);

  // Subtitle
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(150, 150, 155);
  doc.text("Housing Society Management", ML, 30);

  // RECEIPT label right side
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(255, 255, 255);
  doc.text("PAYMENT RECEIPT", W - MR, 18, { align: "right" });

  // Receipt number
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(150, 150, 155);
  doc.text(`#${data.receiptNumber}`, W - MR, 25, { align: "right" });

  // Date
  doc.text(`Date: ${fmtDate(new Date().toISOString())}`, W - MR, 32, {
    align: "right",
  });

  y = 60;

  // ─── STATUS + AMOUNT ROW ────────────────────────────────────
  // Green badge
  doc.setFillColor(52, 199, 89);
  doc.roundedRect(ML, y - 6, 28, 8, 2, 2, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(7);
  doc.setTextColor(255, 255, 255);
  doc.text("PAID", ML + 5, y);

  // Amount
  doc.setFont("helvetica", "bold");
  doc.setFontSize(28);
  doc.setTextColor(28, 28, 30);
  doc.text(fmtINR(data.totalAmount), W - MR, y + 2, {
    align: "right",
  });

  // Amount label
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(130, 130, 135);
  doc.text("Total Amount Paid", W - MR, y + 9, {
    align: "right",
  });

  y += 18;

  // ─── SEPARATOR ──────────────────────────────────────────────
  doc.setDrawColor(230, 230, 235);
  doc.setLineWidth(0.4);
  doc.line(ML, y, W - MR, y);

  y += 10;

  // ─── INFO SECTION ───────────────────────────────────────────
  const leftCol = ML;
  const rightCol = W / 2 + 8;

  // Section headers
  doc.setFont("helvetica", "bold");
  doc.setFontSize(7);
  doc.setTextColor(130, 130, 135);
  doc.text("RESIDENT DETAILS", leftCol, y);
  doc.text("PAYMENT DETAILS", rightCol, y);

  y += 3;

  // Left column entries
  const leftItems = [
    ["Name", data.residentName],
    ["Flat", data.flatNumber],
    ["Society", data.societyName],
  ];

  const rightItems = [
    ["Bill No.", data.billNumber],
    ["Period", `${data.billingMonth} ${data.billingYear}`],
    ["Method", data.paymentMethod],
  ];

  leftItems.forEach((item, i) => {
    const rowY = y + 3 + i * 10;

    // Background
    if (i % 2 === 0) {
      doc.setFillColor(248, 248, 250);
      doc.roundedRect(leftCol - 1, rowY - 3, CW / 2 - 5, 10, 1, 1, "F");
    }

    doc.setFont("helvetica", "normal");
    doc.setFontSize(7);
    doc.setTextColor(130, 130, 135);
    doc.text(item[0], leftCol + 2, rowY);

    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.setTextColor(28, 28, 30);
    // Truncate long text
    const displayText =
      item[1].length > 28 ? item[1].substring(0, 28) + "..." : item[1];
    doc.text(displayText, leftCol + 2, rowY + 5);
  });

  rightItems.forEach((item, i) => {
    const rowY = y + 3 + i * 10;

    if (i % 2 === 0) {
      doc.setFillColor(248, 248, 250);
      doc.roundedRect(rightCol - 1, rowY - 3, CW / 2 - 5, 10, 1, 1, "F");
    }

    doc.setFont("helvetica", "normal");
    doc.setFontSize(7);
    doc.setTextColor(130, 130, 135);
    doc.text(item[0], rightCol + 2, rowY);

    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.setTextColor(28, 28, 30);
    const displayText =
      item[1].length > 28 ? item[1].substring(0, 28) + "..." : item[1];
    doc.text(displayText, rightCol + 2, rowY + 5);
  });

  y += leftItems.length * 10 + 10;

  // ─── SEPARATOR ──────────────────────────────────────────────
  doc.setDrawColor(230, 230, 235);
  doc.line(ML, y, W - MR, y);

  y += 8;

  // ─── PAYMENT BREAKDOWN ──────────────────────────────────────
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(28, 28, 30);
  doc.text("Payment Breakdown", ML, y);

  y += 6;

  // Table header
  doc.setFillColor(28, 28, 30);
  doc.roundedRect(ML, y - 4, CW, 8, 1, 1, "F");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(7);
  doc.setTextColor(255, 255, 255);
  doc.text("Description", ML + 4, y);
  doc.text("Amount (Rs.)", W - MR - 4, y, { align: "right" });

  y += 6;

  // Table rows
  const rows = [
    {
      desc: "Maintenance Charge",
      amount: data.amount,
      isBold: false,
      isTotal: false,
    },
  ];

  if (data.lateFee > 0) {
    rows.push({
      desc: "Late Payment Fee",
      amount: data.lateFee,
      isBold: false,
      isTotal: false,
    });
  }

  rows.push({
    desc: "Total Amount",
    amount: data.totalAmount,
    isBold: true,
    isTotal: true,
  });

  rows.forEach((row, i) => {
    const rowY = y + i * 8;

    if (row.isTotal) {
      // Total row — blue background
      doc.setFillColor(0, 113, 227);
      doc.roundedRect(ML, rowY - 4, CW, 8, 1, 1, "F");
      doc.setFont("helvetica", "bold");
      doc.setFontSize(8);
      doc.setTextColor(255, 255, 255);
    } else {
      // Regular row
      if (i % 2 === 0) {
        doc.setFillColor(248, 248, 250);
        doc.rect(ML, rowY - 4, CW, 8, "F");
      }
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      doc.setTextColor(60, 60, 65);
    }

    doc.text(row.desc, ML + 4, rowY);
    doc.text(fmtINR(row.amount), W - MR - 4, rowY, {
      align: "right",
    });
  });

  y += rows.length * 8 + 8;

  // ─── TRANSACTION REFERENCE ──────────────────────────────────
  if (data.transactionId || data.upiRefNumber) {
    doc.setFillColor(240, 253, 244);
    doc.setDrawColor(134, 239, 172);
    doc.setLineWidth(0.4);
    doc.roundedRect(ML, y, CW, 18, 3, 3, "FD");

    doc.setFont("helvetica", "bold");
    doc.setFontSize(7);
    doc.setTextColor(22, 101, 52);
    doc.text("TRANSACTION REFERENCE", ML + 4, y + 5);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(28, 28, 30);

    let refY = y + 11;
    if (data.transactionId) {
      doc.text(`Transaction ID:  ${data.transactionId}`, ML + 4, refY);
      refY += 5;
    }
    if (data.upiRefNumber) {
      doc.text(`UPI Reference:   ${data.upiRefNumber}`, ML + 4, refY);
    }

    y += 24;
  }

  // ─── PAYMENT DATE BOX ───────────────────────────────────────
  doc.setFillColor(248, 248, 250);
  doc.roundedRect(ML, y, CW, 12, 2, 2, "F");

  doc.setFont("helvetica", "normal");
  doc.setFontSize(7);
  doc.setTextColor(130, 130, 135);
  doc.text("Payment Date", ML + 4, y + 4);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(28, 28, 30);
  doc.text(fmtDate(data.paymentDate), ML + 4, y + 9);

  if (data.confirmedBy) {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7);
    doc.setTextColor(130, 130, 135);
    doc.text("Confirmed By", W - MR - 4, y + 4, { align: "right" });

    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.setTextColor(28, 28, 30);
    doc.text(data.confirmedBy, W - MR - 4, y + 9, { align: "right" });
  }

  y += 18;

  // ─── NOTICE BOX ─────────────────────────────────────────────
  doc.setFillColor(255, 247, 237);
  doc.setDrawColor(253, 186, 116);
  doc.setLineWidth(0.4);
  doc.roundedRect(ML, y, CW, 14, 2, 2, "FD");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(7);
  doc.setTextColor(146, 64, 14);
  doc.text("IMPORTANT", ML + 4, y + 5);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(6.5);
  doc.text(
    "This is a computer-generated receipt. Please keep for your records. No signature required.",
    ML + 4,
    y + 10,
    { maxWidth: CW - 8 },
  );

  // ─── VERIFIED STAMP ─────────────────────────────────────────
  y += 22;

  // Stamp circle
  doc.setDrawColor(52, 199, 89);
  doc.setLineWidth(1);
  doc.circle(W / 2, y + 6, 10);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(6);
  doc.setTextColor(52, 199, 89);
  doc.text("VERIFIED", W / 2, y + 5, { align: "center" });
  doc.text("PAID", W / 2, y + 9, { align: "center" });

  // ─── FOOTER ─────────────────────────────────────────────────
  doc.setDrawColor(230, 230, 235);
  doc.setLineWidth(0.3);
  doc.line(ML, 275, W - MR, 275);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(7);
  doc.setTextColor(150, 150, 155);
  doc.text("SocietyOS — Housing Society Management Platform", W / 2, 280, {
    align: "center",
  });

  doc.setFontSize(6);
  doc.text(
    `Receipt: ${data.receiptNumber}  |  Bill: ${data.billNumber}  |  Society: ${data.societyName}`,
    W / 2,
    284,
    { align: "center" },
  );

  doc.text("This receipt is valid proof of payment.", W / 2, 288, {
    align: "center",
  });

  // ─── SAVE ───────────────────────────────────────────────────
  doc.save(`Receipt-${data.receiptNumber}.pdf`);
}
