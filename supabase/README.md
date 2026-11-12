# Migraciones de Supabase

## Banco de perfiles

1. Abra el **SQL Editor** del proyecto Supabase de TenderOps.
2. Pegue y ejecute `migrations/20261112_professional_profiles.sql`.
3. Verifique:

```sql
SELECT to_regclass('public.professional_profiles');
SELECT id, name, public FROM storage.buckets WHERE id = 'professional-documents';
```

Hasta que `to_regclass` devuelva `public.professional_profiles`, el módulo `/perfiles` mostrará el error de tabla inexistente. No se afirma que la tabla exista en un proyecto concreto si no se ha comprobado.

Variables del BFF (solo servidor): `DATABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `NEXT_PUBLIC_SUPABASE_URL`. Documentación: `docs/BANCO_PERFILES.md`.
