<#
.SYNOPSIS
    Mertilo-Pentest.ps1 - Script de auditoria de segurança autorizada para o sistema Mertilo.
.DESCRIPTION
    Realiza verificações de segurança nos alvos autorizados, conforme especificação do PROJETO MERTILO.
    Modos disponíveis:
      Passive           - Reconhecimento seguro na produção (apenas verificações não intrusivas).
      Local             - Verificações na cópia local do repositório (código-fonte e configurações).
      AuthenticatedLab  - Testes de autorização (IDOR/BOLA) e injeção, exclusivamente em ambiente de homologação.
    O script NUNCA imprime, armazena ou transmite valores de segredos. Em caso de possível exposição, apenas
    registra o caminho e a categoria do achado.

.PARAMETER Mode
    Modo de execução: Passive, Local ou AuthenticatedLab. Obrigatório.

.PARAMETER FrontendUrl
    URL do frontend. Padrão: https://www.mertiloo.com.br (usado no modo Passive).

.PARAMETER ApiUrl
    URL da API. Padrão: https://mertiloo-api.onrender.com (usado nos modos Passive e AuthenticatedLab).

.PARAMETER LocalRepoPath
    Caminho do repositório local. Padrão: C:\Users\kaiqu\OneDrive\Desktop\Mertilo (usado nos modos Local e AuthenticatedLab).

.PARAMETER LabBaseUrl
    URL base do ambiente de homologação. Obrigatório no modo AuthenticatedLab. NÃO pode ser um domínio de produção.

.PARAMETER LabUserAToken
    Token de acesso do usuário fictício A (modo AuthenticatedLab).

.PARAMETER LabUserBToken
    Token de acesso do usuário fictício B (modo AuthenticatedLab).

.PARAMETER LabResourceIdA
    Identificador de um recurso sintético pertencente ao usuário A (modo AuthenticatedLab).

.PARAMETER LabResourceIdB
    Identificador de um recurso sintético pertencente ao usuário B (modo AuthenticatedLab).

.PARAMETER TimeoutSeconds
    Timeout para requisições HTTP em segundos. Padrão: 15.

.PARAMETER RequestDelayMs
    Intervalo entre requisições em milissegundos. Padrão: 500.
#>

[CmdletBinding()]
param(
    [Parameter(Mandatory = $true)]
    [ValidateSet('Passive', 'Local', 'AuthenticatedLab')]
    [string]$Mode,

    [string]$FrontendUrl = 'https://www.mertiloo.com.br',
    [string]$ApiUrl = 'https://mertiloo-api.onrender.com',
    [string]$LocalRepoPath = 'C:\Users\kaiqu\OneDrive\Desktop\Mertilo',

    [string]$LabBaseUrl = '',
    [string]$LabUserAToken = '',
    [string]$LabUserBToken = '',
    [string]$LabResourceIdA = '',
    [string]$LabResourceIdB = '',

    [int]$TimeoutSeconds = 15,
    [int]$RequestDelayMs = 500
)

# =============================================================================
# CONFIGURAÇÕES GERAIS E ESTADO GLOBAL
# =============================================================================

$script:ReportEntries = New-Object System.Collections.Generic.List[PSObject]
$script:RequestCount = 0
$script:MaxRequestsPerModule = 50 # Limite de segurança para evitar flood

# Categorias de segredos conhecidas (para o Módulo D)
$script:SecretPatterns = @{
    'JWT_SECRET'         = 'JWT_SECRET|jwt_secret'
    'DATABASE_URL'       = 'DATABASE_URL|database_url'
    'SMTP_PASS'          = 'SMTP_PASS|smtp_pass'
    'BREVO_API_KEY'      = 'BREVO_API_KEY|brevo_api_key'
    'RESEND_API_KEY'     = 'RESEND_API_KEY|resend_api_key'
    'SECRET_KEY'         = 'SECRET_KEY|secret_key'
    'PRIVATE_KEY'        = 'PRIVATE_KEY|private_key|-----BEGIN (RSA |EC )?PRIVATE KEY-----'
    'GENERIC_API_KEY'    = 'api[_-]?key|apikey'
    'GENERIC_TOKEN'      = 'token|bearer'
}

# =============================================================================
# FUNÇÕES AUXILIARES
# =============================================================================

function Write-Report {
    param(
        [string]$TestName,
        [string]$Target,
        [string]$Result,
        [string]$HttpStatus = 'N/A',
        [string]$Evidence = 'N/A',
        [ValidateSet('CRITICAL', 'HIGH', 'MEDIUM', 'LOW', 'INFO')]
        [string]$Severity = 'INFO',
        [string]$Impact = 'N/A',
        [string]$Recommendation = 'N/A',
        [string]$Limitations = 'N/A',
        [ValidateSet('Vulnerabilidade Confirmada', 'Possível Vulnerabilidade', 'Configuração Recomendada', 'Falso Positivo', 'Teste Inconclusivo')]
        [string]$Classification = 'Teste Inconclusivo'
    )

    $entry = [PSCustomObject]@{
        TestName       = $TestName
        Target         = $Target
        Result         = $Result
        HttpStatus     = $HttpStatus
        Evidence       = $Evidence
        Severity       = $Severity
        Impact         = $Impact
        Recommendation = $Recommendation
        Limitations    = $Limitations
        Classification = $Classification
    }

    $script:ReportEntries.Add($entry) | Out-Null

    $color = switch ($Severity) {
        'CRITICAL' { 'Red' }
        'HIGH'     { 'DarkRed' }
        'MEDIUM'   { 'Yellow' }
        'LOW'      { 'DarkYellow' }
        'INFO'     { 'Cyan' }
    }

    Write-Host "`n[$Severity] $TestName" -ForegroundColor $color
    Write-Host "  Alvo        : $Target"
    Write-Host "  Resultado   : $Result"
    Write-Host "  Status HTTP : $HttpStatus"
    Write-Host "  Evidência   : $Evidence"
    Write-Host "  Classificação: $Classification"
    Write-Host "  Impacto     : $Impact"
    Write-Host "  Recomendação: $Recommendation"
    Write-Host "  Limitações  : $Limitations"
}

