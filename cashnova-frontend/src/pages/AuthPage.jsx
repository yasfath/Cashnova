import { useLayoutEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Eye,
  EyeOff,
  KeyRound,
  Lock,
  Mail,
  Phone,
  User,
} from "lucide-react";
import api from "../services/api";
import { hasAuthenticatedSession, saveSessionUser } from "../utils/auth";
import { completeSocialAuthFromParams } from "../utils/socialAuth";

const rupee = "\u20B9";

const moneyDrizzles = [
  { id: 1, left: "3%", delay: "0s", duration: "13s", rotate: "-14deg", scale: 0.92 },
  { id: 2, left: "12%", delay: "2.2s", duration: "11.5s", rotate: "11deg", scale: 0.82 },
  { id: 3, left: "22%", delay: "1.2s", duration: "14.2s", rotate: "-18deg", scale: 1 },
  { id: 4, left: "35%", delay: "4.6s", duration: "12.8s", rotate: "15deg", scale: 0.88 },
  { id: 5, left: "47%", delay: "2.8s", duration: "10.8s", rotate: "-10deg", scale: 0.8 },
  { id: 6, left: "58%", delay: "5.4s", duration: "12.2s", rotate: "19deg", scale: 0.96 },
  { id: 7, left: "70%", delay: "0.6s", duration: "13.6s", rotate: "-16deg", scale: 0.9 },
  { id: 8, left: "82%", delay: "3.8s", duration: "11.2s", rotate: "13deg", scale: 0.86 },
  { id: 9, left: "92%", delay: "1.8s", duration: "14.8s", rotate: "-8deg", scale: 0.78 },
];

const drizzleSparkles = [
  { id: 1, left: "8%", delay: "0.2s", duration: "8s", size: "5px" },
  { id: 2, left: "18%", delay: "1.4s", duration: "7.2s", size: "4px" },
  { id: 3, left: "29%", delay: "2.6s", duration: "8.6s", size: "6px" },
  { id: 4, left: "41%", delay: "0.9s", duration: "7.8s", size: "5px" },
  { id: 5, left: "53%", delay: "2.1s", duration: "8.2s", size: "4px" },
  { id: 6, left: "67%", delay: "1.1s", duration: "7.4s", size: "6px" },
  { id: 7, left: "79%", delay: "3s", duration: "8.8s", size: "5px" },
  { id: 8, left: "91%", delay: "1.8s", duration: "7.6s", size: "4px" },
];

const shouldBypassAuthRender = () => {
  if (typeof window === "undefined") {
    return false;
  }

  const params = new URLSearchParams(window.location.search);
  const hasSocialUserData = Boolean(
    params.get("payload") || params.get("user_id") || params.get("email")
  );

  return hasAuthenticatedSession() || (hasSocialUserData && !params.get("error"));
};

