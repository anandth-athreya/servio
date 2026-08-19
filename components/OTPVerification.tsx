"use client";

import { useState, useEffect } from "react";

interface OTPVerificationProps {
  phoneNumber: string;
  onVerify: (otp: string) => void;
  onCancel: () => void;
  loading?: boolean;
}

export default function OTPVerification({
  phoneNumber,
  onVerify,
  onCancel,
  loading = false,
}: OTPVerificationProps) {
  const [otp, setOtp] = useState<string[]>(["", "", "", "", "", ""]);
  const [timeLeft, setTimeLeft] = useState(60);
  const [canResend, setCanResend] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (timeLeft === 0) {
      setCanResend(true);
      return;
    }

    const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
    return () => clearTimeout(timer);
  }, [timeLeft]);

  const handleOTPChange = (index: number, value: string) => {
    if (!/^\d?$/.test(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);
    setError("");

    if (value && index < 5) {
      const nextInput = document.getElementById(`otp-${index + 1}`);
      nextInput?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      const prevInput = document.getElementById(`otp-${index - 1}`);
      prevInput?.focus();
    }
  };

  const handleVerify = () => {
    const otpValue = otp.join("");
    if (otpValue.length !== 6) {
      setError("Please enter all 6 digits");
      return;
    }
    onVerify(otpValue);
  };

  const handleResend = () => {
    setOtp(["", "", "", "", "", ""]);
    setTimeLeft(60);
    setCanResend(false);
    setError("");
  };

  const maskedPhone = phoneNumber.replace(/(\d{2})(\d{4})(\d{4})/, "$1****$3");

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-slate-900">Verify Your Phone Number</h2>
        <p className="mt-2 text-slate-600">We've sent a 6-digit OTP to {maskedPhone}</p>
      </div>

      <div className="flex justify-center gap-2">
        {otp.map((digit, index) => (
          <input
            key={index}
            id={`otp-${index}`}
            type="text"
            maxLength={1}
            value={digit}
            onChange={(e) => handleOTPChange(index, e.target.value)}
            onKeyDown={(e) => handleKeyDown(index, e)}
            disabled={loading}
            className="h-12 w-12 rounded-lg border-2 border-slate-300 bg-white text-center text-xl font-semibold text-slate-900 placeholder-slate-500 outline-none focus:border-blue-500 disabled:opacity-50"
            placeholder="0"
          />
        ))}
      </div>

      {error && (
        <div className="rounded-lg bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
          {error}
        </div>
      )}

      <div className="text-center">
        {!canResend ? (
          <p className="text-sm text-slate-600">
            Resend OTP in <span className="font-semibold text-blue-600">{timeLeft}s</span>
          </p>
        ) : (
          <button
            type="button"
            onClick={handleResend}
            disabled={loading}
            className="text-sm font-semibold text-blue-600 hover:text-blue-700 disabled:opacity-50"
          >
            Resend OTP
          </button>
        )}
      </div>

      <button
        onClick={handleVerify}
        disabled={loading || otp.some((d) => d === "")}
        className="w-full rounded-lg bg-gradient-to-r from-blue-600 to-blue-700 px-4 py-3 font-semibold text-white shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? "Verifying..." : "Verify OTP"}
      </button>

      <button
        onClick={onCancel}
        disabled={loading}
        className="w-full rounded-lg border-2 border-slate-300 px-4 py-3 font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
      >
        Cancel
      </button>
    </div>
  );
}
