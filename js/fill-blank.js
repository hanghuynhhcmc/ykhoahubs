/* =====================================
   FILL_BLANK - ĐIỀN KHUYẾT
===================================== */

import { state } from './state.js';
import { escapeHTML, formatText, normalizeAnswer, getFillBlankAnswers } from './helpers.js';
import { markAsNotLearned, isLearned } from './questions.js';
import { createStudyHeader, attachHeaderEvents } from './study.js';
import {
    startToastCountdown,
    cancelToastCountdown,
    resetToastState,
} from './toast.js';
import {
    startTimer,
    stopTimer,
    resumeTimer,
    hideTimerWidget,
    getRemainingTime,
    getTotalDuration,
    calculateDuration,
} from './timer.js';


/* =====================================
   RENDER MÀN HÌNH FILL BLANK
===================================== */

export function renderFillBlank(q, qState) {
    const app = document.getElementById("app");
    if (!app) return;

    resetToastState();

    const correctAnswers = getFillBlankAnswers(q.answer);
    const parts = splitFillBlankQuestion(q.question);

    if (!qState.userAnswers || qState.userAnswers.length !== correctAnswers.length) {
        qState.userAnswers = new Array(correctAnswers.length).fill("");
    }

    const answerHTML = buildFillBlankAnswerHTML(
        parts.answerTemplate,
        qState.userAnswers,
        qState.checked,
        qState.results
    );

    const dapAnHTML = qState.checked
        ? buildFillBlankDapAnHTML(parts.answerTemplate, correctAnswers)
        : "";

    app.innerHTML = `
        ${createStudyHeader(q)}
        <div class="interactive-card">

            <div class="fill-blank-cau-hoi">
                <div class="card-label">CÂU HỎI</div>
                <div class="fill-blank-cau-hoi-text">${parts.questionPart}</div>
            </div>

            <div class="fill-blank-tra-loi">
                <div class="card-label">TRẢ LỜI</div>
                <div class="fill-blank-tra-loi-text" id="fillBlankAnswerArea">
                    ${answerHTML}
                </div>
            </div>

            <div id="fillDapAn">${dapAnHTML}</div>
            <div id="fillGiaiThich"></div>
            <div id="autoNotLearned"></div>
        </div>
        <div class="tap-zone tap-zone-left" data-tap="prev" aria-label="Câu trước">
            <span class="tap-zone-arrow">←</span>
        </div>
        <div class="tap-zone tap-zone-right" data-tap="next" aria-label="Câu tiếp theo">
            <span class="tap-zone-arrow">→</span>
        </div>
    `;

    attachHeaderEvents();
    attachFillBlankInputs(q, qState);
    attachTapZones();

    // ===== XỬ LÝ TIMER =====
    if (qState.checked) {
        stopTimer();
        hideTimerWidget();
    } else if (qState.savedTimeLeft !== undefined && qState.savedTotalDuration !== undefined) {
        // Có thời gian đã lưu → tiếp tục
        resumeTimer(qState.savedTimeLeft, qState.savedTotalDuration, () => {
            autoRevealFillBlank();
        });
    } else {
        // Câu mới → đếm từ đầu (25s cố định)
        const duration = calculateDuration(q.question, "FILL_BLANK");
        startTimer(duration, () => {
            autoRevealFillBlank();
        });
    }

    if (qState.checked) {
        renderFillBlankExplanation(q, qState);
        lockFillBlankInputs();
    } else {
        maybeStartToastCountdown(q);
    }
}


/* =====================================
   GẮN SỰ KIỆN
===================================== */

function attachTapZones() {
    document.querySelectorAll(".tap-zone").forEach(zone => {
        zone.addEventListener("click", (e) => {
            e.stopPropagation();
            const direction = zone.dataset.tap;
            if (direction === "next") {
                import('./study.js').then(({ nextQuestion }) => nextQuestion());
            } else if (direction === "prev") {
                import('./study.js').then(({ prevQuestion }) => prevQuestion());
            }
        });
    });

    const card = document.querySelector(".interactive-card");
    if (card) {
        card.addEventListener("dblclick", (e) => {
            if (e.target.tagName === "INPUT") return;
            e.stopPropagation();
            toggleFillBlankReveal();
        });
    }
}


