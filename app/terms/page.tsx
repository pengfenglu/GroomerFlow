import Link from "next/link";

export const metadata = {
  title: "Terms of Service — GetGroomerFlow",
};

export default function TermsPage() {
  return (
    <div className="min-h-full bg-slate-50 px-4 py-12">
      <article className="prose prose-slate mx-auto max-w-2xl">
        <h1>Terms of Service</h1>
        <p className="text-sm text-slate-600">Last updated: May 2026</p>
        <p>
          By using GetGroomerFlow, you agree to these terms. If you do not agree, please
          do not use the service.
        </p>
        <h2>For groomers</h2>
        <p>
          You are responsible for your business information, availability, pricing, and
          services performed. Subscription and billing terms will be shown at checkout
          when paid plans launch.
        </p>
        <h2>For clients booking online</h2>
        <p>
          Appointments are with the independent groomer named on the booking page, not
          GetGroomerFlow. Cancellation and rescheduling policies are set by your groomer.
        </p>
        <h2>Disclaimer</h2>
        <p>
          The service is provided &quot;as is&quot; without warranties. We are not liable for
          indirect damages arising from use of the platform.
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
