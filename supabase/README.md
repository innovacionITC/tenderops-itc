# Migraciones de Supabase

La tabla `professional_profiles` y el bucket `professional-documents` los consume el **API .NET**, no Next.js.

1. SQL Editor: ejecutar `migrations/20261112_professional_profiles.sql` (si aún no está).
2. Verificar:

```sql
SELECT to_regclass('public.professional_profiles');
SELECT id, name, public FROM storage.buckets WHERE id = 'professional-documents';
```

3. Confirmar que tenderops-api ya tiene `DATABASE_URL` y `SUPABASE_SERVICE_ROLE_KEY`. No las copie al frontend.
4. Implementar `/perfiles` en el API. Contrato: `docs/architecture/perfiles-api-contract.md`.
