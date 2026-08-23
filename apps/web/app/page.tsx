"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import {
  ArrowRight,
  Bot,
  Briefcase,
  Building2,
  GraduationCap,
  HeartPulse,
  Landmark,
  Library,
  Search,
  ShieldCheck,
  Trophy,
  Wifi,
  X,
} from "lucide-react";

import { useRouter } from 'next/navigation';

/* =========================================================
   CONSTANTS
========================================================= */

const C = {
  ink: "#0B0D14",
  gray: "#6B7280",
  grayLight: "#9AA1B0",
  hairline: "#E7E8EC",
  panel: "#F6F7F9",
  blue: "#1A2FE0",
  blueDeep: "#121FB0",
  bannerBg: "#EAF0FF",
  bannerText: "#1A2FE0",
  amber: "#FDB358",
  green: "#1D9E75",
  red: "#D85A30",
} as const;

/* =========================================================
   DATA
========================================================= */

type Tile = {
  top: string;
  left?: string;
  right?: string;
  w: number;
  h: number;
  grad?: string;
  kind?: "mono" | "mono2" | "code";
  side: "left" | "right";
};

const TILES: Tile[] = [
  {
    top: "4%",
    left: "1%",
    w: 92,
    h: 92,
    grad: "linear-gradient(135deg,#1A2FE0,#4A5CFF)",
    side: "left",
  },
  {
    top: "1%",
    left: "10%",
    w: 62,
    h: 62,
    kind: "mono",
    side: "left",
  },
  {
    top: "22%",
    left: "2%",
    w: 74,
    h: 74,
    grad: "linear-gradient(160deg,#0B0D14,#2A2E3B)",
    side: "left",
  },
  {
    top: "34%",
    left: "13%",
    w: 96,
    h: 130,
    grad: "linear-gradient(200deg,#BFD4FF,#7C93F0)",
    side: "left",
  },
  {
    top: "56%",
    left: "3%",
    w: 84,
    h: 84,
    grad: "linear-gradient(200deg,#FDB358,#F0997B)",
    side: "left",
  },
  {
    top: "68%",
    left: "14%",
    w: 68,
    h: 68,
    kind: "mono2",
    side: "left",
  },
  {
    top: "3%",
    right: "1%",
    w: 88,
    h: 88,
    grad: "linear-gradient(135deg,#BFD4FF,#1A2FE0)",
    side: "right",
  },
  {
    top: "18%",
    right: "11%",
    w: 60,
    h: 60,
    kind: "code",
    side: "right",
  },
  {
    top: "31%",
    right: "1%",
    w: 78,
    h: 100,
    grad: "linear-gradient(160deg,#7C93F0,#1A2FE0)",
    side: "right",
  },
  {
    top: "52%",
    right: "10%",
    w: 92,
    h: 92,
    grad: "linear-gradient(200deg,#0B0D14,#3A3F52)",
    side: "right",
  },
  {
    top: "68%",
    right: "0%",
    w: 70,
    h: 70,
    grad: "linear-gradient(200deg,#FDB358,#D85A30)",
    side: "right",
  },
];

const DEPARTMENTS = [
  { icon: Building2, name: "Hostel Admin" },
  { icon: GraduationCap, name: "Academics / HOD" },
  { icon: Landmark, name: "Exam Cell" },
  { icon: Briefcase, name: "Placement Cell" },
  { icon: Library, name: "Library" },
  { icon: HeartPulse, name: "Health Center" },
  { icon: Wifi, name: "IT Services" },
  { icon: Trophy, name: "Sports Dept" },
  { icon: ShieldCheck, name: "Security" },
  { icon: Building2, name: "Admin Office" },
];

/* =========================================================
   REVEAL HOOK
========================================================= */

function useReveal() {
  const ref = useRef<HTMLDivElement | null>(null);
  const [shown, setShown] = useState(false);

  useEffect(() => {
    const element = ref.current;

    if (!element) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setShown(true);
          observer.disconnect();
        }
      },
      {
        threshold: 0.15,
      }
    );

    observer.observe(element);

    return () => observer.disconnect();
  }, []);

  return [ref, shown] as const;
}

