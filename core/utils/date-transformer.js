const monthsHy = [
    "Հունվար",
    "Փետրվար",
    "Մարտ",
    "Ապրիլ",
    "Մայիս",
    "Հունիս",
    "Հուլիս",
    "Օգոստոս",
    "Սեպտեմբեր",
    "Հոկտեմբեր",
    "Նոյեմբեր",
    "Դեկտեմբեր",
];

export function formatDateOnly(dateString) {
    const date = new Date(dateString);
    if (Number.isNaN(date.getTime())) return "";

    const day = String(date.getDate()).padStart(2, "0");
    const monthName = monthsHy[date.getMonth()];
    const year = date.getFullYear();

    return `${day} ${monthName} ${year}`;
}

export function formatTimeOnly(dateString) {
    const date = new Date(dateString);
    if (Number.isNaN(date.getTime())) return "";

    const hours = String(date.getHours()).padStart(2, "0");
    const minutes = String(date.getMinutes()).padStart(2, "0");

    return `${hours}:${minutes}`;
}

export default function formatDate(dateString) {
    const date = new Date(dateString); // parse ISO
    if (Number.isNaN(date.getTime())) return "";

    const day = String(date.getDate()).padStart(2, "0");
    const monthName = monthsHy[date.getMonth()];
    const year = date.getFullYear();

    const hours = String(date.getHours()).padStart(2, "0");
    const minutes = String(date.getMinutes()).padStart(2, "0");

    return `${day} ${monthName} ${year} ${hours}:${minutes}`;
}
