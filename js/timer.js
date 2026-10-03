/* =====================================
   TIMER - ĐỒNG HỒ ĐẾM NGƯỢC HÌNH QUẢ BOM
===================================== */

const WARNING_THRESHOLD = 8;        // Cảnh báo đỏ khi còn ≤ 8s
const EXPLOSION_DELAY = 300;        // Đợi 300ms sau khi nổ mới gọi callback
const TICK_INTERVAL = 1000;         // 1 giây / tick

// Thời gian cố định cho fill-blank
const FILL_BLANK_DURATION = 25;

let countdownInterval = null;
let timeLeft = 0;
let totalDuration = 0;
let isRunning = false;
let onTimeUpCallback = null;


/* =====================================
   ĐẾM SỐ TỪ TRONG CÂU
===================================== */

function countWords(text) {
    const str = String(text || "").trim();
    if (!str) return 0;
    return str.split(/\s+/).filter(w => w.length > 0).length;
}


/* =====================================
   TÍNH THỜI GIAN THEO ĐỘ DÀI CÂU HỎI
===================================== */

export function calculateDuration(question, type = "MCQ", choicesText = "") {
    if (type === "MCQ") {
        // MCQ: 4s + 0.6s/từ câu hỏi + 0.4s/từ đáp án
        // Min 8s, Max 20s
        const questionWords = countWords(question);
        const choiceWords = countWords(choicesText);
        const duration = 4 + questionWords * 0.6 + choiceWords * 0.4;
        return Math.round(Math.max(8, Math.min(20, duration)));
    }

    // FILL_BLANK: cố định 25s
    return FILL_BLANK_DURATION;
}


/* =====================================
   INTERNAL: CHẠY INTERVAL ĐẾM NGƯỢC
===================================== */

function runInterval() {
    countdownInterval = setInterval(() => {
        timeLeft--;
        updateBombDisplay();

        if (timeLeft <= 0) {
            const callback = onTimeUpCallback;

            if (countdownInterval) {
                clearInterval(countdownInterval);
                countdownInterval = null;
            }
            isRunning = false;
            onTimeUpCallback = null;

            triggerExplosion();

            if (typeof callback === 'function') {
                setTimeout(() => {
                    try {
                        callback();
                    } catch (err) {
                        console.error("Timer callback error:", err);
                    }
                }, EXPLOSION_DELAY);
            }
        }
    }, TICK_INTERVAL);
}


/* =====================================
   BẮT ĐẦU ĐẾM NGƯỢC (từ đầu)
===================================== */

export function startTimer(duration, onTimeUp = null) {
    stopTimer();

    timeLeft = duration;
    totalDuration = duration;
    isRunning = true;
    onTimeUpCallback = onTimeUp;

    renderBombWidget();
    updateBombDisplay();

    runInterval();
}


/* =====================================
   TIẾP TỤC ĐẾM NGƯỢC (từ giây đã lưu)
===================================== */

export function resumeTimer(savedTimeLeft, savedTotalDuration, onTimeUp = null) {
    // Reset interval cũ
    if (countdownInterval) {
        clearInterval(countdownInterval);
        countdownInterval = null;
    }

    timeLeft = savedTimeLeft;
    totalDuration = savedTotalDuration;
    isRunning = true;
    onTimeUpCallback = onTimeUp;

    renderBombWidget();
    updateBombDisplay();

    runInterval();
}


/* =====================================
   DỪNG ĐẾM NGƯỢC
===================================== */

export function stopTimer() {
    if (countdownInterval) {
        clearInterval(countdownInterval);
        countdownInterval = null;
    }
    isRunning = false;
    onTimeUpCallback = null;
}


/* =====================================
   ẨN WIDGET
===================================== */

export function hideTimerWidget() {
    const widget = document.getElementById("timerWidget");
    if (widget) widget.remove();
}


/* =====================================
   RENDER BOM WIDGET
===================================== */

function renderBombWidget() {
    const oldWidget = document.getElementById("timerWidget");
    if (oldWidget) oldWidget.remove();

    const header = document.querySelector(".study-header");
    if (!header) return;

    const widget = document.createElement("div");
    widget.id = "timerWidget";
    widget.className = "bomb-widget";
    widget.innerHTML = `
        <div class="bomb-graphic">
            <div class="bomb-fuse">
                <div class="bomb-spark"></div>
            </div>
            <div class="bomb-body">
                <div class="bomb-shine"></div>
            </div>
            <div class="bomb-cap"></div>
        </div>
        <div class="bomb-time">--</div>
    `;

    header.appendChild(widget);
}


/* =====================================
   CẬP NHẬT HIỂN THỊ
===================================== */

function updateBombDisplay() {
    const widget = document.getElementById("timerWidget");
    if (!widget) return;

    const timeEl = widget.querySelector(".bomb-time");
    if (!timeEl) return;

    timeEl.textContent = timeLeft;

    if (timeLeft <= WARNING_THRESHOLD) {
        widget.classList.add("warning");
    } else {
        widget.classList.remove("warning");
    }
}


/* =====================================
   HIỆU ỨNG NỔ
===================================== */

function triggerExplosion() {
    const widget = document.getElementById("timerWidget");
    if (!widget) return;

    widget.classList.add("explode");

    document.body.classList.add("screen-shake");
    setTimeout(() => {
        document.body.classList.remove("screen-shake");
    }, 400);

    setTimeout(() => {
        if (widget.parentNode) widget.parentNode.removeChild(widget);
    }, 1000);
}


/* =====================================
   HELPERS
===================================== */

export function isTimerRunning() {
    return isRunning;
}

export function getRemainingTime() {
    return timeLeft;
}

export function getTotalDuration() {
    return totalDuration;
}

// Alias
export function getTimeLeft() {
    return timeLeft;
}