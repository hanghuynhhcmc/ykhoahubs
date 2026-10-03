/* =====================================
   TOAST - POPUP NHẮC NHỞ + BORDER TEXT RUN
===================================== */

const TAP_HINT_KEY = "tap_hint_shown";
const TAP_HINT_DURATION = 300;

const BORDER_TEXT_INTERVAL = 30000;   // 30 giây giữa 2 lần chạy
const BORDER_TEXT_DURATION = 8000;    // 8 giây cho 1 vòng chữ
const BORDER_TEXT = "DOUBLE CLICK ĐỂ HIỆN ĐÁP ÁN  •  ";

let borderTextTimer = null;
let borderTextAnimId = null;


/* =====================================
   RESET TOAST STATE (giữ để tương thích)
===================================== */

export function resetToastState() {
    return;
}

export function startToastCountdown() {
    return;
}

export function cancelToastCountdown() {
    return;
}


/* =====================================
   TAP HINT - NHẮC NHỞ KHI MỞ APP (1 LẦN DUY NHẤT)
===================================== */

export function showTapHintOnce() {
    if (localStorage.getItem(TAP_HINT_KEY)) return;
    if (document.getElementById("tapHintOverlay")) return;

    const hint = document.createElement("div");
    hint.id = "tapHintOverlay";
    hint.className = "tap-hint-overlay";
    hint.innerHTML = `
        <div class="tap-hint-card">
            <div class="tap-hint-icon">👆</div>
            <div class="tap-hint-title">MẸO HỌC NHANH</div>
            <div class="tap-hint-list">
                <div class="tap-hint-item">
                    <span class="tap-hint-symbol">←</span>
                    <span>Nhấp <b>bên trái</b> màn hình: <b>Câu trước</b></span>
                </div>
                <div class="tap-hint-item">
                    <span class="tap-hint-symbol">→</span>
                    <span>Nhấp <b>bên phải</b> màn hình: <b>Câu tiếp theo</b></span>
                </div>
                <div class="tap-hint-item">
                    <span class="tap-hint-symbol">👆👆</span>
                    <span>Nhấp <b>2 lần</b> vào ô câu hỏi: <b>Hiện / Ẩn đáp án</b></span>
                </div>
            </div>
            <button type="button" class="tap-hint-btn" id="tapHintClose">
                ĐÃ HIỂU
            </button>
        </div>
    `;

    document.body.appendChild(hint);

    requestAnimationFrame(() => {
        hint.classList.add("show");
    });

    const closeBtn = hint.querySelector("#tapHintClose");

    const close = () => {
        hint.classList.remove("show");
        hint.classList.add("hide");
        localStorage.setItem(TAP_HINT_KEY, "1");
        setTimeout(() => {
            if (hint.parentNode) hint.parentNode.removeChild(hint);
        }, TAP_HINT_DURATION);
    };

    closeBtn.addEventListener("click", close);

    hint.addEventListener("click", (e) => {
        if (e.target === hint) close();
    });
}


/* =====================================
   BORDER TEXT RUN — CHỮ NHỎ CHẠY QUANH VIỀN
   Chạy 1 vòng 8s, lặp lại mỗi 30s
===================================== */

export function startBorderRunLoop() {
    stopBorderRunLoop();

    // Chạy lần đầu sau 3 giây
    setTimeout(() => {
        runBorderTextOnce();

        // Sau đó lặp lại mỗi 30 giây
        borderTextTimer = setInterval(() => {
            runBorderTextOnce();
        }, BORDER_TEXT_INTERVAL);
    }, 3000);
}

export function stopBorderRunLoop() {
    if (borderTextTimer) {
        clearInterval(borderTextTimer);
        borderTextTimer = null;
    }
    if (borderTextAnimId) {
        cancelAnimationFrame(borderTextAnimId);
        borderTextAnimId = null;
    }

    const card = document.querySelector(".interactive-card");
    if (card) {
        const svg = card.querySelector(".border-text-svg");
        if (svg) svg.remove();
    }
}

function runBorderTextOnce() {
    const card = document.querySelector(".interactive-card");
    if (!card) return;

    // Xóa SVG cũ nếu còn sót
    const oldSvg = card.querySelector(".border-text-svg");
    if (oldSvg) oldSvg.remove();

    // Tạo SVG
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("class", "border-text-svg");
    svg.setAttribute("viewBox", "0 0 100 100");
    svg.setAttribute("preserveAspectRatio", "none");

    const pathId = "borderTextPath_" + Date.now();

    const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
    path.setAttribute("id", pathId);
    path.setAttribute("fill", "none");
    // Path hình chữ nhật bo góc, đi theo chiều kim đồng hồ
    path.setAttribute("d", "M 2,8 Q 2,2 8,2 L 92,2 Q 98,2 98,8 L 98,92 Q 98,98 92,98 L 8,98 Q 2,98 2,92 Z");

    const text = document.createElementNS("http://www.w3.org/2000/svg", "text");
    const textPath = document.createElementNS("http://www.w3.org/2000/svg", "textPath");
    textPath.setAttribute("href", "#" + pathId);
    textPath.setAttribute("startOffset", "0%");
    textPath.textContent = BORDER_TEXT.repeat(10);

    text.appendChild(textPath);
    svg.appendChild(path);
    svg.appendChild(text);
    card.appendChild(svg);

    // Hiện SVG
    requestAnimationFrame(() => {
        svg.classList.add("show");
    });

    // Animate startOffset
    const startTime = performance.now();

    function animate(now) {
        const elapsed = now - startTime;
        const progress = Math.min(elapsed / BORDER_TEXT_DURATION, 1);

        // Chữ chạy từ 0% đến -100% (ngược chiều path)
        const offset = -progress * 100;
        textPath.setAttribute("startOffset", offset + "%");

        if (progress < 1) {
            borderTextAnimId = requestAnimationFrame(animate);
        } else {
            borderTextAnimId = null;
            // Chạy xong → mờ dần và xóa
            svg.classList.remove("show");
            setTimeout(() => {
                if (svg.parentNode) svg.parentNode.removeChild(svg);
            }, 500);
        }
    }

    borderTextAnimId = requestAnimationFrame(animate);
}