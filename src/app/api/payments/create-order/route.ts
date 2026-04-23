// src/app/api/payments/create-order/route.ts
import { NextRequest } from "next/server";
import { z } from "zod";
import Razorpay from "razorpay";
import prisma from "@/lib/prisma";
import { requireAuth } from "@/lib/auth-context";
import {
  successResponse,
  errorResponse,
  serverErrorResponse,
} from "@/lib/api-response";

// Initialize Razorpay with test keys
const razorpay = new Razorpay({
  key_id: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID!,
  key_secret: process.env.RAZORPAY_KEY_SECRET!,
});

const createOrderSchema = z.object({
  bill_id: z.string().uuid(),
});

export async function POST(request: NextRequest) {
  const { context, error } = requireAuth(request);
  if (error) return error;

  try {
    const body = await request.json();
    const validation = createOrderSchema.safeParse(body);

    if (!validation.success) {
      return errorResponse("Invalid data", 400);
    }

    // Get bill details
    const bill = await prisma.bill.findFirst({
      where: {
        id: validation.data.bill_id,
        society_id: context!.societyId,
        deleted_at: null,
      },
      include: {
        flat: { select: { flat_number: true, wing: true } },
        user: { select: { full_name: true, email: true, phone: true } },
      },
    });

    if (!bill) {
      return errorResponse("Bill not found", 404);
    }

    if (bill.status === "PAID") {
      return errorResponse("Bill already paid", 409);
    }

    const amount = Number(bill.total_amount);

    // Create Razorpay order
    const order = await razorpay.orders.create({
      amount: Math.round(amount * 100), // Razorpay uses paise
      currency: "INR",
      receipt: bill.bill_number,
      notes: {
        bill_id: bill.id,
        society_id: context!.societyId,
        flat: bill.flat?.wing
          ? `${bill.flat.wing}-${bill.flat.flat_number}`
          : bill.flat?.flat_number || "N/A",
        resident: bill.user?.full_name || "N/A",
      },
    });

    return successResponse(
      {
        orderId: order.id,
        amount: order.amount,
        currency: order.currency,
        billNumber: bill.bill_number,
        keyId: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
        prefill: {
          name: bill.user?.full_name || "",
          email: bill.user?.email || "",
          contact: bill.user?.phone || "",
        },
        notes: order.notes,
      },
      "Order created successfully",
    );
  } catch (error) {
    console.error("Razorpay order error:", error);
    return serverErrorResponse(error);
  }
}
