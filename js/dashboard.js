/* =====================================
   DASHBOARD - TRANG CHỦ
===================================== */

import { DASHBOARD_KEY } from './config.js';
import { state } from './state.js';
import { escapeHTML } from './helpers.js';
import { getSubjects, getSubjectStatsFull } from './questions.js';
import { signOut } from './auth.js';


/* =====================================
   DASHBOARD SUBJECTS
===================================== */

export function getDashboardSubjects() {
    const subjects = getSubjects();
    let saved = [];

    try {
        saved = JSON.parse(localStorage.getItem(DASHBOARD_KEY)) || [];
    } catch { saved = []; }

    saved = saved.filter(s => subjects.includes(s));

    if (saved.length === 0 && subjects.length > 0) {
        saved = subjects.slice(0, 4);
        saveDashboardSubjects(saved);
    }

    return saved.slice(0, 4);
}

export function saveDashboardSubjects(subjects) {
    localStorage.setItem(DASHBOARD_KEY, JSON.stringify(subjects.slice(0, 4)));
}

export function removeDashboardSubject(subject, event) {
    if (event) event.stopPropagation();
    let dashboard = getDashboardSubjects();
    dashboard = dashboard.filter(item => item !== subject);
    saveDashboardSubjects(dashboard);
    showMenu();
}

export function addDashboardSubject(subject) {
    if (!subject) return;
    let dashboard = getDashboardSubjects();
    if (dashboard.includes(subject)) {
        alert("Môn này đã có trong Dashboard.");
        return;
    }
    if (dashboard.length >= 4) {
        alert("Dashboard chỉ hiển thị tối đa 4 môn.");
        return;
    }
    dashboard.push(subject);
    saveDashboardSubjects(dashboard);
    showMenu();
}


/* =====================================
   ĐĂNG XUẤT
===================================== */

async function handleLogout() {
    await signOut();
    state.currentUser = null;

    // Hiện màn hình đăng nhập
    const { showLoginScreen } = await import('./login-screen.js');
    showLoginScreen();
}


/* =====================================
   TÍNH % HOÀN THÀNH
===================================== */

function calcProgress(stats) {
    if (!stats || stats.total === 0) return 0;
    return Math.round((stats.mastered / stats.total) * 100);
}


/* =====================================
   RENDER CARD MÔN HỌC
===================================== */

function renderSubjectCard(subject) {
    const stats = getSubjectStatsFull(subject);
    const percent = calcProgress(stats);

    return `
        <div class="subject-progress" data-subject="${escapeHTML(subject)}">
            <button class="dashboard-remove" data-remove="${escapeHTML(subject)}" aria-label="Xóa">×</button>

            <div class="subject-name">${escapeHTML(subject)}</div>

            <div class="subject-progress-bar">
                <div class="subject-progress-fill"
                     style="width: ${percent}%"></div>
            </div>

            <div class="subject-percent">${percent}% đã thuộc</div>

            <div class="progress-stats">
                <div class="stat-item">
                    <span class="stat-icon">🏆</span>
                    <span class="stat-value">${stats.mastered}</span>
                </div>
                <div class="stat-item">
                    <span class="stat-icon">📌</span>
                    <span class="stat-value">${stats.review}</span>
                </div>
                <div class="stat-item">
                    <span class="stat-icon">🔒</span>
                    <span class="stat-value">${stats.locked}</span>
                </div>
            </div>
        </div>
    `;
}


/* =====================================
   TRANG CHỦ
===================================== */

export function showMenu() {
    state.returnToSearch = false;
    state.answeredState = {};

    const subjects = getSubjects();
    const dashboardSubjects = getDashboardSubjects();
    const availableSubjects = subjects.filter(s => !dashboardSubjects.includes(s));

    let dashboardHTML = "";

    for (let i = 0; i < 4; i++) {
        const subject = dashboardSubjects[i];

        if (subject) {
            dashboardHTML += renderSubjectCard(subject);
        } else {
            let options = `<option value="">+ THÊM MÔN HỌC</option>`;
            availableSubjects.forEach(item => {
                options += `<option value="${escapeHTML(item)}">${escapeHTML(item)}</option>`;
            });
            dashboardHTML += `
                <div class="dashboard-empty">
                    <div class="empty-icon">+</div>
                    <select class="dashboard-add-select">
                        ${options}
                    </select>
                </div>
            `;
        }
    }

    const app = document.getElementById("app");
    if (!app) return;

    let userBarHTML = "";
    if (state.isGuest) {
        userBarHTML = `
            <div class="user-bar guest">
                <div class="user-info">
                    <div class="user-avatar">?</div>
                    <div>
                        <div class="user-name">Khách</div>
                        <div class="user-note">Tiến độ không được lưu</div>
                    </div>
                </div>
                <button class="user-login-btn" data-action="logout">ĐĂNG NHẬP</button>
            </div>
        `;
    } else if (state.currentUser) {
        const email = state.currentUser.email || "";
        const goi = state.currentUser.goi || 'trial';
        const daysLeft = state.currentUser.daysLeft || 0;
        const initial = email.charAt(0).toUpperCase();

        userBarHTML = `
            <div class="user-bar">
                <div class="user-info">
                    <div class="user-avatar">${escapeHTML(initial)}</div>
                    <div>
                        <div class="user-name">${escapeHTML(email)}</div>
                        <div class="user-note">Gói: ${escapeHTML(goi)} • Còn ${daysLeft} ngày</div>
                    </div>
                </div>
                <button class="user-login-btn" data-action="logout">ĐĂNG XUẤT</button>
            </div>
        `;
    }

    app.innerHTML = `
        ${userBarHTML}

        <div class="section-heading">MÔN HỌC</div>
        <div class="dashboard-grid">${dashboardHTML}</div>

        <div class="search-home-section">
            <button class="menu-button search-home-button" data-action="show-search">
                🔎 TÌM KIẾM
            </button>
        </div>
    `;

    const logoutBtn = app.querySelector('[data-action="logout"]');
    if (logoutBtn) logoutBtn.addEventListener("click", handleLogout);

    app.querySelector('[data-action="show-search"]')
        .addEventListener("click", () => {
            import('./search.js').then(({ showSearch }) => showSearch());
        });

    app.querySelectorAll('.subject-progress').forEach(el => {
        el.addEventListener("click", (e) => {
            if (e.target.classList.contains("dashboard-remove")) return;
            const subject = el.dataset.subject;
            import('./study.js').then(({ startDashboardQuiz }) => {
                startDashboardQuiz(subject);
            });
        });
    });

    app.querySelectorAll('.dashboard-remove').forEach(btn => {
        btn.addEventListener("click", (e) => {
            e.stopPropagation();
            removeDashboardSubject(btn.dataset.remove, e);
        });
    });

    app.querySelectorAll('.dashboard-add-select').forEach(sel => {
        sel.addEventListener("change", () => {
            if (sel.value) {
                addDashboardSubject(sel.value);
                sel.value = "";
            }
        });
    });
}