import { useEffect, useRef, useState } from 'react';

export default function CopyPlanButton({ plan, explanation }) {
  const [status, setStatus] = useState('');
  const timeout = useRef(null);
  const steps = Array.isArray(plan) ? plan.filter((step) => typeof step === 'string' && step.trim()) : [];
  const text = steps.length
    ? steps.map((step, index) => `${index + 1}. ${step.trim()}`).join('\n')
    : typeof explanation === 'string'
      ? explanation.trim()
      : '';

  useEffect(() => () => clearTimeout(timeout.current), []);

  async function copyText() {
    if (!text) return;

    if (!navigator.clipboard?.writeText) {
      setStatus('Clipboard unavailable');
      return;
    }

    try {
      await navigator.clipboard.writeText(text);
      setStatus('Copied!');
      clearTimeout(timeout.current);
      timeout.current = setTimeout(() => setStatus(''), 2000);
    } catch {
      setStatus('Copy failed');
    }
  }

  return (
    <>
      <button className="btn" type="button" onClick={copyText} disabled={!text}>
        {status === 'Copied!' ? status : steps.length ? 'Copy plan' : 'Copy explanation'}
      </button>
      <span role="status" aria-live="polite">
        {status}
      </span>
    </>
  );
}
