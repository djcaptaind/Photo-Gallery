# Callaway JROTC Gallery Manager v3

This version eliminates the need to open or edit `script.js`.

## Manage photos
Open `admin.html` or click **Manage Photos** from the gallery.

You can upload photos, add titles/captions, choose categories/layouts, reorder, edit, delete, import JSON, and export `gallery-data.json`.

## Local Windows viewing
Double-click `START-GALLERY.bat` to avoid browser restrictions on local JSON files.

## Publish changes to GitHub Pages
1. Click **EXPORT GALLERY DATA** in the manager.
2. Replace `gallery-data.json` in your GitHub repository with the exported file.
3. GitHub Pages updates the gallery automatically after deployment.

### Important
A static GitHub Pages site cannot securely write directly into your repository without GitHub authentication or a backend. This version therefore uses a visual manager plus one-file export instead of asking you to edit JavaScript.
