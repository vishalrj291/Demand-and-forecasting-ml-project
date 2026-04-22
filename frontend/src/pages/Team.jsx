const TEAM = [
  {
    name: "Vishal Raj",
    role: "Lead ML Engineer",
    skills: "Model Architecture · Backend API · Data Pipeline",
    emoji: "🧠",
    gradient: "linear-gradient(135deg, #38bdf8, #4ade80)",
    tag: "Team Lead",
    initials: "VR",
  },
  {
    name: "Divyanshi",
    role: "Data Scientist",
    skills: "Feature Engineering · EDA · Model Evaluation",
    emoji: "📊",
    gradient: "linear-gradient(135deg, #a78bfa, #f472b6)",
    tag: "Data Science",
    initials: "DV",
  },
  {
    name: "Monty Gaurav",
    role: "Full-Stack Developer",
    skills: "React Frontend · UI/UX · API Integration",
    emoji: "⚙️",
    gradient: "linear-gradient(135deg, #fb923c, #f59e0b)",
    tag: "Frontend Dev",
    initials: "MG",
  },
  {
    name: "Dhruv",
    role: "ML Research & Testing",
    skills: "Model Validation · Inventory Logic · Documentation",
    emoji: "🔬",
    gradient: "linear-gradient(135deg, #4ade80, #22d3ee)",
    tag: "Research",
    initials: "DH",
  },
];

const TECHS = [
  { icon: "⚛️", name: "React 18" },
  { icon: "⚡", name: "Vite" },
  { icon: "🐍", name: "Python 3.11" },
  { icon: "🚀", name: "FastAPI" },
  { icon: "🤖", name: "Scikit-Learn" },
  { icon: "🐼", name: "Pandas" },
  { icon: "🔢", name: "NumPy" },
  { icon: "☁️", name: "Render" },
];

export default function Team() {
  return (
    <div className="page-shell" style={{ paddingTop: 68 }}>
      {/* HERO */}
      <div className="team-hero">
        <div style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "rgba(167,139,250,0.1)", border: "1px solid rgba(167,139,250,0.25)", borderRadius: 99, padding: "6px 16px", fontSize: "0.78rem", fontWeight: 600, color: "var(--accent-3)", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 20 }}>
          👥 The People Behind It
        </div>
        <h1 className="glitch" data-text="Meet Our Team" style={{ fontSize: "clamp(2.2rem,5vw,3.6rem)", fontWeight: 900, letterSpacing: "-0.03em", marginBottom: 16 }}>
          Meet Our Team
        </h1>
        <p style={{ color: "var(--muted)", maxWidth: 520, margin: "0 auto", lineHeight: 1.75, fontSize: "1.05rem" }}>
          A passionate group of AI/ML engineering students who built ForecastIQ as a collaborative final-year project, combining data science with real-world inventory management.
        </p>
      </div>

      {/* TEAM CARDS */}
      <div className="team-grid">
        {TEAM.map(member => (
          <div className="team-card" key={member.name}>
            <div className="team-card__avatar" style={{ background: member.gradient }}>
              {member.initials}
            </div>
            <div className="team-card__name">{member.name}</div>
            <div className="team-card__role">{member.role}</div>
            <div className="team-card__badge">{member.tag}</div>
            <p style={{ marginTop: 14, fontSize: "0.82rem", color: "var(--muted)", lineHeight: 1.6 }}>
              {member.skills}
            </p>
          </div>
        ))}
      </div>

      {/* TECH STACK */}
      <div className="tech-section">
        <div style={{ marginBottom: 12 }}>
          <div className="section__badge">🛠️ Tech Stack</div>
          <h2 className="section__title" style={{ marginTop: 8 }}>Built With Modern Tools</h2>
          <p className="section__sub">Production-grade technologies powering ForecastIQ end-to-end.</p>
        </div>
        <div className="tech-grid">
          {TECHS.map(t => (
            <div className="tech-pill" key={t.name}>
              <span className="tech-pill__icon">{t.icon}</span>
              {t.name}
            </div>
          ))}
        </div>
      </div>

      {/* PROJECT INFO */}
      <section className="section" style={{ paddingTop: 0 }}>
        <div style={{ background: "var(--panel)", border: "1px solid var(--line)", borderRadius: 28, padding: 40, backdropFilter: "blur(18px)" }}>
          <div className="section__badge" style={{ marginBottom: 16 }}>🎓 About the Project</div>
          <h2 style={{ fontSize: "1.6rem", fontWeight: 800, marginBottom: 16, letterSpacing: "-0.02em" }}>Second Year ML Project</h2>
          <p style={{ color: "var(--muted)", lineHeight: 1.8, maxWidth: 680, fontSize: "0.95rem" }}>
            ForecastIQ was developed as a capstone project to demonstrate practical applications of machine learning 
            in supply chain management. Using the Sample Superstore dataset (9,994 transactions), we trained a 
            Gradient Boosting model for demand forecasting and a classifier for stockout risk prediction — 
            then wrapped it all in a deployed FastAPI backend connected to this React frontend.
          </p>
          <div style={{ display: "flex", gap: 12, marginTop: 24, flexWrap: "wrap" }}>
            {["Gradient Boosting", "Random Forest", "EOQ Formula", "Reorder Point Logic", "CORS + FastAPI", "React Router"].map(tag => (
              <span key={tag} style={{ background: "rgba(56,189,248,0.1)", border: "1px solid rgba(56,189,248,0.2)", borderRadius: 99, padding: "5px 14px", fontSize: "0.8rem", fontWeight: 600, color: "var(--accent-2)" }}>{tag}</span>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
