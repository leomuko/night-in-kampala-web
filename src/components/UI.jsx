import { useId } from 'react';

export function Button({ children, variant = 'primary', className = '', type = 'button', ...props }) {
  return <button type={type} className={`button button--${variant} ${className}`} {...props}>{children}</button>;
}

export function Field({ label, error, hint, id: suppliedId, ...props }) {
  const generatedId = useId();
  const id = suppliedId || generatedId;
  const description = error ? `${id}-error` : hint ? `${id}-hint` : undefined;
  return <div className="field">
    <label htmlFor={id}>{label}</label>
    <input id={id} aria-invalid={error ? 'true' : undefined} aria-describedby={description} {...props} />
    {hint && !error && <p id={`${id}-hint`} className="helper">{hint}</p>}
    {error && <p id={`${id}-error`} role="alert" className="field-error">{error}</p>}
  </div>;
}

export function Select({ label, children, id: suppliedId, ...props }) {
  const generatedId = useId();
  const id = suppliedId || generatedId;
  return <div className="field"><label htmlFor={id}>{label}</label><select id={id} {...props}>{children}</select></div>;
}

export function Badge({ children }) { return <span className="badge">{children}</span>; }

export function Accordion({ title, children, open = false }) {
  return <details className="accordion" open={open}><summary>{title}</summary><div>{children}</div></details>;
}

export function LoadingState({ children = 'Loading…' }) {
  return <p className="status" role="status"><span className="loading-mark" aria-hidden="true" />{children}</p>;
}

export function ErrorState({ children, onRetry }) {
  return <div className="error-state" role="alert"><p>{children}</p>{onRetry && <Button variant="secondary" onClick={onRetry}>Try again</Button>}</div>;
}
