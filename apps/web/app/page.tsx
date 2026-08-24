"use client";

import { useEffect, useState } from "react";
import { useRouter } from 'next/navigation';

const navItems = ["Platform", "Intelligence", "Security", "Resources"];

const customers = [
  "HOSTEL",
  "ACADEMICS",
  "ADMINISTRATION",
  "FINANCE",
  "INFRASTRUCTURE",
  "STUDENT SERVICES",
  "EXAMINATION",
  "TRANSPORT",
  "LIBRARY",
  "SECURITY",
  "HEALTH",
  "FACILITIES",
];

const securityCards = [
  {
    number: "01",
    title: "Role-based access",
    text: "Give every officer exactly the level of access required for their responsibilities.",
  },
  {
    number: "02",
    title: "PII protection",
    text: "Protect sensitive complainant information throughout the complete grievance lifecycle.",
  },
  {
    number: "03",
    title: "Complete audit trail",
    text: "Every assignment, escalation, override and resolution remains traceable.",
  },
  {
    number: "04",
    title: "Human approval",
    text: "Keep authorized officers in control of consequential AI-assisted decisions.",
  },
  {
    number: "05",
    title: "Data governance",
    text: "Institution-controlled policies determine access, retention and operational workflows.",
  },
  {
    number: "06",
    title: "Controlled AI",
    text: "AI operates inside a governed institutional workflow instead of making unchecked decisions.",
  },
];

const benchmarkData = {
  priority: [
    { label: "P1 · Critical", value: 94 },
    { label: "P2 · High", value: 78 },
    { label: "P3 · Medium", value: 56 },
    { label: "P4 · Low", value: 31 },
  ],
  impact: [
    { label: "High impact", value: 89 },
    { label: "Moderate impact", value: 63 },
    { label: "Low impact", value: 37 },
    { label: "Individual", value: 22 },
  ],
  sla: [
    { label: "Critical risk", value: 91 },
    { label: "Approaching", value: 73 },
    { label: "On track", value: 44 },
    { label: "Resolved", value: 19 },
  ],
};

function Arrow() {
  return <span className="arrow">↗</span>;
}

function Reveal({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.08 }
    );

    const element = document.querySelector(`[data-reveal="${className}"]`);

    if (element) observer.observe(element);

    return () => observer.disconnect();
  }, [className]);

  return (
    <div
      data-reveal={className}
      className={`reveal ${visible ? "visible" : ""} ${className}`}
    >
      {children}
    </div>
  );
}

