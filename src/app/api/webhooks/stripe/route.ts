import type Stripe from "stripe";
import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { logger } from "@/lib/logger";
import { getStripe, markEventProcessed, validateUUID, logStripeEvent } from "@/lib/stripe-server";
import { rateLimitPublic } from "@/lib/rate-limit";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const ip = request.headers.get("x-forwarded-for") ?? "unknown";
  const rl = await rateLimitPublic(`stripe-webhook:${ip}`, 20, "60 s");
  if (!rl.ok) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  const sig = request.headers.get("stripe-signature");
  if (!sig) {
    logger.error("stripe-webhook", "Pedido sem assinatura Stripe");
    return NextResponse.json({ error: "Missing stripe-signature" }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    const body = await request.text();
    const stripe = getStripe();
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!);
  } catch (err) {
    logger.error("stripe-webhook", "Assinatura inválida", err);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  const session = event.data.object as Stripe.Checkout.Session;
  const metadata = session.metadata ?? {};
  const sessionId = session.id;

  logStripeEvent(event.type, sessionId, metadata);

  if (event.type !== "checkout.session.completed") {
    return NextResponse.json({ received: true });
  }

  const isNew = await markEventProcessed(sessionId);
  if (!isNew) {
    logger.info("stripe-webhook", `Evento ${sessionId} já processado — ignorado`);
    return NextResponse.json({ received: true });
  }

  const bookingGroupId = metadata.booking_group_id;
  const packPurchaseId = metadata.pack_purchase_id;

  if (bookingGroupId) {
    if (!validateUUID(bookingGroupId)) {
      logger.error("stripe-webhook", "booking_group_id inválido", { bookingGroupId });
      return NextResponse.json({ error: "Invalid booking_group_id" }, { status: 400 });
    }

    const admin = createAdminClient();

    const { error: bookingError } = await admin
      .from("bookings")
      .update({ payment_status: "paid_stripe" })
      .eq("booking_group_id", bookingGroupId);

    if (bookingError) {
      logger.error("stripe-webhook", "Erro ao atualizar bookings", bookingError);
      return NextResponse.json({ error: "Failed to update bookings" }, { status: 500 });
    }

    logger.info("stripe-webhook", `Bookings pagos: grupo ${bookingGroupId}`);
  }

  if (packPurchaseId) {
    if (!validateUUID(packPurchaseId)) {
      logger.error("stripe-webhook", "pack_purchase_id inválido", { packPurchaseId });
      return NextResponse.json({ error: "Invalid pack_purchase_id" }, { status: 400 });
    }

    const admin = createAdminClient();

    const { error: packError } = await admin
      .from("pack_purchases")
      .update({ status: "active", payment_status: "pago" })
      .eq("id", packPurchaseId);

    if (packError) {
      logger.error("stripe-webhook", "Erro ao ativar pack", packError);
      return NextResponse.json({ error: "Failed to activate pack" }, { status: 500 });
    }

    logger.info("stripe-webhook", `Pack ativado: ${packPurchaseId}`);
  }

  return NextResponse.json({ received: true });
}
