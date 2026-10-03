/* =====================================
   Y KHOA HUB - ENTRY POINT
===================================== */

import { checkAuthAndLoad, isLoggedIn } from './js/auth.js';
import { state } from './js/state.js';
import { loadQuestions } from './js/questions.js';
import { showTapHintOnce } from './js/toast.js';
import { showLoginScreen } from './js/login-screen.js';   // ← THÊM


async function init() {
    try {
        // 1. Kiểm tra đăng nhập (Supabase)
        const user = await checkAuthAndLoad();

        // 2. Nếu chưa đăng nhập → hiện màn hình login
        if (!user) {
            showLoginScreen();
            return;
        }

        // 3. Đã đăng nhập → load câu hỏi
        await loadQuestions();

        // 4. Hiện popup nhắc nhở (1 lần)
        showTapHintOnce();

    } catch (err) {
        console.error("Init failed:", err);
        const app = document.getElementById("app");
        if (app) {
            app.innerHTML = `
                <div class="empty-state">
                    <div class="empty-icon">⚠️</div>
                    <h2>Không tải được dữ liệu</h2>
                    <p>${err && err.message ? err.message : "Lỗi không xác định"}</p>
                    <button onclick="location.reload()">THỬ LẠI</button>
                </div>
            `;
        }
    }
}

init();