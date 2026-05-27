export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-full flex-col items-center justify-center bg-slate-50 px-4 py-12">
      <div className="mb-8 text-center">
        <p className="text-sm font-medium uppercase tracking-wide text-green-800">
          GetGroomerFlow
        </p>
        <h1 className="mt-2 text-3xl font-bold text-slate-900">
          Booking for independent groomers
        </h1>
      </div>
      <div className="w-full max-w-md">{children}</div>
    </div>
  );
}
