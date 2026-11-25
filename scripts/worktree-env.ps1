<#
.SYNOPSIS
  worktree마다 개발 DB와 포트를 따로 쓰도록 .env를 맞춘다 (docs/impl/00-orchestration-plan.md §1-6).

.DESCRIPTION
  - 작업 이름 = 현재 브랜치에서 'impl/' 를 뺀 것(또는 -Name).
  - DB 이름: neodb_<정리한 이름 앞 40자>_<원래 이름 해시 12자리> — 이름이 비슷해도 겹치지 않는다.
    이미 배정된 worktree는 기록된 DB 이름을 그대로 쓴다.
  - API_PORT: 4400 ~ 4899, WEB_PORT = API_PORT + 1000. 다른 worktree에 배정된 포트와 사용 중인 포트는 피한다.
  - 배정 기록: <git 공용 디렉터리>/neodb-worktrees.json (모든 worktree가 같이 본다), 동시 실행은 잠금으로 막는다.
  - 기본 체크아웃(main 폴더)에서는 실행하지 않는다 — main 은 기본 DB 'neodb' 와 .env 그대로.
  - 개발 PostgreSQL 컨테이너는 main 체크아웃에서 `npm run db:up` 으로 띄운다. worktree에서 db:up 을 실행하지 않는다
    (compose 의 ./data/pg 경로가 worktree 폴더로 바뀌어 같은 이름의 컨테이너를 다시 만든다).

.EXAMPLE
  powershell -NoProfile -ExecutionPolicy Bypass -File scripts/worktree-env.ps1
  powershell -NoProfile -ExecutionPolicy Bypass -File scripts/worktree-env.ps1 -Reset -Seed
  powershell -NoProfile -ExecutionPolicy Bypass -File scripts/worktree-env.ps1 -Drop
#>
param(
  [string]$Name,          # 작업 이름을 직접 지정 (기본: 현재 브랜치)
  [switch]$Reset,         # 이 worktree의 DB를 지우고 다시 만든다
  [switch]$Seed,          # 마이그레이션 뒤 시드도 넣는다
  [switch]$NoMigrate,     # 마이그레이션을 건너뛴다
  [switch]$Drop,          # 이 worktree의 DB와 배정 기록을 지우고 끝낸다 (worktree 정리 때)
  [switch]$Adopt,         # 배정 기록 없이 남아 있는 같은 이름의 DB를 이 worktree가 넘겨받는다
  [switch]$TestAccounts,  # 시험 계정(계획 §9.1)도 다시 만든다 — npm run db:seed:test
  [switch]$Prune,         # (어느 체크아웃에서든) -Target 으로 지정한, 폴더가 이미 사라진 worktree 하나의 DB와 배정 기록을 지운다
  [string]$Target         # -Prune 대상 worktree 경로 (orca worktree rm --run-hooks 가 실패했을 때의 예비 수단)
)

$ErrorActionPreference = 'Stop'
$Container = 'neodb-dev-postgres'
$PgUser = 'neodb'
$PgPass = 'neodb-dev'
$PgHostPort = 55432
$PortMin = 4400
$PortSpan = 500

