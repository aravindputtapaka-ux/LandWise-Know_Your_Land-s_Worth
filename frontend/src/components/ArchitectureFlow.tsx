import { useEffect, useRef, useState } from 'react';
import { Maximize2, Minimize2 } from 'lucide-react';
import './ArchitectureFlow.css';

type Node = { title: string; subtitle: string; details?: string[]; tag?: string };
type Stage = { label: string; heading: string; intro: string; nodes: Node[] };

const stages: Stage[] = [
  { label: '01 · ENTRY', heading: 'The user enters LandWise', intro: 'The journey begins in the browser.', nodes: [
    { title: 'Users & Guests', subtitle: 'Explore the landing page, documentation and property tools.', tag: 'Browser' },
    { title: 'React + TypeScript + Vite', subtitle: 'Cinematic landing page, interactive globe, estimator, affordability, maps, chatbot and history.', tag: 'Frontend' },
  ] },
  { label: '02 · COMMUNICATION', heading: 'The frontend talks to the backend', intro: 'Requests travel through HTTPS as JSON.', nodes: [
    { title: 'FastAPI + Python + Pydantic', subtitle: 'Request validation, routing, authentication and application logic.', tag: 'REST API' },
  ] },
  { label: '03 · ROUTING', heading: 'Choose the processing path', intro: 'FastAPI sends each request to the appropriate service.', nodes: [
    { title: 'Authentication', subtitle: 'Signup, login, OTP verification and password reset.', details: ['Hash passwords and validate credentials', 'Brevo HTTPS API sends email OTP', 'MongoDB stores user and verification data', 'JWT protects authenticated endpoints'], tag: 'Identity' },
    { title: 'Property Valuation', subtitle: 'Evidence-first property price estimation.', details: ['Validate property type, area, unit, BHK and location', 'Normalize locality and check MongoDB market cache', 'On cache miss: Tavily Search / Extract', 'Validate source price + area + locality', 'Calculate market rate × area; optionally use validated historical ML', 'Return estimate, range, sources or insufficient-evidence response'], tag: 'Estimator' },
    { title: 'Affordability', subtitle: 'Translate a budget into estimated purchasable property area.', details: ['Use user budget and property preferences', 'Apply validated market rates', 'Calculate affordable area or options'], tag: 'Planning' },
    { title: 'RAG Chatbot', subtitle: 'Grounded explanations with relevant property and knowledge context.', details: ['Classify informational questions versus price requests', 'Retrieve selected property, knowledge and conversation context', 'Use Gemini for explanations, not invented property valuations', 'Return readable answers and evidence citations'], tag: 'AI Assistant' },
    { title: 'Search History', subtitle: 'Retrieve saved property estimates for the authenticated user.', tag: 'History' },
  ] },
  { label: '04 · INTEGRATIONS', heading: 'Data and external intelligence', intro: 'Services access persistent data and trusted external providers.', nodes: [
    { title: 'MongoDB', subtitle: 'Users, market-rate cache, saved searches, conversations, messages and knowledge chunks.', tag: 'Database' },
    { title: 'Tavily', subtitle: 'Search and extract current market evidence from external sources.', tag: 'Research API' },
    { title: 'Google Gemini', subtitle: 'Generate grounded natural-language chatbot explanations.', tag: 'LLM' },
    { title: 'Brevo', subtitle: 'Deliver verification and password-reset OTP emails.', tag: 'Email API' },
    { title: 'OpenStreetMap / Mapping', subtitle: 'Display and explore geographic locations.', tag: 'Geospatial' },
  ] },
  { label: '05 · RESPONSE', heading: 'Results return to the user', intro: 'The backend sends structured JSON for the frontend to present.', nodes: [
    { title: 'LandWise Results', subtitle: 'Property estimates, affordability insights, AI answers, authentication status and search history.', tag: 'Response' },
  ] },
  { label: '06 · OPERATIONS', heading: 'Deployment and reliability', intro: 'The application is deployed and operated as connected services.', nodes: [
    { title: 'GitHub → Render', subtitle: 'Source-controlled frontend and FastAPI backend deployment.', tag: 'Cloud' },
    { title: 'Environment & Monitoring', subtitle: 'API credentials, JWT secrets, request latency, errors and third-party service health.', tag: 'Operations' },
  ] },
];

