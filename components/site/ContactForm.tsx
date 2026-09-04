'use client';

import { useCallback, useEffect, useRef, useState, type FormEvent } from 'react';
import { contact, contactForm } from '@/app/data/siteContent';

/**
 * ContactForm — the first on-site path that can actually complete a contact
 * action (D-CONTACT-02).
 *
 * Before this component existed the page contained exactly one <form> (the
 * HiddenTerminal easter egg) and every contact affordance was a bare `mailto:`.
 * On a machine with no registered mail handler a `mailto:` click emits zero HTTP
 * traffic, no navigation and no confirmation — the visitor believes they made
 * contact and nothing happened. Three fields plus a same-origin POST removes that
 * failure mode; the copyable direct channels below the form remove it for the
 * `mailto:` CTAs that still live elsewhere in the section.
 *
 * Delivery path — the site is a Next.js static export on Firebase Hosting, so
 * `app/api/*` route handlers do NOT run in production. The only submission target
 * that works from this host without leaking a credential into the browser bundle
 * is a same-origin POST that Hosting rewrites to a Cloud Function, exactly like
 * the existing `/api/chat` -> `minivicChat` rewrite. Same-origin also keeps the
 * request inside the deployed CSP (`connect-src 'self' …`), which would block any
 * third-party form vendor outright.
 *
 * Truthfulness — the UI reports `sent` ONLY when the endpoint answered 2xx with
 * `application/json` and `{ ok: true }`. A 404 (the endpoint is not deployed yet),
 * an HTML body, a non-2xx, a malformed body, a timeout or a network error all
 * land in a terminal failure state that keeps the typed text, offers a prefilled
 * mail draft, and exposes the raw address for copy/paste. Optimistic success is
 * never shown.
 *
 * Reduced motion — the only animation is the "sending" pulse, disabled by the
 * `prefers-reduced-motion` block in globals.css. The form itself is never
 * animated in: a conversion-critical control must not depend on a scroll trigger
 * or an opacity tween to become visible.
 */

/**
 * Same-origin by default so Firebase Hosting can rewrite it to a Cloud Function.
 * Overridable at build time for a non-Firebase deployment. This is a URL path,
 * never a credential — nothing secret may ever be routed through a NEXT_PUBLIC_*
 * variable, since those are inlined verbatim into the client bundle.
 */
const CONTACT_ENDPOINT = process.env.NEXT_PUBLIC_CONTACT_ENDPOINT || '/api/contact';

/** Abort a hung request rather than leaving the visitor on "Sending…" forever. */
const REQUEST_TIMEOUT_MS = 12_000;

/** How long a clipboard confirmation stays in the live region. */
const COPY_NOTICE_MS = 6_000;

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type FieldName = 'name' | 'email' | 'message';

const FIELD_ORDER: readonly FieldName[] = ['name', 'email', 'message'];

type FieldValues = Record<FieldName, string>;
type FieldErrors = Partial<Record<FieldName, string>>;

const EMPTY_VALUES: FieldValues = { name: '', email: '', message: '' };

/**
 * `idle` → `submitting` → (`sent` | `failed`); `invalid` is the pre-flight branch
 * where client validation stopped the request before it left the browser.
 */
type FormState = 'idle' | 'invalid' | 'submitting' | 'sent' | 'failed';

/** Why a send failed. `unavailable` = no endpoint answered; `rejected` = it refused. */
type FailureReason = 'unavailable' | 'rejected';

type DeliveryOutcome = { delivered: true } | { delivered: false; reason: FailureReason };

function validate(values: FieldValues): FieldErrors {
  const errors: FieldErrors = {};
  if (!values.name.trim()) errors.name = contactForm.nameRequired;
  const email = values.email.trim();
  if (!email) errors.email = contactForm.emailRequired;
  else if (!EMAIL_PATTERN.test(email)) errors.email = contactForm.emailInvalid;
  if (!values.message.trim()) errors.message = contactForm.messageRequired;
  return errors;
}