/* =========================================================
   REVEAL COMPONENT
========================================================= */

interface RevealProps {
  children: ReactNode;
  delay?: number;
}

function Reveal({ children, delay = 0 }: RevealProps) {
  const [ref, shown] = useReveal();

  return (
    <div
      ref={ref}
      style={{
        opacity: shown ? 1 : 0,
        transform: shown ? "translateY(0)" : "translateY(18px)",
        transition: `opacity 650ms cubic-bezier(.16,1,.3,1) ${delay}ms,
          transform 650ms cubic-bezier(.16,1,.3,1) ${delay}ms`,
      }}
    >
      {children}
    </div>
  );
}

/* =========================================================
   FLOATING COLLAGE
========================================================= */

function FloatingCollage() {
  return (
    <div
      className="giop-collage"
      style={{
        position: "absolute",
        inset: 0,
        pointerEvents: "none",
      }}
    >
      {TILES.map((tile, index) => (
        <div
          key={index}
          style={{
            position: "absolute",
            top: tile.top,
            left: tile.left,
            right: tile.right,
            width: tile.w,
            height: tile.h,
            borderRadius: 10,
            background: tile.grad || "#fff",
            border: tile.kind
              ? `1px solid ${C.hairline}`
              : "none",
            boxShadow: "0 8px 24px -8px rgba(11,13,20,0.18)",
            overflow: "hidden",
            padding: tile.kind ? 8 : 0,
          }}
        >
          {tile.kind === "mono" && (
            <div>
              <div
                style={{
                  fontSize: 9,
                  color: C.grayLight,
                  marginBottom: 4,
                }}
              >
                Priority
              </div>

              <div
                style={{
                  fontSize: 16,
                  fontWeight: 700,
                  color: C.ink,
                }}
              >
                High
              </div>
            </div>
          )}

          {tile.kind === "mono2" && (
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 4,
              }}
            >
              <div
                style={{
                  height: 4,
                  width: "80%",
                  background: C.hairline,
                  borderRadius: 2,
                }}
              />

              <div
                style={{
                  height: 4,
                  width: "60%",
                  background: C.hairline,
                  borderRadius: 2,
                }}
              />

              <div
                style={{
                  height: 4,
                  width: "70%",
                  background: C.blue,
                  borderRadius: 2,
                }}
              />
            </div>
          )}

          {tile.kind === "code" && (
            <div
              style={{
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: 7.5,
                color: C.gray,
                lineHeight: 1.5,
              }}
            >
              <div>route: &quot;hostel&quot;</div>

              <div style={{ color: C.blue }}>
                sla: 24h
              </div>

              <div>status: open</div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

/* =========================================================
   AI PANEL
========================================================= */

function AIPanel() {
  const [tab, setTab] = useState<"search" | "agent">("search");

  return (
    <div
      style={{
        maxWidth: 860,
        margin: "0 auto",
        background: "#fff",
        border: `1px solid ${C.hairline}`,
        borderRadius: 16,
        boxShadow: "0 24px 60px -20px rgba(11,13,20,0.2)",
        padding: "22px 24px",
        position: "relative",
        zIndex: 2,
      }}
    >
      <div
        style={{
          fontSize: 13,
          color: C.gray,
          marginBottom: 12,
        }}
      >
        Hostel water supply — Block A
      </div>

      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          marginBottom: 20,
        }}
      >
        <button
          type="button"
          onClick={() => setTab("search")}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            fontSize: 13,
            fontWeight: 600,
            padding: "8px 14px",
            borderRadius: 9,
            border: `1px solid ${
              tab === "search" ? C.ink : C.hairline
            }`,
            background: tab === "search" ? "#fff" : "transparent",
            color: C.ink,
            cursor: "pointer",
          }}
        >
          <Search size={14} />
          Classify
        </button>

        <button
          type="button"
          onClick={() => setTab("agent")}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            fontSize: 13,
            fontWeight: 600,
            padding: "8px 14px",
            borderRadius: 9,
            border: `1px solid ${
              tab === "agent" ? C.blue : C.hairline
            }`,
            background:
              tab === "agent" ? C.bannerBg : "transparent",
            color: tab === "agent" ? C.blue : C.ink,
            cursor: "pointer",
          }}
        >
          <Bot size={14} />
          Route
        </button>

        <div style={{ flex: 1 }} />

        <div
          style={{
            fontSize: 11.5,
            fontFamily: "'JetBrains Mono', monospace",
            color: C.green,
            background: "#E1F5EE",
            padding: "4px 10px",
            borderRadius: 7,
          }}
        >
          confidence 96%
        </div>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "220px 1fr",
          gap: 20,
        }}
      >
        <div>
          <div
            style={{
              fontSize: 10.5,
              color: C.grayLight,
              letterSpacing: "0.06em",
              marginBottom: 10,
            }}
          >
            CATEGORY
          </div>

          {[
            "Hostel",
            "Exam Cell",
            "Academics",
            "Admin",
            "IT Services",
            "Library",
          ].map((category) => (
            <div
              key={category}
              style={{
                fontSize: 12.5,
                padding: "6px 10px",
                borderRadius: 7,
                marginBottom: 4,
                color:
                  category === "Hostel" ? "#fff" : C.gray,
                background:
                  category === "Hostel"
                    ? C.ink
                    : "transparent",
                fontWeight:
                  category === "Hostel" ? 600 : 400,
              }}
            >
              {category}
            </div>
          ))}
        </div>

        <div>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              marginBottom: 10,
            }}
          >
            <div
              style={{
                fontSize: 10.5,
                color: C.grayLight,
                letterSpacing: "0.06em",
              }}
            >
              RESULT
            </div>
          </div>

          {[
            {
              t: "Priority: High",
              d: "3 related reports · affects 40+ students",
            },
            {
              t: "Routed to: Hostel Administration",
              d: "Auto-assigned, SLA 24h",
            },
            {
              t: "Related complaint found",
              d: "Block A water outage, reported 6h ago",
            },
          ].map((result) => (
            <div
              key={result.t}
              style={{
                padding: "10px 0",
                borderBottom: `1px solid ${C.hairline}`,
              }}
            >
              <div
                style={{
                  fontSize: 13,
                  fontWeight: 600,
                  color: C.ink,
                }}
              >
                {result.t}
              </div>

              <div
                style={{
                  fontSize: 12,
                  color: C.gray,
                }}
              >
                {result.d}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* =========================================================
   BENCHMARK CHART
========================================================= */

function BenchChart() {
  const groups = [
    {
      label: "Routing accuracy",
      giop: 95,
      generic: 44,
      manual: 22,
    },
    {
      label: "Duplicate catch",
      giop: 88,
      generic: 30,
      manual: 8,
    },
    {
      label: "SLA compliance",
      giop: 90,
      generic: 52,
      manual: 19,
    },
  ];

  const max = 100;

  return (
    <div style={{ position: "relative" }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 16,
          marginBottom: 18,
          fontSize: 12.5,
          color: "#C7CBE0",
          flexWrap: "wrap",
        }}
      >
        <span
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
          }}
        >
          <span
            style={{
              width: 10,
              height: 10,
              borderRadius: 3,
              background: C.blue,
            }}
          />
          GIOP
        </span>

        <span
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
          }}
        >
          <span
            style={{
              width: 10,
              height: 10,
              borderRadius: 3,
              background: "#565D72",
            }}
          />
          Generic helpdesk
        </span>

        <span
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
          }}
        >
          <span
            style={{
              width: 10,
              height: 10,
              borderRadius: 3,
              background: "#8A5B45",
            }}
          />
          Manual / email
        </span>
      </div>

      <div
        style={{
          display: "flex",
          alignItems: "flex-end",
          justifyContent: "space-between",
          gap: 20,
          height: 300,
          borderBottom: "1px solid #2A2E3B",
          overflowX: "auto",
        }}
      >
        {groups.map((group) => (
          <div
            key={group.label}
            style={{
              display: "flex",
              alignItems: "flex-end",
              gap: 8,
              minWidth: 150,
              justifyContent: "center",
              height: "100%",
            }}
          >
            {[
              { value: group.giop, color: C.blue },
              { value: group.generic, color: "#565D72" },
              { value: group.manual, color: "#8A5B45" },
            ].map((bar, index) => (
              <div
                key={index}
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  width: 34,
                }}
              >
                <div
                  style={{
                    fontSize: 11.5,
                    color: "#D8DAE8",
                    marginBottom: 6,
                    fontFamily:
                      "'JetBrains Mono', monospace",
                  }}
                >
                  {bar.value}%
                </div>

                <div
                  style={{
                    width: 34,
                    height: `${(bar.value / max) * 250}px`,
                    background: bar.color,
                    borderRadius: "4px 4px 0 0",
                  }}
                />
              </div>
            ))}
          </div>
        ))}
      </div>

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          gap: 20,
          marginTop: 12,
          overflowX: "auto",
        }}
      >
        {groups.map((group) => (
          <div
            key={group.label}
            style={{
              minWidth: 150,
              textAlign: "center",
              fontSize: 12,
              color: "#9AA1B4",
            }}
          >
            {group.label}
          </div>
        ))}
      </div>
    </div>
  );
}