export default function App() {
  const [isSignup, setIsSignup] = useState(false);
  const [authMessage, setAuthMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [otpSubmitting, setOtpSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [authView, setAuthView] = useState("auth");
  const [isBypassingAuth, setIsBypassingAuth] = useState(shouldBypassAuthRender);
  const navigate = useNavigate();

  useLayoutEffect(() => {
    if (hasAuthenticatedSession()) {
      sessionStorage.removeItem("cashnova_auth_message");
      navigate("/", { replace: true });
      return;
    }

    const params = new URLSearchParams(window.location.search);
    const socialError = params.get("error");
    const hasSocialUserData = Boolean(
      params.get("payload") || params.get("user_id") || params.get("email")
    );

    if (socialError) {
      setIsBypassingAuth(false);
      setAuthMessage(socialError);
      window.history.replaceState({}, "", "/auth");
      return;
    }

    if (hasSocialUserData && completeSocialAuthFromParams(params)) {
      sessionStorage.removeItem("cashnova_social_provider");
      window.location.replace("/");
      return;
    }

    setIsBypassingAuth(false);
    const storedMessage = sessionStorage.getItem("cashnova_auth_message");

    if (storedMessage) {
      setAuthMessage(storedMessage);
      sessionStorage.removeItem("cashnova_auth_message");
    }
  }, [navigate]);

  const handleSubmit = async (event) => {
    event.preventDefault();

    const formData = new FormData(event.currentTarget);
    const email = String(formData.get("email") ?? "").trim();
    const fullName = String(formData.get("fullName") ?? "").trim();
    const contactNumber = String(formData.get("contactNumber") ?? "").trim();
    const otp = String(formData.get("otp") ?? "").trim();
    const password = String(formData.get("password") ?? "");

    setAuthMessage("");
    setSubmitting(true);

    if (api.hasBackend()) {
      try {
        const response = isSignup
          ? await api.signup({ fullName, contactNumber, email, password, otp })
          : await api.login({ email, password });

        if (isSignup) {
          setIsSignup(false);
          setAuthMessage("Account created successfully. Please log in.");
          setSubmitting(false);
          return;
        }

        saveSessionUser({
          email,
          fullName,
          token: response?.token,
          user: response?.user,
        });

        navigate("/", { replace: true });
        return;
      } catch {
        setAuthMessage(
          isSignup
            ? "Could not create the account. Please check the details, OTP, and try again."
            : "Could not log in. Please check your email or phone number and password."
        );
        setSubmitting(false);
        return;
      }
    }

    if (isSignup) {
      setIsSignup(false);
      setAuthMessage("Account created successfully. Please log in.");
      setSubmitting(false);
      return;
    }

    saveSessionUser({
      email,
      fullName: "",
    });

    setSubmitting(false);
    navigate("/", { replace: true });
  };

  const handleForgotPassword = async (event) => {
    event.preventDefault();

    const formData = new FormData(event.currentTarget);
    const email = String(formData.get("resetEmail") ?? "").trim();

    if (!api.hasBackend()) {
      setAuthMessage("Forgot password is ready for backend connection. Set VITE_API_URL to enable it.");
      return;
    }

    setAuthMessage("");
    setSubmitting(true);

    try {
      await api.forgotPassword({ email: email.trim() });
      setAuthMessage("Password reset instructions have been sent.");
    } catch {
      setAuthMessage("Could not start password reset. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleOtpRequest = async () => {
    const form = document.querySelector("[data-auth-form]");
    const formData = new FormData(form);
    const email = String(formData.get("email") ?? "").trim();
    const fullName = String(formData.get("fullName") ?? "").trim();
    const contactNumber = String(formData.get("contactNumber") ?? "").trim();

    if (!email || !contactNumber) {
      setAuthMessage("Enter your mail ID and contact number before requesting OTP.");
      return;
    }

    if (!api.hasBackend()) {
      setAuthMessage("OTP request is ready for backend connection. Set VITE_API_URL to enable it.");
      return;
    }

    setAuthMessage("");
    setOtpSubmitting(true);

    try {
      const response = await api.requestSignupOtp({ fullName, contactNumber, email });
      const generatedOtp = response?.otp ?? response?.data?.otp ?? "";

      setAuthMessage(
        generatedOtp
          ? `OTP generated successfully: ${generatedOtp}`
          : "OTP sent successfully. Please check your mail or phone."
      );
    } catch {
      setAuthMessage("Could not send OTP. Please check the details and try again.");
    } finally {
      setOtpSubmitting(false);
    }
  };

  const handleSocialLogin = (provider) => {
    const url = api.getSocialAuthUrl(provider);

    if (!url) {
      setAuthMessage(`${provider} login is ready for backend connection. Set VITE_API_URL to enable it.`);
      return;
    }

    window.location.href = url;
  };

  const switchMode = () => {
    setIsSignup((current) => !current);
    setAuthMessage("");
    setShowPassword(false);
    setAuthView("auth");
  };

  if (isBypassingAuth) {
    return null;
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#f7fbfc] text-slate-900">
      <MoneyDrizzle />
      <FinanceBackdrop />

      <main className="auth-main relative z-10 flex min-h-screen items-center justify-center px-5 py-8 sm:px-8 lg:justify-end lg:px-10 xl:pr-[9vw] 2xl:pr-[18vw]">
        <section className="auth-panel w-full max-w-[430px]">
          {authView === "reset" ? (
            <ResetPasswordView
              authMessage={authMessage}
              onBack={() => {
                setAuthView("auth");
                setAuthMessage("");
              }}
              onSubmit={handleForgotPassword}
              submitting={submitting}
            />
          ) : (
            <>
              <div className="text-center">
                <h1 className="text-3xl font-extrabold tracking-[-0.03em] text-slate-950">
                  {isSignup ? "Create Account" : "Welcome Back"}
                </h1>
                <p className="mt-2 text-sm font-medium text-slate-500">
                  {isSignup
                    ? "Sign up to start managing your account"
                    : "Login to continue to your account"}
                </p>
              </div>

              <form data-auth-form className="mt-8 space-y-4" onSubmit={handleSubmit}>
                {isSignup && (
                  <Input
                    icon={User}
                    name="fullName"
                    placeholder="Full name"
                    required
                    type="text"
                  />
                )}
                    <Input
                      icon={isSignup ? Mail : User}
                      name="email"
                      placeholder={isSignup ? "Mail ID" : "Email or Phone Number"}
                      required
                      type={isSignup ? "email" : "text"}
                    />
                    {isSignup && (
                      <Input
                        icon={Phone}
                        name="contactNumber"
                        placeholder="Contact number"
                        required
                        type="tel"
                      />
                    )}
                    <Input
                      action={
                        <button
                          type="button"
                          onClick={() => setShowPassword((current) => !current)}
                          className="grid h-9 w-9 place-items-center rounded-full text-slate-400 transition hover:bg-slate-100 hover:text-[#0f7c82]"
                          aria-label={showPassword ? "Hide password" : "Show password"}
                        >
                          {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                        </button>
                      }
                      icon={Lock}
                      name="password"
                      placeholder="Password"
                      required
                      type={showPassword ? "text" : "password"}
                    />
                    {isSignup && (
                      <Input
                        action={
                          <button
                            type="button"
                            onClick={handleOtpRequest}
                            disabled={otpSubmitting}
                            className="rounded-xl bg-[#e8f7f4] px-3 py-2 text-xs font-bold text-[#0f7c82] transition hover:bg-[#d7f0ec] disabled:opacity-60"
                          >
                            {otpSubmitting ? "Sending" : "Send OTP"}
                          </button>
                        }
                        icon={KeyRound}
                        name="otp"
                        placeholder="OTP"
                        required
                        type="text"
                      />
                    )}

                    {!isSignup && (
                      <div className="flex items-center justify-between text-xs font-semibold text-slate-500">
                        <label className="flex cursor-pointer items-center gap-2">
                          <input
                            checked={rememberMe}
                            onChange={(event) => setRememberMe(event.target.checked)}
                            type="checkbox"
                            className="h-4 w-4 rounded border-slate-300 accent-[#0f7c82]"
                          />
                          Remember me
                        </label>
                        <button
                          type="button"
                          onClick={() => {
                            setAuthView("reset");
                            setAuthMessage("");
                          }}
                          className="transition hover:text-[#0f7c82]"
                        >
                          Forgot Password?
                        </button>
                      </div>
                    )}

                    <button
                      type="submit"
                      disabled={submitting}
                      className="w-full rounded-[14px] bg-[linear-gradient(90deg,#19c98f,#003069)] px-5 py-4 text-base font-extrabold text-white shadow-[0_18px_36px_rgba(0,48,105,0.22)] transition hover:translate-y-[-1px] hover:shadow-[0_22px_42px_rgba(0,48,105,0.28)] disabled:cursor-not-allowed disabled:opacity-70"
                    >
                      {submitting ? "Please wait..." : isSignup ? "Sign up" : "Login"}
                    </button>
                  </form>

                  {authMessage && (
                    <p className="mt-4 rounded-2xl border border-[#d7e4e9] bg-[#f7fbfc] px-4 py-3 text-sm font-semibold text-[#607684]">
                      {authMessage}
                    </p>
                  )}

                  <div className="my-6 flex items-center gap-4 text-xs font-semibold text-slate-400">
                    <span className="h-px flex-1 bg-slate-200" />
                    or continue with
                    <span className="h-px flex-1 bg-slate-200" />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <SocialButton label="Google" provider="google" onClick={handleSocialLogin} />
                    <SocialButton label="Microsoft" provider="microsoft" onClick={handleSocialLogin} />
                  </div>

              <p className="mt-7 text-center text-sm font-medium text-slate-500">
                {isSignup ? "Already have an account?" : "Don't have an account?"}
                <button
                  type="button"
                  onClick={switchMode}
                  className="ml-1 font-extrabold text-[#0f9f80] transition hover:text-[#003069]"
                >
                  {isSignup ? "Login" : "Sign up"}
                </button>
              </p>
            </>
          )}
        </section>
      </main>

      <style>{`
        .money-drizzle {
          animation: moneyDrizzle var(--drizzle-duration) linear infinite;
          animation-delay: var(--drizzle-delay);
          transform: rotate(var(--drizzle-rotate)) scale(var(--drizzle-scale));
          opacity: 0;
        }

        .drizzle-sparkle {
          animation: sparkleDrizzle var(--sparkle-drizzle-duration) linear infinite;
          animation-delay: var(--sparkle-drizzle-delay);
          opacity: 0;
        }

        .coin-float {
          animation: coinFloat 5.5s ease-in-out infinite;
          animation-delay: var(--coin-delay);
        }

        .scan-ring {
          animation: scanRing 5s ease-in-out infinite;
        }

        .standing-coin {
          animation: standingCoinSpin 4.8s ease-in-out infinite;
          transform-style: preserve-3d;
        }

        .currency-orbit {
          animation: currencyOrbit 6s ease-in-out infinite;
          animation-delay: var(--orbit-delay);
        }

        @keyframes moneyDrizzle {
          0% {
            transform: translateY(-5rem) rotate(var(--drizzle-rotate)) scale(var(--drizzle-scale));
            opacity: 0;
          }
          10% {
            opacity: 0.8;
          }
          85% {
            opacity: 0.72;
          }
          100% {
            transform: translateY(110vh) rotate(var(--drizzle-rotate)) scale(var(--drizzle-scale));
            opacity: 0;
          }
        }

        @keyframes sparkleDrizzle {
          0% {
            transform: translateY(-3rem) scale(0.8);
            opacity: 0;
          }
          15% {
            opacity: 0.95;
          }
          85% {
            opacity: 0.55;
          }
          100% {
            transform: translateY(108vh) scale(1.05);
            opacity: 0;
          }
        }

        @keyframes coinFloat {
          0%, 100% {
            transform: translateY(0) rotate(-12deg);
          }
          50% {
            transform: translateY(-18px) rotate(12deg);
          }
        }

        @keyframes scanRing {
          0%, 100% {
            transform: translate(-50%, -50%) rotate(0deg) scale(1);
            opacity: 0.72;
          }
          50% {
            transform: translate(-50%, -50%) rotate(12deg) scale(1.04);
            opacity: 1;
          }
        }

        @keyframes standingCoinSpin {
          0%, 100% {
            transform: rotateY(-18deg) rotateZ(-4deg);
          }
          50% {
            transform: rotateY(42deg) rotateZ(4deg);
          }
        }

        @keyframes currencyOrbit {
          0%, 100% {
            transform: translateY(0) rotate(-8deg);
          }
          50% {
            transform: translateY(-14px) rotate(8deg);
          }
        }
      `}</style>
    </div>
  );
}

function MoneyDrizzle() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      {moneyDrizzles.map((note) => (
        <span
          key={note.id}
          className="money-drizzle absolute top-[-6rem] grid h-10 w-14 place-items-center rounded-md border border-emerald-200/80 bg-[linear-gradient(135deg,rgba(245,252,250,0.96),rgba(214,242,232,0.92))] text-sm font-extrabold text-emerald-700 shadow-[0_12px_28px_rgba(15,124,130,0.16)]"
          style={{
            left: note.left,
            "--drizzle-delay": note.delay,
            "--drizzle-duration": note.duration,
            "--drizzle-rotate": note.rotate,
            "--drizzle-scale": note.scale,
          }}
        >
          {rupee}
        </span>
      ))}
      {drizzleSparkles.map((sparkle) => (
        <span
          key={sparkle.id}
          className="drizzle-sparkle absolute top-[-4rem] rounded-full bg-white/90 shadow-[0_0_14px_rgba(255,255,255,0.9)]"
          style={{
            left: sparkle.left,
            width: sparkle.size,
            height: sparkle.size,
            "--sparkle-drizzle-delay": sparkle.delay,
            "--sparkle-drizzle-duration": sparkle.duration,
          }}
        />
      ))}
    </div>
  );
}

function FinanceBackdrop() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_20%,rgba(15,124,130,0.2),transparent_30%),radial-gradient(circle_at_31%_80%,rgba(211,162,76,0.14),transparent_24%),radial-gradient(circle_at_84%_80%,rgba(0,48,105,0.1),transparent_30%)]" />
      <div className="absolute inset-0 opacity-35 [background-image:linear-gradient(rgba(15,124,130,0.08)_1px,transparent_1px),linear-gradient(90deg,rgba(15,124,130,0.07)_1px,transparent_1px)] [background-size:38px_38px]" />

      <div className="auth-visual absolute bottom-[clamp(7rem,18vh,12rem)] hidden h-[590px] w-[720px] opacity-[0.88] xl:left-[8vw] xl:block 2xl:left-[18vw]">
        <div className="absolute bottom-28 left-40 flex items-end gap-5">
          {[105, 145, 190, 245, 305, 372].map((height, index) => (
            <span
              key={height}
              className="relative w-10 rounded-t-[18px] border border-[#8ef3dd]/70 bg-[linear-gradient(180deg,rgba(28,224,178,0.94),rgba(15,124,130,0.82)_46%,rgba(0,83,154,0.76))] shadow-[0_0_24px_rgba(25,226,176,0.38),0_12px_28px_rgba(0,83,154,0.12)]"
              style={{ height: `${height}px`, opacity: 0.68 + index * 0.045 }}
            >
              <span className="absolute inset-x-2 top-3 h-10 rounded-full bg-white/20 blur-sm" />
            </span>
          ))}
        </div>

        <svg className="absolute bottom-36 left-[88px] h-[360px] w-[570px]" viewBox="0 0 620 380" aria-hidden="true">
          <defs>
            <linearGradient id="authArrowGradient" x1="78" x2="566" y1="300" y2="30" gradientUnits="userSpaceOnUse">
              <stop stopColor="#075f8f" stopOpacity="0.7" />
              <stop offset="0.48" stopColor="#0f9f80" stopOpacity="0.9" />
              <stop offset="1" stopColor="#d3a24c" stopOpacity="0.95" />
            </linearGradient>
          </defs>
          <path
            d="M54 300L158 205L254 230L356 126L438 146L570 34"
            fill="none"
            stroke="url(#authArrowGradient)"
            strokeLinecap="butt"
            strokeLinejoin="miter"
            strokeWidth="11"
          />
          <path
            d="M526 31H583V88"
            fill="none"
            stroke="#d3a24c"
            strokeLinecap="butt"
            strokeLinejoin="miter"
            strokeOpacity="0.95"
            strokeWidth="11"
          />
          <path
            d="M64 320C153 238 284 215 405 139"
            fill="none"
            stroke="#00539a"
            strokeDasharray="2 24"
            strokeLinecap="round"
            strokeOpacity="0.18"
            strokeWidth="5"
          />
        </svg>

        {[
          { id: "eur", symbol: "€", top: "110px", left: "174px", size: "82px", delay: "0s" },
          { id: "usd", symbol: "$", top: "42px", left: "330px", size: "72px", delay: "0.8s" },
          { id: "inr", symbol: rupee, top: "0px", left: "470px", size: "82px", delay: "1.5s" },
        ].map((coin) => (
          <div
            key={coin.id}
            className="currency-orbit absolute grid place-items-center rounded-full border border-[#13ceb0]/42 shadow-[0_0_30px_rgba(19,206,176,0.26)]"
            style={{
              top: coin.top,
              left: coin.left,
              height: coin.size,
              width: coin.size,
              "--orbit-delay": coin.delay,
            }}
          >
            <span className="absolute inset-[-10px] rounded-full border border-[#0f7c82]/24" />
            <span className="absolute inset-[-20px] rounded-full border border-[#d3a24c]/20" />
            <span className="grid h-[72%] w-[72%] place-items-center rounded-full border border-[#fff7bd]/80 bg-[radial-gradient(circle_at_32%_24%,#fff5a8,#d3a24c_54%,#714b05)] text-2xl font-black text-white shadow-[0_12px_22px_rgba(109,75,5,0.28),0_0_20px_rgba(211,162,76,0.2),inset_0_2px_8px_rgba(255,255,255,0.58)]">
              {coin.symbol}
            </span>
          </div>
        ))}

        <div className="absolute bottom-[72px] left-[472px] h-28 w-28 [perspective:700px]">
          <div className="standing-coin absolute inset-0 grid place-items-center rounded-full border-[5px] border-[#ffe994] bg-[radial-gradient(circle_at_32%_25%,#fff7b9,#d3a24c_54%,#8d5b06)] text-6xl font-black text-white shadow-[0_18px_28px_rgba(141,91,6,0.28),0_0_28px_rgba(15,124,130,0.26),inset_0_4px_12px_rgba(255,255,255,0.58)]">
            {rupee}
          </div>
          <span className="absolute bottom-[-10px] left-1/2 h-5 w-28 -translate-x-1/2 rounded-full bg-[#0f7c82]/18 blur-md" />
        </div>

      </div>
    </div>
  );
}

