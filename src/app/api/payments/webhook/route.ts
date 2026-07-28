// src/app/api/payments/webhook/route.ts
// RazorPay webhook handler.
// Verifies the HMAC signature from RazorPay before updating any payment state.
// RazorPay sends a POST to this endpoint after a payment succeeds or fails.

import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { db } from "@/lib/db";

export async function POST(request: NextRequest) {
  const rawBody = await request.text();
  const signature = request.headers.get("x-razorpay-signature");

  if (!signature) {
    return NextResponse.json(
      { error: "Missing signature header" },
      { status: 400 }
    );
  }

  // Verify HMAC-SHA256 signature.
  const expectedSignature = crypto
    .createHmac("sha256", process.env.RAZORPAY_WEBHOOK_SECRET!)
    .update(rawBody)
    .digest("hex");

  const isValid = crypto.timingSafeEqual(
    Buffer.from(signature, "hex"),
    Buffer.from(expectedSignature, "hex")
  );

  if (!isValid) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  const event = JSON.parse(rawBody);

  // Handle payment.captured → mark order as PAID.
  if (event.event === "payment.captured") {
    const { razorpay_order_id, razorpay_payment_id } =
      event.payload.payment.entity;

    const order = await db.order.findFirst({
      where: { razorpayOrderId: razorpay_order_id },
    });

    if (order) {
      await db.order.update({
        where: { id: order.id },
        data: {
          paymentStatus: "PAID",
          razorpayPaymentId: razorpay_payment_id,
          status:
            order.status === "PENDING" ? "PREPARING" : order.status,
        },
      });
    }
  }

  // Handle payment.failed → mark order payment as FAILED.
  if (event.event === "payment.failed") {
    const { razorpay_order_id } = event.payload.payment.entity;

    await db.order.updateMany({
      where: { razorpayOrderId: razorpay_order_id },
      data: { paymentStatus: "FAILED" },
    });
  }

  return NextResponse.json({ received: true });
}
