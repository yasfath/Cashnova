import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { hasAuthenticatedSession } from "../utils/auth";
import { completeSocialAuthFromParams } from "../utils/socialAuth";

export default function SocialAuthCallback() {
  const navigate = useNavigate();

  useEffect(() => {
    const finishSocialLogin = () => {
      sessionStorage.removeItem("cashnova_social_provider");
      window.location.replace("/");
    };

    const params = new URLSearchParams(window.location.search);
    const error = params.get("error");

    if (error) {
      sessionStorage.setItem("cashnova_auth_message", error);
      navigate("/auth", { replace: true });
      return;
    }

    try {
      const pendingProvider = sessionStorage.getItem("cashnova_social_provider") || "";

      if (!params.get("payload") && params.get("code") && pendingProvider) {
        const baseURL =
          import.meta.env.VITE_API_URL?.trim() || "http://127.0.0.1:8001/api";
        const callbackUrl = new URL(
          `${baseURL.replace(/\/$/, "")}/auth/${pendingProvider}/callback/`
        );
        callbackUrl.search = window.location.search;
        window.location.href = callbackUrl.toString();
        return;
      }

      if (!params.get("payload") && hasAuthenticatedSession()) {
        finishSocialLogin();
        return;
      }

      if (!completeSocialAuthFromParams(params)) {
        sessionStorage.removeItem("cashnova_auth_message");
        navigate("/auth", { replace: true });
        return;
      }

      finishSocialLogin();
    } catch (callbackError) {
      sessionStorage.setItem(
        "cashnova_auth_message",
        callbackError.message || "Could not complete social login."
      );
      navigate("/auth", { replace: true });
    }
  }, [navigate]);

  return null;
}
