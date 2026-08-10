CREATE POLICY "teaching resources read" ON storage.objects
  FOR SELECT TO authenticated USING (bucket_id = 'teaching-resources');
CREATE POLICY "teaching resources staff insert" ON storage.objects
  FOR INSERT TO authenticated WITH CHECK (bucket_id = 'teaching-resources' AND public.is_staff(auth.uid()));
CREATE POLICY "teaching resources staff update" ON storage.objects
  FOR UPDATE TO authenticated USING (bucket_id = 'teaching-resources' AND public.is_staff(auth.uid()))
  WITH CHECK (bucket_id = 'teaching-resources' AND public.is_staff(auth.uid()));
CREATE POLICY "teaching resources staff delete" ON storage.objects
  FOR DELETE TO authenticated USING (bucket_id = 'teaching-resources' AND public.is_staff(auth.uid()));