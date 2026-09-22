export interface ApplicationStage {
  id: string;
  application_id: string;
  stage_type: string;
  scheduled_at: string;
  status: string;
  notes: string | null;
  slack_reminder_days_before: number;
}

export interface CreateStageInput {
  stage_type: string;
  scheduled_at: string;
  status?: string;
  notes?: string | null;
  slack_reminder_days_before?: number;
}

export type UpdateStageInput = Partial<{
  stage_type: string;
  scheduled_at: string;
  status: string;
  notes: string | null;
  slack_reminder_days_before: number;
}>;

export async function listStages(supabase: any, applicationId: string): Promise<ApplicationStage[]> {
  const { data, error } = await supabase
    .from('application_stages')
    .select('*')
    .eq('application_id', applicationId)
    .order('scheduled_at', { ascending: true });
  if (error) throw new Error(error.message);
  return data;
}

export async function createStage(
  supabase: any,
  applicationId: string,
  input: CreateStageInput
): Promise<ApplicationStage> {
  const { data, error } = await supabase
    .from('application_stages')
    .insert({
      application_id: applicationId,
      stage_type: input.stage_type,
      scheduled_at: input.scheduled_at,
      status: input.status ?? '예정',
      notes: input.notes ?? null,
      slack_reminder_days_before: input.slack_reminder_days_before ?? 1,
    })
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data;
}

export async function updateStage(supabase: any, id: string, input: UpdateStageInput): Promise<ApplicationStage> {
  const { data, error } = await supabase.from('application_stages').update(input).eq('id', id).select().single();
  if (error) throw new Error(error.message);
  return data;
}

export async function deleteStage(supabase: any, id: string): Promise<void> {
  const { error } = await supabase.from('application_stages').delete().eq('id', id);
  if (error) throw new Error(error.message);
}
