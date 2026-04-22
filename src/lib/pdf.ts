// src/lib/pdf.ts
// ============================================================
// PDF REPORT GENERATOR — SocietyOS
// Clean implementation without autotable issues
// ============================================================

interface BillData {
  flat_number: string;
  resident_name: string;
  amount: number;
  status: string;
  due_date: string;
  paid_at?: string | null;
}

interface ReportData {
  societyName: string;
  month: string;
  year: number;
  bills: BillData[];
}

// ─── Format currency for PDF ──────────────────────────────────
function formatCurrency(amount: number): string {
  return `Rs. ${amount.toLocaleString("en-IN")}`;
}

// ─── Format date for PDF ──────────────────────────────────────
function formatPDFDate(dateStr: string): string {
  try {
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  } catch {
    return dateStr;
  }
}

// ─── Main Export Function ─────────────────────────────────────
export async function generateBillingReport(data: ReportData): Promise<void> {
  // Dynamic import for client-side only
  const { default: jsPDF } = await import("jspdf");

  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  const pageWidth = 210;
  const marginLeft = 15;
  const marginRight = 15;
  const contentWidth = pageWidth - marginLeft - marginRight;
  let currentY = 0;

  // ── HEADER SECTION ────────────────────────────────────────
  // Dark background header
  doc.setFillColor(24, 24, 27);
  doc.rect(0, 0, pageWidth, 38, "F");

  // Logo text
  doc.setFont("helvetica", "bold");
  doc.setFontSize(22);
  doc.setTextColor(255, 255, 255);
  doc.text("SocietyOS", marginLeft, 16);

  // Tagline
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(161, 161, 170);
  doc.text("Housing Society Management Platform", marginLeft, 24);

  // Generated date on right
  doc.setFontSize(8);
  doc.setTextColor(161, 161, 170);
  const today = new Date().toLocaleDateString("en-IN", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  doc.text(`Generated: ${today}`, pageWidth - marginRight, 16, {
    align: "right",
  });

  // ── REPORT TITLE ──────────────────────────────────────────
  currentY = 50;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.setTextColor(24, 24, 27);
  doc.text("Billing Report", marginLeft, currentY);

  currentY += 8;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(82, 82, 91);
  doc.text(`Society: ${data.societyName}`, marginLeft, currentY);

  currentY += 6;
  doc.text(`Period: ${data.month} ${data.year}`, marginLeft, currentY);

  // ── SUMMARY STATS ─────────────────────────────────────────
  currentY += 12;

  const totalAmount = data.bills.reduce((sum, b) => sum + b.amount, 0);
  const paidBills = data.bills.filter((b) => b.status === "PAID");
  const pendingBills = data.bills.filter((b) => b.status === "PENDING");
  const overdueBills = data.bills.filter((b) => b.status === "OVERDUE");
  const paidAmount = paidBills.reduce((sum, b) => sum + b.amount, 0);
  const pendingAmount = pendingBills.reduce((sum, b) => sum + b.amount, 0);
  const overdueAmount = overdueBills.reduce((sum, b) => sum + b.amount, 0);
  const collectionRate =
    totalAmount > 0 ? Math.round((paidAmount / totalAmount) * 100) : 0;

  // Stats boxes
  const boxWidth = (contentWidth - 12) / 4;
  const boxHeight = 22;
  const statsData = [
    {
      label: "Total Billed",
      value: formatCurrency(totalAmount),
      count: `${data.bills.length} bills`,
      color: [59, 130, 246] as [number, number, number],
    },
    {
      label: "Collected",
      value: formatCurrency(paidAmount),
      count: `${paidBills.length} paid`,
      color: [34, 197, 94] as [number, number, number],
    },
    {
      label: "Pending",
      value: formatCurrency(pendingAmount),
      count: `${pendingBills.length} pending`,
      color: [234, 179, 8] as [number, number, number],
    },
    {
      label: "Collection %",
      value: `${collectionRate}%`,
      count: overdueAmount > 0 ? `${overdueBills.length} overdue` : "On track",
      color: [168, 85, 247] as [number, number, number],
    },
  ];

  statsData.forEach((stat, i) => {
    const x = marginLeft + i * (boxWidth + 4);

    // Box background
    doc.setFillColor(...stat.color);
    doc.roundedRect(x, currentY, boxWidth, boxHeight, 2, 2, "F");

    // Value text
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(255, 255, 255);
    doc.text(stat.value, x + boxWidth / 2, currentY + 9, {
      align: "center",
    });

    // Label text
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7);
    doc.setTextColor(255, 255, 255);
    doc.text(stat.label, x + boxWidth / 2, currentY + 15, {
      align: "center",
    });

    // Count text
    doc.setFontSize(6);
    doc.text(stat.count, x + boxWidth / 2, currentY + 20, {
      align: "center",
    });
  });

  // ── BILLS TABLE ───────────────────────────────────────────
  currentY += boxHeight + 12;

  // Column definitions
  const columns = [
    { label: "#", width: 8 },
    { label: "Flat", width: 22 },
    { label: "Resident Name", width: 45 },
    { label: "Amount", width: 28 },
    { label: "Status", width: 22 },
    { label: "Due Date", width: 28 },
    { label: "Paid Date", width: 28 },
  ];

  const rowHeight = 7;
  const headerHeight = 8;

  // Table header background
  doc.setFillColor(24, 24, 27);
  doc.rect(marginLeft, currentY, contentWidth, headerHeight, "F");

  // Header text
  doc.setFont("helvetica", "bold");
  doc.setFontSize(7);
  doc.setTextColor(255, 255, 255);

  let colX = marginLeft + 2;
  columns.forEach((col) => {
    doc.text(col.label, colX, currentY + 5.5);
    colX += col.width;
  });

  currentY += headerHeight;

  // Table rows
  data.bills.forEach((bill, index) => {
    // Check if we need a new page
    if (currentY + rowHeight > 275) {
      doc.addPage();
      currentY = 15;

      // Repeat header on new page
      doc.setFillColor(24, 24, 27);
      doc.rect(marginLeft, currentY, contentWidth, headerHeight, "F");

      doc.setFont("helvetica", "bold");
      doc.setFontSize(7);
      doc.setTextColor(255, 255, 255);

      let hColX = marginLeft + 2;
      columns.forEach((col) => {
        doc.text(col.label, hColX, currentY + 5.5);
        hColX += col.width;
      });

      currentY += headerHeight;
    }

    // Alternate row background
    if (index % 2 === 0) {
      doc.setFillColor(250, 250, 250);
      doc.rect(marginLeft, currentY, contentWidth, rowHeight, "F");
    }

    // Row border bottom
    doc.setDrawColor(230, 230, 230);
    doc.setLineWidth(0.1);
    doc.line(
      marginLeft,
      currentY + rowHeight,
      marginLeft + contentWidth,
      currentY + rowHeight,
    );

    // Row data
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7);
    doc.setTextColor(60, 60, 60);

    let rColX = marginLeft + 2;
    const textY = currentY + 5;

    // Column 1 — Serial number
    doc.text(String(index + 1), rColX, textY);
    rColX += columns[0].width;

    // Column 2 — Flat number
    doc.setFont("helvetica", "bold");
    doc.text(bill.flat_number.substring(0, 10), rColX, textY);
    rColX += columns[1].width;

    // Column 3 — Resident name
    doc.setFont("helvetica", "normal");
    const truncatedName =
      bill.resident_name.length > 22
        ? bill.resident_name.substring(0, 22) + "..."
        : bill.resident_name;
    doc.text(truncatedName, rColX, textY);
    rColX += columns[2].width;

    // Column 4 — Amount
    doc.setFont("helvetica", "bold");
    doc.setTextColor(24, 24, 27);
    doc.text(formatCurrency(bill.amount), rColX, textY);
    rColX += columns[3].width;

    // Column 5 — Status with color
    doc.setFont("helvetica", "bold");
    doc.setFontSize(7);

    if (bill.status === "PAID") {
      doc.setTextColor(34, 197, 94); // green
    } else if (bill.status === "OVERDUE") {
      doc.setTextColor(239, 68, 68); // red
    } else if (bill.status === "PENDING") {
      doc.setTextColor(234, 179, 8); // yellow/orange
    } else {
      doc.setTextColor(100, 100, 100); // gray
    }

    doc.text(bill.status, rColX, textY);
    rColX += columns[4].width;

    // Column 6 — Due date
    doc.setFont("helvetica", "normal");
    doc.setTextColor(100, 100, 100);
    doc.text(formatPDFDate(bill.due_date), rColX, textY);
    rColX += columns[5].width;

    // Column 7 — Paid date
    if (bill.paid_at) {
      doc.setTextColor(34, 197, 94);
      doc.text(formatPDFDate(bill.paid_at), rColX, textY);
    } else {
      doc.setTextColor(180, 180, 180);
      doc.text("—", rColX, textY);
    }

    currentY += rowHeight;
  });

  // ── TABLE BORDER ──────────────────────────────────────────
  const tableStartY = currentY - data.bills.length * rowHeight - headerHeight;
  const tableEndY = currentY;

  doc.setDrawColor(200, 200, 200);
  doc.setLineWidth(0.3);
  doc.rect(marginLeft, tableStartY, contentWidth, tableEndY - tableStartY);

  // ── SUMMARY SECTION BELOW TABLE ───────────────────────────
  currentY += 8;

  if (currentY > 260) {
    doc.addPage();
    currentY = 15;
  }

  // Summary box
  doc.setFillColor(245, 245, 245);
  doc.roundedRect(marginLeft, currentY, contentWidth, 30, 3, 3, "F");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(24, 24, 27);
  doc.text("Summary", marginLeft + 5, currentY + 7);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(80, 80, 80);

  const summaryItems = [
    `Total Flats Billed: ${data.bills.length}`,
    `Paid: ${paidBills.length} (${formatCurrency(paidAmount)})`,
    `Pending: ${pendingBills.length} (${formatCurrency(pendingAmount)})`,
    `Overdue: ${overdueBills.length} (${formatCurrency(overdueAmount)})`,
  ];

  summaryItems.forEach((item, i) => {
    const col = i % 2;
    const row = Math.floor(i / 2);
    doc.text(
      item,
      marginLeft + 5 + col * (contentWidth / 2),
      currentY + 14 + row * 6,
    );
  });

  // ── FOOTER ────────────────────────────────────────────────
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);

    // Footer line
    doc.setDrawColor(200, 200, 200);
    doc.setLineWidth(0.3);
    doc.line(marginLeft, 282, pageWidth - marginRight, 282);

    // Footer text
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7);
    doc.setTextColor(161, 161, 170);

    doc.text(`SocietyOS — Confidential`, marginLeft, 287);

    doc.text(`Page ${i} of ${pageCount}`, pageWidth - marginRight, 287, {
      align: "right",
    });
  }

  // ── DOWNLOAD ──────────────────────────────────────────────
  const fileName = `SocietyOS-Billing-${data.month}-${data.year}.pdf`;
  doc.save(fileName);
}