function Invoke-SafeWebRequest {
    param(
        [string]$Uri,
        [string]$Method = 'GET',
        [hashtable]$Headers = @{},
        [switch]$NoBody # Se verdadeiro, usa HEAD em vez de GET para reduzir tráfego
    )

    if ($script:RequestCount -ge $script:MaxRequestsPerModule) {
        Write-Warning "Limite de requisições por módulo atingido ($($script:MaxRequestsPerModule)). Pulando: $Uri"
        return $null
    }

    Start-Sleep -Milliseconds $RequestDelayMs
    $script:RequestCount++

    $params = @{
        Uri             = $Uri
        Method          = if ($NoBody) { 'Head' } else { $Method }
        TimeoutSec      = $TimeoutSeconds
        UseBasicParsing = $true
        ErrorAction     = 'Stop'
        Headers         = $Headers
        MaximumRedirection = 3
    }

    try {
        $response = Invoke-WebRequest @params
        return $response
    }
    catch {
        $statusCode = 'ERRO'
        if ($_.Exception.Response) {
            $statusCode = [int]$_.Exception.Response.StatusCode
        }
        Write-Verbose "Requisição falhou para $Uri : $($_.Exception.Message) (Status: $statusCode)"
        return [PSCustomObject]@{
            StatusCode = $statusCode
            Headers    = @{}
            Error      = $_.Exception.Message
        }
    }
}

function Test-IsProductionUrl {
    param([string]$Url)
    $productionHosts = @('mertiloo.com.br', 'mertiloo-api.onrender.com')
    try {
        $uri = [System.Uri]$Url
        foreach ($hostName in $productionHosts) {
            if ($uri.Host -eq $hostName -or $uri.Host -like "*.$hostName") {
                return $true
            }
        }
    } catch { }
    return $false
}

# =============================================================================
# MÓDULO A — RECONHECIMENTO HTTP (PASSIVE)
# =============================================================================

function Invoke-ModuleA_HttpRecon {
    param([string]$Url)

    Write-Host "`n=== MÓDULO A — RECONHECIMENTO HTTP ($Url) ===" -ForegroundColor Magenta

    # Verificação de HTTPS e redirecionamento
    $httpUrl = $Url -replace '^https://', 'http://'
    $respHttp = Invoke-SafeWebRequest -Uri $httpUrl -NoBody
    if ($respHttp -and $respHttp.StatusCode -in @(301, 302, 307, 308)) {
        Write-Report -TestName 'Redirecionamento HTTP para HTTPS' -Target $httpUrl `
            -Result 'Redirecionamento ativo para HTTPS' -HttpStatus $respHttp.StatusCode `
            -Severity 'INFO' -Classification 'Configuração Recomendada' `
            -Recommendation 'Manter o redirecionamento 301/308 para HTTPS.'
    } elseif ($respHttp -and $respHttp.StatusCode -eq 200) {
        Write-Report -TestName 'HTTPS não forçado' -Target $httpUrl `
            -Result 'O site responde em HTTP sem redirecionar para HTTPS' -HttpStatus $respHttp.StatusCode `
            -Severity 'HIGH' -Classification 'Possível Vulnerabilidade' `
            -Impact 'Tráfego em texto claro pode ser interceptado.' `
            -Recommendation 'Configurar redirecionamento permanente (301) de HTTP para HTTPS e habilitar HSTS.'
    }

    # Requisição principal (HTTPS)
    $response = Invoke-SafeWebRequest -Uri $Url -NoBody
    if (-not $response -or $response.StatusCode -ne 200) {
        Write-Report -TestName 'Requisição principal' -Target $Url `
            -Result "Falha ao obter resposta válida: $($response.Error)" -HttpStatus $response.StatusCode `
            -Severity 'INFO' -Classification 'Teste Inconclusivo'
        return
    }

    $headers = $response.Headers

    # Função auxiliar para testar um cabeçalho
    $checkHeader = {
        param($name, $expected, $severity, $impact, $rec)
        $value = $null
        foreach ($key in $headers.Keys) {
            if ($key -eq $name) { $value = $headers[$key]; break }
        }
        if ($value) {
            Write-Report -TestName "Cabeçalho: $name" -Target $Url `
                -Result "Presente: $value" -HttpStatus 200 `
                -Severity 'INFO' -Classification 'Configuração Recomendada' `
                -Recommendation 'Manter o cabeçalho conforme boas práticas.'
        } else {
            Write-Report -TestName "Cabeçalho: $name" -Target $Url `
                -Result 'Ausente' -HttpStatus 200 `
                -Severity $severity -Classification 'Possível Vulnerabilidade' `
                -Impact $impact -Recommendation $rec
        }
    }

    & $checkHeader 'Strict-Transport-Security' 'max-age=31536000; includeSubDomains' 'MEDIUM' 'Permite ataques de downgrade e SSL stripping.' 'Adicionar HSTS com max-age mínimo de 1 ano e includeSubDomains.'
    & $checkHeader 'Content-Security-Policy' '' 'MEDIUM' 'Aumenta a superfície de ataque para XSS e injeção de conteúdo.' 'Definir uma CSP restritiva, evitando unsafe-inline e unsafe-eval.'
    & $checkHeader 'X-Content-Type-Options' 'nosniff' 'LOW' 'Permite MIME sniffing, potencialmente executando conteúdo malicioso.' 'Adicionar X-Content-Type-Options: nosniff.'
    & $checkHeader 'Referrer-Policy' '' 'LOW' 'Pode vazar informações sensíveis via cabeçalho Referer.' 'Definir Referrer-Policy: no-referrer ou strict-origin-when-cross-origin.'
    & $checkHeader 'Permissions-Policy' '' 'LOW' 'Funcionalidades do navegador podem ser acessadas sem restrição.' 'Definir Permissions-Policy restringindo câmera, microfone, geolocalização, etc.'

    # Verificação de CORS
    $corsResp = Invoke-SafeWebRequest -Uri $Url -NoBody -Headers @{ 'Origin' = 'https://example.com' }
    if ($corsResp -and $corsResp.Headers['Access-Control-Allow-Origin']) {
        $acao = $corsResp.Headers['Access-Control-Allow-Origin']
        if ($acao -eq '*') {
            Write-Report -TestName 'Configuração CORS' -Target $Url `
                -Result 'Access-Control-Allow-Origin: * (qualquer origem)' -HttpStatus 200 `
                -Severity 'MEDIUM' -Classification 'Possível Vulnerabilidade' `
                -Impact 'Qualquer site pode fazer requisições cross-origin e ler respostas.' `
                -Recommendation 'Restringir CORS a origens confiáveis específicas.'
        } elseif ($acao -eq 'https://example.com') {
            Write-Report -TestName 'Configuração CORS' -Target $Url `
                -Result 'CORS reflete origem arbitrária' -HttpStatus 200 `
                -Severity 'HIGH' -Classification 'Possível Vulnerabilidade' `
                -Impact 'Origem arbitrária é refletida, permitindo acesso cross-origin não intencional.' `
                -Recommendation 'Implementar allowlist estrita de origens.'
        }
    }

    # Verificação de métodos HTTP permitidos
    $optionsResp = Invoke-SafeWebRequest -Uri $Url -Method 'OPTIONS' -NoBody
    if ($optionsResp -and $optionsResp.Headers['Allow']) {
        Write-Report -TestName 'Métodos HTTP permitidos' -Target $Url `
            -Result "Allow: $($optionsResp.Headers['Allow'])" -HttpStatus $optionsResp.StatusCode `
            -Severity 'INFO' -Classification 'Configuração Recomendada' `
            -Recommendation 'Desabilitar métodos não utilizados (ex.: TRACE, DELETE, PUT se não necessários).'
    }

    # Headers que revelam tecnologia
    $techHeaders = @('Server', 'X-Powered-By', 'X-AspNet-Version', 'X-Generator')
    foreach ($th in $techHeaders) {
        foreach ($key in $headers.Keys) {
            if ($key -eq $th) {
                Write-Report -TestName "Header de tecnologia: $th" -Target $Url `
                    -Result "Presente: $($headers[$key])" -HttpStatus 200 `
                    -Severity 'LOW' -Classification 'Configuração Recomendada' `
                    -Impact 'Facilita a identificação de versões e possíveis exploits específicos.' `
                    -Recommendation "Remover ou ofuscar o header $th."
            }
        }
    }
}

