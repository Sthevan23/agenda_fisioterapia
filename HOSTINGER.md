# Deploy na Hostinger — FisioAgenda

Guia passo a passo para publicar o FisioAgenda com API PHP + MySQL.

## 1. Criar banco de dados

1. Acesse o **hPanel** da Hostinger
2. Vá em **Bancos de dados MySQL** → **Gerenciar**
3. Crie um novo banco e um usuário (anote nome, usuário e senha)
4. Abra o **phpMyAdmin**
5. Selecione o banco criado e importe o arquivo `api/database.sql`

## 2. Configurar a API

O arquivo `api/config.php` já vai no Git e não leva senha. No File Manager, entre em `api/` e copie `config.local.example.php` para `config.local.php`. Preencha:

```php
define('DB_HOST', 'localhost');
define('DB_NAME', 'u123456789_fisio');
define('DB_USER', 'u123456789_user');
define('DB_PASS', 'SuaSenhaSegura');
define('CORS_ORIGIN', 'https://seudominio.com');
define('API_TOKEN', 'UmaSenhaSoSua');
```

`API_TOKEN` é a senha que a tela da agenda pede. Sem ela, a API não entrega pacientes nem consultas.

No hPanel também dá para usar as variáveis `FISIO_DB_PASS` e `FISIO_API_TOKEN`.

## 3. Enviar arquivos

Envie **toda a pasta do projeto** para `public_html/`:

```
public_html/
├── index.html
├── .htaccess
├── css/
├── js/
└── api/
    ├── index.php
    ├── config.php
    ├── config.local.php  ← criado por você, com DB_PASS e API_TOKEN
    ├── database.sql
    ├── .htaccess
    └── ...
```

## 4. Testar a API

Acesse no navegador:

```
https://seudominio.com/api/health
```

Resposta esperada:

```json
{
  "success": true,
  "message": "FisioAgenda API online",
  "version": "1.0.0",
  "connected": true,
  "authConfigured": true
}
```

## 5. Testar o site

Abra:

```
https://seudominio.com
```

Cadastre um paciente e agende uma consulta para confirmar que os dados estão sendo salvos no MySQL.

---

## Endpoints da API

| Método | Rota | Descrição |
|--------|------|-----------|
| GET | `/api/health` | Status da API |
| GET | `/api/patients` | Listar pacientes |
| POST | `/api/patients` | Criar paciente |
| PUT | `/api/patients/{id}` | Atualizar paciente |
| DELETE | `/api/patients/{id}` | Excluir paciente |
| GET | `/api/appointments` | Listar consultas |
| POST | `/api/appointments` | Criar consulta |
| PATCH | `/api/appointments/{id}` | Atualizar consulta |
| DELETE | `/api/appointments/{id}` | Excluir consulta |

---

## Requisitos Hostinger

- PHP **8.0+**
- MySQL / MariaDB
- Extensão **PDO MySQL** habilitada (padrão na Hostinger)
- **mod_rewrite** habilitado (Apache — padrão na Hostinger)

---

## Problemas comuns

**Erro 500 ao acessar /api/**
→ Verifique se `config.local.php` existe e se `DB_PASS` está preenchida.

**Página carrega mas não salva dados**
→ Abra o DevTools (F12) → aba Network e veja se as requisições para `/api/` retornam erro.

**CORS bloqueado**
→ Em `config.local.php`, defina `CORS_ORIGIN` com a URL exata do seu domínio.

**Subpasta (ex: seudominio.com/agenda/)**
→ Altere no `index.html`:
```html
<meta name="api-base" content="/agenda/api">
```
