import Link from "next/link";
import { getPrivacyContactEmail } from "@/lib/support";

export const metadata = {
  title: "Privacy Policy — GetGroomerFlow",
};

export default function PrivacyPage() {
  const contactEmail = getPrivacyContactEmail();

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
        <h2>Your rights (export &amp; deletion)</h2>
        <p>
          <strong>Groomers</strong> can export clients (CSV) and a full account backup
          (JSON) from Settings → Your data. Pet owners should contact their groomer
          directly to update or remove appointment information.
        </p>
        <p>
          To request account deletion or other privacy questions, email{" "}
          <a href={`mailto:${contactEmail}`} className="text-green-800 hover:underline">
            {contactEmail}
          </a>
          . We will respond within a reasonable time.
        </p>
        <h2>Contact</h2>
        <p>
          Questions? Email your groomer directly for appointment changes, or contact us
          at{" "}
          <a href={`mailto:${contactEmail}`} className="text-green-800 hover:underline">
            {contactEmail}
          </a>
          .
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
