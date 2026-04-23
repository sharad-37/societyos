// src/app/api/payments/verify/route.ts
import { NextRequest } from "next/server";
import { z } from "zod";
import { createHmac } from "crypto";
import prisma from "@/lib/prisma";
import { requireAuth } from "@/lib/auth-context";
import { createAuditLog, getRequestMeta } from "@/lib/audit";
import {
  successResponse,
  errorResponse,
  serverErrorResponse,
} from "@/lib/api-response";

const verifySchema = z.object({
  razorpay_order_id: z.string(),
  razorpay_payment_id: z.string(),
  razorpay_signature: z.string(),
  bill_id: z.string().uuid(),
});

export async function POST(request: NextRequest) {
  const { context, error } = requireAuth(request);
  if (error) return error;

  const { ipAddress, userAgent } = getRequestMeta(request);

  try {
    const body = await request.json();
    const validation = verifySchema.safeParse(body);

    if (!validation.success) {
      return errorResponse("Invalid data", 400);
    }

    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      bill_id,
    } = validation.data;

    // ── 1. Verify Razorpay Signature ─────────────────────────
    const generatedSignature = createHmac(
      "sha256",
      process.env.RAZORPAY_KEY_SECRET!,
    )
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest("hex");

    if (generatedSignature !== razorpay_signature) {
      console.error("⚠️ Payment signature mismatch!");

      await createAuditLog({
        societyId: context!.societyId,
        userId: context!.userId,
        action: "CREATE",
        resource: "payments",
        status: "FAILED",
        errorMessage: "Signature verification failed",
        ipAddress,
        userAgent,
      });

      return errorResponse(
        "Payment verification failed. Please contact support.",
        400,
      );
    }

    // ── 2. Get Bill ──────────────────────────────────────────
    const bill = await prisma.bill.findFirst({
      where: {
        id: bill_id,
        society_id: context!.societyId,
        deleted_at: null,
      },
    });

    if (!bill) {
      return errorResponse("Bill not found", 404);
    }

    // ── 3. Create Payment + Update Bill (transaction) ─────────
    const [payment] = await prisma.$transaction([
      // Create payment record
      prisma.payment.create({
        data: {
          society_id: context!.societyId,
          bill_id,
          user_id: context!.userId,
          amount: Number(bill.total_amount),
          payment_method: "ONLINE",
          payment_status: "CONFIRMED",
          transaction_id: razorpay_payment_id,
          payment_date: new Date(),
          confirmed_at: new Date(),
          notes: `Razorpay Order: ${razorpay_order_id}`,
        },
      }),
      // Mark bill as PAID
      prisma.bill.update({
        where: { id: bill_id },
        data: {
          status: "PAID",
          paid_at: new Date(),
          amount_paid: bill.total_amount,
        },
      }),
    ]);

    // ── 4. Audit Log ─────────────────────────────────────────
    await createAuditLog({
      societyId: context!.societyId,
      userId: context!.userId,
      action: "CREATE",
      resource: "payments",
      resourceId: payment.id,
      newValues: {
        razorpayPaymentId: razorpay_payment_id,
        razorpayOrderId: razorpay_order_id,
        amount: Number(bill.total_amount),
        method: "ONLINE",
        verified: true,
      },
      ipAddress,
      userAgent,
    });

    return successResponse(
      {
        paymentId: payment.id,
        transactionId: razorpay_payment_id,
        amount: Number(bill.total_amount),
        status: "CONFIRMED",
        message: "Payment verified and confirmed",
      },
      "Payment successful! Bill marked as paid. 🎉",
    );
  } catch (error) {
    console.error("Payment verify error:", error);
    return serverErrorResponse(error);
  }
}
