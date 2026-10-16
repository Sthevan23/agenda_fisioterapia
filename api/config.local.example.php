<?php
/**
 * Copie para config.local.php no servidor (File Manager) após o primeiro Git deploy.
 * Este arquivo NÃO vai para o Git — a senha fica só no Hostinger.
 */

define('DB_HOST', 'localhost');
define('DB_NAME', 'u586160337_agendathais');
define('DB_USER', 'u586160337_agendathais');
define('DB_PASS', 'COLOQUE_A_SENHA_DO_MYSQL_AQUI');
define('DB_CHARSET', 'utf8mb4');

define('CORS_ORIGIN', 'https://fisio.sthevandev.com.br');
