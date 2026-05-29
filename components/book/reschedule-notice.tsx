type RescheduleNoticeProps = {
  message: string;
};

export function RescheduleNotice({ message }: RescheduleNoticeProps) {
  return (
    <p className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-600">
      {message}
    </p>
  );
}
