import { isSupabaseReady, supabase } from './supabase';

export const MEDIA_BUCKET = 'travel-media';

export function isMediaStorageReady(): boolean {
  return isSupabaseReady && !!supabase;
}

function safeFileName(name: string): string {
  const extension = name.includes('.') ? `.${name.split('.').pop()}` : '';
  return `${Date.now()}-${crypto.randomUUID()}${extension.toLowerCase()}`;
}

export async function uploadTravelMedia(tripId: string, file: File) {
  if (!supabase) throw new Error('Supabase 연결이 설정되지 않았어요.');
  const path = `${tripId}/${safeFileName(file.name)}`;
  const { error } = await supabase.storage.from(MEDIA_BUCKET).upload(path, file, {
    cacheControl: '3600',
    contentType: file.type,
    upsert: false,
  });
  if (error) throw error;
  const { data } = supabase.storage.from(MEDIA_BUCKET).getPublicUrl(path);
  return { storagePath: path, publicUrl: data.publicUrl };
}

export async function deleteTravelMedia(path: string): Promise<void> {
  if (!supabase) throw new Error('Supabase 연결이 설정되지 않았어요.');
  const { error } = await supabase.storage.from(MEDIA_BUCKET).remove([path]);
  if (error) throw error;
}