function ResetPasswordView({ authMessage, onBack, onSubmit, submitting }) {
  return (
    <div className="w-full">
      <div className="text-center">
        <h1 className="text-4xl font-extrabold tracking-[-0.04em] text-slate-950">
          Reset Password
        </h1>
        <p className="mx-auto mt-4 max-w-[360px] text-base font-semibold leading-6 text-slate-400">
          Enter your email or phone number to receive reset instructions.
        </p>
      </div>

      <form className="mt-10 space-y-6" onSubmit={onSubmit}>
        <Input
          icon={Mail}
          name="resetEmail"
          placeholder="Email or Phone Number"
          required
          type="text"
        />

        <button
          type="submit"
          disabled={submitting}
          className="w-full rounded-[14px] bg-[linear-gradient(90deg,#19c98f,#003069)] px-5 py-4 text-base font-extrabold text-white shadow-[0_18px_36px_rgba(0,48,105,0.18)] transition hover:translate-y-[-1px] hover:shadow-[0_22px_42px_rgba(0,48,105,0.24)] disabled:cursor-not-allowed disabled:opacity-70"
        >
          {submitting ? "Sending..." : "Send reset link"}
        </button>

        <button
          type="button"
          onClick={onBack}
          className="w-full rounded-[14px] border border-slate-200 bg-white px-5 py-4 text-base font-extrabold text-slate-700 shadow-[0_14px_30px_rgba(15,23,42,0.06)] transition hover:border-[#0f9f80]/30 hover:text-[#0f9f80]"
        >
          Back to login
        </button>
      </form>

      {authMessage && (
        <p className="mt-5 rounded-2xl border border-[#d7e4e9] bg-[#f7fbfc] px-4 py-3 text-sm font-semibold text-[#607684]">
          {authMessage}
        </p>
      )}
    </div>
  );
}

