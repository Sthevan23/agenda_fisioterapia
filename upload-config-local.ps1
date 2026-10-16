# Envia so api/config.local.php para o Hostinger (FTP)
param(
    [string]$Password = $env:HOSTINGER_FTP_PASS
)

$FtpHost = if ($env:HOSTINGER_FTP_HOST) { $env:HOSTINGER_FTP_HOST } else { "ftp.sthevandev.com.br" }
$FtpUser = $env:HOSTINGER_FTP_USER
# Conta FTP aponta para public_html/fisio — caminho /api/config.local.php
$LocalRoot = $PSScriptRoot
$LocalFile = Join-Path $LocalRoot "api\config.local.php"

if (-not (Test-Path $LocalFile)) {
    Write-Error "Arquivo nao encontrado: $LocalFile"
    exit 1
}

if (-not $Password) {
    Write-Error "Defina HOSTINGER_FTP_PASS ou passe -Password"
    exit 1
}

if (-not $FtpUser) {
    Write-Error "Defina HOSTINGER_FTP_USER (usuario da conta FTP no hPanel)"
    exit 1
}

$remotePath = "/api/config.local.php"
$uri = "ftp://${FtpHost}${remotePath}"
$request = [System.Net.FtpWebRequest]::Create($uri)
$request.Method = [System.Net.WebRequestMethods+Ftp]::UploadFile
$request.Credentials = New-Object System.Net.NetworkCredential($FtpUser, $Password)
$request.UseBinary = $true
$request.UsePassive = $true

$bytes = [System.IO.File]::ReadAllBytes($LocalFile)
$stream = $request.GetRequestStream()
$stream.Write($bytes, 0, $bytes.Length)
$stream.Close()
$response = $request.GetResponse()
Write-Host "OK: $remotePath"
$response.Close()
