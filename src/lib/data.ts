import { getEmDashCollection } from 'emdash';

type Img = { id: string; src?: string; alt?: string; width?: number; height?: number; meta?: { storageKey?: string } };
type Item = { item: string };

/** The single "About me" entry. Falls back to empty values so the page never crashes mid-edit. */
export async function getProfile() {
  const { entries, cacheHint } = await getEmDashCollection('profile', { status: 'published', limit: 1, orderBy: { created_at: 'asc' } });
  const d = (entries[0]?.data ?? {}) as Record<string, any>;
  return {
    cacheHint,
    name: d.title ?? '',
    role: d.role ?? '',
    city: d.city ?? '',
    timezone: d.timezone || 'Asia/Kolkata',
    availability: d.availability ?? '',
    intro: d.intro ?? '',
    services: ((d.services ?? []) as Item[]).map((x) => x.item).filter(Boolean),
    recognition: ((d.recognition ?? []) as Item[]).map((x) => x.item).filter(Boolean),
    email: d.email ?? '',
    social: ((d.social ?? []) as { label: string; url: string }[]).filter((s) => s.label && s.url),
  };
}

/** Published projects in page order, each with at least one photo, plus the cache tags to purge on publish. */
export async function getProjects() {
  const { entries, cacheHint } = await getEmDashCollection('projects', { status: 'published', limit: 200, orderBy: { position: 'asc' } });
  const list = entries
    .map((e) => {
      const d = e.data as Record<string, any>;
      return {
        id: e.id,
        title: d.title as string,
        location: d.location as string,
        year: d.year as string,
        type: d.type as string,
        area: d.area as string | undefined,
        status: d.project_status as string | undefined,
        description: d.description,
        photos: ((d.photos ?? []) as { image?: Img }[]).map((p) => p.image).filter((i): i is Img => !!i?.id),
      };
    })
    .filter((p) => p.photos.length > 0);
  return { list, cacheHint };
}

/** Original file URL for a stored photo (used for the lightbox). */
export const photoUrl = (img: Img) =>
  img.src ?? (img.meta?.storageKey ? `/_emdash/api/media/file/${encodeURIComponent(img.meta.storageKey)}` : '');