/* =====================================
   TOGGLE ĐÁP ÁN (DOUBLE CLICK)
===================================== */

export function toggleFillBlankReveal() {
    const qState = state.answeredState[state.currentQuestion];
    if (!qState) return;

    if (qState.checked) {
        hideFillBlankAnswer();
    } else {
        autoRevealFillBlank();
    }
}


/* =====================================
   ẨN ĐÁP ÁN — TIẾP TỤC ĐẾM NGƯỢC
===================================== */

export function hideFillBlankAnswer() {
    const q = state.selectedQuestions[state.currentQuestion];
    const qState = state.answeredState[state.currentQuestion];
    if (!q || !qState) return;

    // Reset trạng thái trả lời
    qState.checked = false;
    qState.userAnswers = [];
    qState.results = [];

    // savedTimeLeft đã lưu → render lại sẽ resumeTimer

    renderFillBlank(q, qState);

    const card = document.querySelector(".interactive-card");
    if (card) {
        card.scrollIntoView({ behavior: "smooth", block: "start" });
    }
}


/* =====================================
   ĐẾM NGƯỢC HIỆN TOAST
===================================== */

function maybeStartToastCountdown(q) {
    if (!q || q.id === null || q.id === undefined) return;
    if (isLearned(q.id)) return;

    startToastCountdown();
}


/* =====================================
   TÁCH CÂU HỎI THÀNH 2 PHẦN
===================================== */

export function splitFillBlankQuestion(question) {
    const text = String(question ?? "");

    const dapAnRegex = /Đáp\s*án\s*:/i;
    const match = text.match(dapAnRegex);

    if (!match) {
        return {
            questionPart: formatText(text.trim()),
            answerTemplate: "",
        };
    }

    const dapAnIdx = match.index;
    const afterDapAn = dapAnIdx + match[0].length;

    let questionPartRaw = text.slice(0, dapAnIdx).trim();
    let answerTemplate = text.slice(afterDapAn).trim();

    if (!questionPartRaw) {
        questionPartRaw = "Điền vào chỗ trống:";
    }

    return {
        questionPart: formatText(questionPartRaw),
        answerTemplate: answerTemplate,
    };
}


/* =====================================
   BUILD HTML - PHẦN TRẢ LỜI (INPUT)
===================================== */

export function buildFillBlankAnswerHTML(template, userAnswers, checked, results) {
    if (!template) return "";

    const container = document.createElement("div");
    const regex = /\{\{(\d+)\}\}/g;
    let lastIndex = 0;
    let match;

    while ((match = regex.exec(template)) !== null) {
        const textBefore = template.slice(lastIndex, match.index);
        if (textBefore) {
            container.appendChild(document.createTextNode(textBefore));
        }

        const idx = parseInt(match[1], 10) - 1;
        const val = userAnswers[idx] || "";

        let inputCls = "fill-blank-inline-input";
        let isCorrect = false;

        if (checked) {
            isCorrect = results && results[idx];
            inputCls += isCorrect ? " correct-input" : " wrong-input";
        }

        const wrapper = document.createElement("span");
        wrapper.className = "fill-blank-inline";
        wrapper.dataset.index = String(idx);

        const input = document.createElement("input");
        input.type = "text";
        input.className = inputCls;
        input.dataset.index = String(idx);
        input.value = val;
        input.setAttribute("autocomplete", "off");
        input.setAttribute("autocorrect", "off");
        input.setAttribute("spellcheck", "false");
        if (checked) input.disabled = true;

        wrapper.appendChild(input);

        if (checked) {
            const status = document.createElement("span");
            status.className = isCorrect
                ? "fill-blank-inline-status fill-status-correct"
                : "fill-blank-inline-status fill-status-wrong";
            status.textContent = isCorrect ? "✓" : "✗";
            wrapper.appendChild(status);
        }

        container.appendChild(wrapper);

        lastIndex = match.index + match[0].length;
    }

    const textAfter = template.slice(lastIndex);
    if (textAfter) {
        container.appendChild(document.createTextNode(textAfter));
    }

    let html = container.innerHTML;
    html = html.replace(/\n/g, "<br>");

    return html;
}


