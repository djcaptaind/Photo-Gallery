@echo off
cd /d "%~dp0"
echo Starting Callaway JROTC Gallery...
where py >nul 2>nul
if %errorlevel%==0 (
 start "" http://localhost:8000/index.html
 py -m http.server 8000
 goto :eof
)
where python >nul 2>nul
if %errorlevel%==0 (
 start "" http://localhost:8000/index.html
 python -m http.server 8000
 goto :eof
)
echo Python was not found. Upload the files to GitHub Pages to view them normally.
pause
