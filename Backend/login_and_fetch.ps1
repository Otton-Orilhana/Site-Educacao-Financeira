# Ajuste estes valores antes de rodar
$email = "seu_email@dominio.com"
$password = "sua_senha"
$full_name = "Seu Nome"

# (Opcional) registrar usuário — ignora erro se já existir
$reg = @{ email = $email; password = $password; full_name = $full_name } | ConvertTo-Json
try { Invoke-RestMethod -Uri "http://127.0.0.1:8000/api/auth/register" -Method Post -Body $reg -ContentType "application/json" -ErrorAction Stop } catch {}

# login
$login = @{ email = $email; password = $password } | ConvertTo-Json
$response = Invoke-RestMethod -Uri "http://127.0.0.1:8000/api/auth/login" -Method Post -Body $login -ContentType "application/json"
$token = $response.access_token

# salvar token em arquivo (opcional)
Set-Content -Path token.txt -Value $token -Encoding UTF8

# buscar contents e salvar bruto
Invoke-WebRequest -Uri "http://127.0.0.1:8000/api/contents" -Headers @{ "Authorization" = "Bearer $token" } -OutFile contents_raw.json -UseBasicParsing
notepad contents_raw.json
