"use strict";

// A line of "===" is drawn as a divider, three times as thick as the one of "---".
// The note is not changed: only how it is drawn.

const { Plugin, editorLivePreviewField } = require("obsidian");
const { Decoration, ViewPlugin, WidgetType } = require("@codemirror/view");
const { syntaxTree } = require("@codemirror/language");

const LINE = /^ {0,3}={3,}[ \t]*$/;
const FIRST_LINE = /^[ \t]*={3,}[ \t]*(\n|$)/;

const divider = () => createEl("hr", { attr: { style: "border-top-width: calc(3 * var(--hr-thickness))" } });

// <br><hr>, as in the line of a "---": the <br> keeps the height of a line.
class Divider extends WidgetType {
  eq() { return true; }
  toDOM() {
    const el = createSpan({ attr: { style: "display: contents" } });
    el.append(createEl("br"), divider());
    return el;
  }
  ignoreEvent() { return false; } // a click on it selects the line, and shows the "==="
}

// The line gets the class of the line of a "---", so it is laid out the same.
const line = Decoration.line({ class: "hr" });
const widget = Decoration.replace({ widget: new Divider() });

// Only the lines on screen are looked at.
function decorate(view) {
  const { state } = view;
  if (!state.field(editorLivePreviewField)) return Decoration.none;
  const tree = syntaxTree(state), { doc, selection } = state, found = [];
  const marked = (l) => tree.resolveInner(l.from + l.text.search(/\S|$/), 1).name;
  for (const { from, to } of view.visibleRanges) {
    for (let pos = from; pos <= to; ) {
      const l = doc.lineAt(pos);
      pos = l.to + 1;
      if (!LINE.test(l.text)) continue;
      // Marked "===": the line under a heading, or in code, math, a quote or the properties.
      if (tree.resolveInner(l.from + l.text.indexOf("="), 1).parent) continue;
      // Under a list item, "===" makes the item a heading in Reading view.
      if (l.number > 1 && marked(doc.line(l.number - 1)).includes("list")) continue;
      // Where the cursor or the selection is, the "===" is shown, as for "---".
      if (selection.ranges.some((r) => r.from <= l.to && r.to >= l.from)) continue;
      found.push(line.range(l.from), widget.range(l.from, l.to));
    }
  }
  return Decoration.set(found);
}

const livePreview = ViewPlugin.fromClass(
  class {
    constructor(view) { this.decorations = decorate(view); }
    update(u) {
      if (u.docChanged || u.viewportChanged || u.selectionSet ||
          syntaxTree(u.startState) !== syntaxTree(u.state) ||
          u.startState.field(editorLivePreviewField) !== u.state.field(editorLivePreviewField)) {
        this.decorations = decorate(u.view);
      }
    }
  },
  { decorations: (p) => p.decorations },
);

module.exports = class ThickDivider extends Plugin {
  onload() {
    this.registerEditorExtension(livePreview);
    // Reading view: a paragraph that begins with a line of "===".
    this.registerMarkdownPostProcessor((el) => {
      for (const p of el.querySelectorAll(":scope > p")) {
        const t = p.firstChild, m = t?.nodeType === 3 && FIRST_LINE.exec(t.data);
        if (!m) continue;
        const next = t.nextSibling;
        if (!m[1] && next) {
          if (next.nodeName !== "BR") continue; // more on the same line: not a line of "===" only
          next.remove();
        }
        t.data = t.data.slice(m[0].length);
        p.before(divider());
        if (!t.data.trim() && !t.nextSibling) p.remove();
      }
    });
  }
};
