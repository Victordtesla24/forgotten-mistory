'use client';

import React, { useEffect } from 'react';
import Script from 'next/script';

export default function Home() {
  return (
    <>
      {/* Three.js Background */}
      <canvas id="webgl" className="fixed top-0 left-0 w-full h-full -z-10"></canvas>

      {/* Admin Controls */}
      <div className="admin-controls fixed top-5 right-5 z-[10001]">
        <button id="toggle-edit-mode" className="btn-secondary">
          <i className="fas fa-pen"></i> Edit Mode
        </button>
        <button id="reset-content" className="btn-secondary hidden mt-2.5 bg-red-500/20 border-red-500/40">
          <i className="fas fa-undo"></i> Reset
        </button>
      </div>

      {/* Preloader */}
      <div className="preloader" role="status" aria-live="polite">
        <div className="preloader-inner">
          <div className="loader-ring"></div>
          <div className="counter">0</div>
          <div className="loader-copy">Calibrating stars & telemetry</div>
        </div>
      </div>

      {/* Cursor */}
      <div className="cursor-dot" data-cursor-dot></div>
      <div className="cursor-outline" data-cursor-outline></div>

      {/* Navigation */}
      <nav>
        <div className="logo editable" data-key="logo">VIKRAM.</div>
        <div className="menu-toggle">Menu</div>
        <div className="nav-overlay">
          <ul className="nav-links">
            <li><a href="#hero" className="nav-link">Home</a></li>
            <li><a href="#about" className="nav-link">About</a></li>
            <li><a href="#experience" className="nav-link">Experience</a></li>
            <li><a href="#skills" className="nav-link">Skills</a></li>
            <li><a href="#architecture-lab" className="nav-link">Architecture</a></li>
            <li><a href="#work" className="nav-link">Work</a></li>
            <li><a href="docs/Vik_Resume_Final.pdf" className="nav-link" target="_blank">Resume</a></li>
            <li><a href="#contact" className="nav-link">Contact</a></li>
          </ul>
        </div>
      </nav>

      <main>
        {/* Hero Section */}
        <section id="hero" className="hero-section" data-scroll-section>
          <div className="hero-content">
            <h1 className="hero-title">
              <span className="line">Hello, I'm</span>
              <span className="line reveal-text editable" data-key="hero-name">Vikram Deshpande</span>
            </h1>
            <div className="domain-chip">
              <span className="pill live">vikram.io</span>
              <span className="chip-text">Custom domain live. Goodbye forgotten-mistory.web.app</span>
            </div>
            <p className="hero-subtitle reveal-text-delay editable" data-key="hero-subtitle">
              I work as a Senior Technical Manager & AI Solution Architect here in Melbourne.<br/>
              I am really passionate about solving complex problems and leading teams through challenging projects.<br/><br/>
              Whether it's discussing the latest in Technology, debating philosophical ideas, or planning my next travel adventure, I love diving deep into topics that spark my genuine whimsy.<br/><br/>
              My approach towards life is very simple; I do what brings happiness & value, while making sure I do not cause hard to anyone or anything along the way...
            </p>
            <div className="hero-links reveal-text-delay">
              <a href="https://github.com/Victordtesla24" target="_blank" className="btn-link">GitHub</a>
              <a href="https://youtube.com/@vicd0ct" target="_blank" className="btn-link">YouTube</a>
              <a href="docs/Vik_Resume_Final.pdf" className="btn-link">Resume PDF</a>
              <a href="#contact" className="btn-primary">Let's Talk</a>
            </div>
            
            {/* Telemetry Panel */}
            <div className="telemetry-panel glass-card" id="telemetry-panel">
              <div className="telemetry-header">
                <div>
                  <p className="eyebrow">Live Telemetry</p>
                  <h3>System Status</h3>
                </div>
                <div className="telemetry-badges">
                  <span className="pill soft">Simulated</span>
                  <span className="pill accent">P95 <span data-latency>180 ms</span></span>
                </div>
              </div>
              <div className="telemetry-grid">
                <div className="telemetry-card">
                  <div className="telemetry-label">Edge latency (ANZ)</div>
                  <div className="telemetry-value" data-latency-number>0.180 s</div>
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
                    <li>Singapore · Vector cache</li>
                  </ul>
                  <p className="telemetry-note">Geo feed rotates every few seconds.</p>
                </div>
                <div className="telemetry-card telemetry-dual">
                  <div className="telemetry-dual-row">
                    <div>
                      <div className="telemetry-label">Server load</div>
                      <div className="telemetry-value" data-load>32%</div>
                    </div>
                    <div>
                      <div className="telemetry-label">Coffee consumed</div>
                      <div className="telemetry-value" data-coffee>1.0 cups</div>
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
              {/* Meta Cards */}
              <div className="meta-card glass-card">
                <div className="meta-icon"><i className="fas fa-cloud-upload-alt"></i></div>
                <div className="meta-content">
                  <span className="meta-label">Cloud Modernisation</span>
                  <div className="meta-stats">
                    <span className="meta-value">-30%</span>
                    <span className="meta-subvalue">Delivery</span>
                  </div>
                  <span className="meta-note">Faster ROI & leaner infra spend on regulated programs.</span>
                </div>
              </div>
              {/* Add other meta cards similarly if needed, skipping for brevity to focus on core structure */}
            </div>
          </div>
          
          <div className="hero-image-container parallax" data-speed="0.1">
            <div className="avatar-placeholder" id="avatar-container">
              <div className="avatar-circle">
                <img src="assets/my_avatar.png" alt="Vikram Deshpande headshot" className="avatar-img" id="profile-image" />
              </div>
              <input type="file" id="image-upload" accept="image/*" style={{ display: 'none' }} />
              <button id="upload-btn" className="btn-icon"><i className="fas fa-camera"></i></button>
            </div>
          </div>
        </section>

        {/* About Section */}
        <section id="about" className="about-section" data-scroll-section>
          <div className="container">
            <div className="section-header">
              <h2 className="section-title editable" data-key="about-title">About Me</h2>
            </div>
            <div className="about-content">
              <p className="about-text editable" data-key="about-text-1">
                15+ year Senior Technical Delivery Leader & AI/ML Solutions Architect (CSM) across Financial Services and Telecommunications...
              </p>
              {/* Additional about content */}
            </div>
          </div>
        </section>

        {/* Work Section */}
        <section id="work" className="work-section" data-scroll-section>
            <div className="container">
                <div className="section-header">
                    <h2 className="section-title editable" data-key="work-title">Current Projects in the Pipeline</h2>
                </div>
                
                <div className="carousel-wrapper">
                    <div className="projects-carousel" id="projects-carousel">
                        {/* Projects will be hydrated or placed here */}
                        <a href="https://github.com/Victordtesla24/EFDDH-Jira-Analytics-Dashboard" target="_blank" className="project-card" data-preview="chart" data-preview-label="Velocity charts">
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
                        {/* More projects... */}
                    </div>
                </div>
            </div>
        </section>

        {/* Contact */}
        <section id="contact" className="contact-section" data-scroll-section>
            <div className="container">
                <div className="contact-wrapper">
                    <h2 className="contact-title editable" data-key="contact-title">Let’s ship AI/ML programs that stay fast, safe, and compliant.</h2>
                    <div className="social-links-large">
                        <a href="https://github.com/Victordtesla24" target="_blank" className="social-btn">
                            <span>GitHub</span>
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

      {/* Konami / Terminal Easter Egg */}
      <div id="terminal-overlay" className="terminal-overlay" aria-hidden="true">
        <div className="terminal-window">
            <div className="terminal-bar">
                <div className="terminal-dots">
                    <span className="dot red"></span><span className="dot yellow"></span><span className="dot green"></span>
                </div>
                <div className="terminal-title">vikram.io // hidden terminal</div>
                <button id="terminal-close" aria-label="Close terminal">×</button>
            </div>
            <div className="terminal-body" id="terminal-log" role="log">
                <div className="terminal-line">Type <span className="accent">help</span>, <span className="accent">sudo hire vic</span>, <span className="accent">stack</span>, or try the Konami code.</div>
            </div>
            <form id="terminal-form" autoComplete="off">
                <span className="prompt">vic@vikram.io:~$</span>
                <input id="terminal-input" type="text" spellCheck="false" aria-label="Terminal input" placeholder="help | sudo hire vic | stack" />
            </form>
        </div>
      </div>

      {/* Load Scripts */}
      <Script src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.2/gsap.min.js" strategy="beforeInteractive" />
      <Script src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.2/ScrollTrigger.min.js" strategy="beforeInteractive" />
      <Script src="https://unpkg.com/lenis@1.0.45/dist/lenis.min.js" strategy="beforeInteractive" />
      <Script type="module" src="three-background.js" strategy="lazyOnload" />
      <Script src="script.js" strategy="lazyOnload" />
    </>
  );
}

