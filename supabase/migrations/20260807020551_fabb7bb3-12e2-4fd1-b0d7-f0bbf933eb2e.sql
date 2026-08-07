-- Ensure default-role trigger exists on new signups
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Staff can upload marked-up versions and update submission files
DROP POLICY IF EXISTS "staff update submission files" ON storage.objects;
CREATE POLICY "staff update submission files"
ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'past-paper-submissions' AND public.is_staff(auth.uid()))
WITH CHECK (bucket_id = 'past-paper-submissions' AND public.is_staff(auth.uid()));

DROP POLICY IF EXISTS "staff upload submission files" ON storage.objects;
CREATE POLICY "staff upload submission files"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'past-paper-submissions' AND public.is_staff(auth.uid()));

-- Admins can remove submission files
DROP POLICY IF EXISTS "admins delete submission files" ON storage.objects;
CREATE POLICY "admins delete submission files"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'past-paper-submissions' AND public.has_role(auth.uid(), 'admin'));