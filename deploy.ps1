# Deploy FisioAgenda -> Hostinger (FTP)
# Execute: .\deploy.ps1

param(
    [string]$Password = $env:HOSTINGER_FTP_PASS
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
$RemoteRoot = "/public_html"

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

$dirs = @("/public_html/css", "/public_html/js", "/public_html/api", "/public_html/api/lib", "/public_html/api/routes")
foreach ($d in $dirs) { Ensure-FtpDir $d }

$files = @(
    @("index.html", "/public_html/index.html"),
    @(".htaccess", "/public_html/.htaccess"),
    @("css\main.css", "/public_html/css/main.css"),
    @("css\global.css", "/public_html/css/global.css"),
    @("api\index.php", "/public_html/api/index.php"),
    @("api\config.php", "/public_html/api/config.php"),
    @("api\database.sql", "/public_html/api/database.sql"),
    @("api\.htaccess", "/public_html/api/.htaccess"),
    @("api\lib\db.php", "/public_html/api/lib/db.php"),
    @("api\lib\response.php", "/public_html/api/lib/response.php"),
    @("api\routes\patients.php", "/public_html/api/routes/patients.php"),
    @("api\routes\appointments.php", "/public_html/api/routes/appointments.php")
)

Get-ChildItem "$LocalRoot\js\*.js" | ForEach-Object {
    $files += @(@($_.FullName.Substring($LocalRoot.Length + 1), "/public_html/js/$($_.Name)"))
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
Write-Host "Teste: https://sthevandev.com.br/api/health"
Write-Host "Site:  https://sthevandev.com.br"