/* =====================================
   BUILD HTML - PHẦN ĐÁP ÁN
===================================== */

export function buildFillBlankDapAnHTML(template, correctAnswers) {
    if (!template) return "";

    const regex = /\{\{(\d+)\}\}/g;
    let html = "";
    let lastIndex = 0;
    let match;

    while ((match = regex.exec(template)) !== null) {
        html += escapeHTML(template.slice(lastIndex, match.index));
        const idx = parseInt(match[1], 10) - 1;
        const val = correctAnswers[idx] || "";
        html += `<span class="answer-highlight">${escapeHTML(val)}</span>`;
        lastIndex = match.index + match[0].length;
    }

    html += escapeHTML(template.slice(lastIndex));
    html = html.replace(/\n/g, "<br>");

    return `
        <div class="fill-dap-an">
            <div class="explanation-title">ĐÁP ÁN</div>
            <div>${html}</div>
        </div>
    `;
}


/* =====================================
   GẮN SỰ KIỆN CHO INPUT
===================================== */

export function attachFillBlankInputs(q, qState) {
    const inputs = document.querySelectorAll(".fill-blank-inline-input");
    if (!inputs.length) return;

    inputs.forEach(input => {
        autoSizeInput(input);

        input.addEventListener("input", (e) => {
            cancelToastCountdown();
            autoSizeInput(e.target);

            const idx = Number(e.target.dataset.index);
            qState.userAnswers[idx] = e.target.value;
        });

        input.addEventListener("keydown", (e) => {
            if (e.key === "Enter") {
                e.preventDefault();
                if (!qState.checked && hasAnyInput(qState.userAnswers)) {
                    cancelToastCountdown();
                    checkFillBlankAnswer();
                }
            }
        });

        input.addEventListener("blur", () => {
            if (qState.checked) return;

            const allFilled = qState.userAnswers.every(
                v => String(v || "").trim() !== ""
            );

            if (allFilled) {
                cancelToastCountdown();
                setTimeout(() => {
                    if (!qState.checked) checkFillBlankAnswer();
                }, 200);
            }
        });
    });
}


/* =====================================
   TỰ ĐỘNG GIÃN INPUT
===================================== */

export function autoSizeInput(input) {
    if (!input) return;

    if (window.CSS && CSS.supports && CSS.supports("field-sizing", "content")) {
        return;
    }

    const span = document.createElement("span");
    const style = window.getComputedStyle(input);

    span.style.position = "absolute";
    span.style.visibility = "hidden";
    span.style.whiteSpace = "pre";
    span.style.fontFamily = style.fontFamily;
    span.style.fontSize = style.fontSize;
    span.style.fontWeight = style.fontWeight;
    span.style.letterSpacing = style.letterSpacing;
    span.style.padding = "0";
    span.style.border = "0";

    span.textContent = input.value || " ";

    document.body.appendChild(span);
    const textWidth = span.offsetWidth;
    document.body.removeChild(span);

    const width = Math.min(Math.max(textWidth + 30, 80), 500);
    input.style.width = width + "px";
}


/* =====================================
   HELPERS
===================================== */

export function hasAnyInput(arr) {
    if (!arr || !arr.length) return false;
    return arr.some(v => String(v || "").trim() !== "");
}

export function lockFillBlankInputs() {
    document.querySelectorAll(".fill-blank-inline-input").forEach(inp => {
        inp.disabled = true;
    });
}


/* =====================================
   LƯU THỜI GIAN HIỆN TẠI VÀO qState
===================================== */

