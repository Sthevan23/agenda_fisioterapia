# Deploy FisioAgenda -> Hostinger (FTP)
# Execute: .\deploy.ps1

param(
    [string]$Password = $env:HOSTINGER_FTP_PASS,
    [string]$RemoteRoot = "/domains/fisio.sthevandev.com.br/public_html"
)

$FtpHost = "ftp.sthevandev.com.br"
$FtpUser = "u586160337"

if (-not $Password) {
    $secure = Read-Host "Senha FTP da Hostinger" -AsSecureString
    $Password = [Runtime.InteropServices.Marshal]::PtrToStringAuto(
        [Runtime.InteropServices.Marshal]::SecureStringToBSTR($secure)
    )
}

$FtpPassPlain = $Password

$LocalRoot = $PSScriptRoot
$RemoteRoot = $RemoteRoot.TrimEnd('/')

function Upload-FtpFile($LocalFile, $RemotePath) {
    $uri = "ftp://${FtpHost}${RemotePath}"
    $request = [System.Net.FtpWebRequest]::Create($uri)
    $request.Method = [System.Net.WebRequestMethods+Ftp]::UploadFile
    $request.Credentials = New-Object System.Net.NetworkCredential($FtpUser, $FtpPassPlain)
    $request.UseBinary = $true
    $request.UsePassive = $true

    $bytes = [System.IO.File]::ReadAllBytes($LocalFile)
    $stream = $request.GetRequestStream()
    $stream.Write($bytes, 0, $bytes.Length)
    $stream.Close()
    $response = $request.GetResponse()
    $response.Close()
    Write-Host "  OK $RemotePath"
}

function Ensure-FtpDir($RemoteDir) {
    try {
        $uri = "ftp://${FtpHost}${RemoteDir}"
        $request = [System.Net.FtpWebRequest]::Create($uri)
        $request.Method = [System.Net.WebRequestMethods+Ftp]::MakeDirectory
        $request.Credentials = New-Object System.Net.NetworkCredential($FtpUser, $FtpPassPlain)
        $request.UsePassive = $true
        $response = $request.GetResponse()
        $response.Close()
    } catch { }
}

Write-Host "Deploy FisioAgenda -> $FtpHost$RemoteRoot"
Write-Host ""

$stylesDir = Join-Path $LocalRoot "styles.css"
if (-not (Test-Path $stylesDir)) {
    New-Item -ItemType Directory -Path $stylesDir | Out-Null
}
"@import url('../css/global.css');" | Set-Content (Join-Path $stylesDir "index.css") -Encoding UTF8
Write-Host ""

$configRel = "api\config.local.php"
if (-not (Test-Path (Join-Path $LocalRoot $configRel))) {
    Write-Host "AVISO: api\config.local.php nao encontrado — crie no servidor apos deploy Git."
    $configRel = $null
}

$dirs = @(
    "$RemoteRoot/css",
    "$RemoteRoot/js",
    "$RemoteRoot/styles.css",
    "$RemoteRoot/api",
    "$RemoteRoot/api/lib",
    "$RemoteRoot/api/routes"
)
foreach ($d in $dirs) { Ensure-FtpDir $d }

$files = @(
    @("index.html", "$RemoteRoot/index.html"),
    @(".htaccess", "$RemoteRoot/.htaccess"),
    @("api.php", "$RemoteRoot/api.php"),
    @("css\main.css", "$RemoteRoot/css/main.css"),
    @("css\global.css", "$RemoteRoot/css/global.css"),
    @("styles.css\index.css", "$RemoteRoot/styles.css/index.css"),
    @("api\index.php", "$RemoteRoot/api/index.php"),
    @("api\config.php", "$RemoteRoot/api/config.php"),
    @("api\config.local.example.php", "$RemoteRoot/api/config.local.example.php"),
    @("api\database.sql", "$RemoteRoot/api/database.sql"),
    @("api\.htaccess", "$RemoteRoot/api/.htaccess"),
    @("api\lib\db.php", "$RemoteRoot/api/lib/db.php"),
    @("api\lib\response.php", "$RemoteRoot/api/lib/response.php"),
    @("api\routes\patients.php", "$RemoteRoot/api/routes/patients.php"),
    @("api\routes\appointments.php", "$RemoteRoot/api/routes/appointments.php")
)

Get-ChildItem "$LocalRoot\js\*.js" | ForEach-Object {
    $files += @(@($_.FullName.Substring($LocalRoot.Length + 1), "$RemoteRoot/js/$($_.Name)"))
}

if ($configRel) {
    $files += @(@($configRel, "$RemoteRoot/api/config.local.php"))
}

foreach ($f in $files) {
    $local = Join-Path $LocalRoot ($f[0] -replace '/', '\')
    if (-not (Test-Path $local)) {
        Write-Host "  SKIP (nao encontrado): $($f[0])"
        continue
    }
    Upload-FtpFile $local $f[1]
}

Write-Host ""
Write-Host "Deploy concluido!"
Write-Host "Teste: https://fisio.sthevandev.com.br/api/health"
Write-Host "Site:  https://fisio.sthevandev.com.br"
