/* =====================================
   STUDY - MÀN HÌNH HỌC + ĐIỀU HƯỚNG
===================================== */

import { state } from './state.js';
import { escapeHTML, getQuestionType, isValidQuestion } from './helpers.js';
import { markAsLearned } from './questions.js';
import { renderMCQ } from './mcq.js';
import { renderFillBlank } from './fill-blank.js';
import { showMenu } from './dashboard.js';


/* =====================================
   BẮT ĐẦU HỌC
===================================== */

export function startDashboardQuiz(subject) {
    if (!subject) return;
    let list = state.questions.filter(q => q.mon === subject);
    if (list.length === 0) {
        alert("Môn này chưa có câu hỏi.");
        return;
    }
    state.selectedQuestions = createWeightedQuestions(list);
    state.currentQuestion = 0;
    state.returnToSearch = false;
    state.answeredState = {};
    showQuestion();
}

export function createWeightedQuestions(list) {
    let result = [];
    list.forEach(question => {
        const id = question.id;
        const repeatCount = Number(localStorage.getItem("repeat_" + id)) || 0;
        const weight = 1 + repeatCount * 2;
        for (let i = 0; i < weight; i++) result.push(question);
    });
    for (let i = result.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [result[i], result[j]] = [result[j], result[i]];
    }
    return result;
}


/* =====================================
   HIỆN CÂU HỎI
===================================== */

export function showQuestion() {
    const q = state.selectedQuestions[state.currentQuestion];

    if (!q) {
        showResult();
        return;
    }

    if (!isValidQuestion(q)) {
        console.warn("Bỏ qua câu hỏi không hợp lệ:", q && q.id, q && q.dang);
        state.currentQuestion++;
        if (state.currentQuestion >= state.selectedQuestions.length) {
            showResult();
        } else {
            showQuestion();
        }
        return;
    }

    if (!state.answeredState[state.currentQuestion]) {
        state.answeredState[state.currentQuestion] = createEmptyState(q);
    }

    markAsLearned(q.id);

    const type = getQuestionType(q);
    if (type === "MCQ") {
        renderMCQ(q, state.answeredState[state.currentQuestion]);
    } else {
        renderFillBlank(q, state.answeredState[state.currentQuestion]);
    }
}

export function createEmptyState(q) {
    const type = getQuestionType(q);
    if (type === "MCQ") {
        return {
            type: "MCQ",
            checked: false,
            selectedIndex: null,
            isCorrect: false,
            markedNotLearned: false,
        };
    }
    return {
        type: "FILL_BLANK",
        checked: false,
        userAnswers: [],
        results: [],
        markedNotLearned: false,
    };
}


/* =====================================
   HEADER + BOTTOM NAV
===================================== */

export function createStudyHeader(q) {
    return `
        <div class="study-header">
            <button class="back-button" data-action="back">←</button>
            <div class="study-header-info">
                <div class="study-subject">${escapeHTML(q.mon)}</div>
                <div class="study-counter">
                    Câu ${state.currentQuestion + 1} / ${state.selectedQuestions.length}
                </div>
            </div>
        </div>
    `;
}

export function createBottomNav() {
    const isFirst = state.currentQuestion === 0;
    return `
        <div class="bottom-nav-wrapper">
            <div class="bottom-nav">
                <button type="button"
                    class="bottom-nav-button prev"
                    data-action="prev"
                    ${isFirst ? "disabled" : ""}>
                    <span class="nav-icon">←</span>
                    <span class="nav-label">Câu trước</span>
                </button>
                <button type="button"
                    class="bottom-nav-button next"
                    data-action="next">
                    <span class="nav-label">Câu tiếp theo</span>
                    <span class="nav-icon">→</span>
                </button>
            </div>
        </div>
    `;
}

export function attachHeaderEvents() {
    const app = document.getElementById("app");
    if (!app) return;

    const backBtn = app.querySelector('[data-action="back"]');
    if (backBtn) backBtn.addEventListener("click", goBackToMenu);

    const prevBtn = app.querySelector('[data-action="prev"]');
    if (prevBtn) prevBtn.addEventListener("click", prevQuestion);

    const nextBtn = app.querySelector('[data-action="next"]');
    if (nextBtn) nextBtn.addEventListener("click", nextQuestion);
}


/* =====================================
   ĐIỀU HƯỚNG
===================================== */

export function prevQuestion() {
    if (state.currentQuestion <= 0) return;
    state.currentQuestion--;
    showQuestion();
}

export function nextQuestion() {
    state.currentQuestion++;
    if (state.currentQuestion >= state.selectedQuestions.length) {
        showResult();
        return;
    }
    showQuestion();
}

export function goBackToMenu() {
    if (state.returnToSearch) {
        state.returnToSearch = false;
        import('./search.js').then(({ showSearch }) => showSearch(false));
        return;
    }
    showMenu();
}


/* =====================================
   HOÀN THÀNH
===================================== */

export function showResult() {
    const app = document.getElementById("app");
    if (!app) return;

    app.innerHTML = `
        <div class="result-card">
            <div class="result-icon">🎉</div>
            <h2>Hoàn thành!</h2>
            <p>Bạn đã hoàn thành lượt học.</p>
            <button type="button" data-action="back-menu">VỀ TRANG CHỦ</button>
        </div>
    `;

    app.querySelector('[data-action="back-menu"]')
        .addEventListener("click", showMenu);
}