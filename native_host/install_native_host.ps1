# Chrome Native Messaging Host installer
# No admin rights required (registers to Current User)

param(
    [Parameter(Mandatory = $true)]
    [string]$ExtensionId
)

$ExtensionId = $ExtensionId.Trim()

$HostName = "com.googlechat.openinexplorer"
$ScriptDir = $PSScriptRoot
$BatPath = Join-Path $ScriptDir "run_host.bat"
$ManifestPath = Join-Path $ScriptDir "manifest.json"

# Check extension ID format (32 lowercase letters)
if ($ExtensionId.Length -ne 32 -or $ExtensionId -notmatch '^[a-z]+$') {
    Write-Host "Error: Extension ID must be 32 lowercase letters. Check at chrome://extensions" -ForegroundColor Red
    exit 1
}

$AllowedOrigins = "chrome-extension://$ExtensionId/"

$manifestObj = @{
    name             = $HostName
    description      = "Open selected path in Explorer from Google Chat"
    path             = $BatPath
    type             = "stdio"
    allowed_origins = @($AllowedOrigins)
}
$manifest = $manifestObj | ConvertTo-Json

$manifest | Set-Content -Path $ManifestPath -Encoding UTF8

$RegPath = "HKCU:\Software\Google\Chrome\NativeMessagingHosts\$HostName"
if (-not (Test-Path $RegPath)) {
    New-Item -Path $RegPath -Force | Out-Null
}
Set-ItemProperty -Path $RegPath -Name "(Default)" -Value $ManifestPath -Type String

Write-Host "Native host registered successfully." -ForegroundColor Green
Write-Host "  Manifest: $ManifestPath"
Write-Host "  Registry: $RegPath"
Write-Host ""
Write-Host "Make sure Python is installed and in PATH." -ForegroundColor Yellow
