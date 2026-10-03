/* =====================================
   AUTH - SUPABASE
===================================== */

import { state } from './state.js';
import { supabaseClient } from './config.js';

const USER_KEY = "ykhoahub_user";

/* =====================================
   KIỂM TRA ĐĂNG NHẬP
===================================== */

export async function checkAuthAndLoad() {
    const { data: { session } } = await supabaseClient.auth.getSession();

    if (!session) {
        state.currentUser = null;
        return null;
    }

    const user = session.user;

    // Lấy profile
    const { data: profile, error } = await supabaseClient
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

    if (error || !profile) {
        await supabaseClient.auth.signOut();
        state.currentUser = null;
        return null;
    }

    // Kiểm tra hạn
    const today = new Date();
    const expire = new Date(profile.expire_date);
    if (expire < today) {
        await supabaseClient.auth.signOut();
        state.currentUser = null;
        return null;
    }

    state.currentUser = {
        id: user.id,
        email: user.email,
        goi: profile.goi,
        maxCau: profile.max_cau,
        maxMon: profile.max_mon,
        expireDate: profile.expire_date,
        daysLeft: Math.ceil((expire - today) / 86400000)
    };

    // Lưu tạm vào localStorage để đồng bộ
    try {
        localStorage.setItem(USER_KEY, JSON.stringify(state.currentUser));
    } catch { /* ignore */ }

    return state.currentUser;
}

/* =====================================
   ĐĂNG NHẬP
===================================== */

export async function signIn(email, password) {
    const { data, error } = await supabaseClient.auth.signInWithPassword({
        email,
        password
    });

    if (error) {
        return { ok: false, message: error.message };
    }

    // Kiểm tra profile + hạn
    const user = await checkAuthAndLoad();

    if (!user) {
        return { ok: false, message: 'Tài khoản không hợp lệ hoặc đã hết hạn' };
    }

    return { ok: true, user };
}

/* =====================================
   ĐĂNG XUẤT
===================================== */

export async function signOut() {
    await supabaseClient.auth.signOut();
    state.currentUser = null;
    localStorage.removeItem(USER_KEY);
}

/* =====================================
   HELPERS
===================================== */

export function getCurrentUser() {
    return state.currentUser;
}

export function isLoggedIn() {
    return !!state.currentUser;
}