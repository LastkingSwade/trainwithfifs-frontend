"use client";

import React, { useEffect, useRef, useState } from "react";
import { createRecoveryClient } from "@/Lib/supabase/recovery-client";
import {
  RESET_COOLDOWN_MS,
  RESET_PORTAL_HINT_KEY,
  establishRecoverySession,
  parseRecoveryParams,
  portalForReset,
  requestPasswordReset,
  submitNewPassword,
} from "@/Lib/auth/password-reset";

type Phase = "checking" | "ready" | "invalid" | "saving" | "unavailable";

const card: React.CSSProperties = {
  background: "#0d121a",
  border: "1px solid rgba(0, 229, 255, 0.25)",
  borderRadius: 12,
  padding: 24,
  maxWidth: 440,
  width: "100%",
  boxSizing: "border-box",
};
const label: React.CSSProperties = { display: "block", color: "#00e5ff", fontWeight: 700, fontSize: "0.85rem", margin: "14px 0 4px" };
const input: React.CSSProperties = {
  width: "100%", boxSizing: "border-box", padding: "10px 12px", borderRadius: 8,
  border: "1px solid rgba(255,255,255,0.18)", background: "#070b10", color: "#fff", fontSize: "1rem",
};
const button: React.CSSProperties = {
  width: "100%", marginTop: 18, padding: "12px", borderRadius: 8, border: "none",
  background: "linear-gradient(135deg, #38bdf8 0%, #0284c7 100%)", color: "#070b10", fontWeight: 800, fontSize: "1rem", cursor: "pointer",
};

function readPortalHint(): string | null {
  try { return window.localStorage.getItem(RESET_PORTAL_HINT_KEY); } catch { return null; }
}
function clearPortalHint() {
  try { window.localStorage.removeItem(RESET_PORTAL_HINT_KEY); } catch { /* storage unavailable */ }
}