# =============================================================================
# MÓDULO B — EXPOSIÇÃO DE ARQUIVOS (PASSIVE)
# =============================================================================

function Invoke-ModuleB_FileExposure {
    param([string]$BaseUrl)

    Write-Host "`n=== MÓDULO B — EXPOSIÇÃO DE ARQUIVOS ($BaseUrl) ===" -ForegroundColor Magenta

    $paths = @(
        '/.env', '/.env.local', '/.env.production',
        '/.git/config', '/.git/HEAD',
        '/robots.txt', '/sitemap.xml', '/security.txt',
        '/backup.zip', '/backup.tar.gz', '/db.sql',
        '/config.json', '/appsettings.json', '/web.config'
    )

    foreach ($path in $paths) {
        $uri = "$BaseUrl$path"
        $resp = Invoke-SafeWebRequest -Uri $uri -NoBody

        if (-not $resp) { continue }

        $status = $resp.StatusCode
        $isCriticalPath = $path -match '\.env|\.git'

        if ($status -eq 200) {
            # Verifica se a resposta parece ser conteúdo real do arquivo ou uma página genérica da aplicação
            $isGeneric = $false
            if ($resp.Headers['Content-Type'] -match 'text/html') {
                # Se o path é para um arquivo de texto/config e retorna HTML, provavelmente é uma página 404 customizada ou SPA fallback
                if ($isCriticalPath) {
                    $isGeneric = $true
                    Write-Report -TestName "Exposição: $path" -Target $uri `
                        -Result 'Status 200, mas Content-Type é text/html (provável página genérica/SPA fallback)' `
                        -HttpStatus $status -Severity 'INFO' -Classification 'Falso Positivo' `
                        -Limitations 'Não foi possível diferenciar com certeza uma página genérica de um arquivo exposto sem baixar o conteúdo.'
                }
            }

            if (-not $isGeneric) {
                if ($isCriticalPath) {
                    Write-Report -TestName "Exposição: $path" -Target $uri `
                        -Result 'Recurso potencialmente exposto (Status 200)' -HttpStatus $status `
                        -Evidence 'Caminho acessível publicamente. Conteúdo não foi baixado por segurança.' `
                        -Severity 'CRITICAL' -Classification 'Possível Vulnerabilidade' `
                        -Impact 'Exposição de segredos, credenciais ou código-fonte.' `
                        -Recommendation 'Bloquear acesso a arquivos .env e .git no servidor web. Rotacionar todas as credenciais potencialmente expostas.' `
                        -Limitations 'A exposição real não foi confirmada para evitar extração de dados sensíveis.'
                } else {
                    Write-Report -TestName "Arquivo público: $path" -Target $uri `
                        -Result 'Acessível publicamente' -HttpStatus $status `
                        -Severity 'LOW' -Classification 'Configuração Recomendada' `
                        -Recommendation "Verificar se o arquivo $path deve ser público e se não contém informações sensíveis."
                }
            }
        } elseif ($status -in @(403, 404)) {
            Write-Report -TestName "Exposição: $path" -Target $uri `
                -Result "Acesso negado ou não encontrado (Status $status)" -HttpStatus $status `
                -Severity 'INFO' -Classification 'Configuração Recomendada' `
                -Recommendation 'Manter a configuração de bloqueio.'
        } elseif ($status -in @(301, 302, 307, 308)) {
            Write-Report -TestName "Exposição: $path" -Target $uri `
                -Result "Redirecionamento (Status $status)" -HttpStatus $status `
                -Severity 'INFO' -Classification 'Teste Inconclusivo' `
                -Limitations 'Redirecionamento não seguido para evitar sair do escopo.'
        }
    }
}

