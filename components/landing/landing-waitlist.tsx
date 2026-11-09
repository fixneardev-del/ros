"use client";

import { useActionState } from "react";
import { joinWaitlist } from "@/lib/actions/search";

export function LandingWaitlist() {
  const [state, action] = useActionState(joinWaitlist, null);

  return (
    <form action={action} className="l-panel">
      {state && !state.ok ? (
        <p className="l-message l-message-error">{state.error}</p>
      ) : null}
      {state?.ok ? (
        <p className="l-message l-message-success">
          Thanks. We will email you when we reach your area.
        </p>
      ) : null}

      <label className="l-field">
        <span className="l-label">Email</span>
        <input
          name="email"
          type="email"
          autoComplete="email"
          required
          className="l-input"
        />
      </label>

      <label className="l-field">
        <span className="l-label">Postcode</span>
        <input
          name="postcode"
          autoComplete="postal-code"
          required
          className="l-input"
        />
      </label>

      <button type="submit" className="l-btn l-btn-teal" style={{ width: "100%" }}>
        Tell me when you arrive
      </button>
    </form>
  );
}
