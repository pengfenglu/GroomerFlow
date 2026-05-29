import { SetupNotice } from "@/components/setup-notice";
import { BookingLinkCopy } from "@/components/dashboard/booking-link-copy";
import { DownloadLinkButton } from "@/components/dashboard/download-link-button";
import { InstagramBioCopy } from "@/components/dashboard/instagram-bio-copy";
import { AvailabilityRuleRow } from "@/components/settings/availability-rule-row";
import { ServiceRow } from "@/components/settings/service-row";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  createAvailabilityAction,
  createServiceAction,
  updateProfileAction,
} from "@/app/actions/settings";
import { getProfileForGroomer } from "@/lib/data/profile";
import { getGroomerContext } from "@/lib/data/groomer-context";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { publicBookUrl } from "@/lib/site";
import { DepositSettings } from "@/components/settings/deposit-settings";
import { getDefaultDepositCents, isStripeConfigured } from "@/lib/stripe/config";

export const dynamic = "force-dynamic";

const DAYS = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

export default async function SettingsPage() {
  if (!isSupabaseConfigured()) return <SetupNotice />;

  const profile = await getProfileForGroomer();
  const { groomerId, supabase } = await getGroomerContext();
  if (!supabase || !profile) return <SetupNotice />;

  const [{ data: services }, { data: rules }] = await Promise.all([
    supabase
      .from("services")
      .select("*")
      .eq("groomer_id", groomerId)
      .order("name"),
    supabase
      .from("availability_rules")
      .select("*")
      .eq("groomer_id", groomerId)
      .order("day_of_week"),
  ]);

  const bookingUrl = publicBookUrl(profile.booking_slug);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">Settings</h1>
        <p className="text-sm text-slate-600">Business profile, services, and hours.</p>
      </div>

      <Card>
        <CardTitle>Public booking link</CardTitle>
        <CardDescription>Copy for Instagram bio or SMS.</CardDescription>
        <CardContent className="space-y-4">
          <BookingLinkCopy url={bookingUrl} />
          <InstagramBioCopy
            businessName={profile.business_name}
            bookingUrl={bookingUrl}
          />
        </CardContent>
      </Card>

      <Card>
        <CardTitle>Your data</CardTitle>
        <CardDescription>Export for backup or privacy requests.</CardDescription>
        <CardContent className="mt-4 flex flex-wrap gap-3">
          <DownloadLinkButton href="/api/export/clients" label="Export clients (CSV)" />
          <DownloadLinkButton href="/api/export/account" label="Export all data (JSON)" />
        </CardContent>
      </Card>

      <Card>
        <CardTitle>Business profile</CardTitle>
        <CardContent className="mt-4">
          <form action={updateProfileAction} className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="business_name">Business name</Label>
              <Input
                id="business_name"
                name="business_name"
                defaultValue={profile.business_name}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="booking_slug">Booking slug (URL)</Label>
              <Input
                id="booking_slug"
                name="booking_slug"
                defaultValue={profile.booking_slug}
                pattern="^[a-z0-9]+(?:-[a-z0-9]+)*$"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="timezone">Timezone</Label>
              <Input
                id="timezone"
                name="timezone"
                defaultValue={profile.timezone}
                required
              />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="bio">Bio (optional)</Label>
              <Textarea
                id="bio"
                name="bio"
                rows={2}
                defaultValue={profile.bio ?? ""}
                placeholder="We treat your pets like family."
              />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="avatar_url">Profile photo URL (optional)</Label>
              <Input
                id="avatar_url"
                name="avatar_url"
                type="url"
                placeholder="https://…"
                defaultValue={profile.avatar_url ?? ""}
              />
              <p className="text-xs text-slate-500">
                Paste a public image link (e.g. from Instagram or your website). Shown on
                your booking page.
              </p>
            </div>
            <Button type="submit">Save changes</Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardTitle>Services</CardTitle>
        <CardContent className="mt-4 space-y-4">
          <ul className="space-y-3">
            {services?.map((s) => (
              <ServiceRow
                key={`${s.id}-${s.name}-${s.duration_minutes}-${s.price_cents}-${s.is_active}`}
                service={s}
              />
            ))}
          </ul>
          <form action={createServiceAction} className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input id="name" name="name" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="duration_minutes">Duration (min)</Label>
              <Input
                id="duration_minutes"
                name="duration_minutes"
                type="number"
                min={15}
                step={15}
                defaultValue={60}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="price_dollars">Price (USD)</Label>
              <Input
                id="price_dollars"
                name="price_dollars"
                type="number"
                min={0}
                step="0.01"
                defaultValue="50"
                required
              />
            </div>
            <Button type="submit" className="sm:col-span-3">
              Add service
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardTitle>Weekly availability</CardTitle>
        <CardContent className="mt-4 space-y-4">
          <ul className="space-y-3">
            {rules?.map((r) => (
              <AvailabilityRuleRow
                key={`${r.id}-${r.day_of_week}-${r.start_time}-${r.end_time}`}
                rule={r}
              />
            ))}
          </ul>
          <form action={createAvailabilityAction} className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="day_of_week">Day</Label>
              <select
                id="day_of_week"
                name="day_of_week"
                className="flex h-10 w-full rounded-lg border border-slate-200 px-3 text-sm"
              >
                {DAYS.map((day, index) => (
                  <option key={day} value={index}>
                    {day}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="start_time">Start</Label>
              <Input id="start_time" name="start_time" type="time" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="end_time">End</Label>
              <Input id="end_time" name="end_time" type="time" required />
            </div>
            <Button type="submit" className="sm:col-span-3">
              Add hours
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardTitle>Booking deposit</CardTitle>
        <CardDescription>
          Optional Stripe hold for online bookings (reduces no-shows).
        </CardDescription>
        <CardContent className="mt-4">
          <DepositSettings
            depositEnabled={profile.deposit_enabled ?? false}
            depositCents={profile.deposit_cents ?? getDefaultDepositCents()}
            stripeConfigured={isStripeConfigured()}
            defaultDepositCents={getDefaultDepositCents()}
          />
        </CardContent>
      </Card>

      <Card>
        <CardTitle>Subscription</CardTitle>
        <CardDescription>
          14-day trial · Lemon Squeezy billing when you subscribe.
        </CardDescription>
        <CardContent className="mt-2">
          <a href="/settings/billing" className="text-sm text-green-800 hover:underline">
            Manage billing →
          </a>
        </CardContent>
      </Card>
    </div>
  );
}
