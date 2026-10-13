param(
    [string]$ServiceName = "platescan",
    [string]$Region = "us-central1",
    [string]$GeminiApiKey = "",
    [string]$ApiKey = ""
)

# Prevent PowerShell from treating stderr informational output as terminating errors
$ErrorActionPreference = "Continue"
if (Get-Variable -Name PSNativeCommandUseErrorActionPreference -ErrorAction SilentlyContinue) {
    $PSNativeCommandUseErrorActionPreference = $false
}
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8

Write-Host ""
Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "  PlateScan GCP Deployment (Cloud Run - `$0 Free Tier)" -ForegroundColor Cyan
Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host ""

# 1. Verify gcloud is installed
if (-not (Get-Command gcloud -ErrorAction SilentlyContinue)) {
    Write-Host "[!] Error: gcloud CLI is not installed or not in PATH." -ForegroundColor Red
    exit 1
}

# 2. Check active project
$Project = (gcloud config get-value project 2>$null).Trim()
if (-not $Project -or $Project -eq "(unset)") {
    Write-Host "[!] Error: No GCP project is selected." -ForegroundColor Red
    Write-Host "Run: gcloud config set project YOUR_PROJECT_ID" -ForegroundColor Yellow
    exit 1
}
Write-Host "[+] Target GCP Project: $Project" -ForegroundColor Green

# 3. Ensure required APIs are enabled (idempotent)
Write-Host "[*] Verifying enabled GCP services..." -ForegroundColor Yellow
gcloud services enable generativelanguage.googleapis.com --quiet 2>$null | Out-Null

# 4. Ensure required IAM permissions for Cloud Build (idempotent)
Write-Host "[*] Checking Cloud Build IAM permissions..." -ForegroundColor Yellow
$ProjectNumber = (gcloud projects describe $Project --format="value(projectNumber)" 2>$null).Trim()
if ($ProjectNumber) {
    $ComputeSA = "$ProjectNumber-compute@developer.gserviceaccount.com"
    $roles = @(
        "roles/storage.admin",
        "roles/logging.logWriter",
        "roles/artifactregistry.writer"
    )
    foreach ($role in $roles) {
        try {
            & gcloud projects add-iam-policy-binding $Project `
                --member="serviceAccount:$ComputeSA" `
                --role=$role `
                --condition=None `
                --quiet 2>$null | Out-Null
        } catch {
            # Informational output on stderr is ignored
        }
    }
}

# 4. Deploy to Cloud Run with Free-Tier Guardrails
Write-Host "[*] Building container and deploying to Cloud Run ($Region)..." -ForegroundColor Yellow
Write-Host "    - Scale-to-zero: Enabled (min-instances: 0)" -ForegroundColor Gray
Write-Host "    - Cost protection: Max instances capped at 2" -ForegroundColor Gray
Write-Host "    - Memory: 512Mi | CPU: 1" -ForegroundColor Gray
Write-Host ""

$deployArgs = @(
    "run", "deploy", $ServiceName,
    "--source", ".",
    "--region", $Region,
    "--allow-unauthenticated",
    "--min-instances", "0",
    "--max-instances", "2",
    "--memory", "512Mi",
    "--cpu", "1",
    "--quiet"
)

# Optional: Set Gemini API key if provided
$keyToSet = if ($GeminiApiKey) { $GeminiApiKey } elseif ($ApiKey) { $ApiKey } else { $env:GEMINI_API_KEY }
if ($keyToSet) {
    $deployArgs += @("--set-env-vars", "GEMINI_API_KEY=$keyToSet")
}

& gcloud @deployArgs

if ($LASTEXITCODE -ne 0) {
    Write-Host ""
    Write-Host "[!] Deployment failed with exit code $LASTEXITCODE." -ForegroundColor Red
    exit $LASTEXITCODE
}

# 5. Output live deployment URL
$ServiceUrl = (gcloud run services describe $ServiceName --region $Region --format="value(status.url)" 2>$null).Trim()

Write-Host ""
Write-Host "==========================================================" -ForegroundColor Green
Write-Host "[+] DEPLOYMENT COMPLETE!" -ForegroundColor Green
Write-Host "[+] Live URL: $ServiceUrl" -ForegroundColor Cyan
Write-Host "[+] Estimated Cost: `$0.00 / month (Always Free Tier)" -ForegroundColor Green
Write-Host "==========================================================" -ForegroundColor Green
Write-Host ""
