# Registers a Windows Scheduled Task to wake the PC at 4:00 AM daily and run the chunked render job.

$root = Split-Path -Parent $PSScriptRoot
$scriptPath = Join-Path $root "tools\nightly-render.ps1"

$taskName = "CartoonShortsNightlyRender"
$action = New-ScheduledTaskAction -Execute "powershell.exe" -Argument "-ExecutionPolicy Bypass -WindowStyle Hidden -File `"$scriptPath`""
$trigger = New-ScheduledTaskTrigger -Daily -At 4:00am

# -WakeToRun sets the motherboard ACPI Real-Time Clock (RTC) timer to wake Windows from sleep
$settings = New-ScheduledTaskSettingsSet `
  -WakeToRun `
  -AllowStartIfOnBatteries `
  -DontStopIfGoingOnBatteries `
  -ExecutionTimeLimit (New-TimeSpan -Hours 3) `
  -MultipleInstances IgnoreNew

Register-ScheduledTask -TaskName $taskName -Action $action -Trigger $trigger -Settings $settings -Description "Wake PC at 4:00 AM to execute chunked resumable 3D cartoon video renders until 7:00 AM" -Force | Out-Null

$task = Get-ScheduledTask -TaskName $taskName
Write-Host "Task '$taskName' registered successfully."
Write-Host "State: $($task.State)"
Write-Host "Trigger: Daily at 4:00 AM"
Write-Host "WakeToRun: Enabled (Wakes PC from Sleep)"
Write-Host "Execution Time Window: 4:00 AM - 7:00 AM (3 hours limit)"
