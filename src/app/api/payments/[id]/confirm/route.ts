// src/app/api/payments/[id]/confirm/route.ts
import { NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import { requirePermission } from "@/lib/auth-context";
import { createAuditLog, getRequestMeta } from "@/lib/audit";
import { sendReceiptEmail } from "@/lib/resend";
import {
  successResponse,
  notFoundResponse,
  errorResponse,
  serverErrorResponse,
} from "@/lib/api-response";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const { context, error } = requirePermission(request, "payments:confirm");
  if (error) return error;

  const { ipAddress, userAgent } = getRequestMeta(request);

  try {
    const payment = await prisma.payment.findFirst({
      where: {
        id,
        society_id: context!.societyId,
      },
      include: {
        bill: {
          include: {
            flat: true,
            user: true,
          },
        },
        user: true,
      },
    });

    if (!payment) return notFoundResponse("Payment");

    if (payment.payment_status === "CONFIRMED") {
      return errorResponse("Payment already confirmed", 409);
    }

    // Confirm payment in transaction
    const [updatedPayment] = await prisma.$transaction([
      // Update payment status
      prisma.payment.update({
        where: { id },
        data: {
          payment_status: "CONFIRMED",
          confirmed_by: context!.userId,
          confirmed_at: new Date(),
        },
      }),
      // Update bill status
      prisma.bill.update({
        where: { id: payment.bill_id },
        data: {
          status: "PAID",
          paid_at: new Date(),
          amount_paid: payment.amount,
        },
      }),
    ]);

    // Generate receipt number
    const receiptNumber = `RCP-${new Date().getFullYear()}-${String(Date.now()).slice(-6)}`;

    // Send receipt email (non-blocking)
    if (payment.user?.email && payment.bill) {
      const MONTHS = [
        "January",
        "February",
        "March",
        "April",
        "May",
        "June",
        "July",
        "August",
        "September",
        "October",
        "November",
        "December",
      ];

      sendReceiptEmail(payment.user.email, {
        receiptNumber,
        billNumber: payment.bill.bill_number,
        residentName: payment.user.full_name,
        flatNumber: payment.bill.flat
          ? `${payment.bill.flat.wing ? payment.bill.flat.wing + "-" : ""}${payment.bill.flat.flat_number}`
          : "N/A",
        amount: Number(payment.bill.amount),
        totalAmount: Number(payment.amount),
        lateFee: Number(payment.bill.late_fee),
        paymentMethod: payment.payment_method,
        paymentDate: payment.payment_date.toISOString(),
        billingMonth: MONTHS[payment.bill.billing_month - 1],
        billingYear: payment.bill.billing_year,
      });
    }

    await createAuditLog({
      societyId: context!.societyId,
      userId: context!.userId,
      action: "APPROVE",
      resource: "payments",
      resourceId: id,
      newValues: { receiptNumber, status: "CONFIRMED" },
      ipAddress,
      userAgent,
    });

    return successResponse(
      { payment: updatedPayment, receiptNumber },
      "Payment confirmed successfully. Receipt sent to resident.",
    );
  } catch (error) {
    return serverErrorResponse(error);
  }
}