/* =========================================================
   HOME PAGE
========================================================= */

export default function HomePage() {
  const [bannerOpen, setBannerOpen] = useState(true);
  const [tab, setTab] = useState<
    "accuracy" | "latency" | "coverage"
  >("accuracy");

  const router = useRouter();

  const handleRedirect = () => {
    router.push('/Signup');
    console.log("To Signup");
    
  };

  return (
    <main
      style={{
        background: "#fff",
        color: C.ink,
        minHeight: "100vh",
        fontFamily: "'Manrope', sans-serif",
      }}
    >
      {/* =====================================================
          ANNOUNCEMENT BAR
      ===================================================== */}

      {bannerOpen && (
        <div
          style={{
            background: C.bannerBg,
            color: C.bannerText,
            fontSize: 13.5,
            padding: "10px 20px",
            textAlign: "center",
            position: "relative",
          }}
        >
          <strong style={{ fontWeight: 700 }}>
            Introducing GIOP Analytics:
          </strong>{" "}
          Track institutional complaint patterns.{" "}
          <span
            style={{
              textDecoration: "underline",
              cursor: "pointer",
            }}
          >
            Learn more
          </span>

          <X
            size={14}
            onClick={() => setBannerOpen(false)}
            style={{
              position: "absolute",
              right: 20,
              top: "50%",
              transform: "translateY(-50%)",
              cursor: "pointer",
            }}
          />
        </div>
      )}

      {/* =====================================================
          NAVBAR
      ===================================================== */}

      <nav
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "18px 40px",
          borderBottom: `1px solid ${C.hairline}`,
          gap: 20,
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            flexShrink: 0,
          }}
        >
          <div
            style={{
              width: 22,
              height: 22,
              borderRadius: 5,
              background: C.blue,
            }}
          />

          <span
            style={{
              fontSize: 17,
              fontWeight: 700,
              fontFamily: "'Space Grotesk', sans-serif",
            }}
          >
            GIOP
          </span>
        </div>

        <div
          className="giop-nav-links"
          style={{
            display: "flex",
            alignItems: "center",
            gap: 32,
          }}
        >
          {[
            "Product",
            "Departments",
            "Enterprise",
            "Blog",
            "Docs",
            "Pricing",
          ].map((item) => (
            <a
              key={item}
              href="#"
              className="giop-nav-link"
              style={{textDecoration:'none'}}
            >
              {item}
            </a>
          ))}
        </div>

        <div
          className="giop-nav-actions"
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
          }}
        >
          <button
            type="button"
            className="giop-ghost-btn"
            style={{
              background: C.panel,
              border: "none",
              fontSize: 13.5,
              fontWeight: 600,
              padding: "10px 16px",
              borderRadius: 8,
              cursor: "pointer",
              color: C.ink,
            }}
          >
            Contact admin
          </button>

          <button
            type="button"
            className="giop-black-btn"
            style={{
              background: C.ink,
              border: "none",
              color: "#fff",
              fontSize: 13.5,
              fontWeight: 600,
              padding: "10px 18px",
              borderRadius: 8,
              cursor: "pointer",
            }}
            onClick={handleRedirect}
          >
            Sign up
          </button>
        </div>
      </nav>

      {/* =====================================================
          HERO
      ===================================================== */}

      <section
        style={{
          position: "relative",
          padding: "90px 24px 60px",
          overflow: "hidden",
        }}
      >
        <FloatingCollage />

        <div
          style={{
            position: "relative",
            zIndex: 2,
            maxWidth: 900,
            margin: "0 auto",
            textAlign: "center",
          }}
        >
          <Reveal>
            <h1
              style={{
                fontFamily: "'Space Grotesk', sans-serif",
                fontWeight: 600,
                fontSize: "clamp(2.4rem,5.2vw,4.4rem)",
                lineHeight: 1.06,
                letterSpacing: "-0.02em",
                margin: "0 0 22px",
              }}
            >
              The campus grievance system
              <br />
              that understands itself.
            </h1>
          </Reveal>

          <Reveal delay={80}>
            <p
              style={{
                fontSize: 17,
                color: C.gray,
                margin: "0 0 32px",
              }}
            >
              Classify, prioritize, and route every complaint
              across every department.
            </p>
          </Reveal>
        </div>

        <Reveal delay={200}>
          <AIPanel />
        </Reveal>
      </section>

      {/* =====================================================
          DEPARTMENTS
      ===================================================== */}

      <section
        style={{
          padding: "100px 40px",
          borderTop: `1px solid ${C.hairline}`,
        }}
      >
        <Reveal>
          <h2
            style={{
              fontFamily: "'Space Grotesk', sans-serif",
              fontWeight: 600,
              fontSize: "2.2rem",
              lineHeight: 1.15,
              letterSpacing: "-0.01em",
              maxWidth: 640,
              margin: "0 0 24px",
            }}
          >
            Built to run across every department on campus.
          </h2>

          <button
            type="button"
            className="giop-ghost-btn"
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              background: C.panel,
              border: "none",
              fontSize: 13.5,
              fontWeight: 600,
              padding: "10px 16px",
              borderRadius: 8,
              cursor: "pointer",
              marginBottom: 48,
            }}
          >
            See how routing works
            <ArrowRight size={14} />
          </button>
        </Reveal>

        <div
          className="giop-departments-grid"
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(5, 1fr)",
            border: `1px solid ${C.hairline}`,
            borderRadius: 12,
            overflow: "hidden",
          }}
        >
          {DEPARTMENTS.map((department, index) => {
            const Icon = department.icon;

            return (
              <Reveal
                key={department.name}
                delay={index * 40}
              >
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 10,
                    padding: "32px 14px",
                    borderRight:
                      (index + 1) % 5 !== 0
                        ? `1px solid ${C.hairline}`
                        : "none",
                    borderBottom:
                      index < 5
                        ? `1px solid ${C.hairline}`
                        : "none",
                  }}
                >
                  <Icon size={22} color={C.ink} />

                  <span
                    style={{
                      fontSize: 13,
                      fontWeight: 600,
                      textAlign: "center",
                    }}
                  >
                    {department.name}
                  </span>
                </div>
              </Reveal>
            );
          })}
        </div>
      </section>

      {/* =====================================================
          BENCHMARKS
      ===================================================== */}

      <section
        className="giop-benchmark-section"
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1.4fr",
          borderTop: `1px solid ${C.hairline}`,
        }}
      >
        <div
          style={{
            background: C.ink,
            color: "#fff",
            padding: "80px 44px",
          }}
        >
          <Reveal>
            <div
              style={{
                fontSize: 12,
                letterSpacing: "0.08em",
                color: "#8A90A6",
                marginBottom: 16,
              }}
            >
              BENCHMARKS
            </div>

            <h2
              style={{
                fontFamily: "'Space Grotesk', sans-serif",
                fontWeight: 600,
                fontSize: "2rem",
                lineHeight: 1.15,
                margin: "0 0 18px",
              }}
            >
              Faster resolution at every SLA tier
            </h2>

            <p
              style={{
                fontSize: 14.5,
                color: "#B8BCCF",
                lineHeight: 1.7,
                marginBottom: 32,
              }}
            >
              Illustrative pilot targets against the tools most
              departments run on today.
            </p>

            <div
              style={{
                borderTop: "1px solid #2A2E3B",
              }}
            >
              {[
                { key: "accuracy", label: "Accuracy" },
                { key: "latency", label: "Latency" },
                { key: "coverage", label: "Coverage" },
              ].map((item) => (
                <div
                  key={item.key}
                  onClick={() =>
                    setTab(
                      item.key as
                        | "accuracy"
                        | "latency"
                        | "coverage"
                    )
                  }
                  style={{
                    padding: "16px 0",
                    borderBottom: "1px solid #2A2E3B",
                    fontSize: 14.5,
                    fontWeight:
                      item.key === tab ? 700 : 400,
                    color:
                      item.key === tab
                        ? "#fff"
                        : "#8A90A6",
                    cursor: "pointer",
                    borderLeft:
                      item.key === tab
                        ? `2px solid ${C.blue}`
                        : "2px solid transparent",
                    paddingLeft: 14,
                  }}
                >
                  {item.label}
                </div>
              ))}
            </div>
          </Reveal>
        </div>

        <div
          style={{
            background: "#F5F5F0",
            padding: "80px 44px",
          }}
        >
          <Reveal delay={100}>
            <div
              style={{
                background: C.ink,
                borderRadius: 14,
                padding: "32px 28px",
              }}
            >
              <BenchChart />
            </div>
          </Reveal>
        </div>
      </section>

      {/* =====================================================
          FOOTER
      ===================================================== */}

      <footer
        style={{
          background: `linear-gradient(180deg, ${C.blue}, ${C.blueDeep})`,
          color: "#fff",
          padding: "80px 40px 40px",
        }}
      >
        <Reveal>
          <div
            style={{
              fontSize: 13,
              color: "#C9D2FF",
              marginBottom: 20,
            }}
          >
            GIOP PLATFORM
          </div>

          <h2
            style={{
              fontFamily: "'Space Grotesk', sans-serif",
              fontWeight: 600,
              fontSize: "clamp(2rem,4.4vw,3.4rem)",
              lineHeight: 1.1,
              letterSpacing: "-0.01em",
              maxWidth: 800,
              margin: "0 0 56px",
            }}
          >
            Imagine grievances that resolve themselves.
          </h2>
        </Reveal>

        <div
          className="giop-footer-grid"
          style={{
            borderTop:
              "1px solid rgba(255,255,255,0.2)",
            paddingTop: 40,
            display: "grid",
            gridTemplateColumns: "repeat(5,1fr)",
            gap: 24,
          }}
        >
          {[
            {
              heading: "Product",
              items: [
                "Pricing",
                "Dashboard",
                "Intake API",
                "Analytics",
              ],
            },
            {
              heading: "Institution",
              items: [
                "About GIOP",
                "Careers",
                "Blog",
                "Changelog",
              ],
            },
            {
              heading: "Departments",
              items: [
                "Hostel",
                "Exam Cell",
                "Academics",
                "Admin",
              ],
            },
            {
              heading: "Resources",
              items: [
                "Research",
                "Trust Center",
                "Security",
                "Docs",
              ],
            },
            {
              heading: "Connect",
              items: [
                "Contact",
                "Twitter",
                "LinkedIn",
                "GitHub",
              ],
            },
          ].map((column) => (
            <div key={column.heading}>
              <div
                style={{
                  fontSize: 15,
                  fontWeight: 700,
                  marginBottom: 14,
                  fontFamily:
                    "'Space Grotesk', sans-serif",
                }}
              >
                {column.heading}
              </div>

              {column.items.map((item) => (
                <div
                  key={item}
                  style={{
                    fontSize: 13.5,
                    color: "#D6DCFF",
                    marginBottom: 10,
                    cursor: "pointer",
                  }}
                >
                  {item}
                </div>
              ))}
            </div>
          ))}
        </div>

        <div
          style={{
            display: "flex",
            gap: 20,
            marginTop: 48,
            fontSize: 12.5,
            color: "#B8C1FA",
          }}
        >
          <span>Privacy</span>
          <span>Terms</span>
        </div>
      </footer>


    </main>
  );
}