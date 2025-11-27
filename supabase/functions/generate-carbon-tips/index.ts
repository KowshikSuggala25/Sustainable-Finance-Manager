import express from "express";
import cors from "cors";
import fetch from "node-fetch";
import { createClient } from "@supabase/supabase-js";

const app = express();
app.use(
  cors({
    origin: ["http://localhost:5173", "https://personal-finance-manager-g18h.onrender.com"],
    allowedHeaders: ["Content-Type", "Authorization", "apikey", "x-client-info"],
  })
);
app.use(express.json());

app.post("/", async (req, res) => {
  try {
    const openAIApiKey = process.env.OPENAI_API_KEY;
    const supabaseUrl = process.env.VITE_SUPABASE_URL!;
    const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY!;

    if (!openAIApiKey) throw new Error("OPENAI_API_KEY is not set");

    const supabase = createClient(supabaseUrl, supabaseKey);

    const authHeader = req.headers["authorization"] as string | undefined;
    if (!authHeader) {
      return res.status(401).json({ error: "No authorization header" });
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: authError } = await supabase.auth.getUser(token as any);

    const user = (userData as any)?.user;
    if (authError || !user) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const { data: transactions, error: transError } = await supabase
      .from("transactions")
      .select("*")
      .eq("user_id", user.id)
      .order("date", { ascending: false })
      .limit(50);

    if (transError) {
      console.error("Error fetching transactions:", transError);
      return res.status(500).json({ error: "Failed to fetch transactions" });
    }

    const spendingByCategory =
      (transactions as any[] | undefined)?.reduce((acc: Record<string, number>, transaction: any) => {
        if (transaction.type === "expense") {
          const category = transaction.category || "Other";
          acc[category] = (acc[category] || 0) + Math.abs(parseFloat(transaction.amount));
        }
        return acc;
      }, {} as Record<string, number>) || {};

    const totalExpenses = Object.values(spendingByCategory).reduce((a, b) => (a as number) + (b as number), 0);

    const prompt = `Based on the following spending analysis, provide personalized eco-friendly tips to reduce carbon footprint:\n\nSpending Categories and Amounts:\n${Object.entries(spendingByCategory)
      .map(([category, amount]) => `- ${category}: ₹${amount}`)
      .join("\n")}\n\nTotal Monthly Expenses: ₹${totalExpenses}\n\nPlease provide:\n1. 3-4 specific, actionable tips tailored to their spending patterns\n2. Focus on categories where they spend the most\n3. Include potential cost savings where applicable\n4. Keep tips practical and achievable\n\nFormat as a JSON array of objects with \"category\", \"tip\", and \"impact\" fields.`;

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${openAIApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content:
              "You are an environmental advisor who provides practical carbon footprint reduction tips based on spending patterns. Always respond with valid JSON.",
          },
          { role: "user", content: prompt },
        ],
        temperature: 0.7,
        max_tokens: 1000,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("OpenAI API error:", response.status, errorText);
      return res.status(500).json({ error: `OpenAI API error: ${response.status}` });
    }

    const data = (await response.json()) as any;
    const aiResponse = data.choices[0].message.content as string;

    let tips: any;
    try {
      tips = JSON.parse(aiResponse);
    } catch (e) {
      console.error("Failed to parse AI response as JSON:", aiResponse);
      tips = [
        {
          category: "General",
          tip: "Consider using public transport or cycling to reduce transportation emissions.",
          impact: "Can reduce CO₂ by up to 2.6 tons per year.",
        },
        {
          category: "Energy",
          tip: "Switch to LED bulbs and unplug devices when not in use.",
          impact: "Save 10–15% on electricity bills.",
        },
        {
          category: "Food",
          tip: "Choose local and seasonal produce to reduce food miles.",
          impact: "Reduce food-related emissions by 20%.",
        },
      ];
    }

    return res.status(200).json({ tips, spendingAnalysis: spendingByCategory });
  } catch (error: any) {
    console.error("Error in generate-carbon-tips function:", error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    return res.status(500).json({ error: errorMessage });
  }
});

// Local runner
if (require.main === module) {
  const PORT = process.env.PORT || 3002;
  app.listen(PORT, () => console.log(`generate-carbon-tips listening on ${PORT}`));
}
