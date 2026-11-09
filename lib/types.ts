export type AppRole = "user" | "admin";
export type ProviderType = "individual" | "sole_trader" | "business";
export type ProviderStatus = "pending" | "approved" | "rejected" | "suspended";
export type JobStatus = "open" | "receiving_offers" | "closed" | "removed";
export type OfferStatus = "submitted" | "accepted" | "declined" | "withdrawn";
export type ReportStatus = "open" | "reviewed" | "dismissed";

export interface Profile {
  id: string;
  role: AppRole;
  full_name: string;
  phone: string | null;
  is_suspended: boolean;
  suspended_by: string | null;
  suspended_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface ServiceCategory {
  id: string;
  parent_id: string | null;
  name: string;
  slug: string;
  description: string | null;
  requires_extra_checks: boolean;
  is_active: boolean;
  sort_order: number;
}

export interface LocationRow {
  id: string;
  postcode_district: string;
  area_name: string;
  is_enabled: boolean;
}

export interface ProviderProfile {
  user_id: string;
  provider_type: ProviderType;
  display_name: string;
  business_name: string | null;
  bio: string;
  service_districts: string[];
  price_note: string | null;
  status: ProviderStatus;
  rejection_reason: string | null;
  needs_more_info_note: string | null;
  declaration_accepted_at: string;
  reviewed_by: string | null;
  reviewed_at: string | null;
  suspended_by: string | null;
  suspended_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface ProviderPhoto {
  id: string;
  provider_id: string;
  storage_path: string;
  alt_text: string | null;
  sort_order: number;
  created_at: string;
}

export interface JobRequest {
  id: string;
  customer_id: string;
  category_id: string;
  title: string;
  description: string;
  postcode: string;
  postcode_district: string;
  timeframe: string;
  status: JobStatus;
  accepted_offer_id: string | null;
  removed_reason: string | null;
  removed_by: string | null;
  removed_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface JobPhoto {
  id: string;
  job_id: string;
  storage_path: string;
  sort_order: number;
}

export interface ProviderOffer {
  id: string;
  job_id: string;
  provider_id: string;
  message: string;
  indicative_price_pence: number | null;
  estimated_timeframe: string | null;
  status: OfferStatus;
  removed_by: string | null;
  removed_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface Report {
  id: string;
  reporter_id: string | null;
  target_type: "provider" | "job";
  target_id: string;
  reason: string;
  status: ReportStatus;
  created_at: string;
}

export interface NotificationRow {
  id: string;
  user_id: string | null;
  to_email: string;
  template: string;
  payload: Record<string, unknown>;
  status: "queued" | "sent" | "failed";
  error: string | null;
  created_at: string;
  sent_at: string | null;
}

export interface SearchProvider {
  user_id: string;
  display_name: string;
  bio: string;
  price_note: string | null;
  provider_type: ProviderType;
  service_districts: string[];
  categories: string[];
  photo_path: string | null;
}
