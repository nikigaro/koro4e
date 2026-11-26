# Pushes current changes to GitHub, GitHub Pages deploys them automatically.
param([string] $Message = 'update')

git add -A
$changes = git status --porcelain
if (-not $changes) {
  Write-Output 'No changes'
  exit
}

git commit -m $Message
git push origin main
Write-Output 'Pushed to GitHub, GitHub Pages will update shortly'
