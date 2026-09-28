import { ilikeValue } from './essays';

export interface Application {
  id: string;
  user_id: string;
  company: string;
  position: string;
  apply_link: string | null;
  memo: string | null;
  status: string;
  created_at: string;
}

export interface CreateApplicationInput {
  company: string;
  position: string;
  apply_link?: string | null;
  memo?: string | null;
  status?: string;
}

export type UpdateApplicationInput = Partial<{
  company: string;
  position: string;
  apply_link: string | null;
  memo: string | null;
  status: string;
}>;

export async function listApplications(supabase: any): Promise<Application[]> {
  const { data, error } = await supabase.from('applications').select('*').order('created_at', { ascending: false });
  if (error) throw new Error(error.message);
  return data;
}

export async function getApplication(supabase: any, id: string): Promise<Application | null> {
  const { data, error } = await supabase.from('applications').select('*').eq('id', id).maybeSingle();
  if (error) throw new Error(error.message);
  return data;
}

export async function createApplication(
  supabase: any,
  userId: string,
  input: CreateApplicationInput
): Promise<Application> {
  const { data, error } = await supabase
    .from('applications')
    .insert({
      user_id: userId,
      company: input.company,
      position: input.position,
      apply_link: input.apply_link ?? null,
      memo: input.memo ?? null,
      status: input.status ?? '지원예정',
    })
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data;
}

export async function updateApplication(
  supabase: any,
  id: string,
  input: UpdateApplicationInput
): Promise<Application> {
  const { data, error } = await supabase.from('applications').update(input).eq('id', id).select().single();
  if (error) throw new Error(error.message);
  return data;
}

export async function deleteApplication(supabase: any, id: string): Promise<void> {
  const { error } = await supabase.from('applications').delete().eq('id', id);
  if (error) throw new Error(error.message);
}

export interface SearchApplicationsOptions {
  q?: string;
  status?: string;
}

export async function searchApplications(supabase: any, options: SearchApplicationsOptions): Promise<Application[]> {
  let query = supabase.from('applications').select('*').order('created_at', { ascending: false });

  const keyword = options.q?.trim();
  if (keyword) {
    const value = ilikeValue(keyword);
    query = query.or(`company.ilike.${value},position.ilike.${value}`);
  }
  if (options.status) query = query.eq('status', options.status);

  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return data;
}
