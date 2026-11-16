import { getEmDashCollection } from 'emdash';

type Img = { id: string; src?: string; alt?: string; width?: number; height?: number; meta?: { storageKey?: string } };
type Item = { item: string };

/** Google Drive share links (/file/d/<ID>/... or ?id=<ID>) become a direct image URL; other links pass through. */
export const directImageUrl = (url: string) => {
  const id = /drive\.google\.com\/(?:file\/d\/|open\?(?:.*&)?id=|uc\?(?:.*&)?id=)([\w-]+)/.exec(url)?.[1];
  return id ? `https://lh3.googleusercontent.com/d/${id}` : url;
};
/** An uploaded photo if there is one, else the pasted link. */
const pick = (image?: Img, link?: string, alt = ''): Img | null =>
  image?.id ? image : link?.trim() ? { id: '', src: directImageUrl(link.trim()), alt } : null;

/** The single "About me" entry. Falls back to empty values so the page never crashes mid-edit. */
export async function getProfile() {
  const { entries, cacheHint } = await getEmDashCollection('profile', { status: 'published', limit: 1, orderBy: { created_at: 'asc' } });
  const d = (entries[0]?.data ?? {}) as Record<string, any>;
  return {
    cacheHint,
    name: d.title ?? '',
    photo: pick(d.photo, d.photo_link, d.title),
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
        // Each photo is an upload or a link; list order is display order.
        photos: ((d.photos ?? []) as { image?: Img; link?: string }[]).map((p) => pick(p.image, p.link)).filter((i): i is Img => !!i),
      };
    })
    .filter((p) => p.photos.length > 0);
  return { list, cacheHint };
}

/** Original file URL for a stored photo (used for the lightbox). */
export const photoUrl = (img: Img) =>
  img.src ?? (img.meta?.storageKey ? `/_emdash/api/media/file/${encodeURIComponent(img.meta.storageKey)}` : '');
