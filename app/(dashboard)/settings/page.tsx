import { SetupNotice } from "@/components/setup-notice";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  createAvailabilityAction,
  createServiceAction,
  deactivateServiceAction,
  deleteAvailabilityAction,
  updateAvailabilityAction,
  updateProfileAction,
  updateServiceAction,
} from "@/app/actions/settings";
import { getProfileForGroomer } from "@/lib/data/profile";
import { getGroomerContext } from "@/lib/data/groomer-context";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { publicBookUrl } from "@/lib/site";

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
        <CardContent className="mt-2 break-all text-sm text-green-800">{bookingUrl}</CardContent>
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
              />
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
              <li
                key={s.id}
                className="rounded-lg border border-slate-200 p-4 space-y-3"
              >
                <form
                  action={updateServiceAction}
                  className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 lg:items-end"
                >
                  <input type="hidden" name="id" value={s.id} />
                  <div className="space-y-1">
                    <Label htmlFor={`service-name-${s.id}`}>Name</Label>
                    <Input
                      id={`service-name-${s.id}`}
                      name="name"
                      defaultValue={s.name}
                      required
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor={`service-duration-${s.id}`}>Duration (min)</Label>
                    <Input
                      id={`service-duration-${s.id}`}
                      name="duration_minutes"
                      type="number"
                      min={15}
                      step={15}
                      defaultValue={s.duration_minutes}
                      required
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor={`service-price-${s.id}`}>Price (USD)</Label>
                    <Input
                      id={`service-price-${s.id}`}
                      name="price_dollars"
                      type="number"
                      min={0}
                      step="0.01"
                      defaultValue={(s.price_cents / 100).toFixed(2)}
                      required
                    />
                  </div>
                  <div className="flex flex-wrap items-center gap-3">
                    <label className="flex items-center gap-2 text-sm text-slate-700">
                      <input
                        type="checkbox"
                        name="is_active"
                        defaultChecked={s.is_active}
                        className="h-4 w-4 rounded border-slate-300"
                      />
                      Active on booking page
                    </label>
                    <Button type="submit" variant="secondary" size="sm">
                      Save
                    </Button>
                  </div>
                </form>
                <form action={deactivateServiceAction}>
                  <input type="hidden" name="id" value={s.id} />
                  <Button
                    type="submit"
                    variant="ghost"
                    size="sm"
                    className="text-red-700 hover:text-red-800"
                  >
                    Remove from booking
                  </Button>
                </form>
              </li>
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
              <li
                key={r.id}
                className="rounded-lg border border-slate-200 p-4 space-y-3"
              >
                <form
                  action={updateAvailabilityAction}
                  className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 lg:items-end"
                >
                  <input type="hidden" name="id" value={r.id} />
                  <div className="space-y-1">
                    <Label htmlFor={`day-${r.id}`}>Day</Label>
                    <select
                      id={`day-${r.id}`}
                      name="day_of_week"
                      defaultValue={r.day_of_week}
                      className="flex h-10 w-full rounded-lg border border-slate-200 px-3 text-sm"
                    >
                      {DAYS.map((day, index) => (
                        <option key={day} value={index}>
                          {day}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor={`start-${r.id}`}>Start</Label>
                    <Input
                      id={`start-${r.id}`}
                      name="start_time"
                      type="time"
                      defaultValue={r.start_time.slice(0, 5)}
                      required
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor={`end-${r.id}`}>End</Label>
                    <Input
                      id={`end-${r.id}`}
                      name="end_time"
                      type="time"
                      defaultValue={r.end_time.slice(0, 5)}
                      required
                    />
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button type="submit" variant="secondary" size="sm">
                      Save
                    </Button>
                  </div>
                </form>
                <form action={deleteAvailabilityAction}>
                  <input type="hidden" name="id" value={r.id} />
                  <Button
                    type="submit"
                    variant="ghost"
                    size="sm"
                    className="text-red-700 hover:text-red-800"
                  >
                    Delete
                  </Button>
                </form>
              </li>
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
        <CardTitle>Billing</CardTitle>
        <CardDescription>Subscription billing — coming in Phase 3.</CardDescription>
        <CardContent className="mt-2">
          <a href="/settings/billing" className="text-sm text-green-800 hover:underline">
            View billing placeholder →
          </a>
        </CardContent>
      </Card>
    </div>
  );
}
