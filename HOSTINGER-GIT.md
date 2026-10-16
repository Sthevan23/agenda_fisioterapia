# Git auto-deploy na Hostinger — FisioAgenda

O repositório está pronto para **Advanced → Git → Connect with GitHub**. Cada `git push` na branch conectada publica os arquivos em `public_html` (sem build).

## 1. Conectar no hPanel

1. **Websites** → site **fisio.sthevandev.com.br** → **Advanced** → **Git**
2. **Connect with GitHub** → autorize o app → escolha o repositório `agenda_fisioterapia`
3. **Branch:** `main`
4. **Deploy directory:** deixe **`public_html`** (raiz do subdomínio fisio)
5. **Deploy** (primeira vez) e deixe **Auto-deployment** ligado

> A pasta de deploy precisa estar **vazia** na primeira vez. Se der erro, esvazie `public_html` do fisio e deploy de novo.

## 2. Banco MySQL (uma vez)

1. phpMyAdmin → banco `u586160337_agendathais`
2. Importe `mysql-import-u586160337_agendathais.sql` (ou `api/database.sql`)

## 3. Senha da API (obrigatório após deploy)

O Git **não** envia senha. Escolha **uma** opção:

### Opção A — File Manager (recomendado)

1. `public_html/api/` → novo arquivo **`config.local.php`**
2. Copie o conteúdo do arquivo local `api/COLE-NO-HOSTINGER-config.local.php` (só no seu PC) e salve no servidor.

### Opção B — Variáveis PHP no hPanel

**Advanced → PHP Configuration → PHP Variables**, adicione:

- `FISIO_DB_PASS` = senha do MySQL
- (opcional) `FISIO_DB_NAME`, `FISIO_DB_USER`, `FISIO_CORS_ORIGIN`

Sem isso, `/api/index.php?route=health` responde erro de banco.

## 4. Testar

```
https://fisio.sthevandev.com.br/api/health
```

JSON com `"connected": true` → cadastros vão para o MySQL.

Abra o site: a faixa laranja **“Banco offline”** deve sumir.

## 5. Desenvolvimento local

- `api/config.local.php` — suas credenciais (gitignored)
- `api/config.php` — loader versionado (sem senha)

## Estrutura publicada pelo Git

```
public_html/
├── index.html
├── .htaccess
├── api.php
├── css/
├── js/
├── styles.css/index.css   → importa css/global.css
└── api/
    ├── index.php
    ├── config.php
    ├── config.local.php   ← você cria no servidor
    └── ...
```

## Push para publicar

```bash
git push origin main
```

Aguarde o deploy no hPanel (Deployments) e teste `/api/health`.
