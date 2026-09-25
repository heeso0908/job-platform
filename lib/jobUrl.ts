export interface JobMeta {
  company: string;
  position: string;
}

export function isSafePublicUrl(raw: string): boolean {
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    return false;
  }
  if (url.protocol !== 'http:' && url.protocol !== 'https:') return false;

  const host = url.hostname.toLowerCase().replace(/^\[|\]$/g, '');
  if (host === 'localhost' || host.endsWith('.localhost') || host.endsWith('.internal') || host.endsWith('.local')) return false;
  if (host === '::1' || host === '::' || host.startsWith('fc') || host.startsWith('fd') || host.startsWith('fe80')) {
    if (host.includes(':')) return false;
  }

  const v4 = host.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/);
  if (v4) {
    const [a, b] = [Number(v4[1]), Number(v4[2])];
    if (a === 0 || a === 10 || a === 127) return false;
    if (a === 169 && b === 254) return false;
    if (a === 172 && b >= 16 && b <= 31) return false;
    if (a === 192 && b === 168) return false;
    if (a === 100 && b >= 64 && b <= 127) return false;
  }
  return true;
}

function decodeEntities(s: string): string {
  return s
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)))
    .trim();
}

function metaContent(html: string, property: string): string {
  const tags = html.match(/<meta\b[^>]*>/gi) ?? [];
  for (const tag of tags) {
    const key = tag.match(/(?:property|name)\s*=\s*["']([^"']+)["']/i)?.[1];
    if (key?.toLowerCase() !== property) continue;
    const content = tag.match(/content\s*=\s*"([^"]*)"/i)?.[1] ?? tag.match(/content\s*=\s*'([^']*)'/i)?.[1];
    if (content) return decodeEntities(content);
  }
  return '';
}

function findJobPosting(node: unknown): { title?: string; company?: string } | null {
  if (Array.isArray(node)) {
    for (const item of node) {
      const found = findJobPosting(item);
      if (found) return found;
    }
    return null;
  }
  if (node && typeof node === 'object') {
    const obj = node as Record<string, any>;
    const type = obj['@type'];
    if (type === 'JobPosting' || (Array.isArray(type) && type.includes('JobPosting'))) {
      const org = obj.hiringOrganization;
      return {
        title: typeof obj.title === 'string' ? obj.title : undefined,
        company: typeof org === 'string' ? org : typeof org?.name === 'string' ? org.name : undefined,
      };
    }
    if (obj['@graph']) return findJobPosting(obj['@graph']);
  }
  return null;
}

function fromJsonLd(html: string): JobMeta | null {
  const blocks = html.match(/<script[^>]*application\/ld\+json[^>]*>([\s\S]*?)<\/script>/gi) ?? [];
  for (const block of blocks) {
    const body = block.replace(/^<script[^>]*>/i, '').replace(/<\/script>$/i, '');
    try {
      const found = findJobPosting(JSON.parse(body));
      if (found && (found.title || found.company)) {
        return { company: decodeEntities(found.company ?? ''), position: decodeEntities(found.title ?? '') };
      }
    } catch {
      continue;
    }
  }
  return null;
}

export interface RoleGroup {
  org: string;
  jobs: string[];
}

export function parseRoles(html: string): string[] {
  const description = metaContent(html, 'og:description') || metaContent(html, 'description');
  const list = description.match(/모집\s*직무\s*[:：]\s*(.+?)\s*(?:-\s*자소설닷컴)?$/)?.[1];
  if (!list) return [];
  const roles = list
    .split(/,\s*(?![^()]*\))/)
    .map((r) => r.trim())
    .filter(Boolean);
  return Array.from(new Set(roles));
}

export function splitRole(role: string): { org: string; job: string } {
  const m = role.match(/^\[([^\]]+)\]\s*(.+)$/);
  return m ? { org: m[1].trim(), job: m[2].trim() } : { org: '', job: role.trim() };
}

export function groupRoles(roles: string[]): RoleGroup[] {
  const groups = new Map<string, string[]>();
  for (const role of roles) {
    const { org, job } = splitRole(role);
    const jobs = groups.get(org) ?? [];
    if (!jobs.includes(job)) jobs.push(job);
    groups.set(org, jobs);
  }
  return Array.from(groups, ([org, jobs]) => ({ org, jobs }));
}

export function normalizeJobUrl(raw: string): string {
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    return raw;
  }
  const host = url.hostname.replace(/^www\./, '');
  const ec = url.searchParams.get('ec');
  if (host === 'jasoseol.com' && url.pathname.replace(/\/$/, '') === '/recruit' && ec && /^\d+$/.test(ec)) {
    return `https://jasoseol.com/recruit/${ec}`;
  }
  return raw;
}

const GENERIC_TITLES = new Set(['채용 공고', '채용공고', '채용', '공고']);
const MAX_ROLES = 3;
const MAX_ROLE_LENGTH = 60;

export function parseJobMeta(html: string): JobMeta {
  const ogTitle = metaContent(html, 'og:title') || decodeEntities(html.match(/<title[^>]*>([^<]*)<\/title>/i)?.[1] ?? '');
  const ogDescription = metaContent(html, 'og:description') || metaContent(html, 'description');
  const titleHead = ogTitle.split(/\s[|｜]\s/)[0].trim();

  const postingTitle = titleHead.match(/채용\s*공고\s*[-–]\s*(.+)$/)?.[1]?.trim();
  const roles = ogDescription.match(/모집\s*직무\s*[:：]\s*(.+?)\s*(?:-\s*자소설닷컴)?$/)?.[1]?.trim();
  const isBroadListing = roles !== undefined && (roles.split(',').length > MAX_ROLES || roles.length > MAX_ROLE_LENGTH);
  const conciseRole = isBroadListing ? postingTitle : roles;

  const jsonLd = fromJsonLd(html);
  if (jsonLd) return { company: jsonLd.company, position: conciseRole ?? jsonLd.position };

  const company = titleHead.match(/^(.+?)\s+채용\s*공고/)?.[1]?.trim();
  if (company) return { company, position: conciseRole ?? '' };

  const fallback = GENERIC_TITLES.has(titleHead) ? '' : titleHead;
  return { company: '', position: conciseRole ?? fallback };
}
