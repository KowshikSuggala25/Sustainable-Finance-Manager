import express from "express";
import cors from "cors";


const app = express();
app.use(cors({
  origin: '*',
  allowedHeaders: [
    'authorization',
    'x-client-info',
    'apikey',
    'content-type',
  ],
}));
app.use(express.json());

interface VerifyOTPRequest {
  mobile: string;
  otp: string;
  userId: string;
}


app.post("/", async (req, res) => {
  try {
    const { mobile, otp, userId }: VerifyOTPRequest = req.body;

    // For demo purposes, we'll verify if OTP is 6 digits
    // In production, check against stored OTP in database
    const isValidOTP = otp.length === 6 && /^\d{6}$/.test(otp);

    console.log(`Verifying OTP ${otp} for mobile ${mobile}, user ${userId}`);

    res.status(200).json({
      verified: isValidOTP,
      message: isValidOTP ? "OTP verified successfully" : "Invalid OTP"
    });
  } catch (error: any) {
    console.error("Error in verify-otp function:", error);
    res.status(500).json({ error: error.message });
  }
});

// For local development, listen on a port
if (require.main === module) {
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => {
    console.log(`verify-otp function listening on port ${PORT}`);
  });
}
