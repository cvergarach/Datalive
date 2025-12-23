# Script para reiniciar el MCP server automáticamente
Write-Host "🔄 Reiniciando MCP Server..." -ForegroundColor Cyan

# Detener el proceso de Node.js que está corriendo en el puerto 3001
$mcpProcess = Get-Process -Name node -ErrorAction SilentlyContinue | Where-Object {
    $_.Id -eq (Get-NetTCPConnection -LocalPort 3001 -ErrorAction SilentlyContinue).OwningProcess
}

if ($mcpProcess) {
    Write-Host "⏹️  Deteniendo MCP server (PID: $($mcpProcess.Id))..." -ForegroundColor Yellow
    Stop-Process -Id $mcpProcess.Id -Force
    Start-Sleep -Seconds 2
    Write-Host "✅ MCP server detenido" -ForegroundColor Green
} else {
    Write-Host "ℹ️  No se encontró MCP server corriendo" -ForegroundColor Gray
}

# Cambiar al directorio del MCP
Set-Location -Path "mcp-servers\api-analyzer"

# Iniciar el MCP server
Write-Host "🚀 Iniciando MCP server..." -ForegroundColor Cyan
Start-Process -FilePath "node" -ArgumentList "index.js" -NoNewWindow

Start-Sleep -Seconds 3

# Verificar que está corriendo
$newProcess = Get-NetTCPConnection -LocalPort 3001 -ErrorAction SilentlyContinue
if ($newProcess) {
    Write-Host "✅ MCP server reiniciado exitosamente en puerto 3001" -ForegroundColor Green
} else {
    Write-Host "❌ Error: MCP server no pudo iniciar" -ForegroundColor Red
}

# Volver al directorio raíz
Set-Location -Path "..\..\"
