import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { getCorsHeaders } from "../_shared/cors.ts";
import { enqueueSpineEvent } from "../_shared/spine.ts";


serve(async (req) => {
  const corsHeaders = getCorsHeaders(req.headers.get("origin"));

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

        try {
          const memberUrl = `${url}/${encodeURIComponent(email.toLowerCase())}`;
          const mailchimpHeaders = {
            'Authorization': `Basic ${btoa(`anystring:${apiKey}`)}`,
            'Content-Type': 'application/json',
          };
          const memberResponse = await fetch(memberUrl, { headers: mailchimpHeaders });
          const memberData = await memberResponse.json();

          if (!memberResponse.ok) {
            console.error('Failed to fetch existing Mailchimp member:', memberResponse.status, memberData);
          } else if (memberData.status === 'transactional') {
            const updateResponse = await fetch(memberUrl, {
              method: 'PATCH',
              headers: mailchimpHeaders,
              body: JSON.stringify({ status: 'subscribed' }),
            });
            const updateData = await updateResponse.json();

            if (!updateResponse.ok) {
              console.error('Failed to subscribe transactional Mailchimp member:', updateResponse.status, updateData);
            } else {
              const tagsResponse = await fetch(`${memberUrl}/tags`, {
                method: 'POST',
                headers: mailchimpHeaders,
                body: JSON.stringify({
                  tags: [{ name: 'premium-waitlist', status: 'active' }],
                }),
              });

              if (!tagsResponse.ok) {
                console.error('Failed to tag subscribed Mailchimp member:', tagsResponse.status, await tagsResponse.text());
              }
            }
          }
        } catch (error) {
          console.error('Error recovering transactional Mailchimp member:', error);
        }

        await enqueueSpineEvent("lead_captured", {
          email: email,
          props: { source: "mailchimp_waitlist" },
        });
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
    await enqueueSpineEvent("lead_captured", {
      email: email,
      props: { source: "mailchimp_waitlist" },
    });
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
