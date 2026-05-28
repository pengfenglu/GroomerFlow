import Link from "next/link";

export function BookingFooter() {
  return (
    <footer className="border-t border-slate-200 pt-6 text-center text-xs text-slate-500">
      <p>
        Powered by{" "}
        <Link href="/" className="text-green-800 hover:underline">
          GetGroomerFlow
        </Link>
      </p>
      <p className="mt-2 flex justify-center gap-4">
        <Link href="/privacy" className="hover:text-slate-700 hover:underline">
          Privacy
        </Link>
        <Link href="/terms" className="hover:text-slate-700 hover:underline">
          Terms of Service
        </Link>
      </p>
    </footer>
  );
}
