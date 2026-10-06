import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { rfid_card, turnstile_id, access_type } = await req.json();

    console.log("Received access request:", { rfid_card, turnstile_id, access_type });

    if (!rfid_card || !turnstile_id) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "RFID card and turnstile ID are required",
          allowed: false,
        }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Buscar usuário pelo cartão RFID
    const { data: user, error: userError } = await supabase
      .from("users")
      .select("*")
      .eq("rfid_card", rfid_card)
      .single();

    if (userError || !user) {
      console.log("User not found for RFID:", rfid_card);

      await supabase.from("registros_acesso").insert({
        id_usuario: null,
        tipo_acesso: access_type || "entry",
        data_hora: new Date().toISOString(),
        status: "negado",
        observacao: "Cartão RFID não cadastrado",
      });

      return new Response(
        JSON.stringify({
          success: false,
          allowed: false,
          message: "Cartão não cadastrado",
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Verificar se o usuário está bloqueado
    if (user.status === "blocked") {
      console.log("User blocked:", user.name);

      await supabase.from("registros_acesso").insert({
        id_usuario: user.id,
        tipo_acesso: access_type || "entry",
        data_hora: new Date().toISOString(),
        status: "bloqueado",
        observacao: "Usuário bloqueado no sistema",
      });

      return new Response(
        JSON.stringify({
          success: false,
          allowed: false,
          message: "Acesso bloqueado",
          user_name: user.name,
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Verificar se a catraca está ativa
    const { data: turnstile } = await supabase
      .from("turnstiles")
      .select("*")
      .eq("id", turnstile_id)
      .single();

    if (!turnstile || !turnstile.is_active) {
      console.log("Turnstile not active:", turnstile_id);

      await supabase.from("registros_acesso").insert({
        id_usuario: user.id,
        tipo_acesso: access_type || "entry",
        data_hora: new Date().toISOString(),
        status: "negado",
        observacao: "Catraca inativa",
      });

      return new Response(
        JSON.stringify({
          success: false,
          allowed: false,
          message: "Catraca inativa",
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Acesso permitido
    const { error: logError } = await supabase.from("registros_acesso").insert({
      id_usuario: user.id,
      tipo_acesso: access_type || "entry",
      data_hora: new Date().toISOString(),
      status: "sucesso",
      observacao: `Acesso permitido pela catraca ${turnstile.name}`,
    });

    if (logError) console.error("Error logging access:", logError);

    console.log("Access granted for user:", user.name);

    return new Response(
      JSON.stringify({
        success: true,
        allowed: true,
        message: `Bem-vindo, ${user.name}!`,
        user_name: user.name,
        access_type: access_type || "entry",
        turnstile_name: turnstile.name,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error processing request:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
        allowed: false,
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
