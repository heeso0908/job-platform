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
