/** Suggested Instagram / TikTok bio snippets (English, en-US). */
export function formatInstagramBio(params: {
  businessName: string;
  bookingUrl: string;
}): string {
  const { businessName, bookingUrl } = params;
  return `Book ${businessName} online 🐾\n${bookingUrl}`;
}

export function formatInstagramBioShort(bookingUrl: string): string {
  return `Book grooming online 🐾\n${bookingUrl}`;
}
