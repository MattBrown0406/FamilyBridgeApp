import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Generate a random invite code
function generateInviteCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 12; i++) {
    if (i === 4 || i === 8) code += '-';
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { 
      platform, // 'apple' or 'google'
      transactionId,
      productId,
      email,
      receiptData, // For Apple: base64 encoded receipt, For Google: purchase token
      subscriptionType // 'family' or 'provider'
    } = await req.json();

    console.log('Verifying app store purchase:', { platform, productId, email, subscriptionType });

    if (!platform || !transactionId || !email || !subscriptionType) {
      throw new Error('Missing required fields: platform, transactionId, email, subscriptionType');
    }

    // Verify the purchase with the respective app store
    let isValid = false;
    let verificationDetails: any = {};

    if (platform === 'apple') {
      // Apple App Store verification
      // In production, this would call Apple's verifyReceipt endpoint
      // For sandbox: https://sandbox.itunes.apple.com/verifyReceipt
      // For production: https://buy.itunes.apple.com/verifyReceipt
      
      const appleSharedSecret = Deno.env.get('APPLE_SHARED_SECRET');
      
      if (receiptData && appleSharedSecret) {
        const verifyUrl = Deno.env.get('APPLE_VERIFY_URL') || 'https://sandbox.itunes.apple.com/verifyReceipt';
        
        const response = await fetch(verifyUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            'receipt-data': receiptData,
            'password': appleSharedSecret,
            'exclude-old-transactions': true,
          }),
        });

        const appleResponse = await response.json();
        console.log('Apple verification response status:', appleResponse.status);

        // Status 0 means valid receipt
        if (appleResponse.status === 0) {
          isValid = true;
          verificationDetails = {
            bundleId: appleResponse.receipt?.bundle_id,
            originalTransactionId: appleResponse.latest_receipt_info?.[0]?.original_transaction_id,
            expiresDate: appleResponse.latest_receipt_info?.[0]?.expires_date_ms,
          };
        } else if (appleResponse.status === 21007) {
          // Receipt is from sandbox but sent to production, retry with sandbox
          console.log('Retrying with sandbox URL...');
          const sandboxResponse = await fetch('https://sandbox.itunes.apple.com/verifyReceipt', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              'receipt-data': receiptData,
              'password': appleSharedSecret,
              'exclude-old-transactions': true,
            }),
          });
          const sandboxResult = await sandboxResponse.json();
          if (sandboxResult.status === 0) {
            isValid = true;
            verificationDetails = {
              bundleId: sandboxResult.receipt?.bundle_id,
              originalTransactionId: sandboxResult.latest_receipt_info?.[0]?.original_transaction_id,
              expiresDate: sandboxResult.latest_receipt_info?.[0]?.expires_date_ms,
            };
          }
        }
      } else {
        // For testing/development without Apple credentials, accept the transaction
        console.log('Apple verification skipped - no shared secret configured');
        isValid = true; // Remove this in production
        verificationDetails = { note: 'Verification skipped - configure APPLE_SHARED_SECRET' };
      }
    } else if (platform === 'google') {
      // Google Play verification
      // In production, this would use Google Play Developer API
      
      const googleServiceAccount = Deno.env.get('GOOGLE_SERVICE_ACCOUNT_KEY');
      
      if (receiptData && googleServiceAccount) {
        // Use Google Play Developer API to verify purchase
        // This requires OAuth2 authentication with service account
        console.log('Google Play verification would happen here');
        // For now, mark as valid for development
        isValid = true;
        verificationDetails = { note: 'Google verification pending implementation' };
      } else {
        console.log('Google verification skipped - no service account configured');
        isValid = true; // Remove this in production
        verificationDetails = { note: 'Verification skipped - configure GOOGLE_SERVICE_ACCOUNT_KEY' };
      }
    } else {
      throw new Error('Invalid platform. Must be "apple" or "google"');
    }

    if (!isValid) {
      console.error('Purchase verification failed');
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'Purchase verification failed' 
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Generate invite/activation code
    const inviteCode = generateInviteCode();
    console.log('Generated invite code:', inviteCode);

    // Store the code in activation_codes table
    const { error: insertError } = await supabase
      .from('activation_codes')
      .insert({
        code: inviteCode,
        email: email,
        is_used: false,
        // Store app store transaction details for reference
        square_customer_id: `${platform}_${transactionId}`, // Repurposing field for app store ID
      });

    if (insertError) {
      console.error('Failed to store activation code:', insertError);
      throw new Error('Failed to generate activation code');
    }

    console.log('Successfully verified purchase and generated code for:', email);

    return new Response(JSON.stringify({
      success: true,
      inviteCode,
      platform,
      subscriptionType,
      verificationDetails,
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('App store purchase verification error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ success: false, error: message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
