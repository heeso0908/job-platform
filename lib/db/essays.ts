import type { ParsedQuestion } from '../essays';

export interface Essay {
  id: string;
  application_id: string;
  position: number;
  question: string;
  char_limit: number | null;
  answer: string;
  tags: string[];
  submitted_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface EssayWithApplication extends Essay {
  applications: { id: string; company: string; position: string } | null;
}

export type UpdateEssayInput = Partial<{
  question: string;
  char_limit: number | null;
  answer: string;
  tags: string[];
  submitted_at: string | null;
}>;

export interface SearchOptions {
  q?: string;
  tag?: string;
  submittedOnly?: boolean;
}

const SEARCH_LIMIT = 100;

// PostgREST or() 필터 값으로 안전하게 넣기 위한 처리: LIKE 와일드카드를 이스케이프하고 따옴표로 감싼다.
export function ilikeValue(keyword: string): string {
  const likeEscaped = keyword.replace(/[\\%_]/g, (m) => `\\${m}`);
  const quoted = likeEscaped.replace(/[\\"]/g, (m) => `\\${m}`);
  return `"%${quoted}%"`;
}

export async function listEssays(supabase: any, applicationId: string): Promise<Essay[]> {
  const { data, error } = await supabase
    .from('essay_questions')
    .select('*')
    .eq('application_id', applicationId)
    .order('position', { ascending: true });
  if (error) throw new Error(error.message);
  return data;
}

export async function createEssays(
  supabase: any,
  applicationId: string,
  items: ParsedQuestion[],
  startPosition: number
): Promise<Essay[]> {
  if (items.length === 0) return [];
  const rows = items.map((item, i) => ({
    application_id: applicationId,
    position: startPosition + i,
    question: item.question,
    char_limit: item.charLimit,
  }));
  const { data, error } = await supabase.from('essay_questions').insert(rows).select();
  if (error) throw new Error(error.message);
  return data;
}

export async function updateEssay(supabase: any, id: string, input: UpdateEssayInput): Promise<Essay> {
  const { data, error } = await supabase.from('essay_questions').update(input).eq('id', id).select().single();
  if (error) throw new Error(error.message);
  return data;
}

export async function deleteEssay(supabase: any, id: string): Promise<void> {
  const { error } = await supabase.from('essay_questions').delete().eq('id', id);
  if (error) throw new Error(error.message);
}

export async function searchEssays(supabase: any, options: SearchOptions): Promise<EssayWithApplication[]> {
  const keyword = options.q?.trim() ?? '';
  const orParts: string[] = [];

  if (keyword) {
    const value = ilikeValue(keyword);
    const { data: apps, error: appsError } = await supabase
      .from('applications')
      .select('id')
      .or(`company.ilike.${value},position.ilike.${value}`);
    if (appsError) throw new Error(appsError.message);

    orParts.push(`question.ilike.${value}`, `answer.ilike.${value}`);
    const ids = ((apps ?? []) as { id: string }[]).map((a) => a.id);
    if (ids.length > 0) orParts.push(`application_id.in.(${ids.join(',')})`);
  }

  let query = supabase
    .from('essay_questions')
    .select('*, applications!inner(id, company, position)')
    .order('updated_at', { ascending: false })
    .limit(SEARCH_LIMIT);

  if (orParts.length > 0) query = query.or(orParts.join(','));
  if (options.tag) query = query.contains('tags', [options.tag]);
  if (options.submittedOnly) query = query.not('submitted_at', 'is', null);

  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return data;
}

export async function listTags(supabase: any): Promise<{ tag: string; count: number }[]> {
  const { data, error } = await supabase.from('essay_questions').select('tags');
  if (error) throw new Error(error.message);

  const counts = new Map<string, number>();
  for (const row of (data ?? []) as { tags: string[] }[]) {
    for (const tag of row.tags ?? []) counts.set(tag, (counts.get(tag) ?? 0) + 1);
  }
  return Array.from(counts, ([tag, count]) => ({ tag, count })).sort(
    (a, b) => b.count - a.count || a.tag.localeCompare(b.tag, 'ko')
  );
}
