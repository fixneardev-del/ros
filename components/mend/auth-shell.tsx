import type { ReactNode } from "react";

export function AuthShell({
  eyebrow,
  title,
  description,
  children,
  footer,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  children: ReactNode;
  footer?: ReactNode;
}) {
  return (
    <div className="l-container">
      <div className="l-auth">
        <div className="l-auth-aside">
          {eyebrow ? <p className="l-kicker">{eyebrow}</p> : null}
          <h1 className="l-auth-title">{title}</h1>
          {description ? <p className="l-auth-description">{description}</p> : null}
        </div>

        <div>
          <div className="l-auth-card">{children}</div>
          {footer ? <p className="l-auth-footer">{footer}</p> : null}
        </div>
      </div>
    </div>
  );
}
