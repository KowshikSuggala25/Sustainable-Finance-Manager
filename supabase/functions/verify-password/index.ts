import express from "express";
import cors from "cors";
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
  // Handle preflight is automatically handled by cors middleware
  try {
    const { password } = req.body || {};
    if (!password) {
      return res.status(400).json({ error: "Password is required" });
    }

    const authHeader = (req.headers["authorization"] || req.headers["Authorization"]) as string | undefined;
    if (!authHeader) {
      return res.status(401).json({ error: "Missing authorization header" });
    }

    const supabaseUrl = process.env.SUPABASE_URL ?? process.env.VITE_SUPABASE_URL ?? "";
    const supabaseKey = process.env.SUPABASE_ANON_KEY ?? process.env.VITE_SUPABASE_ANON_KEY ?? "";

    const supabase = createClient(supabaseUrl, supabaseKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: userData, error: userError } = await supabase.auth.getUser();
    const user = (userData as any)?.user;
    if (userError || !user?.email) {
      return res.status(401).json({ error: "Unable to verify user" });
    }

    const verifier = createClient(supabaseUrl, supabaseKey);
    const { error: signInError } = await verifier.auth.signInWithPassword({
      email: user.email,
      password,
    });

    return res.status(200).json({ valid: !signInError });
  } catch (err: any) {
    console.error("Unexpected error:", err);
    return res.status(500).json({ error: err?.message ?? String(err) });
  }
});

// Local runner
if (require.main === module) {
  const PORT = process.env.PORT || 3003;
  app.listen(PORT, () => console.log(`verify-password listening on ${PORT}`));
}
