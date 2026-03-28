"use client";

import { FormEvent, useState } from "react";

type NewsletterFormProps = {
  source?: string;
};

export function NewsletterForm({ source = "site-footer" }: NewsletterFormProps) {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [message, setMessage] = useState("");

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("loading");
    setMessage("");

    try {
      const response = await fetch("/api/newsletter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          source
        })
      });

      const payload = (await response.json()) as {
        error?: string;
      };

      if (!response.ok) {
        throw new Error(payload.error || "Subscription failed");
      }

      setStatus("success");
      setMessage("Subscribed successfully. Check your inbox for updates.");
      setEmail("");
    } catch (error) {
      setStatus("error");
      setMessage(error instanceof Error ? error.message : "Unable to subscribe");
    }
  }

  return (
    <form className="newsletter-form" onSubmit={onSubmit}>
      <label htmlFor="newsletter-email" className="newsletter-form__label">
        Subscribe for daily headlines
      </label>
      <div className="newsletter-form__row">
        <input
          id="newsletter-email"
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="Enter your email"
          autoComplete="email"
          required
        />
        <button type="submit" disabled={status === "loading"}>
          {status === "loading" ? "Joining..." : "Subscribe"}
        </button>
      </div>
      {message ? (
        <p className={status === "error" ? "newsletter-form__message newsletter-form__message--error" : "newsletter-form__message"}>
          {message}
        </p>
      ) : null}
    </form>
  );
}
