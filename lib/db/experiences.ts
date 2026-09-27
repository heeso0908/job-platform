import { ilikeValue } from './essays';

export interface Experience {
  id: string;
  user_id: string;
  category: string;
  title: string;
  organization: string | null;
  period_start: string | null;
  period_end: string | null;
  summary: string | null;
  detail: string;
  tags: string[];
  fields: Record<string, string>;
  created_at: string;
  updated_at: string;
}

export interface CreateExperienceInput {
  category?: string;
  title: string;
  organization?: string | null;
  period_start?: string | null;
  period_end?: string | null;
  summary?: string | null;
  detail?: string;
  tags?: string[];
  fields?: Record<string, string>;
}

export type UpdateExperienceInput = Partial<{
  category: string;
  title: string;
  organization: string | null;
  period_start: string | null;
  period_end: string | null;
  summary: string | null;
  detail: string;
  tags: string[];
  fields: Record<string, string>;
}>;

export interface SearchExperienceOptions {
  q?: string;
  category?: string;
  tag?: string;
}

export async function listExperiences(supabase: any): Promise<Experience[]> {
  const { data, error } = await supabase.from('experiences').select('*').order('created_at', { ascending: false });
  if (error) throw new Error(error.message);
  return data;
}

export async function createExperience(supabase: any, userId: string, input: CreateExperienceInput): Promise<Experience> {
  const { data, error } = await supabase
    .from('experiences')
    .insert({
      user_id: userId,
      category: input.category ?? '기타',
      title: input.title,
      organization: input.organization ?? null,
      period_start: input.period_start ?? null,
      period_end: input.period_end ?? null,
      summary: input.summary ?? null,
      detail: input.detail ?? '',
      tags: input.tags ?? [],
      fields: input.fields ?? {},
    })
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data;
}

export async function updateExperience(supabase: any, id: string, input: UpdateExperienceInput): Promise<Experience> {
  const { data, error } = await supabase.from('experiences').update(input).eq('id', id).select().single();
  if (error) throw new Error(error.message);
  return data;
}

export async function deleteExperience(supabase: any, id: string): Promise<void> {
  const { error } = await supabase.from('experiences').delete().eq('id', id);
  if (error) throw new Error(error.message);
}

export async function searchExperiences(supabase: any, options: SearchExperienceOptions): Promise<Experience[]> {
  let query = supabase.from('experiences').select('*').order('updated_at', { ascending: false });

  const keyword = options.q?.trim();
  if (keyword) {
    const value = ilikeValue(keyword);
    query = query.or(`title.ilike.${value},detail.ilike.${value}`);
  }
  if (options.category) query = query.eq('category', options.category);
  if (options.tag) query = query.contains('tags', [options.tag]);

  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return data;
}
