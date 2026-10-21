"use client";

import React, { useEffect, useMemo, useState } from "react";

// The page behind the "Pay my invoice" button in the emailed invoice. The link is signed and lasts 7 days. The amounts come from the server: this page only
// chooses how much of the invoice to pay now (30% to 100%) and sends the person to Stripe's secure checkout. Nothing is stored in this browser.
type Info = { invoiceNumber: string; course: string; classDate: string; price: number; tax: number; total: number; paid: number; balance: number; state: "open" | "balance" | "paid" | "closed"; minPercent: number };
const usd = (n: number) => `$${n.toFixed(2)}`;

const page: React.CSSProperties = { minHeight: "100dvh", display: "flex", alignItems: "center", justifyContent: "center", padding: 16, background: "#070b10", color: "#e6edf5" };
const card: React.CSSProperties = { background: "#0d121a", border: "1px solid rgba(0,229,255,0.3)", borderRadius: 16, padding: 24, maxWidth: 480, width: "100%", boxSizing: "border-box", boxShadow: "0 12px 40px rgba(0,0,0,0.6)" };
const rowStyle: React.CSSProperties = { display: "flex", justifyContent: "space-between", padding: "6px 0", fontSize: "0.98rem" };
const button: React.CSSProperties = { width: "100%", minHeight: 48, marginTop: 16, borderRadius: 10, border: "none", background: "linear-gradient(135deg, #ffb703 0%, #fb8500 100%)", color: "#111", fontWeight: 800, fontSize: "1.05rem", cursor: "pointer" };

const safeCheckoutUrl = (u: unknown): string | null => { try { const x = new URL(String(u)); return x.protocol === "https:" && x.hostname === "checkout.stripe.com" ? x.toString() : null; } catch { return null; } };

async function call(action: string, payload: Record<string, unknown>) {
  const res = await fetch("/api/fifs", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action, payload }) });
  const data = await res.json().catch(() => ({}));
  if (!res.ok || !data?.success) throw new Error(data?.error || "Something went wrong. Please try again or call 443-990-1304.");
  return data;
}

export default function PayInvoicePage() {
  const [q, setQ] = useState<{ i: string; t: string; n: string } | null>(null);
  const [info, setInfo] = useState<Info | null>(null);
  const [error, setError] = useState("");
  const [percent, setPercent] = useState(30);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const p = new URLSearchParams(window.location.search);
    const v = { i: p.get("i") || "", t: p.get("t") || "", n: p.get("n") || "" };
    setQ(v);
    if (!v.i || !v.t) { setError("This invoice link is not complete. Please open the button in your email again."); return; }
    call("invoicePayInfo", { invoice: v.i, token: v.t, name: v.n }).then((d) => setInfo(d.info)).catch((e) => setError(e.message));
  }, []);

  const now = useMemo(() => (info ? Math.round((Math.round(info.total * 100) * percent) / 100) / 100 : 0), [info, percent]);
  const payNow = info?.state === "balance" ? info.balance : percent >= 100 && info ? info.total : now;

  async function pay() {
    if (!q || !info) return;
    setBusy(true); setError("");
    try { const d = await call("invoicePayCheckout", { invoice: q.i, token: q.t, name: q.n, percent }); const url = safeCheckoutUrl(d.url); if (!url) throw new Error("We could not open secure checkout. Please try again or call 443-990-1304."); window.location.href = url; }
    catch (e: any) { setError(e.message); setBusy(false); }
  }

  return (
    <main style={page}>
      <div style={card}>
        <div style={{ color: "#00e5ff", fontWeight: 800, letterSpacing: "0.08em", fontSize: "0.8rem" }}>🧾 TRAIN WITH FIFS · INVOICE</div>
        {!info && !error && <p style={{ marginTop: 16 }}>Loading your invoice…</p>}
        {error && <p role="alert" style={{ marginTop: 16, color: "#ff8a8a", fontWeight: 700 }}>⚠️ {error}</p>}
        {info && (
          <>
            <h1 style={{ fontSize: "1.35rem", margin: "10px 0 2px", color: "#fff" }}>{info.course}</h1>
            <p style={{ margin: "0 0 12px", color: "#ffb703", fontWeight: 700 }}>📅 {info.classDate}</p>
            <div style={rowStyle}><span>Agreed price</span><span>{usd(info.price)}</span></div>
            <div style={rowStyle}><span>Maryland sales tax (6%)</span><span>{usd(info.tax)}</span></div>
            <div style={{ ...rowStyle, borderTop: "1px solid rgba(255,255,255,0.15)", fontWeight: 800, color: "#fff" }}><span>Total, due on receipt</span><span>{usd(info.total)}</span></div>
            {info.state === "paid" && <p style={{ color: "#34d399", fontWeight: 800, marginTop: 14 }}>✅ This invoice is paid in full. Thank you!</p>}
            {info.state === "closed" && <p style={{ color: "#ff8a8a", fontWeight: 700, marginTop: 14 }}>This invoice can't be paid online. Please call 443-990-1304.</p>}
            {info.state === "balance" && (
              <>
                <p style={{ marginTop: 14 }}>✅ Paid so far: <strong>{usd(info.paid)}</strong>. Remaining balance: <strong style={{ color: "#ffb703" }}>{usd(info.balance)}</strong></p>
                <button type="button" style={button} disabled={busy} onClick={pay}>{busy ? "Opening secure checkout…" : `💳 Pay remaining ${usd(info.balance)}`}</button>
              </>
            )}
            {info.state === "open" && (
              <>
                <label htmlFor="pay-percent" style={{ display: "block", marginTop: 16, fontWeight: 700, color: "#00e5ff" }}>How much do you want to pay now? <span style={{ color: "#fff" }}>{percent}% · {usd(payNow)}</span></label>
                <input id="pay-percent" type="range" min={info.minPercent} max={100} step={1} value={percent} onChange={(e) => setPercent(Number(e.target.value))} style={{ width: "100%", height: 44, accentColor: "#ffb703" }} aria-valuetext={`${percent} percent, ${usd(payNow)}`} />
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.82rem", color: "#9fb3c8" }}><span>{info.minPercent}% minimum</span><span>100% pay in full</span></div>
                <p style={{ fontSize: "0.88rem", color: "#9fb3c8", margin: "10px 0 0" }}>{percent >= 100 ? "Nothing more is owed after this payment." : `The remaining ${usd(info.total - payNow)} is due at class.`}</p>
                <button type="button" style={button} disabled={busy} onClick={pay}>{busy ? "Opening secure checkout…" : `💳 Pay ${usd(payNow)} securely`}</button>
              </>
            )}
            <p style={{ fontSize: "0.8rem", color: "#7b8da0", marginTop: 14 }}>Payments are handled by Stripe. Questions? Call 443-990-1304.</p>
          </>
        )}
      </div>
    </main>
  );
}
