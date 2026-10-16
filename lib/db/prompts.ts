export interface Prompt {
  id: string;
  user_id: string;
  category: string;
  title: string;
  content: string;
  created_at: string;
  updated_at: string;
}

export interface CreatePromptInput {
  category?: string;
  title: string;
  content?: string;
}

export type UpdatePromptInput = Partial<{
  category: string;
  title: string;
  content: string;
}>;

export async function listPrompts(supabase: any): Promise<Prompt[]> {
  const { data, error } = await supabase
    .from('prompts')
    .select('*')
    .order('category', { ascending: true })
    .order('created_at', { ascending: false });
  if (error) throw new Error(error.message);
  return data;
}

export async function createPrompt(supabase: any, userId: string, input: CreatePromptInput): Promise<Prompt> {
  const { data, error } = await supabase
    .from('prompts')
    .insert({
      user_id: userId,
      category: input.category ?? '기타',
      title: input.title,
      content: input.content ?? '',
    })
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data;
}

export async function updatePrompt(supabase: any, id: string, input: UpdatePromptInput): Promise<Prompt> {
  const { data, error } = await supabase.from('prompts').update(input).eq('id', id).select().single();
  if (error) throw new Error(error.message);
  return data;
}

export async function deletePrompt(supabase: any, id: string): Promise<void> {
  const { error } = await supabase.from('prompts').delete().eq('id', id);
  if (error) throw new Error(error.message);
}
