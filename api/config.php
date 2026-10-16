<?php

declare(strict_types=1);

/**
 * Configuração da API — compatível com Git auto-deploy da Hostinger.
 * Senhas ficam em config.local.php (não vai pro Git) ou variáveis FISIO_DB_* no hPanel.
 */

function fisioEnv(string $key, string $default = ''): string
{
    $value = getenv($key);
    if ($value !== false && $value !== '') {
        return $value;
    }

    return $_SERVER[$key] ?? $_ENV[$key] ?? $default;
}

$configLocal = __DIR__ . '/config.local.php';
if (is_readable($configLocal)) {
    require $configLocal;
    return;
}

define('DB_HOST', fisioEnv('FISIO_DB_HOST', 'localhost'));
define('DB_NAME', fisioEnv('FISIO_DB_NAME', 'u586160337_agendathais'));
define('DB_USER', fisioEnv('FISIO_DB_USER', 'u586160337_agendathais'));
define('DB_PASS', fisioEnv('FISIO_DB_PASS', ''));
define('DB_CHARSET', 'utf8mb4');
define('CORS_ORIGIN', fisioEnv('FISIO_CORS_ORIGIN', 'https://fisio.sthevandev.com.br'));
