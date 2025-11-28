'use client';

import React from 'react';
import Script from 'next/script';
import Image from 'next/image';

export default function Home() {
  return (
    <>
      <canvas id="webgl" className="fixed top-0 left-0 w-full h-full -z-10"></canvas>

      <div className="admin-controls fixed top-5 right-5 z-[10001]">
        <button id="toggle-edit-mode" className="btn-secondary">
          <i className="fas fa-pen"></i> Edit Mode
        </button>
        <button
          id="reset-content"
          className="btn-secondary hidden mt-2.5 bg-red-500/20 border-red-500/40"
        >
          <i className="fas fa-undo"></i> Reset
        </button>
      </div>

      <div className="preloader" role="status" aria-live="polite">
        <div className="preloader-inner">
          <div className="loader-ring"></div>
          <div className="counter">0</div>
          <div className="loader-copy">Calibrating stars & telemetry</div>
        </div>
      </div>

      <div className="cursor-dot" data-cursor-dot></div>
      <div className="cursor-outline" data-cursor-outline></div>

      <nav>
        <div className="logo editable" data-key="logo">
          VIKRAM.
        </div>
        <div className="menu-toggle">Menu</div>
        <div className="nav-overlay">
          <ul className="nav-links">
            <li>
              <a href="#hero" className="nav-link">
                Home
              </a>
            </li>
            <li>
              <a href="#about" className="nav-link">
                About
              </a>
            </li>
            <li>
              <a href="#experience" className="nav-link">
                Experience
              </a>
            </li>
            <li>
              <a href="#skills" className="nav-link">
                Skills
              </a>
            </li>
            <li>
              <a href="#architecture-lab" className="nav-link">
                Architecture
              </a>
            </li>
            <li>
              <a href="#work" className="nav-link">
                Work
              </a>
            </li>
            <li>
              <a href="/docs/Vik_Resume_Final.pdf" className="nav-link" target="_blank" rel="noreferrer">
                Resume
              </a>
            </li>
            <li>
              <a href="#contact" className="nav-link">
                Contact
              </a>
            </li>
          </ul>
        </div>
      </nav>

      <main>
        <section id="hero" className="hero-section" data-scroll-section>
          <div className="hero-content">
            <h1 className="hero-title">
              <span className="line">Hello, I&apos;m</span>
              <span className="line reveal-text editable" data-key="hero-name">
                Vikram .
              </span>
            </h1>
            <p className="hero-subtitle reveal-text-delay editable" data-key="hero-subtitle">
              I&apos;m a technical leader and AI solutions architect based in Melbourne. With over 15 years of experience, I enjoy helping teams build complex systems and solve challenging problems. My work has spanned across finance and telecommunications, where I&apos;ve focused on delivering value and making a positive impact.
              <br />
              <br />
              Beyond my professional work, I have a deep interest in the intersection of technology and history, particularly in ancient algorithms and Vedic astronomy. I believe there&apos;s a lot to learn from the past to build a better future.
              <br />
              <br />
              My goal is to create technology that is not only powerful but also responsible and beneficial to everyone.
            </p>
            <div className="hero-links reveal-text-delay">
              <a href="https://github.com/Victordtesla24" target="_blank" rel="noreferrer" className="btn-link">
                GitHub
              </a>
              <a href="https://youtube.com/@vicd0ct" target="_blank" rel="noreferrer" className="btn-link">
                YouTube
              </a>
              <a href="/docs/Vik_Resume_Final.pdf" className="btn-link" target="_blank" rel="noreferrer">
                Resume PDF
              </a>
              <a href="#contact" className="btn-primary">
                Let&apos;s Talk
              </a>
            </div>
            <div className="telemetry-panel glass-card" id="telemetry-panel">
              <div className="telemetry-header">
                <div>
                  <p className="eyebrow">Live Telemetry</p>
                  <h3>System Status</h3>
                </div>
                <div className="telemetry-badges">
                  <span className="pill soft">Simulated</span>
                  <span className="pill accent">
                    P95 <span data-latency>180 ms</span>
                  </span>
                </div>
              </div>
              <div className="telemetry-grid">
                <div className="telemetry-card">
                  <div className="telemetry-label">Edge latency (ANZ)</div>
                  <div className="telemetry-value" data-latency-number>
                    0.180 s
                  </div>
                  <svg className="telemetry-spark" viewBox="0 0 160 40" preserveAspectRatio="none">
                    <path data-latency-spark d="M0 30 L20 25 L40 28 L60 20 L80 24 L100 18 L120 22 L140 16 L160 20" />
                  </svg>
                  <p className="telemetry-note">Targets &lt; 200 ms at 10k+ device concurrency.</p>
                </div>
                <div className="telemetry-card">
                  <div className="telemetry-label">Active visitors by region</div>
                  <ul className="telemetry-list" id="telemetry-locations">
                    <li>Melbourne · Edge POP</li>
                    <li>Sydney · API Gateway</li>
                    <li>Adelaide · Vector cache</li>
                  </ul>
                  <p className="telemetry-note">Geo feed rotates every few seconds.</p>
                </div>
                <div className="telemetry-card telemetry-dual">
                  <div className="telemetry-dual-row">
                    <div>
                      <div className="telemetry-label">Server load</div>
                      <div className="telemetry-value" data-load>
                        32%
                      </div>
                    </div>
                    <div>
                      <div className="telemetry-label">Coffee consumed</div>
                      <div className="telemetry-value" data-coffee>
                        1.0 cups
                      </div>
                    </div>
                  </div>
                  <div className="telemetry-meter">
                    <span data-load-meter style={{ width: '32%' }}></span>
                  </div>
                  <p className="telemetry-note">Load is synthetic; caffeine is not.</p>
                </div>
              </div>
            </div>

            <div className="hero-meta">
              <div className="meta-card glass-card">
                <div className="meta-icon">
                  <i className="fas fa-cloud-upload-alt"></i>
                </div>
                <div className="meta-content">
                  <span className="meta-label">Cloud Modernisation</span>
                  <div className="meta-stats">
                    <span className="meta-value">-30%</span>
                    <span className="meta-subvalue">Delivery</span>
                  </div>
                  <span className="meta-note">Faster ROI & leaner infra spend on regulated programs.</span>
                </div>
              </div>
              <div className="meta-card glass-card">
                <div className="meta-icon">
                  <i className="fas fa-tachometer-alt"></i>
                </div>
                <div className="meta-content">
                  <span className="meta-label">Realtime Reliability</span>
                  <div className="meta-stats">
                    <span className="meta-value">10k+</span>
                    <span className="meta-subvalue">Devices</span>
                  </div>
                  <span className="meta-note">Resilient CX & telemetry with P95 &lt;200ms latency.</span>
                </div>
              </div>
              <div className="meta-card glass-card">
                <div className="meta-icon">
                  <i className="fas fa-shield-alt"></i>
                </div>
                <div className="meta-content">
                  <span className="meta-label">AI Quality & Risk</span>
                  <div className="meta-stats">
                    <span className="meta-value">-38%</span>
                    <span className="meta-subvalue">Breaches</span>
                  </div>
                  <span className="meta-note">Safer AI rollouts; 100% tested key server for signing.</span>
                </div>
              </div>
              <div className="meta-card glass-card">
                <div className="meta-icon">
                  <i className="fas fa-users"></i>
                </div>
                <div className="meta-content">
                  <span className="meta-label">Leadership Scale</span>
                  <div className="meta-stats">
                    <span className="meta-value">40+</span>
                    <span className="meta-subvalue">Resources</span>
                  </div>
                  <span className="meta-note">Leading 5+ cross-functional squads onsite & offshore.</span>
                </div>
              </div>
              <div className="meta-card glass-card">
                <div className="meta-icon">
                  <i className="fas fa-compass"></i>
                </div>
                <div className="meta-content">
                  <span className="meta-label">Strategic Alignment</span>
                  <div className="meta-stats">
                    <span className="meta-value">&gt;55%</span>
                    <span className="meta-subvalue">Clarity</span>
                  </div>
                  <span className="meta-note">Bridging engineering depth with executive strategy.</span>
                </div>
              </div>
              <div className="meta-card glass-card">
                <div className="meta-icon">
                  <i className="fas fa-chart-line"></i>
                </div>
                <div className="meta-content">
                  <span className="meta-label">Portfolio Value</span>
                  <div className="meta-stats">
                    <span className="meta-value">$5M+</span>
                    <span className="meta-subvalue">Budget</span>
                  </div>
                  <span className="meta-note">Stewardship of multi-million programs with compliance.</span>
                </div>
              </div>
            </div>
          </div>

          <div className="hero-image-container parallax" data-speed="0.1">
            <div className="avatar-placeholder" id="avatar-container">
              <div className="avatar-circle relative overflow-hidden">
                <Image 
                  src="/assets/my_avatar.png" 
                  alt="Vikram Avatar" 
                  fill
                  className="avatar-img absolute inset-0 w-full h-full object-cover z-10 transition-opacity duration-500"
                  id="avatar-static"
                  priority
                />
                <video
                  src="assets/my-avatar.mp4"
                  className="avatar-img absolute inset-0 w-full h-full object-cover z-0"
                  id="profile-image"
                  muted
                  loop
                  playsInline
                  preload="auto"
                ></video>
              </div>
            </div>
          </div>
        </section>

        <section id="about" className="about-section" data-scroll-section>
          <div className="container">
            <div className="section-header">
              <h2 className="section-title editable" data-key="about-title">
                About Me
              </h2>
            </div>
            <div className="about-content">
              <p className="about-text editable" data-key="about-text-1">
                With over 15 years in the technology industry, I&apos;ve had the privilege of working as a Senior Technical Leader and Certified Scrum Master (CSM) in the financial services and telecommunications sectors. My focus has been on program delivery, enterprise transformation, and architecting AI/ML-driven solutions.
              </p>
              <p className="about-text editable" data-key="about-text-2">
                I have experience in leading cross-functional teams and guiding cloud-based modernizations. My technical background includes Python, TypeScript, and cloud-native infrastructure like Kubernetes, GCP, and AWS. I&apos;m passionate about fostering an agile culture and translating complex technical roadmaps into business value.
              </p>

              <div className="snap-grid" role="list">
                <div className="snap-card" data-snap role="listitem">
                  <button className="snap-header" aria-expanded="false">
                    <div>
                      <p className="snap-kicker">What I aim to deliver</p>
                      <h3 className="snap-title">Career Objective</h3>
                      <p className="snap-summary">
                        Bridge technical depth with executive strategy so AI/ML pilots land in production with
                        business value.
                      </p>
                    </div>
                    <span className="snap-icon">+</span>
                  </button>
                    <div className="snap-body">
                    <ul>
                      <li>Translate strategy into roadmaps that improve delivery efficiency and de-risk cloud modernisations.</li>
                      <li>Align AI/ML delivery with compliance and risk models from the start.</li>
                      <li>Use telemetry and dashboards to provide transparency for leaders and teams.</li>
                    </ul>
                  </div>
                </div>

                <div className="snap-card" data-snap role="listitem">
                  <button className="snap-header" aria-expanded="false">
                    <div>
                      <p className="snap-kicker">Measurable outcomes</p>
                      <h3 className="snap-title">Delivery Impact</h3>
                      <p className="snap-summary">Programs built around latency, resilience, and cost controls.</p>
                    </div>
                    <span className="snap-icon">+</span>
                  </button>
                  <div className="snap-body">
                    <ul>
                      <li>P95 &lt; 200 ms realtime WebSocket telemetry across 10k+ device concurrency (ANZ).</li>
                      <li>Core banking transformation (.NET/Azure) trimmed delivery time by &gt;30% and infra cost by &gt;15%.</li>
                      <li>$5M+ portfolio oversight with 100% compliance to enterprise standards and risk models.</li>
                    </ul>
                  </div>
                </div>

                <div className="snap-card" data-snap role="listitem">
                  <button className="snap-header" aria-expanded="false">
                    <div>
                      <p className="snap-kicker">How teams experience it</p>
                      <h3 className="snap-title">Leadership &amp; Governance</h3>
                      <p className="snap-summary">Servant leadership with clear guardrails and steady cadence.</p>
                    </div>
                    <span className="snap-icon">+</span>
                  </button>
                  <div className="snap-body">
                    <ul>
                      <li>Lead 5+ squads (up to 40 resources including offshore) through Agile/Scrum/SAFe rituals.</li>
                      <li>Exec workshops for 40+ leaders improved decision clarity by ~55%.</li>
                      <li>Certified Scrum Master; governance first to keep risk, budget, and delivery aligned.</li>
                    </ul>
                  </div>
                </div>

                <div className="snap-card" data-snap role="listitem">
                  <button className="snap-header" aria-expanded="false">
                    <div>
                      <p className="snap-kicker">Live proof points</p>
                      <h3 className="snap-title">Recent Builds</h3>
                      <p className="snap-summary">Hands-on shipping to validate decisions with working software.</p>
                    </div>
                    <span className="snap-icon">+</span>
                  </button>
                  <div className="snap-body">
                    <ul>
                      <li>Next.js + Supabase JIRA analytics dashboard surfacing sprint velocity and LLM retro insights.</li>
                      <li>Node.js/Express public-key server with full Mocha/Chai coverage for API signing.</li>
                      <li>React/TypeScript + D3 relationship timeline visualiser for customer journeys.</li>
                      <li>Langfuse + Phoenix evaluation stack reducing simulated LLM error-budget breaches by 38%.</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="experience" className="experience-section" data-scroll-section>
          <div className="container">
            <div className="section-header">
              <h2 className="section-title editable" data-key="experience-title">
                Experience
              </h2>
            </div>
            <div className="accordion-group">
              <div className="accordion-item">
                <div className="accordion-header">
                  <div className="accordion-title">
                    <span className="role editable" data-key="exp-1-role">
                      Senior Delivery Lead / AI/ML Solutions Architect
                    </span>
                    <span className="company editable" data-key="exp-1-company">
                      ANZ — Melbourne, VIC
                    </span>
                  </div>
                  <div className="accordion-meta">
                    <span className="date editable" data-key="exp-1-date">
                      Sept 2017 - Jun 2025
                    </span>
                    <span className="icon">+</span>
                  </div>
                </div>
                <div className="accordion-content">
                  <div className="accordion-body">
                    <ul>
                      <li className="editable" data-key="exp-1-desc-1">
                        Led the delivery of AI/ML solutions, including real-time WebSocket telemetry services for high-concurrency devices.
                      </li>
                      <li className="editable" data-key="exp-1-desc-2">
                        Guided the transition of core banking platforms to cloud-native architectures (.NET/Azure), improving delivery efficiency and reducing infrastructure costs.
                      </li>
                      <li className="editable" data-key="exp-1-desc-3">
                        Managed a program portfolio valued at over $5M, supporting multiple cross-functional squads.
                      </li>
                      <li className="editable" data-key="exp-1-desc-4">
                        Developed the technical vision and managed the product backlog for platform modernizations, ensuring alignment with enterprise standards and risk frameworks.
                      </li>
                    </ul>
                  </div>
                </div>
              </div>

              <div className="accordion-item">
                <div className="accordion-header">
                  <div className="accordion-title">
                    <span className="role editable" data-key="exp-3-role">
                      Senior Project Manager &amp; Business Analyst
                    </span>
                    <span className="company editable" data-key="exp-3-company">
                      National Australia Bank (NAB) — Melbourne, VIC
                    </span>
                  </div>
                  <div className="accordion-meta">
                    <span className="date editable" data-key="exp-3-date">
                      Nov 2016 - Sept 2017
                    </span>
                    <span className="icon">+</span>
                  </div>
                </div>
                <div className="accordion-content">
                  <div className="accordion-body">
                    <ul>
                      <li className="editable" data-key="exp-3-desc-1">
                        Managed the delivery for a critical risk and compliance program, focusing on regulatory adherence for major data initiatives.
                      </li>
                    </ul>
                  </div>
                </div>
              </div>

              <div className="accordion-item">
                <div className="accordion-header">
                  <div className="accordion-title">
                    <span className="role editable" data-key="exp-4-role">
                      Lead Business Analyst
                    </span>
                    <span className="company editable" data-key="exp-4-company">
                      Microsoft Inc. — Sydney, NSW
                    </span>
                  </div>
                  <div className="accordion-meta">
                    <span className="date editable" data-key="exp-4-date">
                      Oct 2015 - Oct 2016
                    </span>
                    <span className="icon">+</span>
                  </div>
                </div>
                <div className="accordion-content">
                  <div className="accordion-body">
                    <ul>
                      <li className="editable" data-key="exp-4-desc-1">
                        Delivered a gap analysis for Azure ML telemetry, which helped to improve system reliability and reduce incident resolution time.
                      </li>
                      <li className="editable" data-key="exp-4-desc-2">
                        Worked on aligning DevOps strategies with enterprise standards to improve compliance.
                      </li>
                    </ul>
                  </div>
                </div>
              </div>

              <div className="accordion-item">
                <div className="accordion-header">
                  <div className="accordion-title">
                    <span className="role editable" data-key="exp-5-role">
                      Business Analyst / Project Coordinator
                    </span>
                    <span className="company editable" data-key="exp-5-company">
                      Telstra — Melbourne, VIC
                    </span>
                  </div>
                  <div className="accordion-meta">
                    <span className="date editable" data-key="exp-5-date">
                      Nov 2014 - Oct 2015
                    </span>
                    <span className="icon">+</span>
                  </div>
                </div>
                <div className="accordion-content">
                  <div className="accordion-body">
                    <ul>
                      <li className="editable" data-key="exp-5-desc-1">
                        Developed customer journey scorecards and streamlined JIRA requirements to improve delivery efficiency and operational clarity.
                      </li>
                    </ul>
                  </div>
                </div>
              </div>

              <div className="accordion-item">
                <div className="accordion-header">
                  <div className="accordion-title">
                    <span className="role editable" data-key="exp-6-role">
                      Senior Business Analyst
                    </span>
                    <span className="company editable" data-key="exp-6-company">
                      InfoCentric — Melbourne, VIC
                    </span>
                  </div>
                  <div className="accordion-meta">
                    <span className="date editable" data-key="exp-6-date">
                      Aug 2011 - Nov 2014
                    </span>
                    <span className="icon">+</span>
                  </div>
                </div>
                <div className="accordion-content">
                  <div className="accordion-body">
                    <ul>
                      <li className="editable" data-key="exp-6-desc-1">
                        Delivered analytics and BI projects that boosted client engagement and automated regulatory reporting.
                      </li>
                    </ul>
                  </div>
                </div>
              </div>

              <div className="accordion-item">
                <div className="accordion-header">
                  <div className="accordion-title">
                    <span className="role editable" data-key="exp-7-role">
                      Developer Support / Software Testing / Analyst
                    </span>
                    <span className="company editable" data-key="exp-7-company">
                      MYOB — Melbourne, VIC
                    </span>
                  </div>
                  <div className="accordion-meta">
                    <span className="date editable" data-key="exp-7-date">
                      May 2010 - Aug 2011
                    </span>
                    <span className="icon">+</span>
                  </div>
                </div>
                <div className="accordion-content">
                  <div className="accordion-body">
                    <ul>
                      <li className="editable" data-key="exp-7-desc-1">
                        Optimized data processing workflows, which improved efficiency and reduced reporting time for financial data sets.
                      </li>
                    </ul>
                  </div>
                </div>
              </div>

              <div className="accordion-item">
                <div className="accordion-header">
                  <div className="accordion-title">
                    <span className="role editable" data-key="exp-8-role">
                      Independent AI Consulting &amp; Upskilling
                    </span>
                    <span className="company editable" data-key="exp-8-company">
                      Independent AI Consulting &amp; Upskilling — Melbourne, VIC
                    </span>
                  </div>
                  <div className="accordion-meta">
                    <span className="date editable" data-key="exp-8-date">
                      Jun 2025 - Current
                    </span>
                    <span className="icon">+</span>
                  </div>
                </div>
                <div className="accordion-content">
                  <div className="accordion-body">
                    <ul>
                      <li className="editable" data-key="exp-8-desc-1">
                        Architected and developed a Next.js and Supabase analytics dashboard for JIRA to expose sprint velocity metrics and generate LLM-powered retrospective insights.
                      </li>
                      <li className="editable" data-key="exp-8-desc-2">
                        Built a production-grade Node.js/Express public-key server for API signing.
                      </li>
                      <li className="editable" data-key="exp-8-desc-3">
                        Developed a React/TypeScript and D3 visualization tool for dynamic customer journey interactions.
                      </li>
                      <li className="editable" data-key="exp-8-desc-4">
                        Implemented an LLM evaluation stack using Langfuse and Phoenix to reduce error budget breaches in a simulated production environment.
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="skills" className="skills-section" data-scroll-section>
          <div className="container">
            <div className="section-header">
              <h2 className="section-title">Skills &amp; Certifications</h2>
            </div>
            <div className="skills-grid">
              <div className="skill-card" data-skill>
                <button className="skill-header" aria-expanded="false">
                  <div className="skill-title">
                    <span className="skill-icon">
                      <i className="fas fa-brain"></i>
                    </span>
                    <div>
                      <p className="skill-kicker">AI/ML &amp; Data</p>
                      <h3 className="skill-name">AI/ML Solutions &amp; LLM Pipelines</h3>
                    </div>
                  </div>
                  <span className="skill-chevron">
                    <i className="fas fa-plus"></i>
                  </span>
                </button>
                <div className="skill-body">
                  <ul className="skill-list">
                    <li>AI/ML Solutions</li>
                    <li>LLM Pipelines (LangChain, Langfuse)</li>
                    <li>Real-Time Telemetry</li>
                    <li>MLOps</li>
                    <li>Data Architecture</li>
                  </ul>
                </div>
              </div>

              <div className="skill-card" data-skill>
                <button className="skill-header" aria-expanded="false">
                  <div className="skill-title">
                    <span className="skill-icon">
                      <i className="fas fa-code-branch"></i>
                    </span>
                    <div>
                      <p className="skill-kicker">Engineering</p>
                      <h3 className="skill-name">Cloud-Native &amp; Full-Stack</h3>
                    </div>
                  </div>
                  <span className="skill-chevron">
                    <i className="fas fa-plus"></i>
                  </span>
                </button>
                <div className="skill-body">
                  <ul className="skill-list">
                    <li>Python, TypeScript, React/Next.js</li>
                    <li>Kubernetes, Docker, Terraform</li>
                    <li>GCP, AWS</li>
                    <li>Postgres/Supabase</li>
                    <li>CI/CD, DevOps</li>
                  </ul>
                </div>
              </div>

              <div className="skill-card" data-skill>
                <button className="skill-header" aria-expanded="false">
                  <div className="skill-title">
                    <span className="skill-icon">
                      <i className="fas fa-chess-king"></i>
                    </span>
                    <div>
                      <p className="skill-kicker">Leadership</p>
                      <h3 className="skill-name">Program Delivery &amp; Management</h3>
                    </div>
                  </div>
                  <span className="skill-chevron">
                    <i className="fas fa-plus"></i>
                  </span>
                </button>
                <div className="skill-body">
                  <ul className="skill-list">
                    <li>Technical Program Management</li>
                    <li>Agile/Scrum/SAFe</li>
                    <li>Product Ownership</li>
                    <li>Stakeholder Alignment</li>
                    <li>Risk &amp; Budget Management</li>
                  </ul>
                </div>
              </div>

              <div className="skill-card" data-skill>
                <button className="skill-header" aria-expanded="false">
                  <div className="skill-title">
                    <span className="skill-icon">
                      <i className="fas fa-certificate"></i>
                    </span>
                    <div>
                      <p className="skill-kicker">Certifications</p>
                      <h3 className="skill-name">Credentials &amp; Governance</h3>
                    </div>
                  </div>
                  <span className="skill-chevron">
                    <i className="fas fa-plus"></i>
                  </span>
                </button>
                <div className="skill-body">
                  <ul className="skill-list">
                    <li>Certified Scrum Master (CSM)</li>
                    <li>Cloud/Data Certifications (AWS/GCP - In progress)</li>
                  </ul>
                </div>
              </div>

              <div className="skill-card" data-skill>
                <button className="skill-header" aria-expanded="false">
                  <div className="skill-title">
                    <span className="skill-icon">
                      <i className="fas fa-graduation-cap"></i>
                    </span>
                    <div>
                      <p className="skill-kicker">Education</p>
                      <h3 className="skill-name">Formal Education</h3>
                    </div>
                  </div>
                  <span className="skill-chevron">
                    <i className="fas fa-plus"></i>
                  </span>
                </button>
                <div className="skill-body">
                  <ul className="skill-list">
                    <li>Master of Computer Science (Honors), Monash University</li>
                    <li>Bachelor of Engineering, Computer Science, University of Melbourne</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="architecture-lab" className="architecture-section" data-scroll-section>
          <div className="container">
            <div className="section-header">
              <h2 className="section-title">Interactive Architecture Map</h2>
              <p className="section-subhead">
                Trace how requests move from edge clients to Gemini, telemetry, and governance.
              </p>
            </div>
            <div className="arch-wrapper glass-card">
              <div id="arch-tooltip" className="arch-tooltip" style={{ position: 'absolute', background: 'rgba(0, 0, 0, 0.8)', color: '#fff', padding: '5px 10px', borderRadius: '5px', fontSize: '0.9rem', pointerEvents: 'none', opacity: 0, transition: 'opacity 0.2s', zIndex: 100 }}></div>
              <div className="arch-diagram">
                <div className="arch-diagram-halo" aria-hidden="true"></div>
                <div className="arch-diagram-grid" aria-hidden="true"></div>
                <svg className="arch-svg" viewBox="0 0 120 70" role="img" aria-label="Architecture flow diagram">
                  <defs>
                    <linearGradient id="link-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="rgba(255,255,255,0.1)" />
                      <stop offset="100%" stopColor="rgba(255,255,255,0.05)" />
                    </linearGradient>
                    <marker
                      id="arrowhead"
                      markerWidth="5"
                      markerHeight="5"
                      refX="5"
                      refY="2.5"
                      orient="auto"
                      markerUnits="strokeWidth"
                    >
                      <path d="M0,0 L5,2.5 L0,5" fill="rgba(255,255,255,0.3)" />
                    </marker>
                  </defs>

                  {/* Connections - Using Bezier Curves */}
                  <path
                    data-line="edge-api"
                    d="M 26 35 L 36 35"
                    fill="none"
                    className="arch-connection"
                  />
                  <path
                    data-line="api-vector"
                    d="M 56 35 C 60 35, 60 20, 66 20"
                    fill="none"
                    className="arch-connection"
                  />
                  <path
                    data-line="vector-llm"
                    d="M 88 20 L 96 20"
                    fill="none"
                    className="arch-connection"
                  />
                  <path
                    data-line="llm-api"
                    d="M 96 24 C 85 24, 70 38, 56 38"
                    fill="none"
                    className="arch-connection"
                  />
                  <path
                    data-line="api-telemetry"
                    d="M 56 35 C 60 35, 60 56, 66 56"
                    fill="none"
                    className="arch-connection"
                  />
                  <path
                    data-line="telemetry-governance"
                    d="M 88 56 L 96 56"
                    fill="none"
                    className="arch-connection"
                  />
                  <path
                    data-line="governance-edge"
                    d="M 105 64 C 105 75, 16 75, 16 42"
                    fill="none"
                    className="arch-connection"
                  />

                  {/* Invisible Node Targets for Script References if needed, or just removal if script relies on class toggling chips */}
                  {/* We keep groups for potential future SVG logic, but they are empty of visible shapes now */}
                  <g data-node="edge" />
                  <g data-node="api" />
                  <g data-node="vector" />
                  <g data-node="llm" />
                  <g data-node="telemetry" />
                  <g data-node="governance" />
                </svg>

                {/* HTML Overlay Nodes - The Visuals */}
                <div className="arch-node-chips">
                  <div className="arch-node-chip edge-chip" data-arch-chip="edge">
                    <div className="chip-icon"><i className="fas fa-laptop"></i></div>
                    <div className="chip-content">
                      <span className="chip-title">Edge</span>
                      <span className="chip-desc">Clients &amp; Sensors</span>
                    </div>
                  </div>
                  
                  <div className="arch-node-chip api-chip" data-arch-chip="api">
                    <div className="chip-icon"><i className="fas fa-network-wired"></i></div>
                    <div className="chip-content">
                      <span className="chip-title">API Gateway</span>
                      <span className="chip-desc">Rate limit &amp; Route</span>
                    </div>
                  </div>

                  <div className="arch-node-chip vector-chip" data-arch-chip="vector">
                    <div className="chip-icon"><i className="fas fa-database"></i></div>
                    <div className="chip-content">
                      <span className="chip-title">Vector DB</span>
                      <span className="chip-desc">Embeddings</span>
                    </div>
                  </div>

                  <div className="arch-node-chip llm-chip" data-arch-chip="llm">
                    <div className="chip-icon"><i className="fas fa-brain"></i></div>
                    <div className="chip-content">
                      <span className="chip-title">Gemini</span>
                      <span className="chip-desc">Inference Core</span>
                    </div>
                  </div>

                  <div className="arch-node-chip telemetry-chip" data-arch-chip="telemetry">
                    <div className="chip-icon"><i className="fas fa-satellite-dish"></i></div>
                    <div className="chip-content">
                      <span className="chip-title">Telemetry</span>
                      <span className="chip-desc">Metric Bus</span>
                    </div>
                  </div>

                  <div className="arch-node-chip governance-chip" data-arch-chip="governance">
                    <div className="chip-icon"><i className="fas fa-balance-scale"></i></div>
                    <div className="chip-content">
                      <span className="chip-title">Governance</span>
                      <span className="chip-desc">Policy &amp; Risk</span>
                    </div>
                  </div>
                </div>
              </div>
              <div className="arch-sidebar">
                <div className="arch-metrics" role="status" aria-live="polite">
                  <div className="arch-metric" data-key="latency">
                    <p className="arch-metric-label">P95 latency</p>
                    <p className="arch-metric-value" data-metric-value>~180 ms</p>
                    <span className="arch-metric-subtext">Edge → Gemini</span>
                  </div>
                  <div className="arch-metric" data-key="throughput">
                    <p className="arch-metric-label">Throughput</p>
                    <p className="arch-metric-value" data-metric-value>~12k req/s</p>
                    <span className="arch-metric-subtext">Parallel reader sessions</span>
                  </div>
                  <div className="arch-metric" data-key="vectorHits">
                    <p className="arch-metric-label">Vector hit accuracy</p>
                    <p className="arch-metric-value" data-metric-value>3 shards</p>
                    <span className="arch-metric-subtext">Multi-region cache</span>
                  </div>
                </div>
                <div className="arch-legend" aria-live="polite">
                  <p className="arch-legend-title">Path components</p>
                  <p className="arch-legend-subtitle">Node states across the journey</p>
                  <div className="arch-legend-grid">
                    <div className="arch-legend-item" data-legend-node="edge">
                      <span className="arch-legend-dot"></span>
                      <div>
                        <p className="arch-legend-name">Edge clients</p>
                        <p className="arch-legend-desc">Browsers, mobile, and sensor kits.</p>
                      </div>
                    </div>
                    <div className="arch-legend-item" data-legend-node="api">
                      <span className="arch-legend-dot"></span>
                      <div>
                        <p className="arch-legend-name">API gateway</p>
                        <p className="arch-legend-desc">Front door, throttling, metadata.</p>
                      </div>
                    </div>
                    <div className="arch-legend-item" data-legend-node="vector">
                      <span className="arch-legend-dot"></span>
                      <div>
                        <p className="arch-legend-name">Vector store</p>
                        <p className="arch-legend-desc">Distributed cache of embeddings.</p>
                      </div>
                    </div>
                    <div className="arch-legend-item" data-legend-node="llm">
                      <span className="arch-legend-dot"></span>
                      <div>
                        <p className="arch-legend-name">Gemini</p>
                        <p className="arch-legend-desc">LLM core with safety filters.</p>
                      </div>
                    </div>
                    <div className="arch-legend-item" data-legend-node="telemetry">
                      <span className="arch-legend-dot"></span>
                      <div>
                        <p className="arch-legend-name">Telemetry</p>
                        <p className="arch-legend-desc">Metric bus and heartbeat feeds.</p>
                      </div>
                    </div>
                    <div className="arch-legend-item" data-legend-node="governance">
                      <span className="arch-legend-dot"></span>
                      <div>
                        <p className="arch-legend-name">Governance</p>
                        <p className="arch-legend-desc">QA, risk, and compliance loops.</p>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="arch-actions">
                  <button className="arch-btn active" data-flow="chat">
                    LLM Chat Path
                  </button>
                  <button className="arch-btn" data-flow="telemetry">
                    Telemetry Stream
                  </button>
                  <button className="arch-btn" data-flow="governance">
                    Governance &amp; Quality
                  </button>
                </div>
                <div className="arch-explainer" id="arch-explainer">
                  <p className="arch-explainer-title" data-arch-headline>
                    LLM Chat Path
                  </p>
                  <p className="arch-explainer-body" data-arch-description>
                    Select a path to highlight the packets moving through edge, gateway, vector store, Gemini, telemetry, and governance.
                  </p>
                  <div className="arch-explainer-callout">
                    <span className="arch-explainer-badge" data-arch-badge>
                      Live feed
                    </span>
                    <p className="arch-explainer-note" data-arch-note>
                      Edge → API → Vector → Gemini → Telemetry → Governance
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="work" className="work-section" data-scroll-section>
          <div className="container">
            <div className="section-header">
              <h2 className="section-title editable" data-key="work-title">
                Current Projects in the Pipeline
              </h2>
            </div>

            <div className="carousel-wrapper">
              <div className="projects-carousel" id="projects-carousel">
                <a
                  href="https://github.com/Victordtesla24/EFDDH-Jira-Analytics-Dashboard"
                  target="_blank"
                  rel="noreferrer"
                  className="project-card"
                  data-preview="chart"
                  data-preview-label="Velocity charts"
                >
                  <div className="project-image">
                    <div className="viz-dashboard">
                      <div className="dash-header"></div>
                      <div className="dash-row">
                        <div className="dash-card c-1"></div>
                        <div className="dash-card c-2"></div>
                      </div>
                      <div className="dash-row row-2">
                        <div className="dash-bar b-1"></div>
                        <div className="dash-bar b-3"></div>
                        <div className="dash-bar b-2"></div>
                        <div className="dash-bar b-4"></div>
                      </div>
                    </div>
                    <div className="card-badge">Python / AI</div>
                  </div>
                  <div className="project-info">
                    <h3>EFDDH Jira Analytics</h3>
                    <p>Python dashboard surfacing sprint velocity + LLM retros using LangChain. Exec-ready insights.</p>
                  </div>
                </a>

                <a
                  href="https://github.com/Victordtesla24/tailor-resume-with-ai"
                  target="_blank"
                  rel="noreferrer"
                  className="project-card"
                  data-preview="doc"
                  data-preview-label="Auto-tailoring"
                >
                  <div className="project-image">
                    <div className="viz-doc">
                      <div className="doc-page">
                        <div className="doc-line w-70"></div>
                        <div className="doc-line w-90"></div>
                        <div className="doc-line w-50"></div>
                        <div className="scan-line"></div>
                      </div>
                    </div>
                    <div className="card-badge">NLP Automation</div>
                  </div>
                  <div className="project-info">
                    <h3>AI Resume Tailor</h3>
                    <p>Automated resume tailoring with web scraping &amp; prompt engineering. Matches CVs to JDs instantly.</p>
                  </div>
                </a>

                <a
                  href="https://github.com/Victordtesla24/relationship-timeline-feature"
                  target="_blank"
                  rel="noreferrer"
                  className="project-card"
                  data-preview="wave"
                  data-preview-label="D3 Visualization"
                >
                  <div className="project-image">
                    <div className="viz-waveform">
                      <div className="bar"></div>
                      <div className="bar"></div>
                      <div className="bar"></div>
                      <div className="bar"></div>
                      <div className="bar"></div>
                      <div className="bar"></div>
                      <div className="bar"></div>
                      <div className="bar"></div>
                      <div className="bar"></div>
                      <div className="bar"></div>
                      <div className="bar"></div>
                      <div className="bar"></div>
                      <div className="play-btn"></div>
                    </div>
                    <div className="card-badge">React / D3</div>
                  </div>
                  <div className="project-info">
                    <h3>Relationship Timeline</h3>
                    <p>React/TypeScript + D3 customer journey visualiser. Interactive temporal data visualization.</p>
                  </div>
                </a>

                <a
                  href="https://github.com/Victordtesla24/AI-Gmail-Mailbox-Manager"
                  target="_blank"
                  rel="noreferrer"
                  className="project-card"
                  data-preview="terminal"
                  data-preview-label="Inbox triage"
                >
                  <div className="project-image">
                    <div className="viz-terminal">
                      <div className="terminal-header">
                        <span className="dot red"></span>
                        <span className="dot yellow"></span>
                        <span className="dot green"></span>
                      </div>
                      <div className="terminal-body">
                        <div className="code-line">
                          <span className="c-purple">await</span> gmail.<span className="c-yellow">fetch</span>();
                        </div>
                        <div className="code-line">&gt; Analyzing sentiment...</div>
                        <div className="code-line">
                          &gt; Label: <span className="c-green">Urgent</span>
                        </div>
                        <div className="code-line">&gt; Draft created.</div>
                        <div className="code-line blink">_</div>
                      </div>
                    </div>
                    <div className="card-badge">TypeScript Automation</div>
                  </div>
                  <div className="project-info">
                    <h3>AI Gmail Manager</h3>
                    <p>Autonomous Gmail triage in TypeScript. Filters, labels, and drafts replies using LLMs.</p>
                  </div>
                </a>
              </div>
            </div>

            <div className="live-content">
              <div className="github-feed">
                <div className="section-subhead">Latest GitHub work</div>
                <div id="github-projects" className="repo-list" aria-live="polite"></div>
                <div className="repo-curated">
                  <div className="section-subhead">Featured repos</div>
                  <ul>
                    <li>
                      <a href="https://github.com/Victordtesla24/btr-demo" target="_blank" rel="noreferrer">
                        btr-demo
                      </a>{' '}
                      — BPHS Birth Time Rectification engine.
                    </li>
                    <li>
                      <a href="https://github.com/Victordtesla24/jyotish-shastra" target="_blank" rel="noreferrer">
                        jyotish-shastra
                      </a>{' '}
                      — Enterprise-grade Vedic Astrology platform.
                    </li>
                    <li>
                      <a href="https://github.com/Victordtesla24/rishi-prajnya" target="_blank" rel="noreferrer">
                        rishi-prajnya
                      </a>{' '}
                      — AI career guidance platform.
                    </li>
                    <li>
                      <a href="https://github.com/Victordtesla24/Birth-Time-Rectifier" target="_blank" rel="noreferrer">
                        Birth-Time-Rectifier
                      </a>{' '}
                      — AI-driven rectification system.
                    </li>
                    <li>
                      <a
                        href="https://github.com/Victordtesla24/Advanced-Prompt-Creator"
                        target="_blank"
                        rel="noreferrer"
                      >
                        Advanced-Prompt-Creator
                      </a>{' '}
                      — Privacy-first prompt engineering.
                    </li>
                  </ul>
                </div>
              </div>
              <div className="video-feed">
                <div className="section-subhead">YouTube stream</div>
                <div className="video-frame">
                  <iframe
                    title="Vicd0ct YouTube uploads"
                    src="https://www.youtube.com/embed/videoseries?list=UUJSYpoFkGKKzYTKzAr8vGzQ"
                    allowFullScreen
                    loading="lazy"
                  ></iframe>
                </div>
                <p className="video-note">
                  Latest drops from @vicd0ct. Live coding, algorithm archaeology, telemetry breakdowns.
                </p>
                <div className="video-list" id="video-list"></div>
              </div>
            </div>
          </div>
        </section>

        <section id="contact" className="contact-section" data-scroll-section>
          <div className="container">
            <div className="contact-wrapper">
              <h2 className="contact-title editable" data-key="contact-title">
                Let&apos;s ship AI/ML programs that stay fast, safe, and compliant.
              </h2>
              <div className="contact-links-grid">
                <a
                  href="mailto:sarkar.vikram@gmail.com"
                  className="contact-card email-card"
                  aria-label="Email sarkar.vikram@gmail.com"
                  title="Email sarkar.vikram@gmail.com"
                >
                  <span className="sr-only">Email Vikram at sarkar.vikram@gmail.com</span>
                </a>
                <a
                  href="tel:+61433224556"
                  className="contact-card phone-card"
                  aria-label="Call +61 433 224 556"
                  title="Call +61 433 224 556"
                >
                  <span className="sr-only">Call +61 433 224 556</span>
                </a>
              </div>
              <div className="social-links-large">
                <a href="https://github.com/Victordtesla24" target="_blank" rel="noreferrer" className="social-btn">
                  <span>GitHub</span>
                  <i className="fas fa-arrow-right"></i>
                </a>
                <a href="https://youtube.com/@vicd0ct" target="_blank" rel="noreferrer" className="social-btn">
                  <span>YouTube</span>
                  <i className="fas fa-arrow-right"></i>
                </a>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer>
        <div className="footer-content">
          <p>&copy; 2024 Vikram Deshpande. All rights reserved.</p>
        </div>
      </footer>

      <div id="terminal-overlay" className="terminal-overlay" aria-hidden="true">
        <div className="terminal-window">
          <div className="terminal-bar">
            <div className="terminal-dots">
              <span className="dot red"></span>
              <span className="dot yellow"></span>
              <span className="dot green"></span>
            </div>
            <div className="terminal-title">vikram.io // hidden terminal</div>
            <button id="terminal-close" aria-label="Close terminal">
              ×
            </button>
          </div>
          <div className="terminal-body" id="terminal-log" role="log">
            <div className="terminal-line">
              Type <span className="accent">help</span>, <span className="accent">sudo hire vic</span>,{' '}
              <span className="accent">stack</span>, or try the Konami code.
            </div>
          </div>
          <form id="terminal-form" autoComplete="off">
            <span className="prompt">vic@vikram.io:~$</span>
            <input
              id="terminal-input"
              type="text"
              spellCheck="false"
              aria-label="Terminal input"
              placeholder="help | sudo hire vic | stack"
            />
          </form>
        </div>
      </div>

      <Script src="/vendor/gsap.min.js" strategy="beforeInteractive" />
      <Script src="/vendor/ScrollTrigger.min.js" strategy="beforeInteractive" />
      <Script src="/vendor/lenis.min.js" strategy="beforeInteractive" />
      <Script type="module" src="/three-background.js" strategy="afterInteractive" />
      <Script src="/script.js" strategy="afterInteractive" />
    </>
  );
}
