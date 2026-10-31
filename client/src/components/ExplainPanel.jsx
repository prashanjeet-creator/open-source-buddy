import Markdown from './Markdown.jsx';
import CopyPlanButton from './CopyPlanButton.jsx';

export default function ExplainPanel({ result, error }) {
  if (error) {
    return (
      <div className="error" role="alert">
        {error}
      </div>
    );
  }
  if (!result) return null;

  return (
    <section className="explain" aria-label="AI explanation">
      <div className="explain-head">
        <span className="provider">AI provider: {result.provider}</span>
        <CopyPlanButton plan={result.plan} explanation={result.markdown} />
      </div>
      <Markdown text={result.markdown} />
    </section>
  );
}