export default function ArchitectureFlow() {
  const rootRef = useRef<HTMLElement>(null);
  const [progress, setProgress] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const elements = Array.from(root.querySelectorAll<HTMLElement>('[data-reveal]'));
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reducedMotion || !('IntersectionObserver' in window)) {
      elements.forEach((el) => el.classList.add('is-visible'));
      return;
    }
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -45px 0px' });
    elements.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [isFullscreen]);

  useEffect(() => {
    const update = () => {
      const el = rootRef.current;
      if (!el) return;
      const viewport = isFullscreen ? el.clientHeight : window.innerHeight;
      const total = Math.max(1, el.scrollHeight - viewport);
      if (isFullscreen) {
        setProgress(Math.min(100, Math.max(0, (el.scrollTop / total) * 100)));
      } else {
        const rect = el.getBoundingClientRect();
        const distance = Math.max(1, rect.height - window.innerHeight * 0.65);
        const traveled = window.innerHeight * 0.35 - rect.top;
        setProgress(Math.min(100, Math.max(0, (traveled / distance) * 100)));
      }
    };
    const el = rootRef.current;
    update();
    window.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', update);
    el?.addEventListener('scroll', update, { passive: true });
    return () => {
      window.removeEventListener('scroll', update);
      window.removeEventListener('resize', update);
      el?.removeEventListener('scroll', update);
    };
  }, [isFullscreen]);

  useEffect(() => {
    if (!isFullscreen) return;
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setIsFullscreen(false);
    };
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.body.style.overflow = originalOverflow;
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [isFullscreen]);

  const toggleFullscreen = () => {
    setIsFullscreen((previous) => !previous);
    if (rootRef.current) rootRef.current.scrollTop = 0;
  };

  return (
    <section
      className={`lw-architecture${isFullscreen ? ' lw-architecture-expanded' : ''}`}
      ref={rootRef}
      aria-labelledby="lw-architecture-title"
      role={isFullscreen ? 'dialog' : undefined}
      aria-modal={isFullscreen ? true : undefined}
    >
      <button
        type="button"
        className="lw-architecture-fullscreen-btn"
        onClick={toggleFullscreen}
        aria-label={isFullscreen ? 'Exit fullscreen architecture' : 'View architecture fullscreen'}
        title={isFullscreen ? 'Exit fullscreen (Esc)' : 'View fullscreen'}
        aria-pressed={isFullscreen}
      >
        {isFullscreen ? <Minimize2 size={19} /> : <Maximize2 size={19} />}
      </button>
      <div className="lw-architecture-heading" data-reveal>
        <span className="lw-architecture-eyebrow">LANDWISE AI / SYSTEM DESIGN</span>
        <h2 id="lw-architecture-title">From a question to <em>clarity.</em></h2>
        <p>Follow a request through the entire LandWise architecture. Scroll to trace how each layer connects.</p>
      </div>
      <div className="lw-architecture-timeline">
        <div className="lw-architecture-rail" aria-hidden="true"><div className="lw-architecture-rail-progress" style={{ height: `${progress}%` }} /></div>
        {stages.map((stage, index) => (
          <section className="lw-architecture-stage" key={stage.label} aria-label={stage.heading}>
            <div className="lw-architecture-marker" aria-hidden="true">{String(index + 1).padStart(2, '0')}</div>
            <div className="lw-architecture-stage-content">
              <header className="lw-architecture-stage-header" data-reveal>
                <span className="lw-architecture-stage-label">{stage.label}</span>
                <h3>{stage.heading}</h3>
                <p>{stage.intro}</p>
              </header>
              <div className={`lw-architecture-cards ${stage.nodes.length > 1 ? 'lw-architecture-cards-grid' : ''}`}>
                {stage.nodes.map((node) => (
                  <article className="lw-architecture-card" key={node.title} data-reveal>
                    <span className="lw-architecture-card-tag">{node.tag}</span>
                    <h4>{node.title}</h4>
                    <p>{node.subtitle}</p>
                    {node.details && <ul>{node.details.map((detail) => <li key={detail}>{detail}</li>)}</ul>}
                  </article>
                ))}
              </div>
              {index < stages.length - 1 && <div className="lw-architecture-next" aria-hidden="true">↓</div>}
            </div>
          </section>
        ))}
      </div>
      <p className="lw-architecture-note">Architecture overview. Actual collection names, endpoint paths and optional ML behavior should be verified against the deployed source.</p>
    </section>
  );
}