# 네이티브 명령: stderr 를 따로 받고 종료 코드로 판단한다 (PowerShell 5.1 NativeCommandError 회피)
function Invoke-Native([string]$exe, [string[]]$argv) {
  if (-not (Get-Command $exe -CommandType Application -ErrorAction SilentlyContinue)) { throw "'$exe' 실행 파일을 찾지 못했습니다(PATH 확인)." }
  $prev = $ErrorActionPreference
  $ErrorActionPreference = 'Continue'
  try {
    $global:LASTEXITCODE = $null
    $errFile = [System.IO.Path]::GetTempFileName()
    $out = & $exe @argv 2> $errFile
    $code = $LASTEXITCODE
    $err = (Get-Content $errFile -Raw -ErrorAction SilentlyContinue)
    Remove-Item $errFile -Force -ErrorAction SilentlyContinue
  } finally { $ErrorActionPreference = $prev }
  if ($null -eq $code) { throw "'$exe' 실행 결과(종료 코드)를 받지 못했습니다." }
  return [pscustomobject]@{ Code = $code; Out = (($out | Out-String).Trim()); Err = ("$err").Trim() }
}
function Invoke-Psql([string]$sql) {
  # CREATE/DROP DATABASE 는 트랜잭션 밖에서만 되므로 SET 을 붙이지 않고 PGOPTIONS 로 NOTICE 를 끈다
  $r = Invoke-Native 'docker' @('exec', '-e', 'PGOPTIONS=-c client_min_messages=warning', $Container, 'psql', '-U', $PgUser, '-d', 'postgres', '-q', '-v', 'ON_ERROR_STOP=1', '-tA', '-c', $sql)
  if ($r.Code -ne 0) { throw "psql 실패(종료 코드 $($r.Code)): $($r.Err)" }
  return $r.Out
}
function Get-NormPath([string]$p) { return [System.IO.Path]::GetFullPath($p).TrimEnd('\', '/').ToLowerInvariant() }

# --- 저장소 · worktree 확인
$r = Invoke-Native 'git' @('rev-parse', '--show-toplevel')
if ($r.Code -ne 0) { throw "git 저장소가 아닙니다: $($r.Err)" }
$root = $r.Out
$r = Invoke-Native 'git' @('worktree', 'list', '--porcelain')
if ($r.Code -ne 0) { throw "git worktree 목록 조회 실패: $($r.Err)" }
$mainPath = (($r.Out -split "`r?`n") | Where-Object { $_ -like 'worktree *' } | Select-Object -First 1) -replace '^worktree ', ''
if (-not $Prune -and (Get-NormPath $mainPath) -eq (Get-NormPath $root)) {
  throw "기본 체크아웃($mainPath)에서는 실행하지 않습니다. main 은 기본 DB 'neodb' 와 .env 그대로 둡니다. 작업 worktree에서 실행하세요."
}
$r = Invoke-Native 'git' @('rev-parse', '--git-common-dir')
if ($r.Code -ne 0) { throw "git 공용 디렉터리 조회 실패: $($r.Err)" }
$commonDir = $r.Out
if (-not [System.IO.Path]::IsPathRooted($commonDir)) { $commonDir = Join-Path $root $commonDir }
$registryPath = Join-Path $commonDir 'neodb-worktrees.json'
$rootKey = Get-NormPath $root

if (-not $Name -and -not $Prune) {
  $r = Invoke-Native 'git' @('rev-parse', '--abbrev-ref', 'HEAD')
  if ($r.Code -ne 0) { throw "현재 브랜치 조회 실패: $($r.Err)" }
  if ($r.Out -eq 'HEAD') { throw "분리된 HEAD입니다. -Name 으로 작업 이름을 주세요." }
  $Name = $r.Out -replace '^impl/', ''
}

# --- DB 이름 (정리한 이름 + 원래 이름 해시)
$md5 = [System.Security.Cryptography.MD5]::Create()
$hash = $md5.ComputeHash([System.Text.Encoding]::UTF8.GetBytes($Name))
$hex = -join ($hash[0..5] | ForEach-Object { $_.ToString('x2') })   # 12자리
$slug = ($Name.ToLowerInvariant() -replace '[^a-z0-9]+', '_').Trim('_')
if ($slug.Length -gt 40) { $slug = $slug.Substring(0, 40).TrimEnd('_') }
if (-not $slug) { $slug = 'wt' }
$db = "neodb_${slug}_$hex"   # [a-z0-9_] 만 — SQL 식별자로 안전

# --- 컨테이너 확인
$r = Invoke-Native 'docker' @('ps', '--filter', "name=^/$Container$", '--format', '{{.Names}}')
if ($r.Code -ne 0) { throw "Docker에 접속하지 못했습니다(Docker Desktop 실행 여부 확인): $($r.Err)" }
if ($r.Out -ne $Container) { throw "개발 DB 컨테이너($Container)가 실행 중이 아닙니다. main 체크아웃에서 'npm run db:up' 을 먼저 실행하세요." }

# --- 배정 기록 (잠금 안에서 읽고 쓴다)
function Read-Registry {
  $h = @{}
  if (Test-Path $registryPath) {
    $raw = [System.IO.File]::ReadAllText($registryPath, [System.Text.Encoding]::UTF8)
    if ($raw.Trim()) {
      $obj = $raw | ConvertFrom-Json
      foreach ($p in $obj.PSObject.Properties) { $h[$p.Name] = $p.Value }
    }
  }
  return $h
}
function Write-Registry($h) {
  $tmp = "$registryPath.tmp"
  $json = ($h | ConvertTo-Json -Depth 4)
  if (-not $json) { $json = '{}' }
  [System.IO.File]::WriteAllText($tmp, $json, (New-Object System.Text.UTF8Encoding $false))
  if (Test-Path $registryPath) { [System.IO.File]::Replace($tmp, $registryPath, [NullString]::Value) } else { [System.IO.File]::Move($tmp, $registryPath) }
}
function Test-PortFree([int]$p) { return -not (Get-NetTCPConnection -LocalPort $p -State Listen -ErrorAction SilentlyContinue) }

# 잠금: git 공용 디렉터리의 잠금 파일을 독점으로 연다 (세션과 상관없이 모든 worktree가 같이 본다)
$lockPath = Join-Path $commonDir 'neodb-worktrees.lock'
$lock = $null
$deadline = (Get-Date).AddMinutes(2)
while (-not $lock) {
  try { $lock = [System.IO.File]::Open($lockPath, 'OpenOrCreate', 'ReadWrite', 'None') }
  catch [System.IO.IOException] {
    if ((Get-Date) -gt $deadline) { throw '다른 worktree 준비가 끝나지 않았습니다(잠금 대기 2분 초과).' }
    Start-Sleep -Milliseconds 300
  }
}
try {
  $reg = Read-Registry

  # 정리(예비 수단): 지정한 worktree 하나 — 폴더가 이미 사라졌을 때만 그 DB · 배정 기록을 지운다
  #   기본은 orca worktree rm --run-hooks (아카이브 스크립트가 그 worktree 안에서 -Drop)
  if ($Prune) {
    if (-not $Target) { throw "-Prune 은 -Target <지운 worktree 경로> 와 함께만 실행합니다(한 번에 하나)." }
    # 상대 경로는 받지 않는다 — 기록 조회와 폴더 확인이 같은 절대 경로를 쓰게(경로 해석 기준 차이로 살아 있는 worktree DB를 지우지 않게)
    # 드라이브 문자 + \ (예: C:\...) 또는 UNC(\\서버\...)만 — 'D:worktree' · '\worktree' 처럼 현재 위치에 따라 바뀌는 경로는 거부
    if ($Target -notmatch '^[A-Za-z]:[\\/]' -and $Target -notmatch '^\\\\[^\\]+\\') { throw "-Target 은 완전한 절대 경로(C:\... 또는 \\서버\...)로 주세요: $Target" }
    $abs = [System.IO.Path]::GetFullPath($Target)
    $k = Get-NormPath $abs
    if (-not $reg.ContainsKey($k)) { Write-Host "배정 기록에 없는 경로입니다: $abs"; return }
    if (Test-Path -LiteralPath $abs) { throw "worktree 폴더가 아직 있습니다($abs). 먼저 orca worktree rm --run-hooks 로 지우세요." }
    $old = [string]$reg[$k].db
    if ($old -match '^neodb_[a-z0-9_]+$') { Invoke-Psql "DROP DATABASE IF EXISTS `"$old`" WITH (FORCE)" | Out-Null }
    $reg.Remove($k)
    Write-Registry $reg
    Write-Host "정리: $k → DB $old 삭제 · 배정 해제"
    return
  }

  $mine = $reg[$rootKey]

  # 이미 배정된 worktree: 작업 이름이 같아야 하고, 기록된 DB 이름을 그대로 쓴다
  if ($mine) {
    if ($mine.name -cne $Name) {
      throw "이 worktree는 이미 작업 '$($mine.name)'(DB '$($mine.db)')로 배정돼 있습니다. 먼저 -Name '$($mine.name)' -Drop 으로 정리하세요."
    }
    $db = [string]$mine.db
  }

  # 같은 DB 이름을 다른 worktree가 쓰고 있으면 중단
  foreach ($k in @($reg.Keys)) {
    if ($k -ne $rootKey -and $reg[$k].db -eq $db) { throw "DB '$db' 는 다른 worktree($k)에 배정돼 있습니다. -Name 을 다르게 주세요." }
  }

  if ($Drop) {
    if (-not $mine) {
      Write-Host "이 worktree의 배정 기록이 없습니다. DB를 지우지 않습니다($db)."
      return
    }
    Invoke-Psql "DROP DATABASE IF EXISTS `"$db`" WITH (FORCE)" | Out-Null
    $reg.Remove($rootKey)
    Write-Registry $reg
    Write-Host "DB 삭제 · 배정 해제: $db"
    return
  }

  # 배정 기록 없이 남은 같은 이름의 DB는 -Adopt 일 때만 넘겨받는다
  $exists = Invoke-Psql "SELECT 1 FROM pg_database WHERE datname = '$db'"
  if ($exists -eq '1' -and -not $mine -and -not $Adopt) {
    throw "DB '$db' 가 배정 기록 없이 이미 있습니다. 이 worktree가 넘겨받으려면 -Adopt 를, 지우려면 -Adopt -Reset 을 주세요."
  }

  # 포트: 내 배정이 있으면 그대로, 없으면 다른 배정 · 사용 중인 포트를 피해서
  $taken = @{}
  foreach ($k in @($reg.Keys)) { if ($k -ne $rootKey) { $taken[[int]$reg[$k].apiPort] = $true } }
  $port = $null
  if ($mine -and $mine.apiPort) { $port = [int]$mine.apiPort }
  else {
    $base = [BitConverter]::ToUInt16($hash, 6) % $PortSpan
    for ($i = 0; $i -lt $PortSpan; $i++) {
      $p = $PortMin + (($base + $i) % $PortSpan)
      if (-not $taken[$p] -and (Test-PortFree $p) -and (Test-PortFree ($p + 1000))) { $port = $p; break }
    }
  }
  if (-not $port) { throw "$PortMin ~ $($PortMin + $PortSpan - 1) 에 빈 포트가 없습니다." }
  $webPort = $port + 1000

  # .env 내용을 먼저 만들고 임시 파일까지 써 본다 (DB 를 건드리기 전에 검증)
  $envPath = Join-Path $root '.env'
  $lines = @()
  if (Test-Path $envPath) { $lines = [System.IO.File]::ReadAllLines($envPath, [System.Text.Encoding]::UTF8) }
  elseif (Test-Path (Join-Path $root '.env.example')) { $lines = [System.IO.File]::ReadAllLines((Join-Path $root '.env.example'), [System.Text.Encoding]::UTF8) }
  else { throw '.env 와 .env.example 이 모두 없습니다.' }
  $url = "postgres://${PgUser}:${PgPass}@localhost:${PgHostPort}/$db"
  $set = [ordered]@{ DATABASE_URL = $url; API_PORT = "$port"; WEB_PORT = "$webPort" }
  $out = New-Object System.Collections.Generic.List[string]
  $done = @{}
  foreach ($l in $lines) {
    $k = ($l -split '=', 2)[0]
    if ($set.Contains($k)) { $out.Add("$k=$($set[$k])"); $done[$k] = $true } else { $out.Add($l) }
  }
  foreach ($k in $set.Keys) { if (-not $done[$k]) { $out.Add("$k=$($set[$k])") } }
  # .env.example 에만 있는 키(나중에 추가된 시험값 등)는 가져온다
  $examplePath = Join-Path $root '.env.example'
  if (Test-Path $examplePath) {
    # 키 비교는 Node --env-file 처럼 앞뒤 공백 · 'export ' 접두어를 무시한다
    $have = @{}; foreach ($l in $out) { if ($l -match '^\s*(?:export\s+)?([A-Za-z_][A-Za-z0-9_]*)\s*=') { $have[$Matches[1]] = $true } }
    foreach ($l in [System.IO.File]::ReadAllLines($examplePath, [System.Text.Encoding]::UTF8)) {
      if ($l -match '^([A-Z][A-Z0-9_]*)=' -and -not $have[$Matches[1]]) { $out.Add($l) }
    }
  }
  # 실제로 교체에 쓸 임시 파일을 지금 써 둔다 — 여기서 실패하면 DB 는 그대로다
  $tmpEnv = "$envPath.tmp"
  [System.IO.File]::WriteAllLines($tmpEnv, $out, (New-Object System.Text.UTF8Encoding $false))

  # 배정을 먼저 기록(예약)한 뒤 DB 를 만든다 — DB 만들기가 실패하면 예약을 되돌린다
  $hadEntry = [bool]$mine
  $reg[$rootKey] = [pscustomobject]@{ name = $Name; db = $db; apiPort = $port; webPort = $webPort; updated = (Get-Date).ToString('s') }
  Write-Registry $reg
  $created = $false
  try {
    if ($Reset -and $exists -eq '1') { Invoke-Psql "DROP DATABASE IF EXISTS `"$db`" WITH (FORCE)" | Out-Null; $exists = '' }
    if ($exists -ne '1') { Invoke-Psql "CREATE DATABASE `"$db`" OWNER $PgUser" | Out-Null; $created = $true }
  } catch {
    Remove-Item $tmpEnv -Force -ErrorAction SilentlyContinue
    if (-not $hadEntry) { $reg.Remove($rootKey); Write-Registry $reg }
    throw
  }

  if (Test-Path $envPath) { [System.IO.File]::Replace($tmpEnv, $envPath, [NullString]::Value) } else { [System.IO.File]::Move($tmpEnv, $envPath) }
} finally {
  $lock.Dispose()
}

# --- 마이그레이션 · 시드 (스크립트는 .env 를 읽지 않으므로 이 프로세스 환경으로 넘긴다)
foreach ($k in $set.Keys) { Set-Item -Path "Env:$k" -Value $set[$k] }
foreach ($l in $out) { if ($l -match '^(SEED_ADMIN_ID|SEED_ADMIN_NAME|SESSION_IDLE_MIN|SESSION_ABSOLUTE_HOURS)=(.*)$') { Set-Item -Path "Env:$($Matches[1])" -Value $Matches[2] } }
Set-Location $root
if (-not $NoMigrate) {
  npm run db:migrate --silent
  if ($LASTEXITCODE -ne 0) { throw '마이그레이션 실패' }
}
if ($Seed) {
  npm run db:seed --silent
  if ($LASTEXITCODE -ne 0) { throw '시드 실패' }
}
if ($TestAccounts) {
  npm run db:seed:test --silent
  if ($LASTEXITCODE -ne 0) { throw '시험 계정 시드 실패' }
}

Write-Host ''
Write-Host 'worktree 개발 환경'
Write-Host "  작업      : $Name"
Write-Host "  DB        : $db $(if ($created) { '(새로 만듦)' } else { '(기존)' })"
Write-Host "  API_PORT  : $port"
Write-Host "  WEB_PORT  : $webPort"
Write-Host "  .env      : $envPath"
Write-Host "  배정 기록 : $registryPath"
