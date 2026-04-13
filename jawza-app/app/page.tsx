"use client";

import { useState } from "react";
import { SCENARIOS, CardType } from "@/components/bait-al-jawza/mock-data";
import CommandCard from "@/components/bait-al-jawza/CommandCard";
import CashWidget from "@/components/bait-al-jawza/CashWidget";

const FILTERS: { key: CardType | "all"; label: string }[] = [
  { key: "all", label: "الكل" },
  { key: "urgent", label: "عاجل" },
  { key: "opportunity", label: "فرصة" },
  { key: "planning", label: "تخطيط" },
  { key: "achievement", label: "إنجاز" },
  { key: "waiting", label: "انتظار" },
  { key: "warning", label: "تنبيه" },
];

export default function JawzaPage() {
  const [filter, setFilter] = useState<CardType | "all">("all");
  const [dismissed, setDismissed] = useState<number[]>([]);
  const [focusMode, setFocusMode] = useState(false);

  const visible = SCENARIOS.filter(
    (s) => !dismissed.includes(s.id) && (filter === "all" || s.type === filter)
  );
  const topPriority = SCENARIOS.find((s) => s.priority === "critical" && !dismissed.includes(s.id));

  const hour = new Date().getHours();
  const greeting = hour < 12 ? "صباح النور" : hour < 17 ? "مساء الخير" : "مساء النور";

  return (
    <>
      {focusMode && topPriority && (
        <div onClick={() => setFocusMode(false)} style={{
          position: "fixed", inset: 0, background: "rgba(0,0,0,0.92)",
          zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center", direction: "rtl",
        }}>
          <div onClick={(e) => e.stopPropagation()} style={{
            background: "#0D1B2A", border: "1px solid rgba(201,150,59,0.3)",
            borderRadius: "16px", padding: "32px", maxWidth: "560px", width: "90%",
          }}>
            <div style={{ textAlign: "center", marginBottom: "24px" }}>
              <div style={{ fontSize: "48px", marginBottom: "8px" }}>🎯</div>
              <h2 style={{ color: "#C9963B", fontSize: "20px", fontWeight: 700, margin: "0 0 4px" }}>وضع التركيز</h2>
              <p style={{ color: "#8FA3C0", fontSize: "13px", margin: 0 }}>أهم قرار يحتاج تنفيذك الآن</p>
            </div>
            <CommandCard scenario={topPriority}
              onDone={(id) => { setDismissed(d => [...d, id]); setFocusMode(false); }}
              onLater={(id) => { setDismissed(d => [...d, id]); setFocusMode(false); }} />
            <button onClick={() => setFocusMode(false)} style={{
              width: "100%", padding: "10px", background: "transparent",
              border: "1px solid rgba(255,255,255,0.1)", borderRadius: "8px",
              color: "#8FA3C0", cursor: "pointer", marginTop: "8px",
              fontFamily: "inherit",
            }}>إغلاق وضع التركيز</button>
          </div>
        </div>
      )}

      <div style={{ direction: "rtl", minHeight: "100vh", background: "#0a1628" }}>
        <div style={{
          background: "rgba(13,27,42,0.95)", borderBottom: "1px solid rgba(255,255,255,0.06)",
          padding: "16px 24px", position: "sticky", top: 0, zIndex: 50,
          display: "flex", justifyContent: "space-between", alignItems: "center",
        }}>
          <div>
            <h1 style={{ color: "#E8EDF5", fontSize: "18px", fontWeight: 700, margin: "0 0 2px" }}>
              {greeting}، غازي 👋
            </h1>
            <p style={{ color: "#4A6080", fontSize: "12px", margin: 0 }}>
              ١٥ شوال ١٤٤٦ · {visible.length} قرار ينتظرك
            </p>
          </div>
          <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
            <div style={{
              background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)",
              borderRadius: "8px", padding: "6px 12px", color: "#EF4444", fontSize: "12px", fontWeight: 600,
            }}>
              🔴 {SCENARIOS.filter(s => s.type === "urgent" && !dismissed.includes(s.id)).length} عاجل
            </div>
            <button onClick={() => setFocusMode(true)} style={{
              background: "linear-gradient(135deg, #C9963B, #E8C97A)",
              border: "none", borderRadius: "8px", padding: "8px 16px",
              color: "#0a1628", fontSize: "13px", fontWeight: 700, cursor: "pointer",
              fontFamily: "inherit",
            }}>🎯 وضع التركيز</button>
          </div>
        </div>

        <div style={{ padding: "24px", maxWidth: "800px" }}>
          <CashWidget />

          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "12px", marginBottom: "20px" }}>
            {[
              { label: "إجمالي القرارات", value: SCENARIOS.length, color: "#C9963B" },
              { label: "منجزة", value: dismissed.length, color: "#22C55E" },
              { label: "متبقية", value: SCENARIOS.length - dismissed.length, color: "#3B82F6" },
            ].map((stat) => (
              <div key={stat.label} style={{
                background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)",
                borderRadius: "10px", padding: "14px", textAlign: "center",
              }}>
                <div style={{ color: stat.color, fontSize: "24px", fontWeight: 700, fontFamily: "monospace" }}>{stat.value}</div>
                <div style={{ color: "#8FA3C0", fontSize: "11px", marginTop: "2px" }}>{stat.label}</div>
              </div>
            ))}
          </div>

          <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginBottom: "20px" }}>
            {FILTERS.map((f) => (
              <button key={f.key} onClick={() => setFilter(f.key)} style={{
                padding: "6px 14px", borderRadius: "20px", cursor: "pointer",
                background: filter === f.key ? "rgba(201,150,59,0.2)" : "rgba(255,255,255,0.04)",
                border: `1px solid ${filter === f.key ? "rgba(201,150,59,0.5)" : "rgba(255,255,255,0.08)"}`,
                color: filter === f.key ? "#C9963B" : "#8FA3C0",
                fontSize: "12px", fontWeight: filter === f.key ? 600 : 400,
                fontFamily: "inherit",
              }}>{f.label}</button>
            ))}
          </div>

          {visible.length === 0 ? (
            <div style={{ textAlign: "center", padding: "60px 20px", color: "#4A6080", fontSize: "14px" }}>
              <div style={{ fontSize: "48px", marginBottom: "12px" }}>🎉</div>
              <p>أنجزت كل القرارات في هذا التصنيف!</p>
            </div>
          ) : (
            visible.map((scenario) => (
              <CommandCard key={scenario.id} scenario={scenario}
                onDone={(id) => setDismissed(d => [...d, id])}
                onLater={(id) => setDismissed(d => [...d, id])} />
            ))
          )}
        </div>
      </div>
    </>
  );
}
