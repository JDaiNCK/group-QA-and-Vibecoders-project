# Installs a portable PHP runtime and Composer inside tools/ so the project can be
# built and tested without touching the system. The host has no package manager
# (no winget/choco/scoop), so a zip build is unpacked directly.
#
# Usage: powershell -ExecutionPolicy Bypass -File tools/setup-php.ps1

$ErrorActionPreference = 'Stop'
$ProgressPreference = 'SilentlyContinue'

$root = Split-Path -Parent $PSScriptRoot
$phpDir = Join-Path $root 'tools\php'
$phpExe = Join-Path $phpDir 'php.exe'
$phpVersion = '8.3.35'
$phpUrl = "https://windows.php.net/downloads/releases/php-$phpVersion-nts-Win32-vs16-x64.zip"

if (Test-Path $phpExe) {
    Write-Host "PHP already present at $phpExe"
} else {
    $zip = Join-Path $env:TEMP "php-$phpVersion.zip"
    Write-Host "Downloading $phpUrl"
    Invoke-WebRequest -Uri $phpUrl -OutFile $zip -UseBasicParsing -TimeoutSec 300
    Expand-Archive -Path $zip -DestinationPath $phpDir -Force
    Write-Host "PHP extracted to $phpDir"
}

if (-not (Test-Path (Join-Path $phpDir 'php.ini'))) {
    Copy-Item (Join-Path $phpDir 'php.ini-development') (Join-Path $phpDir 'php.ini') -Force

    $ini = Join-Path $phpDir 'php.ini'
    $content = Get-Content $ini -Raw

    $content = $content -replace '(?m)^;\s*extension_dir\s*=\s*"ext"', "extension_dir = `"$phpDir\ext`""
    foreach ($ext in @('curl', 'fileinfo', 'mbstring', 'openssl', 'pdo_sqlite', 'sqlite3', 'tokenizer', 'xml', 'ctype', 'sodium', 'zip', 'intl', 'bcmath')) {
        $content = $content -replace "(?m)^;\s*extension=$ext\s*$", "extension=$ext"
    }
    $content = $content -replace '(?m)^memory_limit\s*=.*$', 'memory_limit = 512M'

    Set-Content -Path $ini -Value $content -Encoding ASCII
    Write-Host 'php.ini configured'
}

$composerPhar = Join-Path $root 'tools\composer.phar'
if (-not (Test-Path $composerPhar)) {
    $installer = Join-Path $env:TEMP 'composer-setup.php'
    Invoke-WebRequest -Uri 'https://getcomposer.org/installer' -OutFile $installer -UseBasicParsing -TimeoutSec 120
    & $phpExe $installer --install-dir=$root --filename=composer.phar
}

Write-Host ''
Write-Host 'Verifying:'
& $phpExe -v | Select-Object -First 1
& $phpExe $composerPhar --version
& $phpExe -r "echo 'pdo_sqlite: ', in_array('pdo_sqlite', get_loaded_extensions()) ? 'yes' : 'no', PHP_EOL;"
