export function slugifyBusinessName(name: string): string {
  const base = name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return base || "my-grooming";
}

export function appendSlugSuffix(slug: string, suffix: string): string {
  return `${slug}-${suffix.slice(0, 6)}`;
}
