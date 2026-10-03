/* =====================================
   LOGIN SCREEN - SUPABASE
===================================== */

import { signIn } from './auth.js';
import { loadQuestions } from './questions.js';

export function showLoginScreen() {
    const app = document.getElementById('app');

    app.innerHTML = `
        <div class="login-screen">
            <div class="login-card">
                <div class="login-logo">🩺</div>
                <h1>Y KHOA HUB</h1>
                <p class="login-subtitle">Đăng nhập để tiếp tục học</p>

                <form class="login-form" id="loginForm">
                    <input type="email" id="email" placeholder="Email" autocomplete="email" required>
                    <input type="password" id="password" placeholder="Mật khẩu" autocomplete="current-password" required>
                    <button type="submit" class="login-btn primary" id="loginBtn">ĐĂNG NHẬP</button>
                </form>

                <div class="login-message" id="loginMessage"></div>

                <div class="login-switch">
                    Chưa có tài khoản? 
                    <a href="mailto:admin@ykhoahub.com">Liên hệ để được cấp</a>
                </div>
            </div>
        </div>
    `;

    const form = document.getElementById('loginForm');
    form.addEventListener('submit', handleLogin);
}

async function handleLogin(e) {
    e.preventDefault();

    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value;
    const messageEl = document.getElementById('loginMessage');
    const btn = document.getElementById('loginBtn');

    if (!email || !password) {
        messageEl.className = 'login-message error';
        messageEl.textContent = 'Vui lòng nhập đầy đủ thông tin';
        return;
    }

    btn.disabled = true;
    btn.textContent = 'Đang đăng nhập...';
    messageEl.textContent = '';
    messageEl.className = 'login-message';

    const result = await signIn(email, password);

    if (!result.ok) {
        messageEl.className = 'login-message error';
        messageEl.textContent = result.message || 'Đăng nhập thất bại';
        btn.disabled = false;
        btn.textContent = 'ĐĂNG NHẬP';
        return;
    }

    messageEl.className = 'login-message success';
    messageEl.textContent = 'Đăng nhập thành công! Đang tải...';

    try {
        await loadQuestions();
    } catch (err) {
        messageEl.className = 'login-message error';
        messageEl.textContent = 'Lỗi tải dữ liệu: ' + err.message;
        btn.disabled = false;
        btn.textContent = 'ĐĂNG NHẬP';
    }
}