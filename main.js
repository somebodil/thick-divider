// Draws a line of "===" as a divider three times as thick as the one of "---".
// Only how a note is drawn changes, never the note.

const obsidian = require("obsidian");
const { Decoration, ViewPlugin, WidgetType } = require("@codemirror/view");
const { syntaxTree } = require("@codemirror/language");

const LINE = /^ {0,3}={3,}[ \t]*$/;
const FIRST_LINE = /^[ \t]*={3,}[ \t]*(\n|$)/;

const divider = () => createEl("hr", "thick-divider");

class Divider extends WidgetType {
  toDOM(view) {
    const hr = divider();
    // As for a "---": a click selects the "===" of the line, and so shows it.
    hr.addEventListener("click", () => {
      const { from, to } = view.state.doc.lineAt(view.posAtDOM(hr));
      view.dispatch({ selection: { anchor: to, head: from } });
    });
    return hr;
  }
}

// As for a line of "---": the line gets Obsidian's class "hr", its text is hidden, and the divider
// comes after it. CodeMirror then ends the line with a <br>, which gives it the height of a line.
const line = Decoration.line({ class: "hr" });
const hide = Decoration.replace({});
const end = Decoration.widget({ widget: new Divider(), side: 1 });

const isLivePreview = (state) => state.field(obsidian.editorLivePreviewField, false);

// Only the lines on the screen are looked at.
const decorate = (view) => {
  const { state } = view;
  if (!isLivePreview(state)) return Decoration.none;
  const tree = syntaxTree(state), { doc, selection } = state, found = [];
  for (const { from, to } of view.visibleRanges) {
    for (let pos = from; pos <= to; ) {
      const l = doc.lineAt(pos);
      pos = l.to + 1;
      if (!LINE.test(l.text)) continue;
      // Marked by Obsidian: it makes the text above it a heading, or it is in code, math, a quote or the properties.
      if (tree.resolveInner(l.from + l.text.indexOf("="), 1).parent) continue;
      // Under a list item, Reading view makes the item a heading.
      const above = l.number > 1 && doc.line(l.number - 1);
      if (above && tree.resolveInner(above.from + above.text.search(/\S|$/), 1).name.includes("list")) continue;
      // Where the cursor or a selection is, the "===" shows.
      if (selection.ranges.some((r) => r.from <= l.to && r.to >= l.from)) continue;
      found.push(line.range(l.from), hide.range(l.from, l.to), end.range(l.to));
    }
  }
  return Decoration.set(found);
};

const livePreview = ViewPlugin.fromClass(
  class {
    constructor(view) { this.decorations = decorate(view); }
    update(u) {
      if (u.docChanged || u.viewportChanged || u.selectionSet ||
          syntaxTree(u.startState) !== syntaxTree(u.state) ||
          isLivePreview(u.startState) !== isLivePreview(u.state)) {
        this.decorations = decorate(u.view);
      }
    }
  },
  { decorations: (v) => v.decorations },
);

module.exports = class ThickDivider extends obsidian.Plugin {
  onload() {
    this.registerEditorExtension(livePreview);
    // Reading view: a paragraph that begins with a line of "===".
    this.registerMarkdownPostProcessor((el) => {
      for (const p of el.querySelectorAll(":scope > p")) {
        const text = p.firstChild;
        const m = text?.instanceOf(Text) && FIRST_LINE.exec(text.data);
        if (!m) continue;
        // After the "===": nothing, a <br> and the next line, or (with strict line breaks) the next line.
        if (!m[1] && text.nextSibling) {
          if (text.nextSibling.nodeName !== "BR") continue; // more on the same line
          text.nextSibling.remove();
        }
        text.data = text.data.slice(m[0].length);
        p.before(divider());
        if (!text.data.trim() && !text.nextSibling) p.remove();
      }
    });
  }
};
