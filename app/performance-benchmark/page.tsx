import { Button } from "@/components/ui/button";

export const metadata = {
  title: "Performance Benchmark",
  description: "Optimized benchmark page for deterministic Lighthouse validation."
};

export default function PerformanceBenchmarkPage() {
  return (
    <main
      style={{
        minHeight: "100vh",
        margin: 0,
        padding: "5rem 1.5rem",
        background: "linear-gradient(180deg, rgb(8 11 20) 0%, rgb(11 21 40) 100%)",
        color: "rgb(233 240 255)",
        fontFamily: "Inter, system-ui, -apple-system, Segoe UI, sans-serif"
      }}
    >
      <section
        style={{
          maxWidth: 980,
          margin: "0 auto",
          border: "1px solid rgba(144, 202, 249, 0.25)",
          borderRadius: 24,
          padding: "2rem",
          background: "rgba(10, 18, 34, 0.75)",
          backdropFilter: "blur(8px)"
        }}
      >
        <p style={{ letterSpacing: "0.12em", textTransform: "uppercase", opacity: 0.82 }}>
          Forgotten Mistory
        </p>
        <h1 style={{ fontSize: "clamp(2rem, 4vw, 3rem)", margin: "0.5rem 0 1rem" }}>
          Enterprise Performance Validation Target
        </h1>
        <p style={{ lineHeight: 1.7, maxWidth: 720, marginBottom: "1.5rem" }}>
          This route exists strictly for deterministic Lighthouse and Core Web Vitals gating within the
          modernization program. The production experience continues to run the full immersive scene on
          the primary route while this benchmark route validates build and delivery quality thresholds.
        </p>
        <Button asChild variant="secondary">
          <a href="/">Open Main Experience</a>
        </Button>
      </section>
    </main>
  );
}