function Input({ action = null, icon: Icon, name, placeholder, required = false, type }) {
  return (
    <label className="flex h-14 items-center gap-3 rounded-[14px] border border-slate-200 bg-white px-4 shadow-[0_10px_24px_rgba(15,23,42,0.04)] transition-within focus-within:border-[#0f9f80] focus-within:ring-4 focus-within:ring-[#dff4ef]">
      <Icon className="h-5 w-5 shrink-0 text-slate-400" />
      <input
        type={type}
        name={name}
        placeholder={placeholder}
        required={required}
        className="min-w-0 flex-1 bg-transparent text-sm font-semibold text-slate-700 outline-none placeholder:text-slate-400"
      />
      {action}
    </label>
  );
}

function SocialButton({ label, onClick, provider }) {
  return (
    <button
      type="button"
      onClick={() => onClick(provider)}
      className="flex h-12 items-center justify-center gap-2 rounded-[12px] border border-slate-200 bg-white text-sm font-bold text-slate-600 shadow-[0_8px_18px_rgba(15,23,42,0.04)] transition hover:border-[#0f9f80]/30 hover:bg-[#f7fbfc] hover:text-slate-900"
    >
      {provider === "google" ? <GoogleIcon /> : <MicrosoftIcon />}
      {label}
    </button>
  );
}

