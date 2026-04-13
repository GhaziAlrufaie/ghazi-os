"use client";

export default function Sidebar() {
  const navItems = [
    { icon: "⚡", label: "القيادة", active: false },
    { icon: "🏷️", label: "البراندات", active: false },
    { icon: "✅", label: "المهام", active: false },
    { icon: "📁", label: "المشاريع", active: false },
    { icon: "👥", label: "الفريق", active: false },
    { icon: "📅", label: "التقويم", active: false },
    { icon: "💰", label: "الحسابات", active: false },
    { icon: "📊", label: "التقارير", active: false },
    { icon: "🤖", label: "الجوزاء", active: true },
  ];

  return (
    <aside style={{
      position: "fixed", right: 0, top: 0, width: "220px", height: "100vh",
      background: "#111827", borderLeft: "1px solid rgba(255,255,255,0.06)",
      display: "flex", flexDirection: "column", zIndex: 100, direction: "rtl",
    }}>
      <div style={{ padding: "20px 16px 16px", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <div style={{ width: "32px", height: "32px", background: "linear-gradient(135deg, #C9A84C, #E8C97A)", borderRadius: "8px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "16px" }}>♊</div>
          <div>
            <div style={{ color: "#E8EDF5", fontSize: "14px", fontWeight: 700, lineHeight: 1.2 }}>Ghazi OS</div>
            <div style={{ color: "#4A6080", fontSize: "11px" }}>نظام الإدارة</div>
          </div>
        </div>
      </div>
      <nav style={{ flex: 1, padding: "8px 0", overflowY: "auto" }}>
        {navItems.map((item) => (
          <div key={item.label} style={{
            display: "flex", alignItems: "center", gap: "10px", padding: "10px 16px",
            margin: "1px 8px", borderRadius: "8px", cursor: "pointer",
            background: item.active ? "linear-gradient(135deg, rgba(201,150,59,0.15), rgba(201,150,59,0.08))" : "transparent",
            border: item.active ? "1px solid rgba(201,150,59,0.25)" : "1px solid transparent",
          }}>
            <span style={{ fontSize: "16px", opacity: item.active ? 1 : 0.7 }}>{item.icon}</span>
            <span style={{ fontSize: "13px", color: item.active ? "#C9963B" : "#8FA3C0", fontWeight: item.active ? 600 : 400 }}>{item.label}</span>
            {item.active && <div style={{ marginRight: "auto", width: "6px", height: "6px", borderRadius: "50%", background: "#C9963B" }} />}
          </div>
        ))}
      </nav>
      <div style={{ padding: "12px 16px", borderTop: "1px solid rgba(255,255,255,0.06)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <div style={{ width: "28px", height: "28px", borderRadius: "50%", background: "linear-gradient(135deg, #C9A84C, #8B6914)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "12px", color: "#fff", fontWeight: 700 }}>غ</div>
          <div>
            <div style={{ color: "#E8EDF5", fontSize: "12px", fontWeight: 600 }}>غازي الرفيعي</div>
            <div style={{ color: "#4A6080", fontSize: "10px" }}>المدير التنفيذي</div>
          </div>
        </div>
      </div>
    </aside>
  );
}
