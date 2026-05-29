export type AppointmentStatus = "confirmed" | "completed" | "cancelled";
export type AppointmentSource = "staff" | "public_booking";
export type DepositStatus =
  | "none"
  | "pending"
  | "authorized"
  | "paid"
  | "failed"
  | "refunded";
export type BookingPendingStatus = "pending" | "completed" | "expired" | "cancelled";
export type SubscriptionPlan = "trial" | "starter" | "pro" | "free";
export type ReminderKind = "confirmation" | "day_before";
export type ReminderChannel = "email" | "sms";
export type ReminderStatus = "pending" | "sent" | "failed";

export type Profile = {
  id: string;
  business_name: string;
  booking_slug: string;
  bio: string | null;
  avatar_url: string | null;
  timezone: string;
  subscription_plan: SubscriptionPlan;
  subscription_status: string;
  trial_ends_at: string | null;
  onboarding_dismissed_at: string | null;
  deposit_enabled: boolean;
  deposit_cents: number;
  created_at: string;
  updated_at: string;
};

export type Client = {
  id: string;
  groomer_id: string;
  full_name: string;
  phone: string | null;
  email: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
};

export type Pet = {
  id: string;
  groomer_id: string;
  client_id: string;
  name: string;
  breed: string | null;
  age_years: number | null;
  temperament: string | null;
  coat_notes: string | null;
  allergies: string | null;
  photo_url: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
};

export type Service = {
  id: string;
  groomer_id: string;
  name: string;
  duration_minutes: number;
  price_cents: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export type AvailabilityRule = {
  id: string;
  groomer_id: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
  created_at: string;
};

export type Appointment = {
  id: string;
  groomer_id: string;
  client_id: string;
  pet_id: string;
  service_id: string;
  starts_at: string;
  ends_at: string;
  status: AppointmentStatus;
  source: AppointmentSource;
  notes: string | null;
  deposit_cents: number;
  deposit_status: DepositStatus;
  stripe_checkout_session_id: string | null;
  created_at: string;
  updated_at: string;
};

export type BookingPending = {
  id: string;
  groomer_id: string;
  service_id: string;
  starts_at: string;
  ends_at: string;
  payload: PublicBookPayload & { slug: string };
  stripe_checkout_session_id: string | null;
  status: BookingPendingStatus;
  expires_at: string;
  appointment_id: string | null;
  created_at: string;
};

export type ServiceRecord = {
  id: string;
  groomer_id: string;
  pet_id: string;
  appointment_id: string | null;
  performed_at: string;
  service_id: string | null;
  amount_cents: number;
  notes: string | null;
  created_at: string;
};

export type ReminderLog = {
  id: string;
  groomer_id: string;
  appointment_id: string;
  kind: ReminderKind;
  channel: ReminderChannel;
  status: ReminderStatus;
  sent_at: string | null;
  created_at: string;
};

export type PublicBookPayload = {
  slug: string;
  service_id: string;
  starts_at: string;
  full_name: string;
  phone?: string;
  email: string;
  pet_name: string;
  pet_breed?: string;
  notes?: string;
};
