# FisioAgenda

Sistema web para gestao de consultas de fisioterapia.

## Deploy na Hostinger

Siga o guia completo: HOSTINGER-GIT.md

## API REST

- GET /api/health
- GET /api/auth (exige a senha API_TOKEN)
- GET/POST/PUT/DELETE /api/patients
- GET/POST/PATCH/DELETE /api/appointments

Pacientes e consultas exigem o header `X-Api-Token`.

## Executar localmente

1. Crie um banco MySQL e importe `api/database.sql`
2. Copie `api/config.local.example.php` para `api/config.local.php`
3. Preencha `DB_PASS` e `API_TOKEN`
4. `php -S localhost:8080 router.php`

Acesse: http://localhost:8080 e entre com a senha de `API_TOKEN`.

Os dados sao salvos no MySQL via API REST.