function saveCurrentTime(qState) {
    if (qState.savedTimeLeft === undefined) {
        qState.savedTimeLeft = getRemainingTime();
        qState.savedTotalDuration = getTotalDuration();
    }
}


/* =====================================
   TỰ ĐỘNG ĐIỀN ĐÁP ÁN ĐÚNG
===================================== */

export function autoRevealFillBlank() {
    const q = state.selectedQuestions[state.currentQuestion];
    const qState = state.answeredState[state.currentQuestion];
    if (!q || !qState) return;

    cancelToastCountdown();

    saveCurrentTime(qState);
    stopTimer();

    const correctAnswers = getFillBlankAnswers(q.answer);

    qState.userAnswers = correctAnswers.slice();

    document.querySelectorAll(".fill-blank-inline-input").forEach(inp => {
        const idx = Number(inp.dataset.index);
        inp.value = qState.userAnswers[idx] || "";
        autoSizeInput(inp);
    });

    checkFillBlankAnswer();
}


/* =====================================
   KIỂM TRA ĐÁP ÁN
===================================== */

export function checkFillBlankAnswer() {
    const q = state.selectedQuestions[state.currentQuestion];
    const qState = state.answeredState[state.currentQuestion];
    if (!q || !qState || qState.checked) return;

    saveCurrentTime(qState);
    stopTimer();

    const correctAnswers = getFillBlankAnswers(q.answer);
    const inputs = document.querySelectorAll(".fill-blank-inline-input");

    inputs.forEach(inp => {
        const idx = Number(inp.dataset.index);
        qState.userAnswers[idx] = inp.value;
    });

    qState.results = correctAnswers.map((ans, i) => {
        const user = qState.userAnswers[i] || "";
        return normalizeAnswer(user) === normalizeAnswer(ans);
    });

    qState.checked = true;

    if (qState.results.some(r => !r)) {
        if (!qState.markedNotLearned) {
            markAsNotLearned(q.id);
            qState.markedNotLearned = true;
        }
    }

    inputs.forEach(inp => {
        const idx = Number(inp.dataset.index);
        inp.disabled = true;
        inp.classList.remove("correct-input", "wrong-input");
        inp.classList.add(qState.results[idx] ? "correct-input" : "wrong-input");

        const wrapper = inp.closest(".fill-blank-inline");
        if (wrapper) {
            const oldStatus = wrapper.querySelector(".fill-blank-inline-status");
            if (oldStatus) oldStatus.remove();

            const status = document.createElement("span");
            status.className = qState.results[idx]
                ? "fill-blank-inline-status fill-status-correct"
                : "fill-blank-inline-status fill-status-wrong";
            status.textContent = qState.results[idx] ? "✓" : "✗";
            wrapper.appendChild(status);
        }
    });

    const parts = splitFillBlankQuestion(q.question);
    const dapAnBox = document.getElementById("fillDapAn");
    if (dapAnBox) {
        dapAnBox.innerHTML = buildFillBlankDapAnHTML(parts.answerTemplate, correctAnswers);
    }

    renderFillBlankExplanation(q, qState);
}


/* =====================================
   RENDER GIẢI THÍCH
===================================== */

export function renderFillBlankExplanation(q, qState) {
    const expBox = document.getElementById("fillGiaiThich");
    const noteBox = document.getElementById("autoNotLearned");

    if (expBox) {
        expBox.innerHTML = `
            <div class="explanation-section fill-giai-thich">
                <div class="explanation-title">GIẢI THÍCH</div>
                <div class="feedback-explanation">
                    ${q.explanation ? formatText(q.explanation) : "Không có giải thích cho câu này."}
                </div>
            </div>
        `;
    }

    if (noteBox) {
        const hasWrong = qState.results && qState.results.some(r => !r);
        if (hasWrong && qState.markedNotLearned) {
            noteBox.innerHTML = `
                <div class="auto-not-learned-note">
                    📌 Câu này đã được thêm vào danh sách Chưa thuộc
                </div>
            `;
        } else {
            noteBox.innerHTML = "";
        }
    }
}