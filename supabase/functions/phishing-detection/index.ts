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
    const { content, scanType } = await req.json();
    
    // Validate input
    if (!content || !scanType) {
      return new Response(
        JSON.stringify({ error: "Missing required fields: content and scanType" }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!['email', 'url', 'message', 'domain'].includes(scanType)) {
      return new Response(
        JSON.stringify({ error: "Invalid scan type. Must be: email, url, message, or domain" }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const MAX_CONTENT_LENGTH = 10000;
    const sanitizedContent = content.trim().slice(0, MAX_CONTENT_LENGTH);

    // Get Lovable AI API key
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    // System prompt for phishing detection
    const systemPrompt = `You are an expert cybersecurity analyst specializing in phishing detection.

Analyze the provided content for phishing indicators including:
- Sender spoofing (mismatched display name vs email address)
- Urgency tactics ("Act now!", "Account suspended", "Verify immediately")
- Suspicious links (shortened URLs, misspelled domains, unusual TLDs)
- Grammar/spelling issues (common in phishing attempts)
- Credential requests (passwords, SSN, credit card numbers)
- Brand impersonation (fake bank/government/company communications)
- Malicious attachments (executable files, suspicious extensions)
- Social engineering (emotional manipulation, fear tactics, too-good-to-be-true offers)

Provide a detailed risk assessment with confidence score and actionable recommendations.`;

    // Tool calling schema for structured output
    const tools = [{
      type: "function",
      function: {
        name: "phishing_analysis",
        description: "Provide detailed phishing analysis with risk assessment",
        parameters: {
          type: "object",
          properties: {
            risk_level: {
              type: "string",
              enum: ["safe", "low", "medium", "high", "critical"],
              description: "Overall threat level"
            },
            confidence_score: {
              type: "number",
              minimum: 0,
              maximum: 100,
              description: "Confidence in the assessment (0-100)"
            },
            indicators: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  type: { 
                    type: "string",
                    description: "Type of indicator (e.g., 'suspicious_link', 'urgency_language')"
                  },
                  severity: { 
                    type: "string",
                    enum: ["info", "warning", "danger"]
                  },
                  description: { 
                    type: "string",
                    description: "Detailed explanation of what was detected"
                  }
                },
                required: ["type", "severity", "description"]
              }
            },
            summary: {
              type: "string",
              description: "Brief summary of findings"
            },
            recommendations: {
              type: "string",
              description: "Actionable steps to take"
            }
          },
          required: ["risk_level", "confidence_score", "indicators", "summary", "recommendations"]
        }
      }
    }];

    console.log(`Analyzing ${scanType} content...`);

    // Call Lovable AI Gateway
    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: `Analyze this ${scanType}: ${sanitizedContent}` }
        ],
        tools: tools,
        tool_choice: { type: "function", function: { name: "phishing_analysis" } }
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "AI credits exhausted. Please add more credits to continue." }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const aiResponse = await response.json();
    console.log("AI response received");

    // Parse tool call response
    const toolCall = aiResponse.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall || toolCall.function.name !== "phishing_analysis") {
      throw new Error("Invalid AI response format");
    }

    const analysis = JSON.parse(toolCall.function.arguments);

    // Store results in database
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Missing authorization header" }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: authHeader },
        },
      }
    );

    // Get current user
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Insert scan result into database
    const { data: scanRecord, error: insertError } = await supabaseClient
      .from('phishing_scans')
      .insert({
        user_id: user.id,
        scan_type: scanType,
        input_content: sanitizedContent,
        risk_level: analysis.risk_level,
        confidence_score: analysis.confidence_score,
        analysis_details: {
          summary: analysis.summary,
          recommendations: analysis.recommendations
        },
        indicators: analysis.indicators
      })
      .select()
      .single();

    if (insertError) {
      console.error("Database insert error:", insertError);
      throw insertError;
    }

    console.log("Scan completed successfully");

    return new Response(
      JSON.stringify({
        ...analysis,
        scan_id: scanRecord.id,
        created_at: scanRecord.created_at
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error("Error in phishing-detection function:", error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : "An unexpected error occurred" 
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