/**
 * POSTs the message and reports what actually happened. Resolves (never rejects)
 * so the caller can always render a truthful terminal state.
 *
 * A static host answers an unrouted POST with its 404 HTML page; a Hosting rewrite
 * that lost its function answers with HTML too. Both are reported as `unavailable`
 * rather than being mistaken for a delivery.
 */
async function deliverContactMessage(values: FieldValues): Promise<DeliveryOutcome> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    const response = await fetch(CONTACT_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      signal: controller.signal,
      body: JSON.stringify({
        name: values.name.trim(),
        email: values.email.trim(),
        message: values.message.trim(),
      }),
    });

    if (response.status === 404 || response.status === 405 || response.status === 501) {
      return { delivered: false, reason: 'unavailable' };
    }
    if (!(response.headers.get('content-type') || '').includes('application/json')) {
      return { delivered: false, reason: 'unavailable' };
    }

    let body: { ok?: boolean };
    try {
      body = (await response.json()) as { ok?: boolean };
    } catch {
      return { delivered: false, reason: 'unavailable' };
    }

    if (!response.ok || body.ok !== true) return { delivered: false, reason: 'rejected' };
    return { delivered: true };
  } catch {
    // Network error, CSP block, or the 12s abort above.
    return { delivered: false, reason: 'unavailable' };
  } finally {
    clearTimeout(timer);
  }
}

