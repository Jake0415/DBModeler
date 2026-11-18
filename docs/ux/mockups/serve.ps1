param([string]$Root = $PSScriptRoot, [int]$Port = 5178)
$listener = New-Object System.Net.HttpListener
$listener.Prefixes.Add("http://localhost:$Port/")
$listener.Start()
Write-Host "Serving $Root at http://localhost:$Port/"
$types = @{ ".md"="text/plain; charset=utf-8"; ".html"="text/html; charset=utf-8"; ".css"="text/css; charset=utf-8"; ".js"="application/javascript; charset=utf-8"; ".svg"="image/svg+xml"; ".png"="image/png" }
while ($listener.IsListening) {
  $ctx = $listener.GetContext()
  $path = [Uri]::UnescapeDataString($ctx.Request.Url.AbsolutePath.TrimStart('/'))
  if ([string]::IsNullOrEmpty($path)) { $path = "index.html" }
  $file = Join-Path $Root $path
  $full = [IO.Path]::GetFullPath($file)
  $ok = $full.StartsWith([IO.Path]::GetFullPath($Root)) -and (Test-Path $full -PathType Leaf)
  # design documents linked from the mockups (../02-flows.md → /02-flows.md, ../../spec/... → /spec/...) are served
  # read-only from docs/ux and docs — .md files only
  if (-not $ok -and $path.ToLower().EndsWith('.md')) {
    foreach ($base in @((Join-Path $Root '..'), (Join-Path $Root '..\..'))) {
      $b = [IO.Path]::GetFullPath($base); $cand = [IO.Path]::GetFullPath((Join-Path $b $path))
      if ($cand.StartsWith($b) -and (Test-Path $cand -PathType Leaf)) { $full = $cand; $ok = $true; break }
    }
  }
  if ($ok) {
    $bytes = [IO.File]::ReadAllBytes($full)
    $ext = [IO.Path]::GetExtension($full).ToLower()
    $ctx.Response.ContentType = $(if ($types[$ext]) { $types[$ext] } else { "application/octet-stream" })
    $ctx.Response.Headers.Add("Cache-Control", "no-store")
    $ctx.Response.OutputStream.Write($bytes, 0, $bytes.Length)
  } else { $ctx.Response.StatusCode = 404 }
  $ctx.Response.Close()
}

