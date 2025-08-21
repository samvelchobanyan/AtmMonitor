// avoid "" error in stringified data

export default function encode(obj) {
    const str = JSON.stringify(obj ?? null);
    return str.replace(/&/g, "&amp;").replace(/"/g, "&quot;");
}
