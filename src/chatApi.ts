import { supabase } from './supabaseClient';

export async function signUp(email: string, password: string, name: string) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { name } },
  });
  if (error) throw error;
  return data; // { user, session }
}

export async function signIn(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return data; // { user, session }
}

export function signOut() {
  return supabase.auth.signOut();
}

export async function listConversations() {
  const { data, error } = await supabase
    .from('conversations')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data;
}

export async function getMessages(conversationId: string) {
  const { data, error } = await supabase
    .from('messages')
    .select('*')
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: true });
  if (error) throw error;
  return data;
}

// Appelle l’Edge Function n8n-proxy (qui parle à n8n + sauvegarde l’historique)
export async function sendMessage(content: string, conversationId?: string) {
  const { data, error } = await supabase.functions.invoke('n8n-proxy', {
    body: { content, conversationId },
  });

  if (error) {
    console.error('Edge Function error:', error);
    // essaye d’afficher l’info utile
    const msg = (error as any)?.message || JSON.stringify(error);
    throw new Error(`invoke failed: ${msg}`);
  }

  return data as {
    conversationId: string;
    message: { id: string; role: 'assistant' | 'user'; content: string; created_at: string };
  };
}
