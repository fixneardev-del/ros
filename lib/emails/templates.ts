export interface EmailMessage {
  template: string;
  to: string;
  subject: string;
  html: string;
  text: string;
}

export function escapeHtml(value: unknown) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function layout(heading: string, body: string, cta?: { label: string; url: string }) {
  const ctaHtml = cta
    ? `<p style="margin:24px 0 0"><a href="${escapeHtml(cta.url)}" style="display:inline-block;background:#1F3A5F;color:#ffffff;padding:12px 20px;border-radius:6px;text-decoration:none;font-weight:700">${escapeHtml(cta.label)}</a></p>`
    : "";

  return `<!doctype html>
<html lang="en-GB">
  <body style="margin:0;background:#F3F6F8;color:#14253F;font-family:Atkinson Hyperlegible, Arial, sans-serif">
    <div style="max-width:600px;margin:0 auto;padding:32px 20px">
      <div style="background:#ffffff;border:1px solid #CBD5DD;border-radius:14px;padding:32px">
        <p style="margin:0 0 8px;font-size:14px;color:#475666">Repairs and Other Services</p>
        <h1 style="margin:0 0 20px;font-size:26px;line-height:1.2">${escapeHtml(heading)}</h1>
        ${body}
        ${ctaHtml}
      </div>
      <p style="margin:16px 0 0;font-size:13px;color:#475666">Providers are independent. We do not guarantee qualifications, insurance or checks unless a profile says so.</p>
    </div>
  </body>
</html>`;
}

function textLayout(heading: string, body: string, cta?: { label: string; url: string }) {
  return [
    "Repairs and Other Services",
    "",
    heading,
    "",
    body,
    cta ? `\n${cta.label}: ${cta.url}` : "",
    "",
    "Providers are independent. We do not guarantee qualifications, insurance or checks unless a profile says so.",
  ]
    .filter(Boolean)
    .join("\n");
}

function paragraph(text: string) {
  return `<p style="margin:0 0 16px;font-size:16px;line-height:1.6">${escapeHtml(text)}</p>`;
}

function quote(text: string) {
  return `<blockquote style="margin:0 0 16px;padding:12px 16px;background:#F3F6F8;border-left:3px solid #F2B01E;font-size:16px;line-height:1.6">${escapeHtml(text)}</blockquote>`;
}

