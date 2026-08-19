"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

interface ValidationError {
  fullName?: string;
  email?: string;
  password?: string;
}

interface PasswordStrength {
  score: number;
  label: string;
  color: string;
}

const OTP_LENGTH = 6;
const RESEND_COOLDOWN = 60;

export default function Signup() {
  const router = useRouter();

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<"error" | "success">("error");
  const [errors, setErrors] = useState<ValidationError>({});
  const [loading, setLoading] = useState(false);
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [agreedToTerms, setAgreedToTerms] = useState(false);

  // OTP verification state
  const [step, setStep] = useState<"form" | "otp">("form");
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

  const calculatePasswordStrength = (pwd: string): PasswordStrength => {
    let score = 0;
    if (pwd.length >= 8) score++;
    if (pwd.length >= 12) score++;
    if (/[a-z]/.test(pwd)) score++;
    if (/[A-Z]/.test(pwd)) score++;
    if (/[0-9]/.test(pwd)) score++;
    if (/[^a-zA-Z0-9]/.test(pwd)) score++;

    const strengthLevels: PasswordStrength[] = [
      { score: 0, label: "Very Weak", color: "bg-red-500" },
      { score: 1, label: "Weak", color: "bg-orange-500" },
      { score: 2, label: "Fair", color: "bg-yellow-500" },
      { score: 3, label: "Good", color: "bg-lime-500" },
      { score: 4, label: "Strong", color: "bg-green-500" },
      { score: 6, label: "Very Strong", color: "bg-emerald-600" },
    ];

    return strengthLevels[Math.min(score, 5)];
  };

  const validateForm = (): boolean => {
    const newErrors: ValidationError = {};

    // Full Name validation
    if (!fullName.trim()) {
      newErrors.fullName = "Full name is required";
    } else if (fullName.trim().length < 2) {
      newErrors.fullName = "Full name must be at least 2 characters";
    } else if (!/^[a-zA-Z\s'-]+$/.test(fullName.trim())) {
      newErrors.fullName = "Full name can only contain letters, spaces, hyphens, and apostrophes";
    }

    // Email validation
    if (!email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = "Please enter a valid email address";
    }

    // Password validation
    if (!password) {
      newErrors.password = "Password is required";
    } else if (password.length < 6) {
      newErrors.password = "Password must be at least 6 characters";
    } else if (password !== confirmPassword) {
      newErrors.password = "Passwords do not match";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleBlur = (field: string) => {
    setTouched({ ...touched, [field]: true });
    validateForm();
  };

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    if (!agreedToTerms) {
      setMessage("You must agree to the Terms of Service and Privacy Policy");
      setMessageType("error");
      return;
    }

    setLoading(true);
    setMessage("");

    try {
      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          data: { full_name: fullName.trim() },
        },
      });

      if (error) {
        // Handle rate limit and email sending errors gracefully
        if (
          error.message.toLowerCase().includes("rate limit") ||
          error.message.toLowerCase().includes("email") && error.message.toLowerCase().includes("limit")
        ) {
          setMessage("Too many signup attempts. Please wait a few minutes and try again.");
        } else if (error.message.toLowerCase().includes("sending confirmation")) {
          setMessage("Email service is temporarily busy. Please wait 2-3 minutes and try again.");
        } else if (error.message.toLowerCase().includes("already registered")) {
          setMessage("This email is already registered. Please login instead.");
        } else {
          setMessage(error.message);
        }
        setMessageType("error");
        setLoading(false);
        return;
      }

      // Check if Supabase auto-confirmed the user (email confirmation disabled in dashboard)
      if (data.user && data.session) {
        // Auto-confirmed — skip OTP, create profile, and go to onboarding
        const userId = data.user.id;
        await supabase.from("profiles").upsert({
          id: userId,
          full_name: fullName.trim(),
          role: null,
        });

        setMessage("Account created successfully! Redirecting...");
        setMessageType("success");
        await new Promise((resolve) => setTimeout(resolve, 500));
        router.push("/onboarding");
        return;
      }

      // Email confirmation is enabled — move to OTP step
      if (data.user && !data.session) {
        setStep("otp");
        startCooldown();
        setLoading(false);
        return;
      }

      // Fallback: if we got here, something unexpected happened
      setMessage("Signup initiated. Please check your email for the verification code.");
      setMessageType("success");
      setStep("otp");
      startCooldown();
      setLoading(false);
    } catch (err: any) {
      setMessage(err.message || "Something went wrong. Please try again.");
      setMessageType("error");
      setLoading(false);
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

  // Focus first OTP input when step changes to OTP
  useEffect(() => {
    if (step === "otp") {
      setTimeout(() => inputRefs.current[0]?.focus(), 100);
    }
  }, [step]);

  async function handleVerifyOtp() {
    if (otpValue.length !== OTP_LENGTH) {
      setOtpError("Please enter all 6 digits.");
      return;
    }

    setVerifying(true);
    setOtpError("");

    try {
      const { data, error: verifyError } = await supabase.auth.verifyOtp({
        email: email.trim(),
        token: otpValue,
        type: "signup",
      });

      if (verifyError) {
        // Provide user-friendly error messages
        if (verifyError.message.toLowerCase().includes("expired")) {
          throw new Error("The verification code has expired. Click 'Resend code' to get a new one.");
        } else if (verifyError.message.toLowerCase().includes("invalid")) {
          throw new Error("The code you entered is incorrect. Please check your email and try again.");
        } else {
          throw verifyError;
        }
      }
      if (!data.user) throw new Error("Verification failed. Please try again.");

      setOtpSuccess(true);

      // Create profile record
      const userId = data.user.id;
      const { error: profileError } = await supabase.from("profiles").upsert({
        id: userId,
        full_name: fullName.trim(),
        role: null, // Will be set during onboarding
      });

      if (profileError) {
        console.error("Profile creation error:", profileError);
        // Don't throw — the user is verified, they can set profile during onboarding
      }

      // Brief pause for success animation
      await new Promise((resolve) => setTimeout(resolve, 800));
      router.push("/onboarding");
    } catch (err: any) {
      setOtpError(err.message || "Invalid OTP. Please try again.");
      setOtpValue("");
      setOtpSuccess(false);
      setVerifying(false);
    }
  }

  async function handleResendOtp() {
    if (resendCooldown > 0) return;

    setOtpError("");
    try {
      const { error: resendError } = await supabase.auth.resend({
        type: "signup",
        email: email.trim(),
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

  // Auto-verify when all 6 digits are entered
  useEffect(() => {
    if (otpValue.length === OTP_LENGTH && step === "otp" && !verifying) {
      handleVerifyOtp();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [otpValue]);

  const passwordStrength = calculatePasswordStrength(password);

  /* ─── OTP Verification Screen ─── */
  if (step === "otp") {
    return (
      <main className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 px-4 py-12">
        <div className="mx-auto max-w-md">
          {/* Header */}
          <div className="mb-8 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-3xl bg-gradient-to-br from-blue-500 to-indigo-600 shadow-lg">
              <svg className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
              </svg>
            </div>
            <h1 className="text-4xl font-black text-slate-900">Verify Your Email</h1>
            <p className="mt-2 text-slate-600">
              We sent a 6-digit code to{" "}
              <span className="font-semibold text-slate-800">{email}</span>
            </p>
          </div>

          {/* Card */}
          <div className="rounded-3xl bg-white p-8 shadow-lg">
            {/* OTP Error */}
            {otpError && (
              <div className="mb-6 rounded-xl bg-red-50 px-4 py-3 text-sm font-medium text-red-700 border border-red-200">
                <div className="flex items-start gap-2">
                  <span className="mt-0.5">⚠️</span>
                  <span>{otpError}</span>
                </div>
              </div>
            )}

            {/* OTP Success */}
            {otpSuccess && (
              <div className="mb-6 rounded-xl bg-green-50 px-4 py-3 text-sm font-medium text-green-700 border border-green-200">
                ✅ Email verified successfully! Setting up your account...
              </div>
            )}

            {/* OTP Input */}
            <div className="mb-8 flex items-center justify-center gap-2 sm:gap-3">
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
              className="mb-4 w-full rounded-xl bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-3 font-semibold text-white shadow-md transition-all hover:shadow-lg hover:from-blue-700 hover:to-blue-800 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {verifying ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Verifying...
                </span>
              ) : otpSuccess ? (
                "✓ Verified"
              ) : (
                "Verify Email"
              )}
            </button>

            {/* Resend & Back */}
            <div className="flex items-center justify-between">
              <button
                type="button"
                onClick={() => {
                  setStep("form");
                  setOtpValue("");
                  setOtpError("");
                  setOtpSuccess(false);
                }}
                className="text-sm font-semibold text-slate-500 hover:text-slate-700 transition-colors"
              >
                ← Back to form
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
            <div className="mt-6 rounded-xl bg-blue-50 p-4 border border-blue-100">
              <p className="text-xs text-blue-700 leading-5">
                <span className="font-bold">Didn&apos;t receive the code?</span> Check your spam folder, or make sure{" "}
                <span className="font-semibold">{email}</span> is correct. Supabase free-tier limits emails to ~3 per hour.
                If you&apos;re still not receiving codes, wait 10 minutes and try again.
              </p>
            </div>
          </div>
        </div>
      </main>
    );
  }

  /* ─── Signup Form ─── */
  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 px-4 py-12">
      <div className="mx-auto max-w-md">
        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-black text-slate-900">Get Started</h1>
          <p className="mt-2 text-slate-600">
            Join Servio and discover trusted local services
          </p>
        </div>

        {/* Email verification notice */}
        <div className="mb-4 rounded-2xl border border-amber-200 bg-amber-50/60 px-4 py-3">
          <div className="flex items-start gap-2">
            <span className="text-amber-600 text-lg mt-0.5">📧</span>
            <div>
              <p className="text-sm font-semibold text-amber-800">Email verification required</p>
              <p className="text-xs text-amber-700 mt-1">
                After submitting, we&apos;ll send a 6-digit verification code to your email to confirm your identity.
              </p>
            </div>
          </div>
        </div>

        {/* Form Card */}
        <div className="rounded-3xl bg-white p-8 shadow-lg">
          <form onSubmit={handleSignup} className="space-y-5">
            {/* Full Name Field */}
            <div>
              <label htmlFor="fullName" className="block text-sm font-semibold text-slate-900">
                Full Name
              </label>
              <div className="relative mt-2">
                <input
                  id="fullName"
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  onBlur={() => handleBlur("fullName")}
                  disabled={loading}
                  placeholder="John Doe"
                  className={`w-full rounded-xl border-2 px-4 py-3 transition-colors outline-none ${
                    touched.fullName && errors.fullName
                      ? "border-red-300 bg-red-50 text-slate-900 focus:border-red-500 focus:ring-0"
                      : "border-slate-200 bg-slate-50 text-slate-900 placeholder-slate-400 focus:border-blue-500 focus:ring-0"
                  } disabled:opacity-50`}
                />
                {touched.fullName && errors.fullName && (
                  <p className="mt-1 text-sm text-red-600">{errors.fullName}</p>
                )}
              </div>
            </div>

            {/* Email Field */}
            <div>
              <label htmlFor="email" className="block text-sm font-semibold text-slate-900">
                Email Address
              </label>
              <div className="relative mt-2">
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onBlur={() => handleBlur("email")}
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

            {/* Password Field */}
            <div>
              <label htmlFor="password" className="block text-sm font-semibold text-slate-900">
                Password
              </label>
              <div className="relative mt-2">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onBlur={() => handleBlur("password")}
                  disabled={loading}
                  placeholder="••••••••"
                  className={`w-full rounded-xl border-2 px-4 py-3 pr-12 transition-colors outline-none ${
                    touched.password && errors.password
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

                {/* Password Strength Indicator */}
                {password && (
                  <div className="mt-2 space-y-1">
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-1.5 bg-slate-200 rounded-full overflow-hidden">
                        <div
                          className={`h-full ${passwordStrength.color} transition-all`}
                          style={{
                            width: `${(passwordStrength.score + 1) * 16.67}%`,
                          }}
                        />
                      </div>
                      <span className="text-xs font-medium text-slate-600">
                        {passwordStrength.label}
                      </span>
                    </div>
                  </div>
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
                  type={showPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  onBlur={() => handleBlur("password")}
                  disabled={loading}
                  placeholder="••••••••"
                  className={`w-full rounded-xl border-2 px-4 py-3 transition-colors outline-none ${
                    password && confirmPassword && password !== confirmPassword
                      ? "border-red-300 bg-red-50 text-slate-900 focus:border-red-500 focus:ring-0"
                      : password && confirmPassword && password === confirmPassword
                      ? "border-green-300 bg-green-50 text-slate-900 focus:border-green-500 focus:ring-0"
                      : "border-slate-200 bg-slate-50 text-slate-900 placeholder-slate-400 focus:border-blue-500 focus:ring-0"
                  } disabled:opacity-50`}
                />
                {password && confirmPassword && password === confirmPassword && (
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 text-green-600">
                    <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                  </div>
                )}
              </div>
            </div>

            {/* Terms Checkbox */}
            <label className="flex items-start gap-3">
              <input
                type="checkbox"
                checked={agreedToTerms}
                onChange={(e) => setAgreedToTerms(e.target.checked)}
                disabled={loading}
                className="mt-1 rounded border-slate-300 text-blue-600"
              />
              <span className="text-sm text-slate-600">
                I agree to the{" "}
                <a href="#" className="font-medium text-blue-600 hover:text-blue-700">
                  Terms of Service
                </a>{" "}
                and{" "}
                <a href="#" className="font-medium text-blue-600 hover:text-blue-700">
                  Privacy Policy
                </a>
              </span>
            </label>

            {/* Error/Success Message */}
            {message && (
              <div
                className={`rounded-xl px-4 py-3 text-sm font-medium border ${
                  messageType === "error"
                    ? "bg-red-50 text-red-700 border-red-200"
                    : "bg-green-50 text-green-700 border-green-200"
                }`}
              >
                {message}
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={
                loading ||
                Object.keys(errors).length > 0 ||
                !agreedToTerms ||
                !password ||
                !confirmPassword
              }
              className="w-full rounded-xl bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-3 font-semibold text-white shadow-md transition-all hover:shadow-lg hover:from-blue-700 hover:to-blue-800 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Sending verification code...
                </span>
              ) : (
                "Continue → Verify Email"
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="my-6 flex items-center gap-4">
            <div className="flex-1 border-t border-slate-200" />
            <span className="text-sm text-slate-500">or</span>
            <div className="flex-1 border-t border-slate-200" />
          </div>

          {/* Login Link */}
          <p className="text-center text-sm text-slate-600">
            Already have an account?{" "}
            <a
              href="/login"
              className="font-semibold text-blue-600 hover:text-blue-700 transition-colors"
            >
              Sign in
            </a>
          </p>
        </div>

        {/* Footer Note */}
        <p className="mt-6 text-center text-xs text-slate-500">
          Your data is secure and encrypted. We never share your information.
        </p>
      </div>
    </main>
  );
}