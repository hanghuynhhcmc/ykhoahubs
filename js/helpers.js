/* =====================================
   HELPERS - PARSE
===================================== */

export function getChoices(choices) {
    if (choices === null || choices === undefined) return [];
    return String(choices)
        .split(/\r?\n/)
        .map(c => c.trim())
        .filter(c => c !== "");
}

export function getFillBlankAnswers(answer) {
    if (answer === null || answer === undefined) return [];
    return String(answer)
        .split("|")
        .map(a => a.trim())
        .filter(a => a !== "");
}

export function countPlaceholders(question) {
    const matches = String(question || "").match(/\{\{\d+\}\}/g);
    return matches ? matches.length : 0;
}


/* =====================================
   HELPERS - NORMALIZE / FORMAT
===================================== */

export function normalizeAnswer(text) {
    return normalizeText(text)
        .replace(/\s+/g, " ")
        .trim();
}

export function normalizeText(text) {
    return String(text ?? "")
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/đ/g, "d");
}

export function formatText(text) {
    if (text === null || text === undefined) return "";
    return escapeHTML(String(text)).replace(/\n/g, "<br>");
}

export function escapeHTML(text) {
    return String(text)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}


/* =====================================
   HELPERS - QUESTION TYPE
===================================== */

export function getQuestionType(q) {
    if (!q) return null;
    const type = String(q.dang || "").trim().toUpperCase();
    if (type === "MCQ") return "MCQ";
    if (type === "FILL_BLANK") return "FILL_BLANK";
    return null;
}

export function isValidQuestion(q) {
    const type = getQuestionType(q);
    if (!type) return false;

    if (type === "MCQ") {
        if (!q.choices) return false;
        const choices = getChoices(q.choices);
        if (choices.length === 0) return false;
        if (!q.answer) return false;
        return true;
    }

    const placeholderCount = countPlaceholders(q.question || "");
    if (placeholderCount === 0) return false;
    const answers = getFillBlankAnswers(q.answer);
    if (answers.length !== placeholderCount) return false;
    return true;
}