function GoogleIcon() {
  return (
    <svg aria-hidden="true" className="h-5 w-5" viewBox="0 0 24 24">
      <path fill="#4285F4" d="M21.6 12.23c0-.82-.07-1.43-.22-2.07H12v3.76h5.5c-.11.93-.71 2.34-2.04 3.28l-.02.13 2.96 2.3.2.02c1.84-1.7 3-4.2 3-7.42Z" />
      <path fill="#34A853" d="M12 22c2.64 0 4.85-.87 6.47-2.35l-3.08-2.39c-.82.58-1.93.98-3.39.98-2.58 0-4.76-1.7-5.54-4.05l-.12.01-3.08 2.39-.04.11C4.83 19.85 8.14 22 12 22Z" />
      <path fill="#FBBC05" d="M6.46 14.19A6.16 6.16 0 0 1 6.13 12c0-.76.12-1.5.32-2.19l-.01-.14-3.12-2.42-.1.05A9.97 9.97 0 0 0 2.16 12c0 1.7.41 3.31 1.13 4.7l3.17-2.51Z" />
      <path fill="#EA4335" d="M12 5.76c1.83 0 3.07.79 3.77 1.45l2.76-2.7C16.84 2.93 14.64 2 12 2 8.14 2 4.83 4.15 3.22 7.3l3.23 2.51C7.24 7.46 9.42 5.76 12 5.76Z" />
    </svg>
  );
}

function MicrosoftIcon() {
  return (
    <svg aria-hidden="true" className="h-5 w-5" viewBox="0 0 24 24">
      <path fill="#F25022" d="M3 3h8.5v8.5H3V3Z" />
      <path fill="#7FBA00" d="M12.5 3H21v8.5h-8.5V3Z" />
      <path fill="#00A4EF" d="M3 12.5h8.5V21H3v-8.5Z" />
      <path fill="#FFB900" d="M12.5 12.5H21V21h-8.5v-8.5Z" />
    </svg>
  );
}
