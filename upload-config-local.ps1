# Envia so api/config.local.php para o Hostinger (FTP)
param(
    [string]$Password = $env:HOSTINGER_FTP_PASS
)

$FtpHost = "ftp.sthevandev.com.br"
$FtpUser = "u586160337"
$RemoteRoot = "/domains/fisio.sthevandev.com.br/public_html"
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

$remotePath = "$RemoteRoot/api/config.local.php"
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
