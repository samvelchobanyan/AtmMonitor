// Make a value safe inside a double-quoted HTML attribute, e.g. value="${escapeAttr(text)}".
// Without it, a typed " would end the attribute early and break the rest of the field.

export default function escapeAttr(value) {
    return String(value ?? "").replace(/&/g, "&amp;").replace(/"/g, "&quot;");
}
