# Локальный статический сервер для ES-модулей.
# Запуск: powershell -ExecutionPolicy Bypass -File .\serve.ps1
$root = $PSScriptRoot
$port = 8080

$listener = [System.Net.Sockets.TcpListener]::new([System.Net.IPAddress]::Loopback, $port)
$listener.Start()
Write-Host "Короче: http://localhost:$port/ (Ctrl+C для остановки)"

function Get-Mime($extension) {
  switch ($extension.ToLowerInvariant()) {
    '.html' { return 'text/html; charset=utf-8' }
    '.js'   { return 'text/javascript; charset=utf-8' }
    '.css'  { return 'text/css; charset=utf-8' }
    '.json' { return 'application/json; charset=utf-8' }
    '.png'  { return 'image/png' }
    '.jpg'  { return 'image/jpeg' }
    '.jpeg' { return 'image/jpeg' }
    '.gif'  { return 'image/gif' }
    '.svg'  { return 'image/svg+xml' }
    '.webp' { return 'image/webp' }
    '.ico'  { return 'image/x-icon' }
    '.ttf'  { return 'font/ttf' }
    '.mp4'  { return 'video/mp4' }
    '.webm' { return 'video/webm' }
    '.mp3'  { return 'audio/mpeg' }
    '.wav'  { return 'audio/wav' }
    '.ogg'  { return 'audio/ogg' }
    default { return 'application/octet-stream' }
  }
}

while ($true) {
  $client = $listener.AcceptTcpClient()
  try {
    $stream = $client.GetStream()
    $reader = [System.IO.StreamReader]::new($stream, [System.Text.Encoding]::ASCII, $false, 1024, $true)
    $requestLine = $reader.ReadLine()
    if (-not $requestLine) { continue }

    $parts = $requestLine -split ' '
    $requestPath = [Uri]::UnescapeDataString($parts[1].Split('?')[0])
    while (($header = $reader.ReadLine()) -ne $null -and $header -ne '') { }

    if ($requestPath -eq '/') { $requestPath = '/index.html' }
    $filePath = [System.IO.Path]::GetFullPath($root + $requestPath)

    if (-not $filePath.StartsWith($root, [System.StringComparison]::OrdinalIgnoreCase) -or -not [System.IO.File]::Exists($filePath)) {
      $body = [System.Text.Encoding]::UTF8.GetBytes('Not found')
      $head = [System.Text.Encoding]::ASCII.GetBytes("HTTP/1.1 404 Not Found`r`nContent-Length: $($body.Length)`r`nConnection: close`r`n`r`n")
      $stream.Write($head, 0, $head.Length)
      $stream.Write($body, 0, $body.Length)
      continue
    }

    $body = [System.IO.File]::ReadAllBytes($filePath)
    $mime = Get-Mime ([System.IO.Path]::GetExtension($filePath))
    $head = [System.Text.Encoding]::ASCII.GetBytes("HTTP/1.1 200 OK`r`nContent-Type: $mime`r`nContent-Length: $($body.Length)`r`nCache-Control: no-store`r`nConnection: close`r`n`r`n")
    $stream.Write($head, 0, $head.Length)
    $stream.Write($body, 0, $body.Length)
    $stream.Flush()
  } finally {
    $client.Close()
  }
}
