import Link from "@docusaurus/Link";
import useDocusaurusContext from "@docusaurus/useDocusaurusContext";
import Layout from "@theme/Layout";
import styles from "./index.module.css";

function HeroBanner() {
  return (
    <div className={styles.heroBanner}>
      <div className="container">
        <div className={styles.heroLogo}>RD</div>
        <h1 className={styles.heroTitle}>RAKT Durg</h1>
        <p className={styles.heroSubtitle}>
          District-Level Digital Blood Bank Platform
          <br />
          Durg District Hospital &amp; Red Cross Blood Bank, Chhattisgarh
        </p>
        <div className={styles.heroCtas}>
          <Link className="button button--primary button--lg" to="/quickstart">
            Quick Start →
          </Link>
          <Link className="button button--outline button--lg" to="/architecture/overview">
            Architecture
          </Link>
          <a
            className="button button--outline button--lg"
            href="http://8.231.102.114"
            target="_blank"
            rel="noopener noreferrer"
          >
            Live app
          </a>
        </div>
      </div>
    </div>
  );
}

const features = [
  {
    emoji: "🩸",
    title: "ISBT 128 Barcodes",
    desc: "Luhn check digit, atomic sequence per facility, offline pre-allocation for camp use.",
  },
  {
    emoji: "📱",
    title: "Offline-First Mobile",
    desc: "Flutter app captures screenings & donations with sqflite. Bulk sync with conflict detection when connectivity returns.",
  },
  {
    emoji: "📊",
    title: "Live Stock Dashboard",
    desc: "Server-Sent Events stream via Redis pub/sub. Authenticated dashboard and public availability page.",
  },
  {
    emoji: "🔒",
    title: "RBAC + Audit Trail",
    desc: "8 roles, JWT + refresh token rotation, append-only audit_logs table protected by PostgreSQL RULE.",
  },
  {
    emoji: "🏕️",
    title: "Camp Management",
    desc: "Calendar-blocking unique index prevents double-booking. Coupon generation on approval. Approval queue for medical officers.",
  },
  {
    emoji: "💳",
    title: "Blood Credit Wallet",
    desc: "Feature-flagged Phase 4 — credits for donations, redeemable by donor or verified family members.",
  },
  {
    emoji: "🔁",
    title: "FEFO Inventory",
    desc: "First-Expiry-First-Out component reservation using SELECT … FOR UPDATE SKIP LOCKED for safe concurrency.",
  },
  {
    emoji: "🇮🇳",
    title: "DPDP Compliant",
    desc: "No raw Aadhaar stored. ABHA reference only. Consent fields. Retention policy enforced at the data model layer.",
  },
];

export default function Home(): JSX.Element {
  const { siteConfig } = useDocusaurusContext();
  return (
    <Layout
      title={siteConfig.title}
      description="RAKT Durg — District blood bank platform documentation"
    >
      <HeroBanner />
      <main>
        <section className={styles.features}>
          <div className="container">
            <div className={styles.featuresGrid}>
              {features.map(({ emoji, title, desc }) => (
                <div key={title} className={styles.featureCard}>
                  <div className={styles.featureEmoji}>{emoji}</div>
                  <h3>{title}</h3>
                  <p>{desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className={styles.stack}>
          <div className="container">
            <h2>Tech Stack at a Glance</h2>
            <table>
              <thead>
                <tr>
                  <th>Layer</th>
                  <th>Technology</th>
                </tr>
              </thead>
              <tbody>
                <tr><td>API</td><td>Python 3.12 · FastAPI · Pydantic v2 · SQLAlchemy 2 async</td></tr>
                <tr><td>Database</td><td>PostgreSQL 16 · Alembic migrations</td></tr>
                <tr><td>Cache / Queue</td><td>Redis 7 · Celery 5</td></tr>
                <tr><td>Web</td><td>React 18 · Vite · TanStack Query v5 · shadcn/ui · Tailwind · Bun</td></tr>
                <tr><td>Mobile</td><td>Flutter 3 · Riverpod · sqflite · go_router · Dio</td></tr>
                <tr><td>Auth</td><td>JWT (15 min access · 7 day refresh) · bcrypt · SHA-256 token hash</td></tr>
                <tr><td>Real-time</td><td>SSE via FastAPI + Redis pub/sub</td></tr>
                <tr><td>CI / CD</td><td>GitHub Actions (VM deploy) · Vercel (docs)</td></tr>
              </tbody>
            </table>
          </div>
        </section>
      </main>
    </Layout>
  );
}