/** A mail draft that carries whatever the visitor already typed, so nothing is retyped. */
function buildDraftHref(values: FieldValues): string {
  const subject = values.name.trim()
    ? `${contactForm.draftSubject} — ${values.name.trim()}`
    : contactForm.draftSubject;
  const body = [values.message.trim(), '', `Reply to: ${values.email.trim()}`]
    .join('\n')
    .trim();
  return `mailto:${contact.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}

/** Display form of the LinkedIn profile — the full URL is what gets copied. */
const LINKEDIN_DISPLAY = contact.linkedin.replace(/^https?:\/\/(?:www\.)?/, '');

/**
 * Literal ids rather than `useId()`: the component is mounted exactly once (inside
 * ContactScroll) and `useId()` emits colon-delimited values that are not valid in a
 * CSS selector, which would make the error text unaddressable from styling and
 * tests. Matches the existing `#terminal-input` convention in this tree.
 */
const ID_PREFIX = 'contact-form';
const HEADING_ID = `${ID_PREFIX}-heading`;
const MESSAGE_HINT_ID = `${ID_PREFIX}-message-hint`;
const fieldId = (field: FieldName) => `${ID_PREFIX}-${field}`;
const errorId = (field: FieldName) => `${ID_PREFIX}-${field}-error`;

export default function ContactForm() {
  const [values, setValues] = useState<FieldValues>(EMPTY_VALUES);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [state, setState] = useState<FormState>('idle');
  const [failure, setFailure] = useState<FailureReason>('unavailable');
  const [copyNotice, setCopyNotice] = useState('');

  const nameRef = useRef<HTMLInputElement>(null);
  const emailRef = useRef<HTMLInputElement>(null);
  const messageRef = useRef<HTMLTextAreaElement>(null);
  const copyTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  /** The values as sent — the draft link must reflect them even after a reset. */
  const sentValues = useRef<FieldValues>(EMPTY_VALUES);

  useEffect(() => () => {
    if (copyTimer.current) clearTimeout(copyTimer.current);
  }, []);

  const focusField = useCallback((field: FieldName) => {
    if (field === 'name') nameRef.current?.focus();
    else if (field === 'email') emailRef.current?.focus();
    else messageRef.current?.focus();
  }, []);

  const setField = useCallback((field: FieldName, value: string) => {
    setValues((prev) => ({ ...prev, [field]: value }));
    // Clear a field's error as soon as the visitor starts fixing it; re-validation
    // happens on the next submit so error text never appears mid-keystroke.
    setErrors((prev) => (prev[field] ? { ...prev, [field]: undefined } : prev));
    // Retract the "check the highlighted fields" summary once they act on it.
    // A `failed` send is NOT retracted: nothing was delivered, and the recovery
    // draft link must stay reachable while they retype.
    setState((prev) => (prev === 'invalid' ? 'idle' : prev));
  }, []);

  const validateField = useCallback((field: FieldName) => {
    const fieldErrors = validate(values);
    setErrors((prev) => ({ ...prev, [field]: fieldErrors[field] }));
  }, [values]);

  const handleSubmit = useCallback(
    async (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      if (state === 'submitting') return;

      const nextErrors = validate(values);
      setErrors(nextErrors);
      const firstInvalid = FIELD_ORDER.find((field) => nextErrors[field]);
      if (firstInvalid) {
        setState('invalid');
        focusField(firstInvalid);
        return;
      }

      setState('submitting');
      sentValues.current = values;
      const outcome = await deliverContactMessage(values);
      if (outcome.delivered) {
        setState('sent');
        setValues(EMPTY_VALUES);
        return;
      }
      setFailure(outcome.reason);
      setState('failed');
    },
    [focusField, state, values],
  );

  const handleReset = useCallback(() => {
    setState('idle');
    setErrors({});
    setValues(EMPTY_VALUES);
    focusField('name');
  }, [focusField]);

  const copyValue = useCallback(async (value: string, label: string) => {
    if (copyTimer.current) clearTimeout(copyTimer.current);
    const clipboard = typeof navigator === 'undefined' ? null : navigator.clipboard;
    if (!clipboard) {
      setCopyNotice(contactForm.copyUnsupported);
    } else {
      try {
        await clipboard.writeText(value);
        setCopyNotice(`${label} copied to the clipboard.`);
      } catch {
        setCopyNotice(contactForm.copyFailed);
      }
    }
    copyTimer.current = setTimeout(() => setCopyNotice(''), COPY_NOTICE_MS);
  }, []);

  const busy = state === 'submitting';
  // Error text is announced before the hint — the correction matters more than the prompt.
  const describedBy = (field: FieldName, extra?: string) =>
    [errors[field] ? errorId(field) : null, extra].filter(Boolean).join(' ') || undefined;

  return (
    <div className="container">
      <div className="contact-console" data-contact-state={state}>
        <h2 id={HEADING_ID} className="contact-console-title">
          {contactForm.heading}
        </h2>
        <p className="contact-console-lead">{contactForm.lead}</p>

        <form className="contact-form" noValidate onSubmit={handleSubmit} aria-labelledby={HEADING_ID}>
          <div className="contact-field">
            <label className="contact-field-label" htmlFor={fieldId('name')}>
              {contactForm.nameLabel}
            </label>
            <input
              ref={nameRef}
              id={fieldId('name')}
              name="name"
              type="text"
              className="contact-field-input"
              autoComplete="name"
              required
              aria-required="true"
              aria-invalid={errors.name ? true : undefined}
              aria-describedby={describedBy('name')}
              value={values.name}
              onChange={(event) => setField('name', event.target.value)}
              onBlur={() => validateField('name')}
            />
            {errors.name ? (
              <p className="contact-field-error" id={errorId('name')}>
                {errors.name}
              </p>
            ) : null}
          </div>

          <div className="contact-field">
            <label className="contact-field-label" htmlFor={fieldId('email')}>
              {contactForm.emailLabel}
            </label>
            <input
              ref={emailRef}
              id={fieldId('email')}
              name="email"
              type="email"
              className="contact-field-input"
              autoComplete="email"
              inputMode="email"
              required
              aria-required="true"
              aria-invalid={errors.email ? true : undefined}
              aria-describedby={describedBy('email')}
              value={values.email}
              onChange={(event) => setField('email', event.target.value)}
              onBlur={() => validateField('email')}
            />
            {errors.email ? (
              <p className="contact-field-error" id={errorId('email')}>
                {errors.email}
              </p>
            ) : null}
          </div>

          <div className="contact-field contact-field--full">
            <label className="contact-field-label" htmlFor={fieldId('message')}>
              {contactForm.messageLabel}
            </label>
            <textarea
              ref={messageRef}
              id={fieldId('message')}
              name="message"
              className="contact-field-input contact-field-textarea"
              rows={4}
              autoComplete="off"
              required
              aria-required="true"
              aria-invalid={errors.message ? true : undefined}
              aria-describedby={describedBy('message', MESSAGE_HINT_ID)}
              value={values.message}
              onChange={(event) => setField('message', event.target.value)}
              onBlur={() => validateField('message')}
            />
            <p className="contact-field-hint" id={MESSAGE_HINT_ID}>
              {contactForm.messageHint}
            </p>
            {errors.message ? (
              <p className="contact-field-error" id={errorId('message')}>
                {errors.message}
              </p>
            ) : null}
          </div>

          <button
            type="submit"
            className="btn-primary contact-form-submit"
            disabled={busy}
            aria-busy={busy}
          >
            {busy ? contactForm.submittingLabel : contactForm.submitLabel}
          </button>
        </form>

        {/* Single live region for the whole send state machine. Present from first
            paint so assistive tech is subscribed before the first transition. */}
        <div
          className="contact-form-status"
          data-state={state}
          role="status"
          aria-live="polite"
          aria-atomic="true"
        >
          {state === 'submitting' ? (
            <p className="contact-form-status-line">{contactForm.submittingStatus}</p>
          ) : null}

          {state === 'invalid' ? (
            <p className="contact-form-status-line">{contactForm.errorSummary}</p>
          ) : null}

          {state === 'sent' ? (
            <div className="contact-form-outcome">
              <p className="contact-form-outcome-title">{contactForm.successTitle}</p>
              <p className="contact-form-outcome-body">{contactForm.successBody}</p>
              <button type="button" className="contact-form-reset" onClick={handleReset}>
                {contactForm.resetLabel}
              </button>
            </div>
          ) : null}

          {state === 'failed' ? (
            <div className="contact-form-outcome">
              <p className="contact-form-outcome-title">
                {failure === 'unavailable' ? contactForm.unavailableTitle : contactForm.rejectedTitle}
              </p>
              <p className="contact-form-outcome-body">
                {failure === 'unavailable' ? contactForm.unavailableBody : contactForm.rejectedBody}
              </p>
              <a className="contact-form-draft" href={buildDraftHref(sentValues.current)}>
                {contactForm.draftLabel}
              </a>
            </div>
          ) : null}
        </div>

        {/* Always-visible, always-copyable channels. A `mailto:` link can be a
            silent no-op; a selectable address never is. */}
        <div className="contact-direct">
          <p className="contact-direct-heading">{contactForm.directHeading}</p>
          <ul className="contact-direct-list">
            <li className="contact-direct-row">
              <span className="contact-direct-label">{contactForm.emailChannelLabel}</span>
              <span className="contact-direct-value">{contact.email}</span>
              <button
                type="button"
                className="contact-direct-action"
                onClick={() => copyValue(contact.email, contactForm.emailChannelLabel)}
              >
                {contactForm.copyEmailLabel}
              </button>
            </li>
            <li className="contact-direct-row">
              <span className="contact-direct-label">{contactForm.linkedinChannelLabel}</span>
              <span className="contact-direct-value">{LINKEDIN_DISPLAY}</span>
              <button
                type="button"
                className="contact-direct-action"
                onClick={() => copyValue(contact.linkedin, contactForm.linkedinChannelLabel)}
              >
                {contactForm.copyLinkedinLabel}
              </button>
              <a
                className="contact-direct-action contact-direct-link"
                href={contact.linkedin}
                target="_blank"
                rel="noreferrer"
              >
                {contactForm.openLinkedinLabel}
              </a>
            </li>
          </ul>
          <p className="contact-copy-status" role="status" aria-live="polite" aria-atomic="true">
            {copyNotice}
          </p>
        </div>
      </div>
    </div>
  );
}
