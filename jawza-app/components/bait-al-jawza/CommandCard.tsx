"use client";
import { useState } from "react";
import { Scenario, CARD_COLORS } from "./mock-data";

export default function CommandCard({ scenario, onDone, onLater }: {
  scenario: Scenario;
  onDone: (id: number) => void;
  onLater: (id: number) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const [copied, setCopied] = useState(false);
  const [shaking, setShaking] = useState(false);
  const colors = CARD_COLORS[scenario.type];

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(scenario.readyText);
      setCopied(true);
      setShaking(true);
      setTimeout(() => setShaking(false), 400);
      setTimeout(() => setCopied(false), 3000);
    } catch {
      alert("تعذّر النسخ — انسخ النص يدوياً:\n\n" + scenario.readyText);
    }
  };

  return (
    <div style={{
      background: colors.bg,
      border: `1px solid ${colors.border}`,
      borderRadius: "12px",
      padding: "18px",
      marginBottom: "12px",
      direction: "rtl",
      animation: "slideInUp 0.3s ease forwards",
      transform: shaking ? "translateX(-4px)" : "none",
      transition: "transform 0.1s ease",
    }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "10px" }}>
        <div style={{ flex: 1 }}>
          <span style={{
            display: "inline-block", padding: "2px 8px", borderRadius: "20px",
            background: colors.badge, color: colors.badgeTxt,
            fontSize: "11px", fontWeight: 600, marginBottom: "6px",
          }}>{colors.label}</span>
          <h3 style={{ color: "#E8EDF5", fontSize: "15px", fontWeight: 700, margin: "0 0 4px" }}>{scenario.title}</h3>
          <p style={{ color: "#8FA3C0", fontSize: "12px", margin: 0 }}>{scenario.subtitle}</p>
        </div>
      </div>

      {/* Insight */}
      <div style={{
        background: "rgba(255,255,255,0.04)", borderRadius: "8px",
        padding: "10px 12px", marginBottom: "10px",
        borderRight: `3px solid ${colors.badgeTxt}`,
      }}>
        <p style={{ color: "#C8D8E8", fontSize: "13px", margin: 0, lineHeight: 1.6 }}>
          💡 {scenario.insight}
        </p>
      </div>

      {/* Action */}
      <p style={{ color: "#E8EDF5", fontSize: "13px", marginBottom: "12px", lineHeight: 1.6 }}>
        <strong style={{ color: colors.badgeTxt }}>الإجراء: </strong>{scenario.action}
      </p>

      {/* Ready Text Box */}
      <div style={{
        background: "rgba(0,0,0,0.3)", borderRadius: "8px",
        padding: "10px 12px", marginBottom: "12px",
        border: "1px solid rgba(255,255,255,0.08)",
      }}>
        <div style={{ color: "#8FA3C0", fontSize: "11px", marginBottom: "6px" }}>📋 النص الجاهز للإرسال:</div>
        <p style={{ color: "#C8D8E8", fontSize: "12px", margin: 0, lineHeight: 1.7, fontFamily: "monospace" }}>
          {scenario.readyText}
        </p>
      </div>

      {/* Why toggle */}
      <button
        onClick={() => setExpanded(!expanded)}
        style={{
          background: "none", border: "none", cursor: "pointer",
          color: "#8FA3C0", fontSize: "12px", padding: "0 0 8px",
          display: "flex", alignItems: "center", gap: "4px",
        }}
      >
        {expanded ? "▲" : "▼"} لماذا هذا القرار؟
      </button>

      {expanded && (
        <div style={{
          background: "rgba(255,255,255,0.03)", borderRadius: "8px",
          padding: "10px 12px", marginBottom: "12px",
        }}>
          <div style={{ marginBottom: "8px" }}>
            <span style={{ color: "#22C55E", fontSize: "12px" }}>✅ لو نفّذت: </span>
            <span style={{ color: "#8FA3C0", fontSize: "12px" }}>{scenario.ifDone}</span>
          </div>
          <div style={{ marginBottom: "8px" }}>
            <span style={{ color: "#EF4444", fontSize: "12px" }}>⏰ لو تأخرت: </span>
            <span style={{ color: "#8FA3C0", fontSize: "12px" }}>{scenario.ifDelayed}</span>
          </div>
          <div>
            <span style={{ color: "#C9963B", fontSize: "12px" }}>📊 لماذا: </span>
            <span style={{ color: "#8FA3C0", fontSize: "12px" }}>{scenario.why}</span>
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
        <button
          onClick={handleCopy}
          style={{
            flex: 1, padding: "10px 16px", borderRadius: "8px", cursor: "pointer",
            background: copied ? "rgba(34,197,94,0.2)" : `linear-gradient(135deg, ${colors.badgeTxt}, ${colors.badgeTxt}cc)`,
            border: `1px solid ${copied ? "#22C55E" : colors.badgeTxt}`,
            color: copied ? "#22C55E" : "#fff",
            fontSize: "13px", fontWeight: 600, transition: "all 0.2s",
            fontFamily: "'IBM Plex Sans Arabic', sans-serif",
          }}
        >
          {copied ? "✓ تم النسخ!" : "⚡ نسخ وتنفيذ"}
        </button>
        <button
          onClick={() => onDone(scenario.id)}
          style={{
            padding: "10px 14px", borderRadius: "8px", cursor: "pointer",
            background: "rgba(34,197,94,0.1)", border: "1px solid rgba(34,197,94,0.3)",
            color: "#22C55E", fontSize: "13px",
            fontFamily: "'IBM Plex Sans Arabic', sans-serif",
          }}
        >✅ نفّذت</button>
        <button
          onClick={() => onLater(scenario.id)}
          style={{
            padding: "10px 14px", borderRadius: "8px", cursor: "pointer",
            background: "rgba(148,163,184,0.08)", border: "1px solid rgba(148,163,184,0.2)",
            color: "#8FA3C0", fontSize: "13px",
            fontFamily: "'IBM Plex Sans Arabic', sans-serif",
          }}
        >💤 لاحقاً</button>
      </div>
    </div>
  );
}
