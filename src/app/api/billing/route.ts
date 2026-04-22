// src/app/api/billing/route.ts
// GET  /api/billing — List bills
// POST /api/billing — Generate bills (Treasurer/President only)
// ============================================================

import { BILL_CONFIG, PAGINATION } from "@/constants/config";
import {
  createdResponse,
  errorResponse,
  paginatedResponse,
  serverErrorResponse,
} from "@/lib/api-response";
import { createAuditLog, getRequestMeta } from "@/lib/audit";
import { requireAuth, requirePermission } from "@/lib/auth-context";
import prisma from "@/lib/prisma";
import { sendBillNotificationEmail } from "@/lib/resend";
import { NextRequest } from "next/server";
import { z } from "zod";

// ─── GET — List Bills ────────────────────────────────────────
export async function GET(request: NextRequest) {
  const { context, error } = requireAuth(request);
  if (error) return error;

  try {
    const { searchParams } = new URL(request.url);
    const page = Number(searchParams.get("page")) || PAGINATION.defaultPage;
    const limit = Math.min(
      Number(searchParams.get("limit")) || PAGINATION.defaultLimit,
      PAGINATION.maxLimit,
    );
    const status = searchParams.get("status");
    const month = searchParams.get("month");
    const year = searchParams.get("year");
    const skip = (page - 1) * limit;

    // Committee sees all bills, residents see only their own
    const isCommittee = [
      "SECRETARY",
      "TREASURER",
      "PRESIDENT",
      "ADMIN",
    ].includes(context!.role);

    const whereClause: any = {
      society_id: context!.societyId,
      deleted_at: null,
      ...(!isCommittee && { user_id: context!.userId }),
      ...(status && { status }),
      ...(month && { billing_month: parseInt(month) }),
      ...(year && { billing_year: parseInt(year) }),
    };

    const [bills, total] = await Promise.all([
      prisma.bill.findMany({
        where: whereClause,
        include: {
          flat: { select: { flat_number: true, wing: true } },
          user: { select: { full_name: true, email: true } },
          payments: {
            where: { payment_status: "CONFIRMED" },
            select: { amount: true, payment_date: true },
          },
        },
        orderBy: [{ billing_year: "desc" }, { billing_month: "desc" }],
        skip,
        take: limit,
      }),
      prisma.bill.count({ where: whereClause }),
    ]);

    return paginatedResponse(
      bills,
      {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasNext: page < Math.ceil(total / limit),
        hasPrev: page > 1,
      },
      "Bills retrieved successfully",
    );
  } catch (error) {
    return serverErrorResponse(error);
  }
}

// ─── POST — Generate Monthly Bills ──────────────────────────
const generateBillsSchema = z.object({
  month: z.number().min(1).max(12),
  year: z.number().min(2020).max(2030),
  sendEmails: z.boolean().default(true),
});

export async function POST(request: NextRequest) {
  const { context, error } = requirePermission(request, "bills:create");
  if (error) return error;

  const { ipAddress, userAgent } = getRequestMeta(request);

  try {
    const body = await request.json();
    const validation = generateBillsSchema.safeParse(body);

    if (!validation.success) {
      return errorResponse(
        "Invalid data",
        400,
        validation.error.flatten().fieldErrors as Record<string, string[]>,
      );
    }

    const { month, year, sendEmails } = validation.data;

    // Check if bills already generated for this month
    const existingBills = await prisma.bill.count({
      where: {
        society_id: context!.societyId,
        billing_month: month,
        billing_year: year,
        deleted_at: null,
      },
    });

    if (existingBills > 0) {
      return errorResponse(
        `Bills for ${month}/${year} have already been generated (${existingBills} bills exist)`,
        409,
      );
    }

    // Get all occupied flats with their residents
    const flats = await prisma.flat.findMany({
      where: {
        society_id: context!.societyId,
        status: "OCCUPIED",
        deleted_at: null,
      },
      include: {
        users: {
          where: { status: "ACTIVE", deleted_at: null },
          select: {
            id: true,
            full_name: true,
            email: true,
            is_owner: true,
          },
          orderBy: { is_owner: "desc" }, // Owner first
        },
      },
    });

    if (flats.length === 0) {
      return errorResponse("No occupied flats found in this society", 404);
    }

    // Calculate due date (10th of the billing month)
    const dueDate = new Date(year, month - 1, BILL_CONFIG.dueDayOfMonth);

    // Generate bill number prefix
    const billPrefix = `BILL-${year}-${String(month).padStart(2, "0")}`;

    // Create all bills in a transaction
    const createdBills = await prisma.$transaction(async (tx) => {
      const bills = [];

      for (let i = 0; i < flats.length; i++) {
        const flat = flats[i];
        const primaryUser = flat.users[0];

        if (!primaryUser) continue; // Skip flats with no users

        const billNumber = `${billPrefix}-${String(i + 1).padStart(3, "0")}`;

        const bill = await tx.bill.create({
          data: {
            society_id: context!.societyId,
            flat_id: flat.id,
            user_id: primaryUser.id,
            bill_number: billNumber,
            billing_month: month,
            billing_year: year,
            amount: flat.monthly_amount,
            total_amount: flat.monthly_amount,
            status: "PENDING",
            due_date: dueDate,
          },
        });

        bills.push({ bill, flat, user: primaryUser });
      }

      return bills;
    });

    // Send email notifications (non-blocking)
    if (sendEmails) {
      const emailPromises = createdBills.map(({ bill, flat, user }) =>
        sendBillNotificationEmail(user.email, {
          userName: user.full_name,
          flatNumber: `${flat.wing ? flat.wing + "-" : ""}${flat.flat_number}`,
          amount: Number(bill.total_amount),
          dueDate: dueDate.toLocaleDateString("en-IN", {
            day: "numeric",
            month: "long",
            year: "numeric",
          }),
          billNumber: bill.bill_number,
        }),
      );
      // Fire and forget — don't await
      Promise.allSettled(emailPromises);
    }

    // Audit log
    await createAuditLog({
      societyId: context!.societyId,
      userId: context!.userId,
      action: "CREATE",
      resource: "bills",
      ipAddress,
      userAgent,
      newValues: {
        month,
        year,
        billsGenerated: createdBills.length,
      },
    });

    return createdResponse(
      {
        billsGenerated: createdBills.length,
        month,
        year,
        dueDate: dueDate.toISOString(),
        totalAmount: createdBills.reduce(
          (sum, { bill }) => sum + Number(bill.total_amount),
          0,
        ),
      },
      `Successfully generated ${createdBills.length} bills for ${month}/${year}`,
    );
  } catch (error) {
    return serverErrorResponse(error);
  }
}