export function buildEmailMessages(
  event: string,
  payload: Record<string, unknown>,
  siteUrl: string,
): EmailMessage[] {
  const text = (key: string) => String(payload[key] ?? "");
  const messages: EmailMessage[] = [];

  switch (event) {
    case "provider.applied": {
      const providerEmail = text("providerEmail");
      const adminEmail = text("adminEmail");
      const name = text("providerName");

      if (providerEmail) {
        const heading = "Application received";
        const body = `${paragraph(`Thanks, ${name}. We have your provider application and will review it.`)}${paragraph("You can add more photos or update your profile while you wait.")}`;
        messages.push({
          template: "provider.applied.provider",
          to: providerEmail,
          subject: "Your provider application is with us",
          html: layout(heading, body, { label: "Open your dashboard", url: `${siteUrl}/provide` }),
          text: textLayout(heading, `Thanks, ${name}. We have your provider application and will review it.`, {
            label: "Open your dashboard",
            url: `${siteUrl}/provide`,
          }),
        });
      }

      if (adminEmail) {
        const heading = "New provider to review";
        const body = `${paragraph(`${name} has applied to become a provider.`)}`;
        messages.push({
          template: "provider.applied.admin",
          to: adminEmail,
          subject: "New provider application",
          html: layout(heading, body, { label: "Review the application", url: `${siteUrl}/admin/providers` }),
          text: textLayout(heading, `${name} has applied to become a provider.`, {
            label: "Review the application",
            url: `${siteUrl}/admin/providers`,
          }),
        });
      }
      break;
    }

    case "provider.approved": {
      const email = text("providerEmail");
      const name = text("providerName");
      if (!email) break;
      const heading = "You're approved";
      const body = `${paragraph(`Your provider profile is now public, ${name}. You can see open jobs that match your services and areas.`)}${paragraph("Send an offer when a job suits you. The customer will see your message and price.")}`;
      messages.push({
        template: "provider.approved",
        to: email,
        subject: "You're approved on Repairs and Other Services",
        html: layout(heading, body, { label: "See open jobs", url: `${siteUrl}/provide/jobs` }),
        text: textLayout(heading, `Your provider profile is now public, ${name}. You can see open jobs that match your services and areas.`, {
          label: "See open jobs",
          url: `${siteUrl}/provide/jobs`,
        }),
      });
      break;
    }

    case "provider.rejected": {
      const email = text("providerEmail");
      const name = text("providerName");
      if (!email) break;
      const heading = "Application not approved";
      const body = `${paragraph(`We could not approve your application this time, ${name}.`)}${quote(text("reason"))}${paragraph("You can update your profile and apply again.")}`;
      messages.push({
        template: "provider.rejected",
        to: email,
        subject: "Your provider application was not approved",
        html: layout(heading, body, { label: "Update your profile", url: `${siteUrl}/provide` }),
        text: textLayout(heading, `We could not approve your application this time, ${name}. Reason: ${text("reason")}`, {
          label: "Update your profile",
          url: `${siteUrl}/provide`,
        }),
      });
      break;
    }

    case "provider.removed": {
      const email = text("providerEmail");
      const name = text("providerName");
      if (!email) break;
      const heading = "Your provider application was removed";
      const body = `${paragraph(`We removed your provider application, ${name}.`)}${quote(text("reason"))}${paragraph("Your account still works. You can apply again whenever you are ready.")}`;
      messages.push({
        template: "provider.removed",
        to: email,
        subject: "Your provider application was removed",
        html: layout(heading, body, { label: "Apply again", url: `${siteUrl}/provide/apply` }),
        text: textLayout(heading, `We removed your provider application, ${name}. Reason: ${text("reason")}`, {
          label: "Apply again",
          url: `${siteUrl}/provide/apply`,
        }),
      });
      break;
    }

    case "provider.more_info_requested": {
      const email = text("providerEmail");
      const name = text("providerName");
      if (!email) break;
      const heading = "We need more information";
      const body = `${paragraph(`We are reviewing your application, ${name}, and need a little more information.`)}${quote(text("note"))}${paragraph("Update your profile and reply to the administrator when you are ready.")}`;
      messages.push({
        template: "provider.more_info_requested",
        to: email,
        subject: "More information needed for your provider application",
        html: layout(heading, body, { label: "Update your profile", url: `${siteUrl}/provide` }),
        text: textLayout(heading, `We need a little more information, ${name}. ${text("note")}`, {
          label: "Update your profile",
          url: `${siteUrl}/provide`,
        }),
      });
      break;
    }

    case "job.created": {
      const customerEmail = text("customerEmail");
      const customerName = text("customerName");
      const jobTitle = text("jobTitle");
      const jobId = text("jobId");
      const adminEmail = text("adminEmail");

      if (customerEmail) {
        const heading = "Your job is posted";
        const body = `${paragraph(`Thanks, ${customerName}. Your job "${jobTitle}" is live.`)}${paragraph("Approved providers in your area can now send offers. We will email you when one arrives.")}`;
        messages.push({
          template: "job.created.customer",
          to: customerEmail,
          subject: "Your job is posted",
          html: layout(heading, body, { label: "View your job", url: `${siteUrl}/jobs/${jobId}` }),
          text: textLayout(heading, `Your job "${jobTitle}" is live.`, {
            label: "View your job",
            url: `${siteUrl}/jobs/${jobId}`,
          }),
        });
      }

      if (adminEmail) {
        const heading = "New job posted";
        const body = paragraph(`${customerName} posted "${jobTitle}" in ${text("district")}.`);
        messages.push({
          template: "job.created.admin",
          to: adminEmail,
          subject: "New job posted",
          html: layout(heading, body, { label: "View the job", url: `${siteUrl}/admin/jobs` }),
          text: textLayout(heading, `${customerName} posted "${jobTitle}" in ${text("district")}.`, {
            label: "View the job",
            url: `${siteUrl}/admin/jobs`,
          }),
        });
      }
      break;
    }

    case "offer.created": {
      const email = text("customerEmail");
      if (!email) break;
      const heading = "You have a new offer";
      const body = `${paragraph(`${text("providerName")} sent an offer for "${text("jobTitle")}".`)}${paragraph("Open the job to read the message, price and timeframe. Contact details stay private until you accept an offer.")}`;
      messages.push({
        template: "offer.created",
        to: email,
        subject: "You have a new offer",
        html: layout(heading, body, { label: "View the offer", url: `${siteUrl}/jobs/${text("jobId")}` }),
        text: textLayout(heading, `${text("providerName")} sent an offer for "${text("jobTitle")}".`, {
          label: "View the offer",
          url: `${siteUrl}/jobs/${text("jobId")}`,
        }),
      });
      break;
    }

    case "offer.accepted": {
      const email = text("providerEmail");
      if (!email) break;
      const heading = "Your offer was accepted";
      const body = `${paragraph(`Good news, ${text("providerName")}. Your offer for "${text("jobTitle")}" was accepted.`)}${paragraph("Open the job to see the customer's contact details. You can now arrange the work directly.")}`;
      messages.push({
        template: "offer.accepted",
        to: email,
        subject: "Your offer was accepted",
        html: layout(heading, body, { label: "See contact details", url: `${siteUrl}/jobs/${text("jobId")}` }),
        text: textLayout(heading, `Your offer for "${text("jobTitle")}" was accepted.`, {
          label: "See contact details",
          url: `${siteUrl}/jobs/${text("jobId")}`,
        }),
      });
      break;
    }

    case "offer.declined": {
      const email = text("providerEmail");
      if (!email) break;
      const heading = "Offer not chosen";
      const body = `${paragraph(`The customer chose another offer for "${text("jobTitle")}".`)}${paragraph("There are more jobs on the board. We will keep showing you work that matches your services and areas.")}`;
      messages.push({
        template: "offer.declined",
        to: email,
        subject: "Your offer was not chosen",
        html: layout(heading, body, { label: "See open jobs", url: `${siteUrl}/provide/jobs` }),
        text: textLayout(heading, `The customer chose another offer for "${text("jobTitle")}".`, {
          label: "See open jobs",
          url: `${siteUrl}/provide/jobs`,
        }),
      });
      break;
    }

    case "job.removed": {
      const email = text("customerEmail");
      if (!email) break;
      const heading = "Your job was removed";
      const body = `${paragraph(`Your job "${text("jobTitle")}" was removed by an administrator.`)}${quote(text("reason"))}${paragraph("If you think this was a mistake, contact the administrator.")}`;
      messages.push({
        template: "job.removed",
        to: email,
        subject: "Your job was removed",
        html: layout(heading, body),
        text: textLayout(heading, `Your job "${text("jobTitle")}" was removed. Reason: ${text("reason")}`),
      });
      break;
    }

    case "waitlist.joined": {
      const email = text("adminEmail");
      if (!email) break;
      const heading = "New waitlist signup";
      const body = paragraph(`${text("signupEmail")} asked to be told when we reach ${text("postcode")}.`);
      messages.push({
        template: "waitlist.joined",
        to: email,
        subject: "New waitlist signup",
        html: layout(heading, body),
        text: textLayout(heading, `${text("signupEmail")} asked to be told when we reach ${text("postcode")}.`),
      });
      break;
    }

    case "report.created": {
      const email = text("adminEmail");
      if (!email) break;
      const heading = "New report";
      const body = `${paragraph(`Someone reported a ${text("targetType")}.`)}${quote(text("reason"))}`;
      messages.push({
        template: "report.created",
        to: email,
        subject: "New content report",
        html: layout(heading, body, { label: "Review reports", url: `${siteUrl}/admin/reports` }),
        text: textLayout(heading, `Someone reported a ${text("targetType")}. Reason: ${text("reason")}`, {
          label: "Review reports",
          url: `${siteUrl}/admin/reports`,
        }),
      });
      break;
    }

    default:
      break;
  }

  return messages;
}
