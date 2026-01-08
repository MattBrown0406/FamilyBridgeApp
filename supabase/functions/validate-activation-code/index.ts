import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get authorization header to identify user
    const authHeader = req.headers.get('authorization');
    if (!authHeader) {
      throw new Error('Authorization required');
    }

    // Verify user token
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      throw new Error('Invalid authentication');
    }

    const { code } = await req.json();

    if (!code) {
      throw new Error('Activation code is required');
    }

    // Normalize code (remove dashes and uppercase)
    const normalizedCode = code.replace(/-/g, '').toUpperCase();
    const formattedCode = `${normalizedCode.slice(0, 4)}-${normalizedCode.slice(4, 8)}-${normalizedCode.slice(8, 12)}`;

    console.log('Validating activation code:', formattedCode);

    // Check if code exists and is valid
    // SECURITY: Only select necessary fields - never fetch email, square_customer_id, or square_subscription_id
    const { data: activationCode, error: fetchError } = await supabase
      .from('activation_codes')
      .select('id, code, is_used, expires_at')
      .eq('code', formattedCode)
      .single();

    if (fetchError || !activationCode) {
      console.log('Activation code not found');
      return new Response(JSON.stringify({ 
        valid: false, 
        error: 'Invalid activation code' 
      }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Check if already used
    if (activationCode.is_used) {
      console.log('Activation code already used');
      return new Response(JSON.stringify({ 
        valid: false, 
        error: 'This activation code has already been used' 
      }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Check if expired
    if (activationCode.expires_at && new Date(activationCode.expires_at) < new Date()) {
      console.log('Activation code expired');
      return new Response(JSON.stringify({ 
        valid: false, 
        error: 'This activation code has expired' 
      }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Mark code as used
    const { error: updateError } = await supabase
      .from('activation_codes')
      .update({
        is_used: true,
        used_by: user.id,
        used_at: new Date().toISOString(),
      })
      .eq('id', activationCode.id);

    if (updateError) {
      console.error('Error marking code as used:', updateError);
      throw new Error('Failed to activate code');
    }

    console.log('Activation code validated successfully');

    return new Response(JSON.stringify({ 
      valid: true,
      message: 'Activation code validated successfully'
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Validation error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ 
      valid: false, 
      error: message 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
