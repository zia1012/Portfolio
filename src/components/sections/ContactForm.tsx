"use client";

import { useRef, useState, type FormEvent } from "react";
import { Button } from "@/components/ui/Button";
import { uiText } from "@/lib/ui-text";

type Field = "name" | "email" | "message";
type Errors = Partial<Record<Field, string>>;
type Status = "idle" | "sending" | "success" | "error" | "not-connected";

const text = uiText.contactForm;
const FIELDS: Field[] = ["name", "email", "message"];
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
// Inlined at build time. Unset → the form validates but points people to email instead.
const FORMSPREE_ID = process.env.NEXT_PUBLIC_FORMSPREE_ID;

function validate(data: FormData): Errors {
  const errors: Errors = {};
  const name = String(data.get("name") ?? "").trim();
  const email = String(data.get("email") ?? "").trim();
  const message = String(data.get("message") ?? "").trim();
  if (!name) errors.name = text.nameRequired;
  if (!email) errors.email = text.emailRequired;
  else if (!EMAIL_PATTERN.test(email)) errors.email = text.emailInvalid;
  if (!message) errors.message = text.messageRequired;
  return errors;
}

// Underline inputs: the muted bottom border marks the field (3:1+ over the scrim); focus
// thickens it to a 2px accent line (box-shadow, so nothing shifts) with a light tint.
// Invalid fields get the same 2px accent line, so the error is not a colour change alone.
const inputClasses =
  "mt-1 block w-full rounded-none border-0 border-b border-text-muted bg-transparent px-0 py-3 text-base text-text placeholder:text-text-muted transition-[border-color,box-shadow,background-color] duration-200 focus-visible:border-accent focus-visible:bg-accent/5 focus-visible:shadow-[0_1px_0_0_var(--color-accent)] focus-visible:outline-hidden aria-[invalid=true]:border-accent aria-[invalid=true]:shadow-[0_1px_0_0_var(--color-accent)]";

export function ContactForm({ email }: { email: string }) {
  const formRef = useRef<HTMLFormElement>(null);
  const [errors, setErrors] = useState<Errors>({});
  const [status, setStatus] = useState<Status>("idle");

  function clearError(field: Field) {
    setErrors((current) => (current[field] ? { ...current, [field]: undefined } : current));
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    const nextErrors = validate(data);
    setErrors(nextErrors);

    const firstInvalid = FIELDS.find((field) => nextErrors[field]);
    if (firstInvalid) {
      form.querySelector<HTMLElement>(`[name="${firstInvalid}"]`)?.focus();
      setStatus("idle");
      return;
    }

    if (!FORMSPREE_ID) {
      setStatus("not-connected");
      return;
    }

    setStatus("sending");
    try {
      const response = await fetch(`https://formspree.io/f/${FORMSPREE_ID}`, {
        method: "POST",
        headers: { Accept: "application/json" },
        body: data,
      });
      if (!response.ok) throw new Error(`Formspree responded ${response.status}`);
      formRef.current?.reset();
      setStatus("success");
    } catch {
      setStatus("error");
    }
  }

  const describedBy = (field: Field) => (errors[field] ? `${field}-error` : undefined);

  return (
    <div className="mt-14">
      <h3 className="text-xl font-bold">{text.heading}</h3>
      <form ref={formRef} noValidate onSubmit={onSubmit} className="mt-6 grid gap-8">
        <div>
          <label htmlFor="name" className="font-medium">
            {text.name}
          </label>
          <input
            id="name"
            name="name"
            type="text"
            autoComplete="name"
            required
            aria-invalid={errors.name ? true : undefined}
            aria-describedby={describedBy("name")}
            onChange={() => clearError("name")}
            className={inputClasses}
          />
          <p id="name-error" aria-live="polite" className="mt-1 text-sm font-medium text-accent">
            {errors.name}
          </p>
        </div>

        <div>
          <label htmlFor="email" className="font-medium">
            {text.email}
          </label>
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            inputMode="email"
            required
            aria-invalid={errors.email ? true : undefined}
            aria-describedby={describedBy("email")}
            onChange={() => clearError("email")}
            className={inputClasses}
          />
          <p id="email-error" aria-live="polite" className="mt-1 text-sm font-medium text-accent">
            {errors.email}
          </p>
        </div>

        <div>
          <label htmlFor="message" className="font-medium">
            {text.message}
          </label>
          <textarea
            id="message"
            name="message"
            rows={5}
            required
            aria-invalid={errors.message ? true : undefined}
            aria-describedby={describedBy("message")}
            onChange={() => clearError("message")}
            className={`${inputClasses} resize-y`}
          />
          <p id="message-error" aria-live="polite" className="mt-1 text-sm font-medium text-accent">
            {errors.message}
          </p>
        </div>

        {/* Honeypot: hidden from people, filled by bots; Formspree drops submissions that set it. */}
        <div aria-hidden="true" className="hidden">
          <label htmlFor="_gotcha">{text.honeypot}</label>
          <input id="_gotcha" name="_gotcha" type="text" tabIndex={-1} autoComplete="off" />
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <Button type="submit" disabled={status === "sending"}>
            {status === "sending" ? text.sending : text.submit}
          </Button>
        </div>

        <p role="status" aria-live="polite" className="min-h-6 text-text">
          {status === "sending" ? text.sending : null}
          {status === "success" ? text.success : null}
          {status === "error" || status === "not-connected" ? (
            <>
              {status === "error" ? text.error : text.notConnected}{" "}
              <a
                href={`mailto:${email}`}
                className="font-medium text-accent underline underline-offset-4 break-all hover:text-text"
              >
                {email}
              </a>
            </>
          ) : null}
        </p>
      </form>
    </div>
  );
}
