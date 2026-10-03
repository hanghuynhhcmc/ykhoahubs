/* =====================================
   QUESTIONS - LOAD + QUẢN LÝ CÂU HỎI
===================================== */

import { state } from './state.js';
import { isValidQuestion } from './helpers.js';
import { supabaseClient, LEARNED_KEY } from './config.js';


/* =====================================
   LOAD CÂU HỎI TỪ SUPABASE
===================================== */

export async function loadQuestions() {
    const maxCau = state.currentUser?.maxCau || 100;

    const { data, error } = await supabaseClient
        .from('questions')
        .select('*')
        .limit(maxCau);

    if (error) {
        console.error('Lỗi tải câu hỏi:', error);
        throw new Error('Không tải được câu hỏi từ Supabase');
    }

    console.log('=== SỐ DÒNG ===', data.length);
    if (data.length > 0) console.log('=== CỘT ===', Object.keys(data[0]));

    // Chuẩn hóa data
    state.questions = data.map((q, i) => {
        // Xác định loại câu hỏi (linh hoạt)
        const loaiRaw = String(
            q["Loại câu hỏi"] || q["Loại"] || q.loai_cau_hoi || q.loai || q.type || ''
        ).trim();
        const loaiNorm = loaiRaw.toUpperCase().normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd');

        let dang = '';
        if (loaiNorm.includes('MCQ') || loaiNorm.includes('TRAC NGHIEM')) {
            dang = 'MCQ';
        } else if (loaiNorm.includes('DIEN') || loaiNorm.includes('KHUYET') ||
                   loaiNorm.includes('FILL') || loaiNorm.includes('TU LUAN')) {
            dang = 'FILL_BLANK';
        } else {
            // Tự đoán
            const choices = q["Lựa chọn"] || q.lua_chon || q.choices || '';
            const question = q["Câu hỏi"] || q.cau_hoi || q.question || '';
            if (choices && String(choices).trim()) dang = 'MCQ';
            else if (/\{\{\d+\}\}/.test(String(question))) dang = 'FILL_BLANK';
            else dang = 'MCQ';
        }

        return {
            id: q["ID"] || q.id || i + 1,
            mon: String(q["Môn"] || q.mon || q.subject || '').trim(),
            dang: dang,
            question: String(q["Câu hỏi"] || q.cau_hoi || q.question || q.content || '').trim(),
            choices: String(q["Lựa chọn"] || q.lua_chon || q.choices || '').trim(),
            answer: String(q["Đáp án"] || q.dap_an || q.answer || '').trim(),
            explanation: String(q["Giải thích"] || q.giai_thich || q.explanation || '').trim()
        };
    }).filter(isValidQuestion);

    console.log(`Đã tải ${state.questions.length} câu hỏi hợp lệ.`);

    // Hiển thị menu
    const { showMenu } = await import('./dashboard.js');
    showMenu();
}


/* =====================================
   DANH SÁCH MÔN
===================================== */

export function getSubjects() {
    const set = new Set();
    state.questions.forEach(q => {
        if (q.mon) set.add(q.mon);
    });
    return Array.from(set);
}


/* =====================================
   LEARNED — GIỮ NGUYÊN
===================================== */

function getLearnedIds() {
    try {
        const raw = localStorage.getItem(LEARNED_KEY);
        const arr = raw ? JSON.parse(raw) : [];
        return new Set(arr.map(Number));
    } catch {
        return new Set();
    }
}

function saveLearnedIds(set) {
    try {
        localStorage.setItem(LEARNED_KEY, JSON.stringify(Array.from(set)));
    } catch { /* ignore */ }
}

export function markAsLearned(id) {
    if (id === null || id === undefined) return;
    const set = getLearnedIds();
    set.add(Number(id));
    saveLearnedIds(set);
}

export function isLearned(id) {
    return getLearnedIds().has(Number(id));
}


/* =====================================
   NOT LEARNED — GIỮ NGUYÊN
===================================== */

const NOT_LEARNED_KEY = "ykhoahub_not_learned";

function getNotLearnedIds() {
    try {
        const raw = localStorage.getItem(NOT_LEARNED_KEY);
        const arr = raw ? JSON.parse(raw) : [];
        return new Set(arr.map(Number));
    } catch {
        return new Set();
    }
}

function saveNotLearnedIds(set) {
    try {
        localStorage.setItem(NOT_LEARNED_KEY, JSON.stringify(Array.from(set)));
    } catch { /* ignore */ }
}

export function markAsNotLearned(id) {
    if (id === null || id === undefined) return;
    const set = getNotLearnedIds();
    set.add(Number(id));
    saveNotLearnedIds(set);
}

export function unmarkNotLearned(id) {
    const set = getNotLearnedIds();
    set.delete(Number(id));
    saveNotLearnedIds(set);
}

export function isNotLearned(id) {
    return getNotLearnedIds().has(Number(id));
}

export function getNotLearnedQuestions() {
    const ids = getNotLearnedIds();
    return state.questions.filter(q => ids.has(Number(q.id)));
}


/* =====================================
   PHÂN LOẠI
===================================== */

export function getQuestionStatus(id) {
    const numId = Number(id);
    if (!numId) return "locked";
    if (!isLearned(numId)) return "locked";
    if (isNotLearned(numId)) return "review";
    return "mastered";
}

export function getSubjectStatsFull(subject) {
    const list = state.questions.filter(q => q.mon === subject);
    let mastered = 0, review = 0, locked = 0;
    list.forEach(q => {
        const s = getQuestionStatus(q.id);
        if (s === "mastered") mastered++;
        else if (s === "review") review++;
        else locked++;
    });
    return { total: list.length, mastered, review, locked, remaining: list.length - mastered };
}

export function getSubjectStats(subject) {
    const stats = getSubjectStatsFull(subject);
    return { total: stats.total, learned: stats.mastered, review: stats.review, remaining: stats.remaining };
}

export function getLockedQuestions() {
    return state.questions.filter(q => getQuestionStatus(q.id) === "locked");
}

export function getMasteredQuestions() {
    return state.questions.filter(q => getQuestionStatus(q.id) === "mastered");
}


/* =====================================
   HELPERS — GIỮ NGUYÊN
===================================== */

export function stripFillBlank(q) {
    if (!q) return "";
    let text = String(q.question || "");
    text = text.replace(/Đáp\s*án\s*:[\s\S]*$/i, "").trim();
    return text;
}