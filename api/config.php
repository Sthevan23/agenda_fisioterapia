<?php

declare(strict_types=1);

/**
 * Configuração da API — compatível com Git auto-deploy da Hostinger.
 * Senhas ficam em config.local.php (não vai pro Git) ou variáveis FISIO_DB_* no hPanel.
 */

$configLocal = __DIR__ . '/config.local.php';
if (is_readable($configLocal)) {
    require $configLocal;
    return;
}

define('DB_HOST', getenv('FISIO_DB_HOST') ?: 'localhost');
define('DB_NAME', getenv('FISIO_DB_NAME') ?: 'u586160337_agendathais');
define('DB_USER', getenv('FISIO_DB_USER') ?: 'u586160337_agendathais');
define('DB_PASS', getenv('FISIO_DB_PASS') ?: '');
define('DB_CHARSET', 'utf8mb4');
define('CORS_ORIGIN', getenv('FISIO_CORS_ORIGIN') ?: 'https://fisio.sthevandev.com.br');
