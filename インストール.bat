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
    set "EXT_ID=%%a"
    goto :got_id
)
:got_id

if "!EXT_ID!"=="" (
    echo [エラー] extension_id.txt の1行目に拡張機能IDを記入してください。
    echo.
    echo 手順:
    echo   1. Chrome で chrome://extensions を開く
    echo   2. 「Google Chat - エクスプローラーで開く」の ID をコピー
    echo   3. extension_id.txt を開き、1行目に貼り付けて上書き保存
    echo   4. このバッチを再度ダブルクリック
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
    echo 登録に失敗しました。extension_id.txt のIDが正しいか確認してください。
    pause
    exit /b 1
)

echo.
echo ネイティブホストの登録が完了しました。
pause
