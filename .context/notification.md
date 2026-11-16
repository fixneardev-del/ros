# REPAIRS & OTHER SERVICES (ROS)
# NOTIFICATIONS & SIMPLE CONTACT WORKFLOW

**Filename:** `ROS_NOTIFICATIONS_AND_CONTACT_WORKFLOW.md`  
**Version:** 1.0  
**Status:** MVP Implementation Specification  
**Frontend:** Next.js, React, TypeScript  
**Backend:** Supabase  
**Database:** PostgreSQL  
**Authentication:** Supabase Auth

---

# 1. PURPOSE

This document defines a lightweight notification and contact system for the Repairs & Other Services (ROS) marketplace.

The objective is to allow customers and service providers to stay informed about important marketplace activities and communicate after a provider's offer has been accepted.

The implementation must be affordable, secure and easy to maintain.

## 1.1 Core objectives

1. Notify customers when providers submit offers.
2. Notify providers when their offers are accepted.
3. Notify users about important job updates.
4. Notify providers about relevant new jobs.
5. Notify users when their provider applications are approved or rejected.
6. Provide a simple in-app notification centre.
7. Send essential transactional email notifications.
8. Allow customers and providers to contact each other after an offer is accepted.

## 1.2 Explicit exclusions

The following are not part of this MVP:

- Live chat.
- Real-time messaging.
- Conversation management.
- Message history.
- Read receipts.
- SMS.
- WhatsApp integration.
- Mobile push notifications.
- Voice or video calls.
- Automated AI notifications.

These may be introduced in future development phases.

---

# 2. NOTIFICATION SYSTEM

## 2.1 Notification channels

The MVP will use two channels.

### A. In-app notifications

Users will receive notifications inside their ROS dashboard.

Examples:

- A provider has submitted an offer for your job.
- Your offer has been accepted.
- A new job matching your services is available.
- Your provider application has been approved.
- Your job has been cancelled.

### B. Transactional email

Important marketplace events will also trigger email notifications.

Emails should contain:

- Notification title.
- Short explanation.
- Relevant job information where appropriate.
- A link to the user's ROS dashboard.
- Platform branding.

Email delivery should use a transactional email provider through a secure server-side integration.

---

# 3. NOTIFICATION EVENTS

The following events must be supported.

| Event | Recipient | In-app | Email |
|---|---|---|---|
| New job published | Relevant approved providers | Yes | Optional |
| New offer submitted | Customer | Yes | Yes |
| Offer accepted | Selected provider | Yes | Yes |
| Offer rejected | Relevant provider | Yes | Optional |
| Job cancelled | Relevant provider | Yes | Yes |
| Job marked completed | Other participant | Yes | Optional |
| Provider application approved | Provider | Yes | Yes |
| Provider application rejected | Provider | Yes | Yes |

Only notify users who are relevant to the event.

Do not send a notification to the user who performed the action unless there is a specific business reason.

## 3.1 Notification examples

**New offer received**

Title: New offer received

Message: A provider has submitted an offer for your job. Log in to review the details.

**Offer accepted**

Title: Your offer has been accepted

Message: The customer has accepted your offer. You can now contact the customer to discuss the job.

**New job available**

Title: New job opportunity

Message: A new job matching your service categories and service area is available.

**Provider approved**

Title: Your provider application has been approved

Message: Your provider profile has been approved. You can now receive relevant job opportunities.

---

# 4. DATABASE ARCHITECTURE

The notification system should reuse existing ROS tables wherever possible.

## 4.1 Notifications table

Table: `notifications`

| Column | Type | Description |
|---|---|---|
| id | UUID | Primary key |
| user_id | UUID | Notification recipient |
| type | TEXT | Notification event type |
| title | TEXT | Notification title |
| body | TEXT | Notification description |
| data | JSONB | Related record references |
| read_at | TIMESTAMPTZ | Read timestamp |
| created_at | TIMESTAMPTZ | Creation timestamp |

Example `data`:

```json
{
  "job_id": "uuid",
  "offer_id": "uuid"
}
```

Use these references to navigate users to the relevant job or offer.

Do not store passwords, access tokens or unnecessary personal information in notification data.

## 4.2 Notification preferences

Table: `notification_preferences`

| Column | Type | Description |
|---|---|---|
| id | UUID | Primary key |
| user_id | UUID | User reference |
| email_enabled | BOOLEAN | General optional email preference |
| job_updates | BOOLEAN | Job update emails |
| offer_updates | BOOLEAN | Offer update emails |
| created_at | TIMESTAMPTZ | Creation timestamp |
| updated_at | TIMESTAMPTZ | Modification timestamp |

Each user should have one preference record.

Essential account and security emails should be handled separately from optional notifications and marketing communications.

## 4.3 Email delivery tracking

For a small MVP, email delivery can initially be handled by a simple server-side process.

If delivery tracking is needed, introduce:

Table: `notification_deliveries`

Suggested fields:

- id.
- notification_id.
- channel.
- status.
- attempt_count.
- provider_message_id.
- last_error.
- created_at.
- updated_at.

Possible statuses:

- pending
- sent
- failed

This table is optional for the initial implementation if the selected email provider already supplies sufficient delivery tracking.

---

# 5. SIMPLE CONTACT WORKFLOW

## 5.1 Objective

Allow customers and providers to contact each other without developing a messaging platform.

Communication will use existing contact details, such as email and telephone, where available and authorised.

## 5.2 Contact availability

Contact details must not be publicly exposed to every marketplace user.

Before offer acceptance:

- Customers can view provider profile information intended for public display.
- Providers can view the job information needed to prepare an offer.
- Private telephone numbers and email addresses