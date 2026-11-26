# Creates a local version snapshot. Snapshots are ignored by Git.
param([Parameter(Mandatory = $true)][string] $Version)

$source = $PSScriptRoot
$versionsRoot = Join-Path $source 'versions'
$target = Join-Path $versionsRoot $Version

if (Test-Path $target) {
  throw "Version $Version already exists"
}

New-Item -ItemType Directory -Path $target -Force | Out-Null

Get-ChildItem -Path $source -Force | Where-Object {
  $_.Name -notin @('.git', 'versions', 'koro4e-backups')
} | Copy-Item -Destination $target -Recurse -Force

$commit = git rev-parse --short HEAD
$stamp = Get-Date -Format 'yyyy-MM-dd HH:mm:ss'
$info = "Version: $Version`nDate: $stamp`nGit commit: $commit"
Set-Content -Path (Join-Path $target 'VERSION.txt') -Value $info -Encoding UTF8
Set-Content -Path (Join-Path $versionsRoot 'CURRENT.txt') -Value $Version -Encoding UTF8

Write-Output "Snapshot $Version saved to $target"
