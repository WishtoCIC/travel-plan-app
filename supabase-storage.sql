-- Supabase SQL Editor에서 한 번 실행하세요.
-- v2.0 여행앨범용 공개 버킷입니다. 현재 앱은 별도 사용자 로그인이 없으므로
-- 기존 공유 모델과 동일하게 anon 역할의 업로드/삭제를 허용합니다.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'travel-media', 'travel-media', true, 52428800,
  array['image/jpeg','image/png','image/webp','image/heic','image/heif','video/mp4','video/quicktime','video/webm']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "travel media public read" on storage.objects;
drop policy if exists "travel media anon upload" on storage.objects;
drop policy if exists "travel media anon delete" on storage.objects;

create policy "travel media public read"
on storage.objects for select
to public
using (bucket_id = 'travel-media');

create policy "travel media anon upload"
on storage.objects for insert
to anon
with check (bucket_id = 'travel-media');

create policy "travel media anon delete"
on storage.objects for delete
to anon
using (bucket_id = 'travel-media');
