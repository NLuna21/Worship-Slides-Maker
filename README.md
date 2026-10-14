# Ligaya Worship Slide Builder

Pick songs, add new ones, and export a PowerPoint (built-in design, or your own `.pptx` template containing `{{Song Title}}` / `{{Lyrics}}`).

```
index.html         page markup (loads CDN libraries + the scripts below, in order)
css/styles.css     styling (light/dark aware)
data/songs.xlsx    the song database (source of truth - edit this in Excel)
js/songs-data.js   GENERATED from data/songs.xlsx by tools/build.py (offline copy)
js/database.js     Excel parsing + loads data/songs.xlsx when hosted
js/config.js       theme colours + slide geometry / margins
js/utils.js        DOM, storage and status helpers
js/state.js        loaded songs, added songs, current set
js/formatting.js   lyric rules (4-5 lines, no end punctuation, capitals) + auto-fit font sizing
js/render.js       library / set / preview rendering
js/events.js       tabs, filters, set editing
js/add-song.js     add-a-song form
js/export.js       spreadsheet import/export + built-in PowerPoint export
js/template.js     custom template engine (slide duplication, auto-fit inside template boxes)
js/preview.js      draws template slides as HTML (backgrounds, images, fonts, colours) for the live preview
js/main.js         start-up
tools/build.py     regenerates the data script and bundles to dist/worship-slide-builder.html
```

- **Auto-fit:** `js/formatting.js` (`fitPt`, `uniformPt`) picks one font size per deck; `js/template.js` (`tplLayout`, `fitBox`) reads the slide size and sizes the lyrics box for templates.
## Updating the songs
Edit `data/songs.xlsx` (see its "How to use" sheet): one song per row, one lyric section per column from column Q.
- **Hosted (GitHub Pages / Netlify):** upload the new `songs.xlsx`. The site reads it directly, no build needed.
- **Opened by double-clicking `index.html`:** run `pip install openpyxl` once, then `python3 tools/build.py` after each edit.
- **Single-file version:** `dist/worship-slide-builder.html` (made by the build script).
- Songs added inside the app are saved in that browser only; use "Export my added songs" and paste the rows into `songs.xlsx`.
