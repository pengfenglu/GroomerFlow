import Image from "next/image";
import { timezoneLabel } from "@/lib/timezone";

type BookingHeaderProps = {
  businessName: string;
  bio: string | null;
  avatarUrl: string | null;
  timezone: string;
};

export function BookingHeader({
  businessName,
  bio,
  avatarUrl,
  timezone,
}: BookingHeaderProps) {
  const initials = businessName
    .split(/\s+/)
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <header className="text-center">
      <p className="text-sm font-medium text-green-800">GetGroomerFlow</p>
      <div className="mt-4 flex flex-col items-center gap-3">
        {avatarUrl ? (
          <Image
            src={avatarUrl}
            alt=""
            width={80}
            height={80}
            className="h-20 w-20 rounded-full border border-slate-200 object-cover"
            unoptimized
          />
        ) : (
          <div
            className="flex h-20 w-20 items-center justify-center rounded-full border border-slate-200 bg-green-50 text-lg font-semibold text-green-900"
            aria-hidden
          >
            {initials}
          </div>
        )}
        <h1 className="text-3xl font-bold text-slate-900">{businessName}</h1>
      </div>
      {bio ? (
        <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-slate-600">
          {bio}
        </p>
      ) : null}
      <p className="mt-3 text-xs text-slate-500">
        All times in {timezoneLabel(timezone)}
      </p>
    </header>
  );
}
