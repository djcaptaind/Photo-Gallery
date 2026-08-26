# Callaway JROTC Gallery v5 — No Server

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


## v5 fix
The photo manager now uses IndexedDB instead of localStorage and automatically resizes large camera photos before storing them. This fixes Add Photo failures caused by browser localStorage size limits.
