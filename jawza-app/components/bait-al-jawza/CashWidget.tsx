"use client";

export default function CashWidget() {
  const events = [
    { label: "الرواتب", days: 3, color: "#C9963B", progress: 90 },
    { label: "حساب المواطن", days: 15, color: "#3B82F6", progress: 50 },
    { label: "عيد الفطر", days: 12, color: "#22C55E", progress: 60 },
  ];

  return (
    <div style={{
      background: "rgba(201,150,59,0.06)", border: "1px solid rgba(201,150,59,0.2)",
      borderRadius: "12px", padding: "16px", marginBottom: "20px", direction: "rtl",
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "14px" }}>
        <span style={{ fontSize: "18px" }}>💰</span>
        <h3 style={{ color: "#C9963B", fontSize: "14px", fontWeight: 700, margin: 0 }}>عدّاد الكاش السعودي</h3>
      </div>
      <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
        {events.map((e) => (
          <div key={e.label} style={{
            flex: 1, minWidth: "120px",
            background: "rgba(0,0,0,0.2)", borderRadius: "8px", padding: "10px",
          }}>
            <div style={{ color: "#8FA3C0", fontSize: "11px", marginBottom: "4px" }}>{e.label}</div>
            <div style={{ color: e.color, fontSize: "22px", fontWeight: 700, fontFamily: "monospace" }}>{e.days}</div>
            <div style={{ color: "#8FA3C0", fontSize: "10px", marginBottom: "6px" }}>يوم</div>
            <div style={{ background: "rgba(255,255,255,0.08)", borderRadius: "4px", height: "4px" }}>
              <div style={{ width: `${e.progress}%`, height: "100%", background: e.color, borderRadius: "4px" }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
