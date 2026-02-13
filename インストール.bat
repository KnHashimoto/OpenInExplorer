@echo off
chcp 65001 >nul
setlocal EnableDelayedExpansion
set "SCRIPT_DIR=%~dp0"
set "ID_FILE=%SCRIPT_DIR%extension_id.txt"

if not exist "%ID_FILE%" (
    echo [エラー] extension_id.txt が見つかりません。
    echo.
    echo このフォルダ内に extension_id.txt があるか確認してください。
    pause
    exit /b 1
)

set "EXT_ID="
for /f "usebackq tokens=* delims=" %%a in ("%ID_FILE%") do (
    set "line=%%a"
    if "!line:~0,1!" neq "#" (
        set "EXT_ID=%%a"
        goto :got_id
    )
)
:got_id

if "!EXT_ID!"=="" (
    echo [エラー] extension_id.txt に拡張機能IDを記入してください。
    echo.
    echo # で始まる行はコメントです。コメントの「下の1行」に、32文字のIDだけを書いて保存してください。
    echo.
    start notepad "%ID_FILE%"
    pause
    exit /b 1
)

cd /d "%SCRIPT_DIR%native_host"
powershell -ExecutionPolicy Bypass -File ".\install_native_host.ps1" -ExtensionId "!EXT_ID!"
set "PS_RESULT=!errorlevel!"
cd /d "%SCRIPT_DIR%"

if !PS_RESULT! neq 0 (
    echo.
    echo 登録に失敗しました。拡張機能IDが正しくない可能性があります。
    echo extension_id.txt を確認し、# で始まらない行に32文字の英小文字のIDだけが書かれているか確認してください。
    echo.
    start notepad "%ID_FILE%"
    pause
    exit /b 1
)

echo.
echo ネイティブホストの登録が完了しました。
pause
