# thick-divider

A plugin for [Obsidian](https://obsidian.md) that draws a line of `===` as a divider three times as thick as the one of `---`.

```markdown
Under a thin divider.

===

Under a thick divider.
```

`===` is a thick `---`, and nothing more. It goes where a `---` goes, and does what a `---` does:

- Under a line of text, it makes that text a heading, as `---` does. A divider needs a blank line above it.
- Where the cursor is, the `===` shows, so that you can change it. A click on the divider selects its `===`.
- In code, in math, in a quote and in a callout, it stays as it is.
- In Source mode, and in other apps, it stays `===`. The plugin changes how the note is drawn, never the note.

The divider has the color and the place of the one of `---` in your theme. There are no settings.

## Requirements

- Obsidian 1.6.7 or later

## Installation

1. Download `main.js`, `manifest.json`, and `styles.css` from the [latest release](https://github.com/somebodil/thick-divider/releases/latest).
2. In your vault, create the folder `.obsidian/plugins/thick-divider/` and put the three files in it. `.obsidian` is a hidden folder.
3. Restart Obsidian.
4. Go to **Settings → Community plugins** and switch on **thick-divider** in the list of installed plugins.

## License

[MIT](LICENSE)
