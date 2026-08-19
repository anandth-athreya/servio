"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

type Step = "email" | "otp" | "password" | "success";

const OTP_LENGTH = 6;
const RESEND_COOLDOWN = 60;

export default function ForgotPassword() {
  const router = useRouter();

  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<"error" | "success">("error");
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  // OTP state
  const [otpValue, setOtpValue] = useState("");
  const [otpError, setOtpError] = useState("");
  const [otpSuccess, setOtpSuccess] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const cooldownRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Cooldown timer
  const startCooldown = useCallback(() => {
    setResendCooldown(RESEND_COOLDOWN);
    if (cooldownRef.current) clearInterval(cooldownRef.current);
    cooldownRef.current = setInterval(() => {
      setResendCooldown((prev) => {
        if (prev <= 1) {
          if (cooldownRef.current) clearInterval(cooldownRef.current);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, []);

  useEffect(() => {
    return () => {
      if (cooldownRef.current) clearInterval(cooldownRef.current);
    };
  }, []);

  // Focus first OTP input when step changes to OTP
  useEffect(() => {
    if (step === "otp") {
      setTimeout(() => inputRefs.current[0]?.focus(), 100);
    }
  }, [step]);

  /* ─── Step 1: Send OTP to email ─── */
  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: Record<string, string> = {};

    if (!email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = "Please enter a valid email address";
    }

    setErrors(newErrors);

    if (Object.keys(newErrors).length > 0) {
      return;
    }

    setLoading(true);
    setMessage("");

    try {
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: `${window.location.origin}/auth/callback?type=recovery`,
      });

      if (resetError) {
        if (resetError.message.toLowerCase().includes("rate limit") ||
            resetError.message.toLowerCase().includes("limit")) {
          throw new Error("Too many attempts. Please wait a few minutes and try again.");
        } else if (resetError.message.toLowerCase().includes("sending")) {
          throw new Error("Email service is temporarily busy. Please wait 2-3 minutes and try again.");
        }
        throw resetError;
      }

      setStep("otp");
      startCooldown();
      setMessage("");
    } catch (err: any) {
      setMessage(err.message || "Failed to send reset code. Please try again.");
      setMessageType("error");
    } finally {
      setLoading(false);
    }
  };

  /* ─── Step 2: Verify OTP ─── */
  async function handleVerifyOtp() {
    if (otpValue.length !== OTP_LENGTH) {
      setOtpError("Please enter all 6 digits.");
      return;
    }

    setVerifying(true);
    setOtpError("");

    try {
      const { error: verifyError } = await supabase.auth.verifyOtp({
        email: email.trim(),
        token: otpValue,
        type: "recovery",
      });

      if (verifyError) {
        if (verifyError.message.toLowerCase().includes("expired")) {
          throw new Error("The verification code has expired. Click 'Resend code' to get a new one.");
        } else if (verifyError.message.toLowerCase().includes("invalid")) {
          throw new Error("The code you entered is incorrect. Please check your email and try again.");
        }
        throw verifyError;
      }

      setOtpSuccess(true);
      await new Promise((resolve) => setTimeout(resolve, 600));
      setStep("password");
    } catch (err: any) {
      setOtpError(err.message || "Invalid or expired code. Please try again.");
      setOtpValue("");
      setOtpSuccess(false);
      setVerifying(false);
    }
  }

  /* ─── Step 2: Resend OTP ─── */
  async function handleResendOtp() {
    if (resendCooldown > 0) return;

    setOtpError("");
    try {
      const { error: resendError } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: `${window.location.origin}/auth/callback?type=recovery`,
      });

      if (resendError) {
        if (resendError.message.toLowerCase().includes("rate limit") ||
            resendError.message.toLowerCase().includes("limit")) {
          throw new Error("Too many requests. Please wait a few minutes before trying again.");
        }
        throw resendError;
      }
      startCooldown();
      setOtpValue("");
      setOtpError("");
    } catch (err: any) {
      setOtpError(err.message || "Failed to resend code. Please wait and try again.");
    }
  }

  // OTP input handlers
  const handleOtpKeyDown = (idx: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !otpValue[idx] && idx > 0) {
      inputRefs.current[idx - 1]?.focus();
    }
    if (e.key === "ArrowLeft" && idx > 0) {
      inputRefs.current[idx - 1]?.focus();
    }
    if (e.key === "ArrowRight" && idx < OTP_LENGTH - 1) {
      inputRefs.current[idx + 1]?.focus();
    }
  };

  const handleOtpInput = (idx: number, char: string) => {
    if (!/^\d$/.test(char)) return;
    const arr = otpValue.split("");
    arr[idx] = char;
    const next = arr.join("").slice(0, OTP_LENGTH);
    setOtpValue(next);
    setOtpError("");
    if (idx < OTP_LENGTH - 1) {
      inputRefs.current[idx + 1]?.focus();
    }
  };

  const handleOtpPaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, OTP_LENGTH);
    if (pasted) {
      setOtpValue(pasted);
      setOtpError("");
      const focusIdx = Math.min(pasted.length, OTP_LENGTH - 1);
      inputRefs.current[focusIdx]?.focus();
    }
  };

  // Auto-verify when all digits entered
  useEffect(() => {
    if (otpValue.length === OTP_LENGTH && step === "otp" && !verifying) {
      handleVerifyOtp();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [otpValue]);

  /* ─── Step 3: Set new password ─── */
  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: Record<string, string> = {};

    if (!newPassword) {
      newErrors.newPassword = "New password is required";
    } else if (newPassword.length < 6) {
      newErrors.newPassword = "Password must be at least 6 characters";
    }

    if (!confirmPassword) {
      newErrors.confirmPassword = "Please confirm your password";
    } else if (newPassword !== confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match";
    }

    setErrors(newErrors);

    if (Object.keys(newErrors).length > 0) {
      return;
    }

    setLoading(true);
    setMessage("");

    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) {
        setMessage(error.message);
        setMessageType("error");
        setLoading(false);
        return;
      }

      setStep("success");
      setMessage("Password reset successful!");
      setMessageType("success");

      // Sign out and redirect after delay
      setTimeout(async () => {
        await supabase.auth.signOut();
        router.push("/login");
      }, 2000);
    } catch (err: any) {
      setMessage(err.message || "Password reset failed");
      setMessageType("error");
    } finally {
      setLoading(false);
    }
  };

  // Password strength helper
  const getPasswordStrength = (pw: string) => {
    if (!pw) return { label: "", color: "", width: "0%" };
    let score = 0;
    if (pw.length >= 6) score++;
    if (pw.length >= 10) score++;
    if (/[A-Z]/.test(pw)) score++;
    if (/[0-9]/.test(pw)) score++;
    if (/[^A-Za-z0-9]/.test(pw)) score++;

    if (score <= 1) return { label: "Weak", color: "bg-red-500", width: "25%" };
    if (score === 2) return { label: "Fair", color: "bg-orange-500", width: "50%" };
    if (score === 3) return { label: "Good", color: "bg-yellow-500", width: "75%" };
    return { label: "Strong", color: "bg-emerald-500", width: "100%" };
  };

  const passwordStrength = getPasswordStrength(newPassword);

  // Step indicator
  const stepIndex = step === "email" ? 0 : step === "otp" ? 1 : step === "password" ? 2 : 3;
  const stepLabels = ["Email", "Verify", "Reset"];

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 px-4 py-12 transition-colors">
      <div className="mx-auto max-w-md">
        {/* Step Indicator */}
        {step !== "success" && (
          <div className="mb-8 flex items-center justify-center gap-4">
            {stepLabels.map((label, i) => (
              <div key={label} className="flex items-center gap-2">
                <div
                  className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold transition-all ${
                    i === stepIndex
                      ? "bg-blue-600 text-white shadow-lg"
                      : i < stepIndex
                      ? "bg-emerald-500 text-white"
                      : "bg-slate-200 text-slate-500"
                  }`}
                >
                  {i < stepIndex ? "✓" : i + 1}
                </div>
                <span className={`text-xs font-semibold hidden sm:block ${
                  i === stepIndex ? "text-blue-700" : i < stepIndex ? "text-emerald-600" : "text-slate-400"
                }`}>
                  {label}
                </span>
                {i < stepLabels.length - 1 && (
                  <div className={`hidden sm:block w-8 h-0.5 rounded-full ml-2 ${
                    i < stepIndex ? "bg-emerald-400" : "bg-slate-200"
                  }`} />
                )}
              </div>
            ))}
          </div>
        )}

        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-black text-slate-900">
            Reset Password
          </h1>
          <p className="mt-2 text-slate-600">
            {step === "email" && "Enter your email to receive a verification code"}
            {step === "otp" && "Enter the code sent to your email"}
            {step === "password" && "Create a new password"}
            {step === "success" && "Your password has been reset"}
          </p>
        </div>

        {/* Form Card */}
        <div className="rounded-3xl bg-white p-8 shadow-lg">
          {/* Step 1: Email */}
          {step === "email" && (
            <form onSubmit={handleEmailSubmit} className="space-y-5">
              <div>
                <label htmlFor="email" className="block text-sm font-semibold text-slate-900">
                  Email Address
                </label>
                <div className="relative mt-2">
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      setTouched({ ...touched, email: true });
                    }}
                    onBlur={() => setTouched({ ...touched, email: true })}
                    disabled={loading}
                    placeholder="you@example.com"
                    className={`w-full rounded-xl border-2 px-4 py-3 transition-colors outline-none ${
                      touched.email && errors.email
                        ? "border-red-300 bg-red-50 text-slate-900 focus:border-red-500 focus:ring-0"
                        : "border-slate-200 bg-slate-50 text-slate-900 placeholder-slate-400 focus:border-blue-500 focus:ring-0"
                    } disabled:opacity-50`}
                  />
                  {touched.email && errors.email && (
                    <p className="mt-1 text-sm text-red-600">{errors.email}</p>
                  )}
                </div>
              </div>

              {/* Error/Success Message */}
              {message && (
                <div
                  className={`rounded-xl px-4 py-3 text-sm font-medium transition-colors ${
                    messageType === "error"
                      ? "bg-red-50 text-red-700"
                      : "bg-green-50 text-green-700"
                  }`}
                >
                  {message}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-xl bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-3 font-semibold text-white shadow-md transition-all hover:shadow-lg hover:from-blue-700 hover:to-blue-800 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Sending code...
                  </span>
                ) : (
                  "Send Verification Code"
                )}
              </button>

              <div className="text-center">
                <a href="/login" className="text-sm font-medium text-blue-600 hover:text-blue-700">
                  Back to Login
                </a>
              </div>
            </form>
          )}

          {/* Step 2: OTP Verification */}
          {step === "otp" && (
            <div className="space-y-6">
              <div className="text-center">
                <p className="text-sm text-slate-600">
                  We sent a 6-digit code to{" "}
                  <span className="font-semibold text-slate-800">{email}</span>
                </p>
              </div>

              {/* OTP Error */}
              {otpError && (
                <div className="rounded-xl bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
                  ⚠️ {otpError}
                </div>
              )}

              {/* OTP Success */}
              {otpSuccess && (
                <div className="rounded-xl bg-green-50 px-4 py-3 text-sm font-medium text-green-700">
                  ✅ Code verified! Preparing password reset...
                </div>
              )}

              {/* OTP Input */}
              <div className="flex items-center justify-center gap-2 sm:gap-3">
                {Array.from({ length: OTP_LENGTH }).map((_, idx) => (
                  <input
                    key={idx}
                    ref={(el) => { inputRefs.current[idx] = el; }}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    disabled={verifying}
                    value={otpValue[idx] || ""}
                    onKeyDown={(e) => handleOtpKeyDown(idx, e)}
                    onInput={(e) => handleOtpInput(idx, (e.target as HTMLInputElement).value.slice(-1))}
                    onPaste={handleOtpPaste}
                    className={`h-14 w-12 rounded-xl border-2 text-center text-2xl font-bold outline-none transition-colors sm:h-16 sm:w-14 ${
                      otpError
                        ? "border-red-300 bg-red-50 text-red-900 focus:border-red-500"
                        : otpSuccess
                        ? "border-green-300 bg-green-50 text-green-900 focus:border-green-500"
                        : "border-slate-300 bg-white text-slate-900 focus:border-blue-500"
                    } disabled:opacity-50`}
                    aria-label={`Digit ${idx + 1}`}
                  />
                ))}
              </div>

              {/* Verify Button */}
              <button
                type="button"
                onClick={handleVerifyOtp}
                disabled={verifying || otpValue.length !== OTP_LENGTH}
                className="w-full rounded-xl bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-3 font-semibold text-white shadow-md transition-all hover:shadow-lg hover:from-blue-700 hover:to-blue-800 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {verifying ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Verifying...
                  </span>
                ) : (
                  "Verify Code"
                )}
              </button>

              {/* Resend & Back */}
              <div className="flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => {
                    setStep("email");
                    setOtpValue("");
                    setOtpError("");
                    setOtpSuccess(false);
                  }}
                  className="text-sm font-semibold text-slate-500 hover:text-slate-700 transition-colors"
                >
                  ← Change email
                </button>

                {resendCooldown > 0 ? (
                  <span className="text-sm font-semibold text-slate-500">
                    Resend in {resendCooldown}s
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={handleResendOtp}
                    className="text-sm font-semibold text-blue-600 hover:text-blue-700 transition-colors"
                  >
                    Resend code
                  </button>
                )}
              </div>

              {/* Help text */}
              <div className="rounded-xl bg-blue-50 p-4">
                <p className="text-xs text-blue-700 leading-5">
                  <span className="font-bold">Didn&apos;t receive the code?</span> Check your spam folder, or try resending after the cooldown.
                </p>
              </div>
            </div>
          )}

          {/* Step 3: New Password */}
          {step === "password" && (
            <form onSubmit={handlePasswordReset} className="space-y-5">
              {/* New Password Field */}
              <div>
                <label htmlFor="newPassword" className="block text-sm font-semibold text-slate-900">
                  New Password
                </label>
                <div className="relative mt-2">
                  <input
                    id="newPassword"
                    type={showPassword ? "text" : "password"}
                    value={newPassword}
                    onChange={(e) => {
                      setNewPassword(e.target.value);
                      setTouched({ ...touched, newPassword: true });
                    }}
                    onBlur={() => setTouched({ ...touched, newPassword: true })}
                    disabled={loading}
                    placeholder="••••••••"
                    className={`w-full rounded-xl border-2 px-4 py-3 pr-12 transition-colors outline-none ${
                      touched.newPassword && errors.newPassword
                        ? "border-red-300 bg-red-50 text-slate-900 focus:border-red-500 focus:ring-0"
                        : "border-slate-200 bg-slate-50 text-slate-900 placeholder-slate-400 focus:border-blue-500 focus:ring-0"
                    } disabled:opacity-50`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-600 hover:text-slate-900"
                    disabled={loading}
                  >
                    {showPassword ? (
                      <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-4.803m5.596-3.856a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0z" />
                      </svg>
                    ) : (
                      <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    )}
                  </button>

                  {/* Password strength meter */}
                  {newPassword && (
                    <div className="mt-2">
                      <div className="h-1.5 w-full rounded-full bg-slate-200 overflow-hidden">
                        <div
                          className={`h-full ${passwordStrength.color} transition-all`}
                          style={{ width: passwordStrength.width }}
                        />
                      </div>
                      <p className="mt-1 text-xs font-semibold text-slate-600">
                        Password strength: {passwordStrength.label}
                      </p>
                    </div>
                  )}

                  {touched.newPassword && errors.newPassword && (
                    <p className="mt-1 text-sm text-red-600">{errors.newPassword}</p>
                  )}
                </div>
              </div>

              {/* Confirm Password Field */}
              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-semibold text-slate-900">
                  Confirm Password
                </label>
                <div className="relative mt-2">
                  <input
                    id="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => {
                      setConfirmPassword(e.target.value);
                      setTouched({ ...touched, confirmPassword: true });
                    }}
                    onBlur={() => setTouched({ ...touched, confirmPassword: true })}
                    disabled={loading}
                    placeholder="••••••••"
                    className={`w-full rounded-xl border-2 px-4 py-3 pr-12 transition-colors outline-none ${
                      touched.confirmPassword && errors.confirmPassword
                        ? "border-red-300 bg-red-50 text-slate-900 focus:border-red-500 focus:ring-0"
                        : "border-slate-200 bg-slate-50 text-slate-900 placeholder-slate-400 focus:border-blue-500 focus:ring-0"
                    } disabled:opacity-50`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-600 hover:text-slate-900"
                    disabled={loading}
                  >
                    {showConfirmPassword ? (
                      <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-4.803m5.596-3.856a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0z" />
                      </svg>
                    ) : (
                      <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    )}
                  </button>

                  {/* Match indicator */}
                  {confirmPassword && newPassword && (
                    <p className={`mt-1 text-xs font-semibold ${
                      newPassword === confirmPassword ? "text-emerald-600" : "text-red-500"
                    }`}>
                      {newPassword === confirmPassword ? "✓ Passwords match" : "✗ Passwords don't match"}
                    </p>
                  )}

                  {touched.confirmPassword && errors.confirmPassword && (
                    <p className="mt-1 text-sm text-red-600">{errors.confirmPassword}</p>
                  )}
                </div>
              </div>

              {/* Password tips */}
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-xs font-bold text-slate-600 uppercase tracking-wide mb-2">Password tips</p>
                <ul className="space-y-1.5 text-xs text-slate-500">
                  <li className={`flex items-center gap-2 ${newPassword.length >= 6 ? "text-emerald-600" : ""}`}>
                    <span>{newPassword.length >= 6 ? "✓" : "○"}</span> At least 6 characters
                  </li>
                  <li className={`flex items-center gap-2 ${/[A-Z]/.test(newPassword) ? "text-emerald-600" : ""}`}>
                    <span>{/[A-Z]/.test(newPassword) ? "✓" : "○"}</span> One uppercase letter
                  </li>
                  <li className={`flex items-center gap-2 ${/[0-9]/.test(newPassword) ? "text-emerald-600" : ""}`}>
                    <span>{/[0-9]/.test(newPassword) ? "✓" : "○"}</span> One number
                  </li>
                  <li className={`flex items-center gap-2 ${/[^A-Za-z0-9]/.test(newPassword) ? "text-emerald-600" : ""}`}>
                    <span>{/[^A-Za-z0-9]/.test(newPassword) ? "✓" : "○"}</span> One special character
                  </li>
                </ul>
              </div>

              {/* Error/Success Message */}
              {message && (
                <div
                  className={`rounded-xl px-4 py-3 text-sm font-medium transition-colors ${
                    messageType === "error"
                      ? "bg-red-50 text-red-700"
                      : "bg-green-50 text-green-700"
                  }`}
                >
                  {message}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-xl bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-3 font-semibold text-white shadow-md transition-all hover:shadow-lg hover:from-blue-700 hover:to-blue-800 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Resetting password...
                  </span>
                ) : (
                  "Reset Password"
                )}
              </button>
            </form>
          )}

          {/* Step 4: Success */}
          {step === "success" && (
            <div className="space-y-6 text-center">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
                <svg className="h-8 w-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div>
                <h2 className="text-2xl font-bold text-slate-900">
                  Password Reset Successful
                </h2>
                <p className="mt-2 text-slate-600">
                  Your password has been successfully reset. Redirecting to login...
                </p>
              </div>
              <a
                href="/login"
                className="inline-block rounded-xl bg-gradient-to-r from-blue-600 to-blue-700 px-8 py-3 font-semibold text-white shadow-md transition-all hover:shadow-lg hover:from-blue-700 hover:to-blue-800"
              >
                Back to Login
              </a>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