export default function Home() {

  const [activeTab, setActiveTab] =
    useState<keyof typeof benchmarkData>("priority");

  const [query, setQuery] = useState(
    "Hostel Block A has had no water supply for three days."
  );

  const [analyzed, setAnalyzed] = useState(false);

  const [mobileMenu, setMobileMenu] = useState(false);

  const bars = benchmarkData[activeTab];

  const router = useRouter();
    const handleRedirect = () => {
    router.push('/signup');
    console.log("To Signup");
    
  };
  return (
    <main className="site">
      {/* NAVIGATION */}

      <header className="navbar">
        <a href="#" className="brand">
          <span className="brand-mark">
            <span />
            <span />
            <span />
          </span>

          <span>Resolve</span>
        </a>

        <nav className={`nav-links ${mobileMenu ? "mobile-open" : ""}`}>
          {navItems.map((item) => (
            <a
              href={`#${item.toLowerCase()}`}
              key={item}
              onClick={() => setMobileMenu(false)}
            >
              {item}
            </a>
          ))}

          <a href="#demo" className="nav-mobile-cta">
            Request a demo <Arrow />
          </a>
        </nav>

        <div className="nav-actions">
          <a href="#demo" className="nav-demo">
            Request a demo <Arrow />
          </a>

          <button
            className="menu-button"
            onClick={() => setMobileMenu(!mobileMenu)}
            aria-label="Toggle menu"
          >
            <span />
            <span />
          </button>
        </div>
      </header>

      {/* HERO */}

      <section className="hero">
        <div className="hero-grid" />

        <div className="hero-content">
          <Reveal className="hero-copy">
            <div className="eyebrow">
              <span className="eyebrow-dot" />
              AI-POWERED GRIEVANCE INTELLIGENCE
            </div>

            <h1>
              Turn every complaint
              <br />
              into <em>actionable intelligence.</em>
            </h1>

            <p className="hero-description">
              Understand what is happening across your institution, prioritize
              what matters most, and move every grievance toward resolution.
            </p>

            <div className="hero-buttons">
          <button
            type="button"
            className="giop-black-btn"
            style={{
              border: "none",
              color: "#fff",
              fontSize: 13.5,
              fontWeight: 600,
              padding: "10px 18px",
              borderRadius: 8,
              cursor: "pointer",
              background:"#3948e8"
            }}
            onClick={handleRedirect}
          >
            Sign up
          </button>

          <button
            type="button"
            className="giop-black-btn"
            style={{    
              border: "none",
              color: "#fff",
              fontSize: 13.5,
              fontWeight: 600,
              padding: "10px 18px",
              borderRadius: 8,
              cursor: "pointer",
              background:"#3948e8"
            }}
            onClick={handleRedirect}
          >
            Sign up
          </button>
            </div>
          </Reveal>

          <Reveal className="hero-console-wrap">
            <div className="hero-console">
              <div className="console-top">
                <div className="console-title">
                  <span className="live-dot" />
                  Complaint Intelligence
                </div>

                <span className="console-status">LIVE ANALYSIS</span>
              </div>

              <div className="console-body">
                <div className="console-input">
                  <textarea
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    aria-label="Complaint"
                  />

                  <button
                    onClick={() => setAnalyzed(true)}
                    className="analyze-button"
                  >
                    Analyze <Arrow />
                  </button>
                </div>

                <div className="analysis">
                  <div className="analysis-heading">
                    <span>AI ANALYSIS</span>
                    <span className="confidence">
                      {analyzed ? "98.4% CONFIDENCE" : "READY"}
                    </span>
                  </div>

                  <div className="analysis-grid">
                    <div>
                      <small>Category</small>
                      <strong>Infrastructure</strong>
                    </div>

                    <div>
                      <small>Department</small>
                      <strong>Estate / Maintenance</strong>
                    </div>

                    <div>
                      <small>Urgency</small>
                      <strong className="danger">HIGH</strong>
                    </div>

                    <div>
                      <small>Impact</small>
                      <strong>126 students</strong>
                    </div>

                    <div>
                      <small>Sentiment</small>
                      <strong>Distressed</strong>
                    </div>

                    <div>
                      <small>Duplicate cluster</small>
                      <strong>47 related</strong>
                    </div>
                  </div>

                  <div className="priority-result">
                    <div>
                      <small>PRIORITY</small>
                      <strong>P1</strong>
                    </div>

                    <div className="priority-reasons">
                      <span>3-day disruption</span>
                      <span>High student impact</span>
                      <span>Repeated complaints</span>
                      <span>SLA approaching</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="floating-card floating-one">
              <span>MASTER INCIDENT</span>
              <strong>#1042</strong>
              <small>47 complaints connected</small>
            </div>

            <div className="floating-card floating-two">
              <span>SLA RISK</span>
              <strong>89%</strong>
              <small>Escalation approaching</small>
            </div>
          </Reveal>
        </div>
      </section>

      {/* PLATFORM */}

      <section className="section platform" id="platform">
        <Reveal className="section-heading">
          <div>
            <span className="section-kicker">ONE INTELLIGENCE LAYER</span>

            <h2>
              Every way a complaint
              <br />
              reaches you.
            </h2>
          </div>

          <div className="section-heading-right">
            <p>
              From online complaints and official email to PDFs, scanned
              letters and structured forms, bring every grievance into one
              intelligent workflow.
            </p>

            <a href="#demo" className="arrow-link">
              Explore the platform <Arrow />
            </a>
          </div>
        </Reveal>

        <Reveal className="intake-grid">
          <article className="intake-card large">
            <div className="card-number">01</div>

            <div className="card-visual portal-visual">
              <div className="portal-window">
                <div className="portal-header">
                  <span />
                  <span />
                  <span />
                </div>

                <div className="portal-lines">
                  <i />
                  <i />
                  <i />
                  <i />
                </div>
              </div>
            </div>

            <div className="intake-card-bottom">
              <div>
                <h3>Student portal</h3>
                <p>Submit and track complaints directly.</p>
              </div>

              <Arrow />
            </div>
          </article>

          <article className="intake-card">
            <div className="card-number">02</div>

            <div className="mini-icon email-icon">
              <span />
            </div>

            <h3>Official email</h3>
            <p>
              Automatically extract, classify and route incoming grievances.
            </p>

            <Arrow />
          </article>

          <article className="intake-card">
            <div className="card-number">03</div>

            <div className="mini-icon document-icon">
              <span />
              <span />
              <span />
            </div>

            <h3>PDF & documents</h3>
            <p>
              Extract complaint information from structured and unstructured
              documents.
            </p>

            <Arrow />
          </article>

          <article className="intake-card">
            <div className="card-number">04</div>

            <div className="mini-icon scan-icon">
              <span />
            </div>

            <h3>Scanned letters</h3>
            <p>
              OCR converts physical submissions into actionable digital cases.
            </p>

            <Arrow />
          </article>
        </Reveal>
      </section>

      {/* INCIDENT ENGINE */}

      <section className="section incident-section">
        <Reveal className="split-heading">
          <span className="section-kicker">INCIDENT INTELLIGENCE</span>

          <h2>
            Don't just count complaints.
            <br />
            <em>Understand the incident.</em>
          </h2>

          <p>
            Multiple people can report the same underlying problem. Resolve
            connects semantically similar complaints and creates a Master
            Incident—giving administrators a real picture of institutional
            impact.
          </p>
        </Reveal>

        <Reveal className="incident-visual">
          <div className="complaint-stack">
            <div className="complaint-card">
              <span>COMPLAINT #821</span>
              <p>Water unavailable in Hostel Block A.</p>
              <small>Student · 09:12</small>
            </div>

            <div className="complaint-card">
              <span>COMPLAINT #834</span>
              <p>No water supply since yesterday evening.</p>
              <small>Student · 11:48</small>
            </div>

            <div className="complaint-card">
              <span>COMPLAINT #856</span>
              <p>Hostel Block A water problem continues.</p>
              <small>Student · 14:06</small>
            </div>
          </div>

          <div className="connection-line">
            <span />
            <span />
            <span />
          </div>

          <div className="master-incident">
            <div className="master-top">
              <span>MASTER INCIDENT</span>
              <span>#1042</span>
            </div>

            <div className="master-symbol">∞</div>

            <h3>Hostel Block A</h3>
            <p>Water Supply Failure</p>

            <div className="master-stats">
              <div>
                <strong>47</strong>
                <span>complaints</span>
              </div>

              <div>
                <strong>126</strong>
                <span>students affected</span>
              </div>

              <div>
                <strong>3d</strong>
                <span>unresolved</span>
              </div>
            </div>
          </div>
        </Reveal>
      </section>

      {/* BENCHMARKS */}

      <section className="benchmark-section" id="intelligence">
        <div className="benchmark-left">
          <span className="section-kicker light">PRIORITIZATION ENGINE</span>

          <h2>
            Prioritize by
            <br />
            <em>impact.</em>
          </h2>

          <p>
            Every complaint gets a reason. Every priority can be explained.
            The system continuously considers impact, recurrence, sentiment,
            unresolved duration and SLA pressure.
          </p>

          <div className="benchmark-tabs">
            {(Object.keys(benchmarkData) as Array<keyof typeof benchmarkData>).map(
              (tab) => (
                <button
                  key={tab}
                  className={activeTab === tab ? "active" : ""}
                  onClick={() => setActiveTab(tab)}
                >
                  {tab === "priority"
                    ? "Priority"
                    : tab === "impact"
                    ? "Impact"
                    : "SLA Risk"}
                </button>
              )
            )}
          </div>
        </div>

        <div className="benchmark-right">
          <div className="chart-header">
            <div>
              <span>INSTITUTIONAL SIGNAL</span>
              <h3>
                {activeTab === "priority"
                  ? "Priority distribution"
                  : activeTab === "impact"
                  ? "Affected population"
                  : "SLA pressure"}
              </h3>
            </div>

            <div className="chart-value">+24.8%</div>
          </div>

          <div className="chart">
            {bars.map((bar, index) => (
              <div className="chart-row" key={bar.label}>
                <div className="chart-label">{bar.label}</div>

                <div className="bar-track">
                  <div
                    className="bar"
                    style={{
                      width: `${bar.value}%`,
                      transitionDelay: `${index * 80}ms`,
                    }}
                  />
                </div>

                <div className="bar-number">{bar.value}</div>
              </div>
            ))}
          </div>

          <div className="chart-footer">
            <span>AI-generated institutional signal</span>
            <span>Live system data</span>
          </div>
        </div>
      </section>

      {/* PRIORITY EXPLANATION */}

      <section className="section explain-section">
        <Reveal className="section-heading">
          <div>
            <span className="section-kicker">EXPLAINABLE PRIORITY</span>

            <h2>
              Every priority
              <br />
              has a <em>reason.</em>
            </h2>
          </div>

          <div className="section-heading-right">
            <p>
              AI should not produce a mysterious number. Administrators can
              see exactly which signals contributed to a complaint's priority.
            </p>
          </div>
        </Reveal>

        <Reveal className="priority-board">
          <div className="priority-main">
            <div className="priority-board-top">
              <span>INCIDENT #1042</span>
              <span>AI ASSESSMENT</span>
            </div>

            <h3>Hostel Block A — Water Supply Failure</h3>

            <div className="priority-big">
              <small>PRIORITY</small>
              <strong>P1</strong>
              <span>Critical</span>
            </div>
          </div>

          <div className="reason-list">
            <div className="reason-item">
              <span>Affected students</span>
              <div>
                <i style={{ width: "90%" }} />
              </div>
              <strong>+35</strong>
            </div>

            <div className="reason-item">
              <span>Service disruption</span>
              <div>
                <i style={{ width: "75%" }} />
              </div>
              <strong>+25</strong>
            </div>

            <div className="reason-item">
              <span>Repeated complaints</span>
              <div>
                <i style={{ width: "62%" }} />
              </div>
              <strong>+20</strong>
            </div>

            <div className="reason-item">
              <span>SLA proximity</span>
              <div>
                <i style={{ width: "48%" }} />
              </div>
              <strong>+10</strong>
            </div>

            <div className="reason-total">
              <span>Total priority score</span>
              <strong>90 / 100</strong>
            </div>
          </div>
        </Reveal>
      </section>

      {/* SMART ROUTING */}

      <section className="section routing-section">
        <Reveal className="split-heading">
          <span className="section-kicker">SMART ROUTING</span>

          <h2>
            The right complaint.
            <br />
            <em>To the right department.</em>
          </h2>

          <p>
            AI classification turns unstructured grievances into clear,
            actionable workflows—without forcing administrators to manually
            sort every submission.
          </p>
        </Reveal>

        <Reveal className="routing-flow">
          <div className="routing-node input-node">
            <span>01</span>
            <strong>Complaint</strong>
            <small>Unstructured input</small>
          </div>

          <div className="flow-arrow">→</div>

          <div className="routing-node ai-node">
            <span>02</span>
            <strong>AI classification</strong>
            <small>Category · impact · urgency</small>
          </div>

          <div className="flow-arrow">→</div>

          <div className="routing-node destination-node">
            <span>03</span>
            <strong>Responsible team</strong>
            <small>Department · officer · SLA</small>
          </div>
        </Reveal>

        <Reveal className="department-grid">
          {[
            ["HOSTEL", "Maintenance", "Warden"],
            ["ACADEMIC", "Academic Section", "HOD"],
            ["FINANCE", "Accounts", "Scholarship Cell"],
            ["SAFETY", "Security", "Administration"],
          ].map(([title, first, second]) => (
            <div className="department-card" key={title}>
              <span>{title}</span>
              <strong>{first}</strong>
              <small>{second}</small>
              <Arrow />
            </div>
          ))}
        </Reveal>
      </section>

      {/* SLA */}

      <section className="sla-section">
        <Reveal className="sla-content">
          <div className="sla-copy">
            <span className="section-kicker light">SLA & ESCALATION</span>

            <h2>
              Never let an important
              <br />
              complaint <em>disappear.</em>
            </h2>

            <p>
              Monitor resolution commitments in real time. When an incident
              approaches its SLA threshold, automatically escalate it through
              the configured institutional hierarchy.
            </p>

            <a href="#demo" className="button button-light">
              Explore escalation <Arrow />
            </a>
          </div>

          <div className="sla-dashboard">
            <div className="sla-dashboard-top">
              <span>MASTER INCIDENT #1042</span>
              <span className="warning">ESCALATION RISK</span>
            </div>

            <h3>Hostel Water Supply</h3>

            <div className="sla-info">
              <div>
                <span>Priority</span>
                <strong>P1</strong>
              </div>

              <div>
                <span>Affected</span>
                <strong>126</strong>
              </div>

              <div>
                <span>Open for</span>
                <strong>68h</strong>
              </div>
            </div>

            <div className="sla-meter">
              <div className="sla-meter-label">
                <span>SLA CONSUMED</span>
                <strong>89%</strong>
              </div>

              <div className="sla-track">
                <i />
              </div>
            </div>

            <div className="escalation-line">
              <span>Current owner</span>
              <strong>Estate Department</strong>
            </div>

            <div className="escalation-line">
              <span>Next escalation</span>
              <strong>Dean / Administration →</strong>
            </div>
          </div>
        </Reveal>
      </section>

      {/* HUMAN IN LOOP */}

      <section className="section human-section">
        <Reveal className="section-heading">
          <div>
            <span className="section-kicker">HUMAN IN THE LOOP</span>

            <h2>
              AI where it helps.
              <br />
              Humans where it <em>matters.</em>
            </h2>
          </div>

          <div className="section-heading-right">
            <p>
              Uncertain classifications, duplicate merges and AI-generated
              responses remain reviewable by authorized officers.
            </p>
          </div>
        </Reveal>

        <Reveal className="human-grid">
          <div className="human-card">
            <span>01</span>
            <div className="human-icon">✦</div>
            <h3>AI analysis</h3>
            <p>
              Classification, extraction, sentiment, impact and similarity are
              handled automatically.
            </p>
          </div>

          <div className="human-card">
            <span>02</span>
            <div className="human-icon">◌</div>
            <h3>Human review</h3>
            <p>
              Officers can approve uncertain classifications, merges and
              actions before they become operational.
            </p>
          </div>

          <div className="human-card">
            <span>03</span>
            <div className="human-icon">↗</div>
            <h3>Audit trail</h3>
            <p>
              Every important action is recorded with the responsible user and
              timestamp.
            </p>
          </div>
        </Reveal>
      </section>

      {/* RESPONSE */}

      <section className="response-section">
        <Reveal className="response-content">
          <div className="response-copy">
            <span className="section-kicker">GROUNDED RESPONSE</span>

            <h2>
              Generate responses.
              <br />
              Keep the <em>decision</em> with the officer.
            </h2>

            <p>
              Create context-aware response drafts using the current incident,
              institutional policies and resolution status—then let an
              authorized officer review, edit and send.
            </p>
          </div>

          <div className="response-card">
            <div className="response-card-top">
              <span>AI DRAFT</span>
              <span>GROUNDED</span>
            </div>

            <p className="response-text">
              "We acknowledge the disruption in Hostel Block A. The issue has
              been assigned to the Estate Department and is currently being
              investigated. We will provide an update as soon as the next
              resolution milestone is reached."
            </p>

            <div className="response-sources">
              <span>Sources</span>
              <div>Maintenance policy</div>
              <div>Hostel grievance procedure</div>
              <div>Current incident status</div>
            </div>

            <div className="response-actions">
              <button>Review draft</button>
              <button>Edit</button>
              <button className="send">Send</button>
            </div>
          </div>
        </Reveal>
      </section>

      {/* ANALYTICS */}

      <section className="section analytics-section">
        <Reveal className="section-heading">
          <div>
            <span className="section-kicker">INSTITUTIONAL ANALYTICS</span>

            <h2>
              See what your
              <br />
              institution is <em>struggling with.</em>
            </h2>
          </div>

          <div className="section-heading-right">
            <p>
              Turn thousands of individual complaints into a clear picture of
              recurring problems, response performance and institutional risk.
            </p>
          </div>
        </Reveal>

        <Reveal className="analytics-dashboard">
          <div className="metric">
            <span>Total complaints</span>
            <strong>12,842</strong>
            <small>↑ 18.4% this month</small>
          </div>

          <div className="metric">
            <span>Master incidents</span>
            <strong>1,284</strong>
            <small>9.9% of total complaints</small>
          </div>

          <div className="metric">
            <span>Within SLA</span>
            <strong>87%</strong>
            <small>↑ 6.2% improvement</small>
          </div>

          <div className="metric">
            <span>Critical incidents</span>
            <strong>23</strong>
            <small>4 currently escalating</small>
          </div>

          <div className="analytics-chart">
            <div className="analytics-chart-head">
              <div>
                <span>COMPLAINTS BY CATEGORY</span>
                <h3>Institutional pressure</h3>
              </div>

              <span>LAST 30 DAYS</span>
            </div>

            {[
              ["Infrastructure", 88],
              ["Academic", 69],
              ["Hostel", 57],
              ["Finance", 43],
              ["Administration", 31],
            ].map(([label, value]) => (
              <div className="analytics-row" key={label}>
                <span>{label}</span>
                <div>
                  <i style={{ width: `${value}%` }} />
                </div>
                <strong>{value}</strong>
              </div>
            ))}
          </div>
        </Reveal>
      </section>

      {/* SECURITY */}

      <section className="security-section" id="security">
        <Reveal className="security-intro">
          <span className="section-kicker light">SECURITY & GOVERNANCE</span>

          <h2>
            Built for accountable
            <br />
            institutional <em>governance.</em>
          </h2>

          <p>
            A complaint system handles real people, real problems and
            sensitive information. Governance is part of the product—not an
            afterthought.
          </p>
        </Reveal>

        <Reveal className="security-grid">
          {securityCards.map((card) => (
            <article className="security-card" key={card.number}>
              <span>{card.number}</span>

              <div className="security-symbol">
                <i />
              </div>

              <h3>{card.title}</h3>
              <p>{card.text}</p>

              <Arrow />
            </article>
          ))}
        </Reveal>
      </section>

      {/* CUSTOMERS / DOMAINS */}

      <section className="section domains-section">
        <Reveal className="section-heading">
          <div>
            <span className="section-kicker">ONE PLATFORM</span>

            <h2>
              Designed around
              <br />
              <em>institutional reality.</em>
            </h2>
          </div>

          <div className="section-heading-right">
            <p>
              A single intelligence layer can serve the many departments,
              workflows and people involved in resolving institutional
              grievances.
            </p>
          </div>
        </Reveal>

        <Reveal className="domain-grid">
          {customers.map((customer, index) => (
            <div className="domain-cell" key={customer}>
              <span>{String(index + 1).padStart(2, "0")}</span>
              <strong>{customer}</strong>
              <Arrow />
            </div>
          ))}
        </Reveal>
      </section>

      {/* FINAL CTA */}

      <section className="final-section" id="demo">
        <div className="final-grid" />

        <Reveal className="final-content">
          <span className="section-kicker light">SIH 2026 · COMPLAINT INTELLIGENCE</span>

          <h2>
            Imagine an institution
            <br />
            where no important
            <br />
            complaint gets <em>lost.</em>
          </h2>

          <p>
            From the first submission to final resolution, transform scattered
            grievances into measurable institutional intelligence.
          </p>

          <div className="hero-buttons">
            <button className="button button-white">
              Explore the platform <Arrow />
            </button>

            <a href="#platform" className="final-link">
              Learn more <span>↓</span>
            </a>
          </div>
        </Reveal>
      </section>

      {/* FOOTER */}

      <footer className="footer">
        <div className="footer-top">
          <div className="footer-brand">
            <a href="#" className="brand footer-brand-logo">
              <span className="brand-mark">
                <span />
                <span />
                <span />
              </span>
              <span>Resolve</span>
            </a>

            <p>
              AI-powered grievance intelligence for faster resolution, smarter
              routing and accountable governance.
            </p>
          </div>

          <div className="footer-links">
            <div>
              <span>PRODUCT</span>
              <a href="#platform">Complaint Intelligence</a>
              <a href="#intelligence">Master Incidents</a>
              <a href="#intelligence">Prioritization</a>
              <a href="#intelligence">SLA & Escalation</a>
            </div>

            <div>
              <span>PLATFORM</span>
              <a href="#platform">Multi-modal Intake</a>
              <a href="#intelligence">AI Classification</a>
              <a href="#intelligence">Semantic Deduplication</a>
              <a href="#intelligence">Analytics</a>
            </div>

            <div>
              <span>GOVERNANCE</span>
              <a href="#security">Roles & Permissions</a>
              <a href="#security">Audit Logs</a>
              <a href="#security">Data Governance</a>
              <a href="#security">Human Review</a>
            </div>

            <div>
              <span>PROJECT</span>
              <a href="#demo">SIH 2026</a>
              <a href="#platform">Architecture</a>
              <a href="#intelligence">AI Methodology</a>
              <a href="#demo">Demo</a>
            </div>
          </div>
        </div>

        <div className="footer-bottom">
          <span>© 2026 Resolve · SIH 2026</span>

          <div>
            <a href="#">Privacy</a>
            <a href="#">Terms</a>
            <a href="#">GitHub ↗</a>
          </div>
        </div>
      </footer>
    </main>
  );
}