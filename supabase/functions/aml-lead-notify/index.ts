import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const secret = Deno.env.get("AML_WEBHOOK_SECRET");
    const regwatchUrl = Deno.env.get("REGWATCH_API_URL");

    if (!secret || !regwatchUrl) {
      throw new Error("Server configuration error: missing AML env vars.");
    }

    const bodyStr = JSON.stringify(body);

    // Compute HMAC-SHA256 using the Web Crypto API (native in Deno — no imports needed)
    const key = await crypto.subtle.importKey(
      "raw",
      new TextEncoder().encode(secret),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["sign"]
    );
    const sigBuffer = await crypto.subtle.sign(
      "HMAC",
      key,
      new TextEncoder().encode(bodyStr)
    );
    const hmac = Array.from(new Uint8Array(sigBuffer))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");

    const response = await fetch(`${regwatchUrl}/aml-lead/capture`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-AML-Signature": hmac,
      },
      body: bodyStr,
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`RegWatch returned ${response.status}: ${text}`);
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("aml-lead-notify error:", message);
    return new Response(
      JSON.stringify({ error: message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
