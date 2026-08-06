REVOKE ALL ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.is_staff(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_staff(uuid) TO authenticated;

CREATE POLICY "students upload own folder" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'past-paper-submissions' AND (storage.foldername(name))[1] = 'students' AND (storage.foldername(name))[2] = auth.uid()::text);
CREATE POLICY "students read own files" ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'past-paper-submissions' AND ((storage.foldername(name))[2] = auth.uid()::text OR public.is_staff(auth.uid())));
CREATE POLICY "students delete own files" ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'past-paper-submissions' AND (storage.foldername(name))[2] = auth.uid()::text);