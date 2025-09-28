
import { supabase } from './supabaseClient';

export async function signUp(email: string, password: string, name: string) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { name } }
  });
  if (error) throw error;
  return data;
}

export async function signIn(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return data;
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

export async function sendMessage(content: string, conversationId?: string) {
  // Call Edge Function (needs Authorization header handled by supabase-js)
  const { data, error } = await supabase.functions.invoke('n8n-proxy', {
    body: { content, conversationId }
  });
  if (error) throw error;
  return data as { conversationId: string; message: { id: string; role: string; content: string; created_at: string } };
}
