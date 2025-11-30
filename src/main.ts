import { gsap } from 'gsap';
import { initScene } from './components/ThreeScene';
import './style.css';

const app = document.querySelector<HTMLDivElement>('#app');

if (app) {
  app.innerHTML = `
    <main class="page">
      <section class="hero glass-panel">
        <p class="eyebrow">Space / Mystery</p>
        <h1>Forgotten Mistory</h1>
        <p class="lede">
          A monochrome bridge into the unknown. You are drifting through a time warp
          while ghost signals flicker across the hull.
        </p>
        <div class="cta-row">
          <button class="btn-solid">Launch Sequence</button>
          <button class="btn-outline">Open Logs</button>
        </div>
      </section>

      <section class="panel-grid">
        <div class="glass-panel panel-card">
          <h2>Signal Trace</h2>
          <p>Encoded transmissions scatter as the warp field stretches starlight into threads.</p>
          <p class="footnote">Tracking parity drift, ghost echoes, and magnetic residue.</p>
        </div>

        <div class="glass-panel panel-card">
          <h2>Telemetry</h2>
          <ul class="telemetry">
            <li><span>Velocity</span><span>0.92c</span></li>
            <li><span>Integrity</span><span>99.2%</span></li>
            <li><span>Entropy</span><span>Low / Stable</span></li>
          </ul>
        </div>

        <div class="glass-panel panel-card">
          <h2>Briefing</h2>
          <p>
            Maintain radio silence while the field stabilizes. The monochrome corridor is
            thin; trust the instruments and keep eyes on the warp path.
          </p>
        </div>
      </section>
    </main>
  `;
}

const teardownScene = initScene();
const mainContent = document.querySelector('.page');

if (mainContent) {
  requestAnimationFrame(() => {
    gsap.from(mainContent, {
      opacity: 0,
      y: 30,
      duration: 1.5,
      ease: 'power3.out'
    });
  });
}

window.addEventListener('beforeunload', () => teardownScene());
