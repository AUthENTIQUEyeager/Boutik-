import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(request: NextRequest) {
  try {
    // Verify webhook signature if secret is configured
    const webhookSecret = process.env.MONEYFUSION_WEBHOOK_SECRET;
    if (webhookSecret) {
      // TODO: Implement signature verification according to MoneyFusion documentation
      // Example (pseudo-code):
      // const signature = request.headers.get('x-moneyfusion-signature');
      // const isValid = verifySignature(await request.text(), signature, webhookSecret);
      // if (!isValid) {
      //   return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
      // }
      // For now, we skip verification if secret is present but we have not implemented it yet.
      // In production, you must implement proper verification.
    }

    // Parse the body (assuming JSON)
    const body = await request.json();

    // Expected structure from MoneyFusion (adjust based on their actual webhook format)
    const {
      shop_id,
      plan,
      status, // e.g., 'success', 'failed', 'refunded', 'cancelled'
      provider_payment_id,
      amount,
    } = body;

    // Validate required fields
    if (!shop_id || !plan || !status) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Only process successful payments for plan updates
    if (status === 'success' && (plan === 'essential' || plan === 'professional')) {
      const supabase = createAdminClient();

      // Update the user's plan in the profiles table
      const { error: updateError } = await supabase
        .from("profiles")
        .update({
          plan,
          plan_renews_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days from now
          plan_updated_at: new Date().toISOString(),
        })
        .eq("id", shop_id);

      if (updateError) {
        console.error("Error updating user plan:", updateError);
        // We still return 200 to MoneyFusion to avoid retries, but log the error
        return NextResponse.json({ received: true }, { status: 200 });
      }

      // Optionally, we could also record the successful payment in the payments table
      // but we already have a pending intent from the init route; we could update it.
      // For simplicity, we'll skip in this example.

      return NextResponse.json({ received: true }, { status: 200 });
    }

    // For other statuses (failed, refunded, etc.) we just acknowledge receipt
    return NextResponse.json({ received: true }, { status: 200 });
  } catch (error) {
    console.error("Payment webhook error:", error);
    // Still return 200 to avoid webhook retries, but log the error
    return NextResponse.json({ received: true }, { status: 200 });
  }
}