import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email } = await req.json();
    
    if (!email) {
      console.error('No email provided');
      return new Response(
        JSON.stringify({ error: 'Email is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const apiKey = Deno.env.get('MAILCHIMP_API_KEY');
    const listId = Deno.env.get('MAILCHIMP_LIST_ID');
    const serverPrefix = Deno.env.get('MAILCHIMP_SERVER_PREFIX');

    if (!apiKey || !listId || !serverPrefix) {
      console.error('Missing Mailchimp configuration');
      return new Response(
        JSON.stringify({ error: 'Mailchimp not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Adding ${email} to Mailchimp list ${listId}`);

    const url = `https://${serverPrefix}.api.mailchimp.com/3.0/lists/${listId}/members`;
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${btoa(`anystring:${apiKey}`)}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email_address: email,
        status: 'subscribed',
        tags: ['premium-waitlist'],
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      // Handle "already subscribed" case
      if (data.title === 'Member Exists') {
        console.log(`${email} is already subscribed to Mailchimp`);
        return new Response(
          JSON.stringify({ success: true, message: 'Already subscribed' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      console.error('Mailchimp error:', data);
      return new Response(
        JSON.stringify({ error: data.detail || 'Failed to add to Mailchimp' }),
        { status: response.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Successfully added ${email} to Mailchimp`);
    return new Response(
      JSON.stringify({ success: true, id: data.id }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error in add-to-mailchimp:', error);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
