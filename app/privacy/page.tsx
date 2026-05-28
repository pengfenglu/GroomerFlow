import Link from "next/link";

export const metadata = {
  title: "Privacy Policy — GetGroomerFlow",
};

export default function PrivacyPage() {
  return (
    <div className="min-h-full bg-slate-50 px-4 py-12">
      <article className="prose prose-slate mx-auto max-w-2xl">
        <h1>Privacy Policy</h1>
        <p className="text-sm text-slate-600">Last updated: May 2026</p>
        <p>
          GetGroomerFlow (&quot;we&quot;) helps independent pet groomers accept online
          appointments. This policy describes how we handle information when you use our
          website and booking pages.
        </p>
        <h2>Information we collect</h2>
        <ul>
          <li>
            <strong>Groomers:</strong> account email, business name, settings, and
            appointment data you manage in the dashboard.
          </li>
          <li>
            <strong>Clients booking online:</strong> name, email, optional phone, pet
            details, and appointment times you submit on a groomer&apos;s booking page.
          </li>
        </ul>
        <h2>How we use it</h2>
        <p>
          We use this information to provide scheduling, confirmation emails, and
          reminders. We do not sell personal information.
        </p>
        <h2>Contact</h2>
        <p>
          Questions? Email your groomer directly or contact the GetGroomerFlow operator
          listed on your booking confirmation.
        </p>
        <p>
          <Link href="/" className="text-green-800 hover:underline">
            ← Back to home
          </Link>
        </p>
      </article>
    </div>
  );
}
