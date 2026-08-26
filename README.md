# Callaway JROTC Gallery v7 — No Server

This version does NOT use localhost and does NOT require Python.

## Open the gallery

1. Extract the ZIP.
2. Open the folder.
3. Double-click `index.html`.

That is all.

## Manage photos

Click **Manage Photos** in the gallery, or double-click `admin.html`.

You can upload photos, add titles/captions, choose categories/layouts, reorder, edit, and delete.

When finished:
1. Click **EXPORT gallery-data.js**
2. Replace the old `gallery-data.js` in your GitHub repository with the downloaded one.

You never need to open `app.js` or `admin.js`.

## GitHub Pages

Upload the entire folder contents to the root of your GitHub repository, then enable:
Settings → Pages → Deploy from a branch → main → /root


## v7 fix
The photo manager now uses IndexedDB instead of localStorage and automatically resizes large camera photos before storing them. This fixes Add Photo failures caused by browser localStorage size limits.


## v7 — One-click GitHub Upload Package

In `admin.html`, click **EXPORT UPLOAD PACKAGE**.

The downloaded ZIP contains:
- `gallery-data.js`
- `images/` with your locally uploaded gallery photos
- `UPLOAD-INSTRUCTIONS.txt`

After extracting it:
1. Replace `gallery-data.js` in the root of your GitHub repository.
2. Upload the photos into the repository's `images` folder.
3. Commit the changes.

The image paths are created automatically, so you do not have to edit JavaScript.


## v7 — Direct Publish to GitHub

The Gallery Manager now has a **Publish to GitHub** panel.

### One-time GitHub requirement
Create a fine-grained personal access token restricted to the `Photo-Gallery` repository with:
- Repository permission: **Contents — Read and write**

Do not put the token into any source file.

### Publishing
1. Open `admin.html`.
2. Add/edit/reorder photos.
3. Enter:
   - Owner: `djcaptaind`
   - Repository: `Photo-Gallery`
   - Branch: `main`
   - Your fine-grained token
4. Click **TEST CONNECTION**.
5. Click **PUBLISH TO GITHUB**.

The manager automatically:
- uploads locally-added pictures to `/images`
- gives them safe filenames
- changes the photo records to `images/...`
- updates `gallery-data.js`
- commits the changes to GitHub

The token is not saved in IndexedDB or localStorage.

### Backup
**Export Backup Package** remains available if direct publishing is blocked by browser/network policy.
