import { formatInstagramBio } from "@/lib/instagram-bio";
import { CopyTextButton } from "@/components/dashboard/copy-text-button";

type InstagramBioCopyProps = {
  businessName: string;
  bookingUrl: string;
};

export function InstagramBioCopy({ businessName, bookingUrl }: InstagramBioCopyProps) {
  const bioText = formatInstagramBio({ businessName, bookingUrl });

  return (
    <div className="space-y-3 rounded-lg border border-slate-200 bg-slate-50 p-3">
      <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
        Instagram / TikTok bio
      </p>
      <pre className="whitespace-pre-wrap font-sans text-sm text-slate-800">{bioText}</pre>
      <CopyTextButton text={bioText} label="Copy bio text" />
    </div>
  );
}
