// @ts-ignore
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
// @ts-ignore
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// Declare Deno global for TypeScript
declare const Deno: any;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

serve(async (req: Request) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { messages } = await req.json();

    // Initialize Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    );

    // Get current user
    const { data: { user } } = await supabaseClient.auth.getUser();

    // Tools Definition
    const tools = [
      {
        type: "function",
        function: {
          name: "update_budget",
          description: "Update the user's monthly budget in their profile.",
          parameters: {
            type: "object",
            properties: {
              amount: {
                type: "number",
                description: "The budget amount to set.",
              },
            },
            required: ["amount"],
          },
        },
      },
      {
        type: "function",
        function: {
          name: "add_transaction",
          description: "Add a new transaction (expense, income, or savings) to the database.",
          parameters: {
            type: "object",
            properties: {
              amount: { type: "number", description: "The transaction amount." },
              type: {
                type: "string",
                enum: ["income", "expense"],
                description: "Type of transaction. Savings should be marked as expense with category 'Savings'.",
              },
              category: { type: "string", description: "Category like Food, Travel, Salary, Savings, etc." },
              date: { type: "string", description: "ISO date string (YYYY-MM-DD)." },
              description: { type: "string", description: "Short description of the transaction." },
            },
            required: ["amount", "type", "category", "date"],
          },
        },
      },
    ];

    // Context / System Prompt
    const systemPrompt = {
      role: "system",
      content: `You are "Bhanu", a warm, empathetic, and efficient Financial Assistant.

Your Capabilities:
- You can chatted specifically about finances.
- You can **ACTION** requests like "set budget" or "add expense" using the provided tools. 
- When a user asks to add a "savings" transaction, treat it as an transaction with type='expense' and category='Savings'.
- If the user mentions a specific month/year for budget, just update the global monthly budget using the tool (explain this limitation gently if needed).

Your Response Rules:
1. **Name**: You are Bhanu. 
2. **Conciseness**: Max 5 bullet points.
3. **Introduction**: Max 2 lines.

Persona: Warm, Emotional, Concise, Grammatically perfect.
Today's Date: ${new Date().toISOString().split('T')[0]}`
    };

    let finalMessages = [systemPrompt, ...messages];

    // First Call: Check for Tool Usage (Non-streaming)
    const firstResponse = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${Deno.env.get("OPENAI_API_KEY")}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: finalMessages,
        tools: tools,
        tool_choice: "auto",
        stream: false, 
      }),
    });

    const firstResult = await firstResponse.json();
    const assistantMessage = firstResult.choices[0].message;

    // Helper to stream text manually
    const streamResponse = (text: string) => {
      const encoder = new TextEncoder();
      const stream = new ReadableStream({
        start(controller) {
          const chunk = { choices: [{ delta: { content: text } }] };
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(chunk)}\n\n`));
          controller.enqueue(encoder.encode('data: [DONE]\n\n'));
          controller.close();
        }
      });
      return new Response(stream, { headers: { ...corsHeaders, "Content-Type": "text/event-stream" } });
    }

    if (assistantMessage.tool_calls) {
      finalMessages.push(assistantMessage);

      for (const toolCall of assistantMessage.tool_calls) {
        const functionName = toolCall.function.name;
        const args = JSON.parse(toolCall.function.arguments);
        let functionResult = "";

        try {
          if (functionName === "update_budget") {
            if (!user) throw new Error("User not authenticated");
            const { error } = await supabaseClient
              .from("profiles")
              .update({ budget: args.amount })
              .eq("id", user.id);
            
            if (error) throw error;
            functionResult = JSON.stringify({ success: true, message: `Budget updated to ${args.amount}` });
          } 
          else if (functionName === "add_transaction") {
            if (!user) throw new Error("User not authenticated");
            const { error } = await supabaseClient
              .from("transactions")
              .insert({
                user_id: user.id,
                amount: args.amount,
                type: args.type,
                category: args.category,
                date: args.date,
                notes: args.description || "",
                title: args.description || args.category // Default title
              });

            if (error) throw error;
            functionResult = JSON.stringify({ success: true, message: "Transaction added successfully" });
          }
        } catch (err: any) {
          functionResult = JSON.stringify({ success: false, error: err.message });
        }

        finalMessages.push({
          tool_call_id: toolCall.id,
          role: "tool",
          name: functionName,
          content: functionResult,
        });
      }

      // Second Call: Stream the confirmation message
      const secondResponse = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${Deno.env.get("OPENAI_API_KEY")}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "gpt-4o-mini",
          messages: finalMessages,
          stream: true,
        }),
      });
      
      return new Response(secondResponse.body, {
        headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
      });
    }

    // No tool calls, just stream back the text we got (or call again with stream=true to match format? 
    // Optimization: Just use the text we have and wrap it in SSE format to save a call)
    return streamResponse(assistantMessage.content || "");



  } catch (error: any) {
    console.error("Error in financial-chat:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
