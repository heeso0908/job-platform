export async function getSlackWebhook(supabase: any, userId: string): Promise<string | null> {
  const { data, error } = await supabase
    .from('slack_webhooks')
    .select('webhook_url')
    .eq('user_id', userId)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data?.webhook_url ?? null;
}

export async function upsertSlackWebhook(supabase: any, userId: string, webhookUrl: string): Promise<void> {
  const { error } = await supabase.from('slack_webhooks').upsert({ user_id: userId, webhook_url: webhookUrl });
  if (error) throw new Error(error.message);
}