export default function ResetPasswordPage() {
  const clientRef = useRef<ReturnType<typeof createRecoveryClient> | null>(null);
  const roleRef = useRef<string | undefined>(undefined);
  const [phase, setPhase] = useState<Phase>("checking");
  const [reason, setReason] = useState<"expired" | "invalid">("invalid");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [email, setEmail] = useState("");
  const [notice, setNotice] = useState("");
  const [cooldownUntil, setCooldownUntil] = useState(0);
  const [, tick] = useState(0);

  useEffect(() => {
    let client: ReturnType<typeof createRecoveryClient>;
    try {
      client = createRecoveryClient();
    } catch {
      setPhase("unavailable");
      return;
    }
    clientRef.current = client;

    // Capture the link parameters, then remove them from the address bar so tokens are not left in
    // the URL, browser history, or screenshots.
    const params = parseRecoveryParams(window.location.search, window.location.hash);
    if (params.kind !== "none") window.history.replaceState(null, "", window.location.pathname);

    let cancelled = false;
    const { data: sub } = client.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY" && !cancelled) setPhase((p) => (p === "checking" ? "ready" : p));
    });

    establishRecoverySession(client, params).then((outcome) => {
      if (cancelled) return;
      if (outcome.state === "ready") {
        roleRef.current = outcome.appRole;
        setPhase("ready");
      } else {
        setReason(outcome.reason);
        setPhase("invalid");
      }
    });

    return () => {
      cancelled = true;
      sub.subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (cooldownUntil <= Date.now()) return;
    const id = window.setInterval(() => {
      tick((n) => n + 1);
      if (Date.now() >= cooldownUntil) window.clearInterval(id);
    }, 1000);
    return () => window.clearInterval(id);
  }, [cooldownUntil]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const client = clientRef.current;
    if (!client || phase !== "ready") return;
    setError("");
    setPhase("saving");
    const result = await submitNewPassword(client, password, confirm);
    if (!result.ok) {
      setError(result.error);
      // An expired session cannot be fixed by retrying the form.
      setPhase(/expired|no longer valid/.test(result.error) ? "invalid" : "ready");
      if (/expired|no longer valid/.test(result.error)) setReason("expired");
      return;
    }
    setPassword("");
    setConfirm("");
    const portal = portalForReset(readPortalHint(), roleRef.current);
    clearPortalHint();
    window.location.assign(`/?password_reset=success&portal=${portal}`);
  }

  async function onRequestNew(e: React.FormEvent) {
    e.preventDefault();
    const client = clientRef.current;
    if (!client || Date.now() < cooldownUntil) return;
    const result = await requestPasswordReset(client, email, window.location.origin);
    setNotice(result.message);
    if (result.cooldown) setCooldownUntil(Date.now() + RESET_COOLDOWN_MS);
  }

  const secondsLeft = Math.max(0, Math.ceil((cooldownUntil - Date.now()) / 1000));

  return (
    <main style={{ minHeight: "100vh", background: "#070b10", color: "#e2e8f0", display: "flex", alignItems: "center", justifyContent: "center", padding: "24px 16px", fontFamily: "system-ui, sans-serif" }}>
      <div style={card}>
        <h1 style={{ margin: "0 0 6px", fontSize: "1.5rem", color: "#fff" }}>Train With FIFS</h1>

        {phase === "checking" && <p>Checking your reset link…</p>}

        {phase === "unavailable" && (
          <p role="alert">Password reset is not available right now. Please contact FIFS directly.</p>
        )}

        {(phase === "ready" || phase === "saving") && (
          <form onSubmit={onSubmit} noValidate>
            <p style={{ color: "#94a3b8", margin: "0 0 4px" }}>Set a new password for your account.</p>
            <label htmlFor="newPassword" style={label}>New password</label>
            <input id="newPassword" type="password" autoComplete="new-password" style={input} value={password} onChange={(e) => setPassword(e.target.value)} />
            <label htmlFor="confirmPassword" style={label}>Confirm new password</label>
            <input id="confirmPassword" type="password" autoComplete="new-password" style={input} value={confirm} onChange={(e) => setConfirm(e.target.value)} />
            <p style={{ color: "#94a3b8", fontSize: "0.8rem", margin: "8px 0 0" }}>Use at least 8 characters.</p>
            {error && <p role="alert" style={{ color: "#f87171", marginTop: 12 }}>{error}</p>}
            <button type="submit" style={{ ...button, opacity: phase === "saving" ? 0.6 : 1 }} disabled={phase === "saving"}>
              {phase === "saving" ? "Saving…" : "Save new password"}
            </button>
          </form>
        )}

        {phase === "invalid" && (
          <div>
            <p role="alert" style={{ color: "#f87171" }}>
              {reason === "expired"
                ? "This reset link has expired or was already used."
                : "This reset link is not valid."}
            </p>
            {error && <p role="alert" style={{ color: "#f87171" }}>{error}</p>}
            <p style={{ color: "#94a3b8" }}>Enter your email address and we will send you a new link.</p>
            <form onSubmit={onRequestNew} noValidate>
              <label htmlFor="resetEmail" style={label}>Email address</label>
              <input id="resetEmail" type="email" autoComplete="email" style={input} value={email} onChange={(e) => setEmail(e.target.value)} />
              <button type="submit" style={{ ...button, opacity: secondsLeft > 0 ? 0.6 : 1 }} disabled={secondsLeft > 0}>
                {secondsLeft > 0 ? `Please wait ${secondsLeft}s` : "Send me a new link"}
              </button>
            </form>
            {notice && <p role="status" style={{ color: "#a7f3d0", marginTop: 12 }}>{notice}</p>}
          </div>
        )}

        <p style={{ marginTop: 22, fontSize: "0.85rem" }}>
          <a href="/" style={{ color: "#00e5ff" }}>← Back to the site</a>
        </p>
      </div>
    </main>
  );
}
