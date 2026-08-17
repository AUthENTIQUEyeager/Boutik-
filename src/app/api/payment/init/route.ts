import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(request: NextRequest) {
  try {
    const { shopId, plan } = await request.json();

    // Validate input
    if (!shopId || !plan || !(plan === 'essential' || plan === 'professional')) {
      return NextResponse.json(
        { error: "Paramètres invalides" },
        { status: 400 }
      );
    }

    const amount = plan === 'essential' ? 3000 : 5000;
    const baseUrl = process.env.MONEYFUSION_PAYMENT_URL;
    if (!baseUrl) {
      return NextResponse.json(
        { error: "MoneyFusion payment URL not configured" },
        { status: 500 }
      );
    }
    // Build payment URL with query parameters
    const url = new URL(baseUrl);
    url.searchParams.set('shop_id', shopId);
    url.searchParams.set('plan', plan);
    url.searchParams.set('amount', amount.toString());
    const paymentUrl = url.toString();

    // Store payment intent (optional, for tracking)
    const supabase = createAdminClient();
    const { error: paymentError } = await supabase
      .from("payments")
      .insert([
        {
          shop_id: shopId,
          amount,
          plan,
          status: "pending",
          provider: "moneyfusion",
          // provider_payment_id would be set after MoneyFusion response
        }
      ]);

    if (paymentError) {
      console.error("Error storing payment intent:", paymentError);
      // Continue anyway - we can still redirect to payment
    }

    return NextResponse.json({ paymentUrl });
  } catch (error) {
    console.error("Payment init error:", error);
    return NextResponse.json(
      { error: "Erreur lors de l'initialisation du paiement" },
      { status: 500 }
    );
  }
}