# =============================================================================
# MÓDULO C — AUDITORIA DO GIT (LOCAL)
# =============================================================================

function Invoke-ModuleC_GitAudit {
    param([string]$RepoPath)

    Write-Host "`n=== MÓDULO C — AUDITORIA DO GIT ($RepoPath) ===" -ForegroundColor Magenta

    if (-not (Test-Path (Join-Path $RepoPath '.git'))) {
        Write-Report -TestName 'Repositório Git' -Target $RepoPath `
            -Result 'Diretório .git não encontrado' -Severity 'INFO' -Classification 'Teste Inconclusivo' `
            -Limitations 'O caminho fornecido pode não ser um repositório Git.'
        return
    }

    Push-Location $RepoPath
    try {
        # 1. Verificar se .env está rastreado no índice atual
        $trackedEnv = git ls-files 2>$null | Where-Object { $_ -match '\.env' }
        if ($trackedEnv) {
            Write-Report -TestName '.env rastreado no Git' -Target $RepoPath `
                -Result "Arquivos .env rastreados: $($trackedEnv -join ', ')" `
                -Severity 'CRITICAL' -Classification 'Possível Vulnerabilidade' `
                -Impact 'Segredos no .env podem estar versionados e expostos no repositório.' `
                -Recommendation 'Remover .env do controle de versão (git rm --cached .env), adicionar ao .gitignore e rotacionar todas as credenciais.'
        } else {
            Write-Report -TestName '.env rastreado no Git' -Target $RepoPath `
                -Result 'Nenhum arquivo .env rastreado no índice atual' `
                -Severity 'INFO' -Classification 'Configuração Recomendada'
        }

        # 2. Verificar histórico de commits em busca de .env
        $envInHistory = git log --all --oneline --name-only 2>$null | Where-Object { $_ -match '\.env' } | Select-Object -First 5
        if ($envInHistory) {
            Write-Report -TestName '.env no histórico do Git' -Target $RepoPath `
                -Result "Possível menção a .env no histórico (amostra: $($envInHistory -join '; '))" `
                -Severity 'HIGH' -Classification 'Possível Vulnerabilidade' `
                -Impact 'Credenciais antigas podem estar acessíveis via histórico do Git.' `
                -Recommendation 'Utilizar ferramentas como git-filter-repo ou BFG para remover o arquivo do histórico e rotacionar as credenciais.'
        } else {
            Write-Report -TestName '.env no histórico do Git' -Target $RepoPath `
                -Result 'Nenhuma menção a .env encontrada no histórico recente' `
                -Severity 'INFO' -Classification 'Configuração Recomendada' `
                -Limitations 'A busca foi limitada aos primeiros resultados; um histórico muito extenso pode conter ocorrências não listadas.'
        }

        # 3. Verificar regras do .gitignore
        $gitignorePath = Join-Path $RepoPath '.gitignore'
        if (Test-Path $gitignorePath) {
            $gitignoreContent = Get-Content $gitignorePath -Raw
            if ($gitignoreContent -match '\.env') {
                Write-Report -TestName 'Regra .env no .gitignore' -Target $gitignorePath `
                    -Result '.env está listado no .gitignore' -Severity 'INFO' -Classification 'Configuração Recomendada'
            } else {
                Write-Report -TestName 'Regra .env no .gitignore' -Target $gitignorePath `
                    -Result '.env NÃO está listado no .gitignore' -Severity 'HIGH' -Classification 'Possível Vulnerabilidade' `
                    -Impact 'Novos arquivos .env podem ser acidentalmente versionados.' `
                    -Recommendation 'Adicionar .env e variações (*.env, .env.*) ao .gitignore.'
            }
        } else {
            Write-Report -TestName 'Arquivo .gitignore' -Target $RepoPath `
                -Result '.gitignore não encontrado' -Severity 'MEDIUM' -Classification 'Possível Vulnerabilidade' `
                -Recommendation 'Criar um .gitignore e incluir .env, *.pem, *.key, etc.'
        }

        # 4. Identificar arquivos de configuração potencialmente expostos (rastreados)
        $configFiles = git ls-files 2>$null | Where-Object { $_ -match '\.(json|yml|yaml|config|xml|pem|key|p12|pfx)$' -and $_ -notmatch 'node_modules|\.example$' }
        if ($configFiles) {
            Write-Report -TestName 'Arquivos de configuração rastreados' -Target $RepoPath `
                -Result "Arquivos de configuração encontrados: $($configFiles -join ', ')" `
                -Severity 'MEDIUM' -Classification 'Possível Vulnerabilidade' `
                -Impact 'Arquivos de configuração podem conter credenciais ou informações sensíveis.' `
                -Recommendation 'Revisar cada arquivo para garantir que não contenha segredos. Usar variáveis de ambiente ou cofres de segredos.'
        }
    } finally {
        Pop-Location
    }
}

# =============================================================================
# MÓDULO D — AUDITORIA DO FRONTEND (LOCAL)
# =============================================================================

function Invoke-ModuleD_FrontendAudit {
    param([string]$RepoPath)

    Write-Host "`n=== MÓDULO D — AUDITORIA DO FRONTEND (Vite build) ===" -ForegroundColor Magenta

    $distPath = Join-Path $RepoPath 'resources\app\dist'
    if (-not (Test-Path $distPath)) {
        Write-Report -TestName 'Diretório de build do frontend' -Target $distPath `
            -Result 'Diretório não encontrado' -Severity 'INFO' -Classification 'Teste Inconclusivo' `
            -Limitations 'O build do frontend pode não ter sido gerado ou o caminho está incorreto.'
        return
    }

    $jsFiles = Get-ChildItem -Path $distPath -Recurse -File -Include *.js, *.jsx, *.ts, *.tsx -ErrorAction SilentlyContinue
    if (-not $jsFiles) {
        Write-Report -TestName 'Arquivos JavaScript compilados' -Target $distPath `
            -Result 'Nenhum arquivo JS encontrado' -Severity 'INFO' -Classification 'Teste Inconclusivo'
        return
    }

    Write-Host "  Analisando $($jsFiles.Count) arquivo(s) JavaScript..." -ForegroundColor Gray

    $foundCategories = @{}

    foreach ($file in $jsFiles) {
        $content = Get-Content $file.FullName -Raw -ErrorAction SilentlyContinue
        if (-not $content) { continue }

        foreach ($category in $script:SecretPatterns.Keys) {
            $pattern = $script:SecretPatterns[$category]
            if ($content -match $pattern) {
                if (-not $foundCategories.ContainsKey($category)) {
                    $foundCategories[$category] = New-Object System.Collections.Generic.List[string]
                }
                if (-not $foundCategories[$category].Contains($file.FullName)) {
                    $foundCategories[$category].Add($file.FullName)
                }
            }
        }
    }

    if ($foundCategories.Count -eq 0) {
        Write-Report -TestName 'Busca por segredos no frontend' -Target $distPath `
            -Result 'Nenhum padrão de segredo identificado nos arquivos JavaScript analisados' `
            -Severity 'INFO' -Classification 'Configuração Recomendada' `
            -Limitations 'A busca é baseada em padrões textuais e pode não detectar segredos ofuscados ou codificados de forma não trivial.'
    } else {
        foreach ($category in $foundCategories.Keys) {
            $fileList = $foundCategories[$category] -join ', '
            $severity = if ($category -in @('JWT_SECRET', 'DATABASE_URL', 'PRIVATE_KEY')) { 'CRITICAL' } else { 'HIGH' }
            Write-Report -TestName "Possível segredo: $category" -Target $distPath `
                -Result "Padrão encontrado em: $fileList" `
                -Evidence 'Valor do segredo NÃO foi extraído ou impresso por segurança.' `
                -Severity $severity -Classification 'Possível Vulnerabilidade' `
                -Impact 'Segredos incorporados no JavaScript do cliente podem ser extraídos por qualquer usuário.' `
                -Recommendation "Remover o segredo '$category' do código do frontend. Utilizar variáveis de ambiente do servidor ou um backend proxy para operações sensíveis. Rotacionar a credencial exposta."
        }
    }
}

# =============================================================================
# MÓDULO E — AUDITORIA DA API (PASSIVE)
# =============================================================================

function Invoke-ModuleE_ApiAudit {
    param([string]$ApiBase)

    Write-Host "`n=== MÓDULO E — AUDITORIA DA API ($ApiBase) ===" -ForegroundColor Magenta

    # Endpoints comuns para verificação não intrusiva
    $endpoints = @(
        '/', '/health', '/api', '/api/v1',
        '/api/docs', '/swagger', '/swagger.json', '/openapi.json',
        '/api/status', '/version'
    )

    foreach ($ep in $endpoints) {
        $uri = "$ApiBase$ep"
        $resp = Invoke-SafeWebRequest -Uri $uri -NoBody

        if (-not $resp) { continue }

        $status = $resp.StatusCode

        if ($status -eq 200) {
            # Verifica se a resposta parece conter informações excessivas
            $isSwagger = $ep -match 'swagger|openapi|docs'
            $severity = if ($isSwagger) { 'MEDIUM' } else { 'LOW' }
            $classification = if ($isSwagger) { 'Possível Vulnerabilidade' } else { 'Configuração Recomendada' }

            Write-Report -TestName "Endpoint público: $ep" -Target $uri `
                -Result 'Endpoint acessível sem autenticação' -HttpStatus $status `
                -Severity $severity -Classification $classification `
                -Impact $(if ($isSwagger) { 'Documentação da API exposta pode revelar todos os endpoints e parâmetros.' } else { 'Endpoint público pode fornecer informações sobre o serviço.' }) `
                -Recommendation $(if ($isSwagger) { 'Proteger a documentação da API com autenticação ou restringir o acesso por IP.' } else { 'Avaliar se o endpoint deve ser público e se não expõe informações sensíveis.' })
        } elseif ($status -in @(401, 403)) {
            Write-Report -TestName "Endpoint protegido: $ep" -Target $uri `
                -Result 'Requer autenticação/autorização' -HttpStatus $status `
                -Severity 'INFO' -Classification 'Configuração Recomendada'
        } elseif ($status -eq 404) {
            # 404 é esperado para endpoints não existentes; não reportar como vulnerabilidade
            Write-Verbose "Endpoint não encontrado (404): $uri"
        } elseif ($status -in @(500, 502, 503)) {
            Write-Report -TestName "Erro no endpoint: $ep" -Target $uri `
                -Result "Erro do servidor (Status $status)" -HttpStatus $status `
                -Severity 'MEDIUM' -Classification 'Teste Inconclusivo' `
                -Recommendation 'Investigar a causa do erro. Evitar expor stack traces ou detalhes internos nas respostas de erro.'
        }
    }

    # Verificação de CORS na API
    $corsResp = Invoke-SafeWebRequest -Uri $ApiBase -NoBody -Headers @{ 'Origin' = 'https://evil.example' }
    if ($corsResp -and $corsResp.Headers['Access-Control-Allow-Origin']) {
        $acao = $corsResp.Headers['Access-Control-Allow-Origin']
        if ($acao -eq '*' -or $acao -eq 'https://evil.example') {
            Write-Report -TestName 'CORS da API' -Target $ApiBase `
                -Result "Access-Control-Allow-Origin: $acao" -HttpStatus $corsResp.StatusCode `
                -Severity 'HIGH' -Classification 'Possível Vulnerabilidade' `
                -Impact 'Qualquer origem pode fazer requisições autenticadas à API se cookies/tokens forem enviados.' `
                -Recommendation 'Restringir CORS a origens confiáveis específicas.'
        }
    }

    # Verificação de headers de segurança na API
    if ($corsResp -and $corsResp.Headers) {
        $apiHeaders = $corsResp.Headers
        $securityHeadersApi = @{
            'Strict-Transport-Security' = 'MEDIUM'
            'X-Content-Type-Options'     = 'LOW'
        }
        foreach ($h in $securityHeadersApi.Keys) {
            $present = $false
            foreach ($key in $apiHeaders.Keys) { if ($key -eq $h) { $present = $true; break } }
            if (-not $present) {
                Write-Report -TestName "Header de segurança da API: $h" -Target $ApiBase `
                    -Result 'Ausente' -Severity $securityHeadersApi[$h] -Classification 'Possível Vulnerabilidade' `
                    -Recommendation "Adicionar o cabeçalho $h nas respostas da API."
            }
        }
    }
}

# =============================================================================
# MÓDULO F — SEGURANÇA DE DOCUMENTOS (AUTHENTICATED LAB)
# =============================================================================

function Invoke-ModuleF_DocumentSecurity {
    param(
        [string]$BaseUrl,
        [string]$TokenA,
        [string]$TokenB,
        [string]$ResourceIdA,
        [string]$ResourceIdB
    )

    Write-Host "`n=== MÓDULO F — SEGURANÇA DE DOCUMENTOS (IDOR/BOLA) ===" -ForegroundColor Magenta

    if (-not $BaseUrl -or -not $TokenA -or -not $TokenB -or -not $ResourceIdA -or -not $ResourceIdB) {
        Write-Report -TestName 'Teste IDOR/BOLA' -Target 'N/A' `
            -Result 'Parâmetros insuficientes para executar o teste' -Severity 'INFO' -Classification 'Teste Inconclusivo' `
            -Limitations 'É necessário fornecer LabBaseUrl, tokens A e B, e IDs de recursos sintéticos A e B.'
        return
    }

    if (Test-IsProductionUrl -Url $BaseUrl) {
        Write-Report -TestName 'Teste IDOR/BOLA' -Target $BaseUrl `
            -Result 'Execução bloqueada: o alvo é um domínio de produção' -Severity 'INFO' -Classification 'Teste Inconclusivo' `
            -Recommendation 'Utilizar um ambiente de homologação (localhost, 127.0.0.1 ou domínio de staging).'
        return
    }

    # Constrói endpoints de recurso (ajustar conforme a API real)
    $resourceEndpoints = @(
        "/api/documents/$ResourceIdB",
        "/api/irpf/$ResourceIdB",
        "/api/files/$ResourceIdB",
        "/api/uploads/$ResourceIdB"
    )

    foreach ($ep in $resourceEndpoints) {
        $uri = "$BaseUrl$ep"
        $headersA = @{ 'Authorization' = "Bearer $TokenA" }
        $respA = Invoke-SafeWebRequest -Uri $uri -Headers $headersA

        if (-not $respA) { continue }

        if ($respA.StatusCode -eq 200) {
            Write-Report -TestName 'Possível IDOR/BOLA' -Target $uri `
                -Result 'Usuário A obteve status 200 ao acessar recurso do usuário B' `
                -HttpStatus $respA.StatusCode -Severity 'CRITICAL' -Classification 'Vulnerabilidade Confirmada' `
                -Impact 'Quebra de autorização em nível de objeto: um usuário pode acessar dados de outro.' `
                -Recommendation 'Implementar verificação de propriedade do recurso no servidor. Não confiar apenas no ID fornecido pelo cliente. Utilizar autorização baseada em atributos (ABAC) ou verificação explícita de ownership.'
        } elseif ($respA.StatusCode -in @(401, 403)) {
            Write-Report -TestName 'Autorização de recurso (A→B)' -Target $uri `
                -Result 'Acesso negado corretamente' -HttpStatus $respA.StatusCode `
                -Severity 'INFO' -Classification 'Configuração Recomendada'
        } else {
            Write-Report -TestName 'Teste IDOR/BOLA' -Target $uri `
                -Result "Status inesperado: $($respA.StatusCode)" -HttpStatus $respA.StatusCode `
                -Severity 'INFO' -Classification 'Teste Inconclusivo' `
                -Limitations 'O endpoint pode não existir ou ter um formato diferente.'
        }
    }
}

# =============================================================================
# MÓDULO G — SQL INJECTION E XSS (LOCAL / AUTHENTICATED LAB)
# =============================================================================

function Invoke-ModuleG_InjectionAudit {
    param(
        [string]$RepoPath,
        [string]$LabBaseUrl = ''
    )

    Write-Host "`n=== MÓDULO G — SQL INJECTION E XSS ===" -ForegroundColor Magenta

    # --- Parte 1: Análise estática do código (modo Local) ---
    if ($RepoPath -and (Test-Path $RepoPath)) {
        Write-Host "  [Análise estática] Procurando padrões de risco no código..." -ForegroundColor Gray

        $sourceFiles = Get-ChildItem -Path $RepoPath -Recurse -File -Include *.js, *.ts, *.jsx, *.tsx, *.sql -ErrorAction SilentlyContinue |
            Where-Object { $_.FullName -notmatch 'node_modules|\.git|dist' } |
            Select-Object -First 100

        $sqlRiskPatterns = @(
            @{ Pattern = 'query\s*\(\s*[''"].*\$\{'; Name = 'Concatenação de SQL com interpolação' },
            @{ Pattern = 'query\s*\(\s*[''"].*\+'; Name = 'Concatenação de SQL com operador +' },
            @{ Pattern = 'sequelize\.query\s*\(\s*[''"].*\$\{'; Name = 'Sequelize query com interpolação' },
            @{ Pattern = 'knex\.raw\s*\(\s*[''"].*\$\{'; Name = 'Knex raw com interpolação' }
        )

        $xssRiskPatterns = @(
            @{ Pattern = 'dangerouslySetInnerHTML'; Name = 'Uso de dangerouslySetInnerHTML (React)' },
            @{ Pattern = 'innerHTML\s*='; Name = 'Atribuição direta a innerHTML' },
            @{ Pattern = 'document\.write\s*\('; Name = 'Uso de document.write' },
            @{ Pattern = 'v-html\s*='; Name = 'Uso de v-html (Vue)' }
        )

        $sqlFindings = @()
        $xssFindings = @()

        foreach ($file in $sourceFiles) {
            $content = Get-Content $file.FullName -Raw -ErrorAction SilentlyContinue
            if (-not $content) { continue }

            foreach ($p in $sqlRiskPatterns) {
                if ($content -match $p.Pattern) {
                    $sqlFindings += "$($p.Name) em $($file.Name)"
                }
            }
            foreach ($p in $xssRiskPatterns) {
                if ($content -match $p.Pattern) {
                    $xssFindings += "$($p.Name) em $($file.Name)"
                }
            }
        }

        if ($sqlFindings.Count -gt 0) {
            Write-Report -TestName 'Possível risco de SQL Injection (estático)' -Target $RepoPath `
                -Result ($sqlFindings | Select-Object -First 5) -Severity 'HIGH' -Classification 'Possível Vulnerabilidade' `
                -Impact 'Concatenação de SQL pode permitir injeção se as entradas não forem devidamente parametrizadas.' `
                -Recommendation 'Utilizar prepared statements ou ORMs com parâmetros vinculados. Nunca concatenar entradas de usuário diretamente em consultas SQL.'
        } else {
            Write-Report -TestName 'Risco de SQL Injection (estático)' -Target $RepoPath `
                -Result 'Nenhum padrão óbvio de concatenação de SQL encontrado na amostra analisada' `
                -Severity 'INFO' -Classification 'Configuração Recomendada' `
                -Limitations 'Análise baseada em padrões; pode não detectar todas as formas de injeção.'
        }

        if ($xssFindings.Count -gt 0) {
            Write-Report -TestName 'Possível risco de XSS (estático)' -Target $RepoPath `
                -Result ($xssFindings | Select-Object -First 5) -Severity 'HIGH' -Classification 'Possível Vulnerabilidade' `
                -Impact 'Uso de HTML não sanitizado pode permitir execução de scripts maliciosos no navegador do usuário.' `
                -Recommendation 'Sanitizar todas as entradas renderizadas como HTML. Utilizar bibliotecas de sanitização (DOMPurify, sanitize-html) e evitar dangerouslySetInnerHTML/innerHTML sempre que possível.'
        } else {
            Write-Report -TestName 'Risco de XSS (estático)' -Target $RepoPath `
                -Result 'Nenhum padrão de risco óbvio encontrado na amostra analisada' `
                -Severity 'INFO' -Classification 'Configuração Recomendada' `
                -Limitations 'Análise baseada em padrões; pode não detectar todas as formas de XSS.'
        }
    }

    # --- Parte 2: Teste dinâmico não destrutivo (apenas em laboratório) ---
    if ($LabBaseUrl) {
        if (Test-IsProductionUrl -Url $LabBaseUrl) {
            Write-Report -TestName 'Teste dinâmico de injeção' -Target $LabBaseUrl `
                -Result 'Execução bloqueada: o alvo é um domínio de produção' -Severity 'INFO' -Classification 'Teste Inconclusivo'
            return
        }

        Write-Host "  [Teste dinâmico] Enviando payloads benignos para detecção de reflexão..." -ForegroundColor Gray

        # Payloads sintéticos e inofensivos
        $testPayloads = @(
            @{ Value = 'MERTILO_TEST_<script>alert(1)</script>'; Type = 'XSS'; Param = 'q' },
            @{ Value = "MERTILO_TEST_' OR '1'='1"; Type = 'SQLi'; Param = 'id' }
        )

        foreach ($payload in $testPayloads) {
            $testUri = "$LabBaseUrl/api/test?$($payload.Param)=$([System.Uri]::EscapeDataString($payload.Value))"
            $resp = Invoke-SafeWebRequest -Uri $testUri

            if (-not $resp) { continue }

            if ($resp.StatusCode -eq 200) {
                # Verifica se o payload é refletido na resposta (indicativo de XSS)
                $body = ''
                try { $body = $resp.Content } catch { }
                if ($body -and $body.Contains($payload.Value)) {
                    Write-Report -TestName "Reflexão de payload ($($payload.Type))" -Target $testUri `
                        -Result 'Payload sintético refletido na resposta' -HttpStatus $resp.StatusCode `
                        -Severity 'HIGH' -Classification 'Possível Vulnerabilidade' `
                        -Impact 'Entrada do usuário refletida sem sanitização adequada, potencialmente permitindo XSS ou injeção.' `
                        -Recommendation 'Sanitizar e codificar todas as saídas. Para SQL, utilizar prepared statements. Para HTML, escapar entidades.'
                } elseif ($resp.StatusCode -in @(500, 502)) {
                    Write-Report -TestName "Erro após payload ($($payload.Type))" -Target $testUri `
                        -Result "Erro do servidor após envio de payload (Status $($resp.StatusCode))" -HttpStatus $resp.StatusCode `
                        -Severity 'MEDIUM' -Classification 'Possível Vulnerabilidade' `
                        -Impact 'A entrada pode estar chegando a um interpretador (SQL, etc.) sem tratamento adequado.' `
                        -Recommendation 'Revisar o tratamento de entradas e utilizar prepared statements.'
                }
            }
        }
    }
}

# =============================================================================
# LÓGICA PRINCIPAL
# =============================================================================

Write-Host @"
╔══════════════════════════════════════════════════════════════╗
║           MERTILO-PENTEST — AUDITORIA DE SEGURANÇA           ║
║  Modo: $Mode                                                 ║
╚══════════════════════════════════════════════════════════════╝
"@ -ForegroundColor Cyan

Write-Host "Iniciando verificações em $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')..." -ForegroundColor Gray

switch ($Mode) {
    'Passive' {
        Write-Host "`n>>> Modo PASSIVE: apenas reconhecimento e verificações não intrusivas.`n" -ForegroundColor Yellow
        Invoke-ModuleA_HttpRecon -Url $FrontendUrl
        Invoke-ModuleB_FileExposure -BaseUrl $FrontendUrl
        Invoke-ModuleE_ApiAudit -ApiBase $ApiUrl
    }
    'Local' {
        Write-Host "`n>>> Modo LOCAL: auditoria do repositório local e código-fonte.`n" -ForegroundColor Yellow
        Invoke-ModuleC_GitAudit -RepoPath $LocalRepoPath
        Invoke-ModuleD_FrontendAudit -RepoPath $LocalRepoPath
        Invoke-ModuleG_InjectionAudit -RepoPath $LocalRepoPath
    }
    'AuthenticatedLab' {
        Write-Host "`n>>> Modo AUTHENTICATEDLAB: testes de autorização e injeção em ambiente de homologação.`n" -ForegroundColor Yellow

        if (-not $LabBaseUrl) {
            Write-Error "No modo AuthenticatedLab, o parâmetro -LabBaseUrl é obrigatório."
            exit 1
        }
        if (Test-IsProductionUrl -Url $LabBaseUrl) {
            Write-Error "O modo AuthenticatedLab NÃO pode ser executado contra domínios de produção."
            exit 1
        }

        Invoke-ModuleF_DocumentSecurity -BaseUrl $LabBaseUrl `
            -TokenA $LabUserAToken -TokenB $LabUserBToken `
            -ResourceIdA $LabResourceIdA -ResourceIdB $LabResourceIdB

        Invoke-ModuleG_InjectionAudit -LabBaseUrl $LabBaseUrl
    }
}

# =============================================================================
# RESUMO FINAL
# =============================================================================

Write-Host "`n$('=' * 60)" -ForegroundColor Cyan
Write-Host "RESUMO DA AUDITORIA" -ForegroundColor Cyan
Write-Host "$('=' * 60)" -ForegroundColor Cyan

$critical = ($script:ReportEntries | Where-Object { $_.Severity -eq 'CRITICAL' }).Count
$high     = ($script:ReportEntries | Where-Object { $_.Severity -eq 'HIGH' }).Count
$medium   = ($script:ReportEntries | Where-Object { $_.Severity -eq 'MEDIUM' }).Count
$low      = ($script:ReportEntries | Where-Object { $_.Severity -eq 'LOW' }).Count
$info     = ($script:ReportEntries | Where-Object { $_.Severity -eq 'INFO' }).Count

Write-Host "Total de achados: $($script:ReportEntries.Count)" -ForegroundColor White
Write-Host "  CRITICAL: $critical" -ForegroundColor Red
Write-Host "  HIGH    : $high" -ForegroundColor DarkRed
Write-Host "  MEDIUM  : $medium" -ForegroundColor Yellow
Write-Host "  LOW     : $low" -ForegroundColor DarkYellow
Write-Host "  INFO    : $info" -ForegroundColor Cyan

Write-Host "`nLimitações gerais:" -ForegroundColor Gray
Write-Host "- O script não realiza exploração ativa em produção." -ForegroundColor Gray
Write-Host "- Nenhum valor de segredo foi impresso ou armazenado." -ForegroundColor Gray
Write-Host "- Testes de IDOR/BOLA e injeção dinâmica só são executados em ambiente de laboratório." -ForegroundColor Gray

Write-Host "`nAuditoria concluída em $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')." -ForegroundColor Green