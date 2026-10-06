const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', 'frontend', 'index.html');
let content = fs.readFileSync(filePath, 'utf8');

console.log('Original content length:', content.length);

const SVG_ICONS = {
  'graduation-cap': (s, c) => `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="${c||''}"><path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c3 3 9 3 12 0v-5"/></svg>`,
  'book-open': (s, c) => `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="${c||''}"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>`,
  'video': (s, c) => `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="${c||''}"><path d="m22 8-6 4 6 4V8Z"/><rect width="14" height="12" x="2" y="6" rx="2"/></svg>`,
  'layout-dashboard': (s, c) => `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="${c||''}"><rect width="7" height="9" x="3" y="3" rx="1"/><rect width="7" height="5" x="14" y="3" rx="1"/><rect width="7" height="9" x="14" y="12" rx="1"/><rect width="7" height="5" x="3" y="16" rx="1"/></svg>`,
  'home': (s, c) => `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="${c||''}"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>`,
  'bar-chart-2': (s, c) => `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="${c||''}"><line x1="18" x2="18" y1="20" y2="10"/><line x1="12" x2="12" y1="20" y2="4"/><line x1="6" x2="6" y1="20" y2="14"/></svg>`,
  'clipboard-list': (s, c) => `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="${c||''}"><rect width="8" height="4" x="8" y="2" rx="1" ry="1"/><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><path d="M12 11h4"/><path d="M12 16h4"/><path d="M8 11h.01"/><path d="M8 16h.01"/></svg>`,
  'check-square': (s, c) => `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="${c||''}"><polyline points="9 11 12 14 22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>`,
  'check-circle': (s, c) => `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="${c||''}"><path d="m9 12 2 2 4-4"/><circle cx="12" cy="12" r="10"/></svg>`,
  'bot': (s, c) => `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="${c||''}"><path d="M12 8V4H8"/><rect width="16" height="12" x="4" y="8" rx="2"/><path d="M2 14h2"/><path d="M20 14h2"/><path d="M15 13v2"/><path d="M9 13v2"/></svg>`,
  'calendar': (s, c) => `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="${c||''}"><rect width="18" height="18" x="3" y="4" rx="2" ry="2"/><line x1="16" x2="16" y1="2" y2="6"/><line x1="8" x2="8" y1="2" y2="6"/><line x1="3" x2="21" y1="10" y2="10"/></svg>`,
  'user': (s, c) => `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="${c||''}"><circle cx="12" cy="7" r="4"/><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/></svg>`,
  'users': (s, c) => `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="${c||''}"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>`,
  'user-check': (s, c) => `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="${c||''}"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><polyline points="16 11 18 13 22 9"/></svg>`,
  'newspaper': (s, c) => `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="${c||''}"><path d="M4 22h16a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2v16a2 2 0 0 1-2 2Zm0 0a2 2 0 0 1-2-2v-9c0-1.1.9-2 2-2h2"/><path d="M18 14h-8"/><path d="M15 18h-5"/><path d="M10 6h8v4h-8V6Z"/></svg>`,
  'layers': (s, c) => `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="${c||''}"><polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/></svg>`,
  'upload': (s, c) => `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="${c||''}"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" x2="12" y1="3" y2="15"/></svg>`,
  'log-out': (s, c) => `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="${c||''}"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" x2="21" y1="12" y2="9"/></svg>`,
  'moon': (s, c) => `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="${c||''}"><path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/></svg>`,
  'sun': (s, c) => `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="${c||''}"><circle cx="12" cy="12" r="4"/><path d="M12 2v2"/><path d="M12 20v2"/><path d="m4.93 4.93 1.41 1.41"/><path d="m17.66 17.66 1.41 1.41"/><path d="M2 12h2"/><path d="M20 12h2"/><path d="m6.34 17.66-1.41 1.41"/><path d="m19.07 4.93-1.41 1.41"/></svg>`,
  'edit': (s, c) => `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="${c||''}"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/></svg>`,
  'trash': (s, c) => `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="${c||''}"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/><line x1="10" x2="10" y1="11" y2="17"/><line x1="14" x2="14" y1="11" y2="17"/></svg>`,
  'key': (s, c) => `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="${c||''}"><path d="m21 2-2 2m-1.5 1.5L14 9l-3-3-4 4 1.5 1.5L7 13l-4 4 1 1 2-2 2 2 1-1-2-2 1.5-1.5 2 2 4-4-3-3 3.5-3.5Z"/></svg>`,
  'lock': (s, c) => `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="${c||''}"><rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>`,
  'unlock': (s, c) => `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="${c||''}"><rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 9.9-1"/></svg>`,
  'eye': (s, c) => `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="${c||''}"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>`,
  'eye-off': (s, c) => `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="${c||''}"><path d="M9.88 9.88a3 3 0 1 0 4.24 4.24"/><path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68"/><path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61"/><line x1="2" x2="22" y1="2" y2="22"/></svg>`,
  'check': (s, c) => `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="${c||''}"><polyline points="20 6 9 17 4 12"/></svg>`,
  'x': (s, c) => `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="${c||''}"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>`,
  'alert-circle': (s, c) => `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="${c||''}"><circle cx="12" cy="12" r="10"/><line x1="12" x2="12" y1="8" y2="12"/><line x1="12" x2="12.01" y1="16" y2="16"/></svg>`,
  'refresh': (s, c) => `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="${c||''}"><path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/><path d="M21 3v5h-5"/><path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"/><path d="M8 16H3v5"/></svg>`,
  'plus': (s, c) => `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="${c||''}"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>`,
  'search': (s, c) => `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="${c||''}"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>`,
  'settings': (s, c) => `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="${c||''}"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>`,
  'shield': (s, c) => `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="${c||''}"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>`,
  'play': (s, c) => `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="currentColor" class="${c||''}"><polygon points="5 3 19 12 5 21 5 3"/></svg>`
};

const replacements = [
  // ── Auth Screen ──
  ['<div class="logo-icon">🎓</div>', `<div class="logo-icon">${SVG_ICONS['graduation-cap'](22, '')}</div>`],
  ['<button type="button" class="role-btn active" id="rr_student" onclick="selRole(\'r\',\'student\')"><span>🎒</span>O\'quvchi</button>',
   `<button type="button" class="role-btn active" id="rr_student" onclick="selRole('r','student')">${SVG_ICONS['graduation-cap'](16, '')} <span>O'quvchi</span></button>`],
  ['<button type="button" class="role-btn" id="rr_teacher" onclick="selRole(\'r\',\'teacher\')"><span>👩‍🏫</span>O\'qituvchi</button>',
   `<button type="button" class="role-btn" id="rr_teacher" onclick="selRole('r','teacher')">${SVG_ICONS['book-open'](16, '')} <span>O'qituvchi</span></button>`],

  // ── Sidebar Logo & Avatar ──
  ['<div class="logo-icon" style="width:36px;height:36px;font-size:18px">🎓</div>',
   `<div class="logo-icon" style="width:36px;height:36px">${SVG_ICONS['graduation-cap'](20, '')}</div>`],
  ['<div class="s-avatar" id="sAvatar">🎒</div>',
   `<div class="s-avatar" id="sAvatar"><span class="avatar-initials" id="sInitials">SM</span></div>`],

  // ── Sidebar Navigation Items ──
  [`<div class="nav-item active" id="nav_home"     onclick="navTo('home')"><div class="nav-icon">🏠</div>Bosh sahifa</div>`,
   `<div class="nav-item active" id="nav_home"     onclick="navTo('home')"><div class="nav-icon">${SVG_ICONS['layout-dashboard'](18, '')}</div>Bosh sahifa</div>`],
  [`<div class="nav-item"        id="nav_subjects"  onclick="navTo('subjects')"><div class="nav-icon">📚</div>Darsliklar</div>`,
   `<div class="nav-item"        id="nav_subjects"  onclick="navTo('subjects')"><div class="nav-icon">${SVG_ICONS['book-open'](18, '')}</div>Darsliklar</div>`],
  [`<div class="nav-item"        id="nav_videos"    onclick="navTo('videos')"><div class="nav-icon">🎬</div>Video darslar</div>`,
   `<div class="nav-item"        id="nav_videos"    onclick="navTo('videos')"><div class="nav-icon">${SVG_ICONS['video'](18, '')}</div>Video darslar</div>`],
  [`<div class="nav-item"        id="nav_grades"    onclick="navTo('grades')"><div class="nav-icon">📊</div>Baholar</div>`,
   `<div class="nav-item"        id="nav_grades"    onclick="navTo('grades')"><div class="nav-icon">${SVG_ICONS['bar-chart-2'](18, '')}</div>Baholar</div>`],
  [`<div class="nav-item"        id="nav_tasks"     onclick="navTo('tasks')"><div class="nav-icon">📝</div>Topshiriqlar</div>`,
   `<div class="nav-item"        id="nav_tasks"     onclick="navTo('tasks')"><div class="nav-icon">${SVG_ICONS['clipboard-list'](18, '')}</div>Topshiriqlar</div>`],
  [`<div class="nav-item"        id="nav_quizzes"   onclick="navTo('quizzes')"><div class="nav-icon">✏️</div>Testlar</div>`,
   `<div class="nav-item"        id="nav_quizzes"   onclick="navTo('quizzes')"><div class="nav-icon">${SVG_ICONS['check-square'](18, '')}</div>Testlar</div>`],
  [`<div class="nav-item"        id="nav_ai"        onclick="navTo('ai')"><div class="nav-icon">🤖</div>AI Yordamchi</div>`,
   `<div class="nav-item"        id="nav_ai"        onclick="navTo('ai')"><div class="nav-icon">${SVG_ICONS['bot'](18, '')}</div>AI Yordamchi</div>`],
  [`<div class="nav-item"        id="nav_schedule"  onclick="navTo('schedule')"><div class="nav-icon">📅</div>Dars jadvali</div>`,
   `<div class="nav-item"        id="nav_schedule"  onclick="navTo('schedule')"><div class="nav-icon">${SVG_ICONS['calendar'](18, '')}</div>Dars jadvali</div>`],
  [`<div class="nav-item"        id="nav_profile"   onclick="navTo('profile')"><div class="nav-icon">👤</div>Profil</div>`,
   `<div class="nav-item"        id="nav_profile"   onclick="navTo('profile')"><div class="nav-icon">${SVG_ICONS['user'](18, '')}</div>Profil</div>`],

  [`<div class="nav-item" id="nav_upload"     style="display:none" onclick="navTo('upload')"><div class="nav-icon">⬆️</div>Yuklash</div>`,
   `<div class="nav-item" id="nav_upload"     style="display:none" onclick="navTo('upload')"><div class="nav-icon">${SVG_ICONS['upload'](18, '')}</div>Yuklash</div>`],
  [`<div class="nav-item" id="nav_attendance" style="display:none" onclick="navTo('attendance')"><div class="nav-icon">📋</div>Davomat</div>`,
   `<div class="nav-item" id="nav_attendance" style="display:none" onclick="navTo('attendance')"><div class="nav-icon">${SVG_ICONS['user-check'](18, '')}</div>Davomat</div>`],
  [`<div class="nav-item" id="nav_myclass"                  onclick="navTo('myclass')"><div class="nav-icon">👨‍👩‍👧</div>Mening sinfim</div>`,
   `<div class="nav-item" id="nav_myclass"                  onclick="navTo('myclass')"><div class="nav-icon">${SVG_ICONS['users'](18, '')}</div>Mening sinfim</div>`],

  [`<div class="nav-item" id="nav_users"       style="display:none" onclick="navTo('users')"><div class="nav-icon">👥</div>Foydalanuvchilar</div>`,
   `<div class="nav-item" id="nav_users"       style="display:none" onclick="navTo('users')"><div class="nav-icon">${SVG_ICONS['users'](18, '')}</div>Foydalanuvchilar</div>`],
  [`<div class="nav-item" id="nav_analytics"   style="display:none" onclick="navTo('analytics')"><div class="nav-icon">📊</div>Statistika</div>`,
   `<div class="nav-item" id="nav_analytics"   style="display:none" onclick="navTo('analytics')"><div class="nav-icon">${SVG_ICONS['bar-chart-2'](18, '')}</div>Statistika</div>`],
  [`<div class="nav-item" id="nav_news"        style="display:none" onclick="navTo('news')"><div class="nav-icon">📰</div>Yangiliklar Boshqaruvi</div>`,
   `<div class="nav-item" id="nav_news"        style="display:none" onclick="navTo('news')"><div class="nav-icon">${SVG_ICONS['newspaper'](18, '')}</div>Yangiliklar Boshqaruvi</div>`],
  [`<div class="nav-item" id="nav_assignments" style="display:none" onclick="navTo('assignments')"><div class="nav-icon">🔗</div>Dars biriktirish</div>`,
   `<div class="nav-item" id="nav_assignments" style="display:none" onclick="navTo('assignments')"><div class="nav-icon">${SVG_ICONS['layers'](18, '')}</div>Dars biriktirish</div>`],

  [`<div class="nav-item" onclick="doLogout()" style="color:var(--red)"><div class="nav-icon">🚪</div>Chiqish</div>`,
   `<div class="nav-item" onclick="doLogout()" style="color:var(--red)"><div class="nav-icon">${SVG_ICONS['log-out'](18, '')}</div>Chiqish</div>`],

  // ── Topbar ──
  [`<div class="notif-btn" onclick="toggleTheme()" id="themeBtn2" style="cursor: pointer; user-select: none;" title="Mavzuni o'zgartirish">🌙</div>`,
   `<div class="notif-btn" onclick="toggleTheme()" id="themeBtn2" style="cursor: pointer; user-select: none;" title="Mavzuni o'zgartirish"><span id="themeIconSlot">${SVG_ICONS['moon'](18, '')}</span></div>`],
  [`<div class="top-avatar" id="topAvatar">🎒</div>`,
   `<div class="top-avatar" id="topAvatar"><span class="avatar-initials" id="topInitials">SM</span></div>`],

  // ── News Feed & AI ──
  [`<h2>📢 Maktab yangiliklari va e'lonlar</h2>`, `<h2>Maktab yangiliklari va e'lonlar</h2>`],
  [`<button class="btn btn-ghost" onclick="loadNewsFeed()">🔄 Yangilash</button>`, `<button class="btn btn-ghost" onclick="loadNewsFeed()">Yangilash</button>`],
  [`<h2>🤖 SmartSchool AI Shaxsiy Yordamchi</h2>`, `<h2>SmartSchool AI Shaxsiy Yordamchi</h2>`],
  [`<button class="btn btn-ghost" onclick="clearAiChat()">🗑️ Chatni tozalash</button>`, `<button class="btn btn-ghost" onclick="clearAiChat()">Chatni tozalash</button>`],
  [`<div class="ai-av">🤖</div>`, `<div class="ai-av">${SVG_ICONS['bot'](18, '')}</div>`],
  [`Assalomu alaykum! 🎓 Men SmartSchool platformasining AI Shaxsiy Yordamchisiman.`, `Assalomu alaykum! Men SmartSchool platformasining AI Shaxsiy Yordamchisiman.`],
  [`onclick="sendAI('📋 Mening baholarim va natijalarim qanday?')">📋 Baholarim</button>`, `onclick="sendAI('Mening baholarim va natijalarim qanday?')">Baholarim</button>`],
  [`onclick="sendAI('📚 Bugungi darslar va fanlar haqida ma\\'lumot ber')">📚 Darslarim</button>`, `onclick="sendAI('Bugungi darslar va fanlar haqida ma\\'lumot ber')">Darslarim</button>`],
  [`onclick="sendAI('📝 Menda qanday bajarilmagan topshiriqlar bor?')">📝 Topshiriqlar</button>`, `onclick="sendAI('Menda qanday bajarilmagan topshiriqlar bor?')">Topshiriqlar</button>`],
  [`onclick="sendAI('💡 Siz nimalar qila olasiz?')">💡 Imkoniyatlar</button>`, `onclick="sendAI('Siz nimalar qila olasiz?')">Imkoniyatlar</button>`],
  [`<button class="ai-send" onclick="sendAI()">🚀</button>`, `<button class="ai-send" onclick="sendAI()"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg></button>`],

  // ── Profile ──
  [`<div class="profile-avatar" id="profileAvatar">🎒</div>`, `<div class="profile-avatar" id="profileAvatar"><span class="avatar-initials" id="profileInitials" style="font-size:28px">SM</span></div>`],
  [`<div class="avatar-upload-btn" onclick="document.getElementById('avatarFileInput').click()" title="Avatar o'zgartirish">📷</div>`,
   `<div class="avatar-upload-btn" onclick="document.getElementById('avatarFileInput').click()" title="Avatar o'zgartirish">${SVG_ICONS['edit'](13, '')}</div>`],
  [`<button class="btn btn-primary" onclick="saveProfile()">💾 Saqlash</button>`, `<button class="btn btn-primary" onclick="saveProfile()">Saqlash</button>`],
  [`<button class="btn btn-ghost" onclick="openPassModal()">🔑 Parol o'zgartirish</button>`, `<button class="btn btn-ghost" onclick="openPassModal()">Parol o'zgartirish</button>`],

  // ── Grades ──
  [`<h2>📊 Baholar va Baholash</h2>`, `<h2>Baholar va Baholash</h2>`],
  [`<button class="btn btn-ghost" onclick="loadGrades()">🔄 Yangilash</button>`, `<button class="btn btn-ghost" onclick="loadGrades()">Yangilash</button>`],
  [`👥 Sinf o'quvchilari ro'yxati`, `Sinf o'quvchilari ro'yxati`],

  // ── Tasks & Quizzes Headers & Buttons ──
  [`<h2>📝 Topshiriqlar</h2>`, `<h2>Topshiriqlar</h2>`],
  [`<button id="createTaskBtn" class="btn btn-primary" style="display:none" onclick="openTaskModal()">+ Yangi topshiriq</button>`,
   `<button id="createTaskBtn" class="btn btn-primary" style="display:none" onclick="openTaskModal()">Yangi topshiriq</button>`],
  [`<h2>✏️ Onlayn Testlar</h2>`, `<h2>Onlayn Testlar</h2>`],
  [`<button id="createQuizBtn" class="btn btn-primary" style="display:none" onclick="openQuizModal()">+ Yangi test</button>`,
   `<button id="createQuizBtn" class="btn btn-primary" style="display:none" onclick="openQuizModal()">Yangi test</button>`],
  [`<h2>📝 Yangi topshiriq</h2>`, `<h2>Yangi topshiriq</h2>`],
  [`onclick="submitTask()">✅ Yaratish</button>`, `onclick="submitTask()">Yaratish</button>`],
  [`<h2>📤 Topshiriq topshirish</h2>`, `<h2>Topshiriq topshirish</h2>`],
  [`onclick="doSubmitTask()">✅ Topshirish</button>`, `onclick="doSubmitTask()">Topshirish</button>`],
  [`<h2>✏️ Yangi test yaratish</h2>`, `<h2>Yangi test yaratish</h2>`],
  [`onclick="submitQuizCreate()">✅ Yaratish</button>`, `onclick="submitQuizCreate()">Yaratish</button>`],
  [`<h2>➕ Savol qo'shish</h2>`, `<h2>Savol qo'shish</h2>`],
  [`onclick="submitAddQuestion()">✅ Qo'shish</button>`, `onclick="submitAddQuestion()">Qo'shish</button>`],
  [`<h2 id="takeQuizTitle" style="margin-bottom:8px">✏️ Test topshirish</h2>`, `<h2 id="takeQuizTitle" style="margin-bottom:8px">Test topshirish</h2>`],
  [`onclick="submitTakenQuiz()">✅ Testni yakunlash</button>`, `onclick="submitTakenQuiz()">Testni yakunlash</button>`],
  [`<h2 id="resultsQuizTitle" style="margin-bottom:20px">📊 O'quvchilar Natijalari</h2>`, `<h2 id="resultsQuizTitle" style="margin-bottom:20px">O'quvchilar natijalari</h2>`],

  // ── Attendance ──
  [`<h2>📋 Sinf Davomati (Davomat Belgilash)</h2>`, `<h2>Sinf Davomati (Davomat Belgilash)</h2>`],
  [`<button class="btn btn-ghost" onclick="loadAttendanceTable()">🔄 Yangilash</button>`, `<button class="btn btn-ghost" onclick="loadAttendanceTable()">Yangilash</button>`],

  // ── Users ──
  [`placeholder="🔍 Qidirish..."`, `placeholder="Qidirish..."`],
  [`<option value="student">🎒 O'quvchilar</option>`, `<option value="student">O'quvchilar</option>`],
  [`<option value="teacher">👩‍🏫 O'qituvchilar</option>`, `<option value="teacher">O'qituvchilar</option>`],
  [`<option value="admin">🛡️ Adminlar</option>`, `<option value="admin">Adminlar</option>`],
  [`<button class="btn btn-ghost" id="toggleAllPassBtn" onclick="toggleAllPasswords()">🙈 Parollarni yashirish</button>`,
   `<button class="btn btn-ghost" id="toggleAllPassBtn" onclick="toggleAllPasswords()">Parollarni yashirish</button>`],
  [`<button class="btn btn-primary" onclick="openAddUserModal()">+ Yangi</button>`,
   `<button class="btn btn-primary" onclick="openAddUserModal()">Yangi foydalanuvchi</button>`],

  // ── News Admin ──
  [`<h2>📰 Maktab Yangiliklari va E'lonlar Boshqaruvi</h2>`, `<h2>Maktab Yangiliklari va E'lonlar Boshqaruvi</h2>`],
  [`<button class="btn btn-primary" onclick="openAddNewsModal()">+ Yangi E'lon Qo'shish</button>`, `<button class="btn btn-primary" onclick="openAddNewsModal()">Yangi e'lon qo'shish</button>`],

  // ── Assignments (Dars biriktirish) ──
  [`<h2>🔗 Dars biriktirish (O'qituvchi va Sinf)</h2>`, `<h2>Dars biriktirish (O'qituvchi va Sinf)</h2>`],
  [`<button class="btn btn-ghost" onclick="loadAssignmentsData()">🔄 Yangilash</button>`, `<button class="btn btn-ghost" onclick="loadAssignmentsData()">Yangilash</button>`],
  [`➕ Yangi dars biriktirish`, `Yangi dars biriktirish`],
  [`👨‍🏫 O'qituvchini tanlang *`, `O'qituvchini tanlang *`],
  [`📚 Fanni tanlang (Asosiy fan)`, `Fanni tanlang (Asosiy fan)`],
  [`🎒 Biriktiriladigan sinf(lar)ni tanlang *`, `Biriktiriladigan sinf(lar)ni tanlang *`],
  [`ℹ️ Avval yuqoridan o'qituvchini tanlang — unga biriktirilgan sinflar bu yerda ko'rinadi.`, `Avval yuqoridan o'qituvchini tanlang — unga biriktirilgan sinflar bu yerda ko'rinadi.`],
  [`✓ Barchasini tanlash`, `Barchasini tanlash`],
  [`✗ Tozalash`, `Tozalash`],
  [`<span>🔗 Biriktirish</span>`, `<span>Biriktirish</span>`],
  [`📋 Faol biriktirishlar ro'yxati`, `Faol biriktirishlar ro'yxati`],

  // ── Schedule ──
  [`<h2>📅 Dars jadvali</h2>`, `<h2>Dars jadvali</h2>`],
  [`<button class="btn btn-ghost" onclick="loadScheduleModule()">🔄 Yangilash</button>`, `<button class="btn btn-ghost" onclick="loadScheduleModule()">Yangilash</button>`],
  [`➕ Yangi dars qo'shish (Konflikt nazorati bilan)`, `Yangi dars qo'shish (Konflikt nazorati bilan)`],
  [`<span>💾 Saqlash</span>`, `<span>Saqlash</span>`],
  [`📋 Haftalik dars rejasi`, `Haftalik dars rejasi`],

  // ── Analytics ──
  [`<button class="btn btn-ghost" onclick="loadStats()">🔄 Yangilash</button>`, `<button class="btn btn-ghost" onclick="loadStats()">Yangilash</button>`],

  // ── Modals ──
  [`<h2 id="uploadModalTitle">📄 Darslik yuklash</h2>`, `<h2 id="uploadModalTitle">Darslik yuklash</h2>`],
  [`<div class="ud-icon" id="uploadIcon">📁</div>`, `<div class="ud-icon" id="uploadIcon">${SVG_ICONS['upload'](36, '')}</div>`],
  [`id="uploadSubmitBtn" onclick="submitUpload()" style="margin-top:14px">⬆️ Yuklash</button>`, `id="uploadSubmitBtn" onclick="submitUpload()" style="margin-top:14px">Yuklash</button>`],
  [`<h3 id="wmTitle" style="margin-bottom:12px;padding-right:40px;font-size:18px">🎬 Video dars</h3>`, `<h3 id="wmTitle" style="margin-bottom:12px;padding-right:40px;font-size:18px">Video dars</h3>`],
  [`<span id="wmMeta" style="color:var(--text2);font-size:13px">👩‍🏫 O'qituvchi</span>`, `<span id="wmMeta" style="color:var(--text2);font-size:13px">O'qituvchi</span>`],
  [`<span id="wmViews" style="color:var(--accent2);font-size:13px;font-weight:600">👁 0 ko'rishlar</span>`, `<span id="wmViews" style="color:var(--accent2);font-size:13px;font-weight:600">0 ko'rishlar</span>`],
  [`<h2>🔑 Parol o'zgartirish</h2>`, `<h2>Parol o'zgartirish</h2>`],
  [`<h2>👥 Yangi foydalanuvchi qo'shish</h2>`, `<h2>Yangi foydalanuvchi qo'shish</h2>`],
  [`<option value="student">🎒 O'quvchi</option>`, `<option value="student">O'quvchi</option>`],
  [`<option value="teacher">👩‍🏫 O'qituvchi</option>`, `<option value="teacher">O'qituvchi</option>`],
  [`<option value="admin">⚙️ Admin</option>`, `<option value="admin">Admin</option>`],
  [`🎒 Biriktirilgan sinflar (Dars beradigan sinflari):`, `Biriktirilgan sinflar (Dars beradigan sinflari):`],
  [`🎒 Boshlang'ich sinf o'qituvchisi (1-4 sinf fanlari)`, `Boshlang'ich sinf o'qituvchisi (1-4 sinf fanlari)`],
  [`📚 Biriktiriladigan fanlar:`, `Biriktiriladigan fanlar:`],
  [`⚽ Boshlang'ich sinflar jismoniy tarbiya o'qituvchisi (barcha 1-4 sinflar)`, `Boshlang'ich sinflar jismoniy tarbiya o'qituvchisi (barcha 1-4 sinflar)`],
  [`👨‍💼 Sinf rahbari etib tayinlash`, `Sinf rahbari etib tayinlash`],
  [`onclick="submitAddUser()" style="margin-top:14px">✅ Yaratish</button>`, `onclick="submitAddUser()" style="margin-top:14px">Yaratish</button>`],
  [`<h2>✏️ Foydalanuvchini tahrirlash</h2>`, `<h2>Foydalanuvchini tahrirlash</h2>`],
  [`onclick="submitEditUser()" style="margin-top:14px">💾 Saqlash</button>`, `onclick="submitEditUser()" style="margin-top:14px">Saqlash</button>`],
  [`<h2>📚 Yangi fan qo'shish</h2>`, `<h2>Yangi fan qo'shish</h2>`],
  [`onclick="submitAddSubject()">✅ Fan qo'shish</button>`, `onclick="submitAddSubject()">Fan qo'shish</button>`],
  [`<div id="sdIcon" style="width:64px;height:64px;border-radius:20px;display:flex;align-items:center;justify-content:center;font-size:32px;background:rgba(59,130,246,.15)">📚</div>`,
   `<div id="sdIcon" style="width:56px;height:56px;border-radius:12px;display:flex;align-items:center;justify-content:center;background:var(--accent-light);color:var(--accent)">${SVG_ICONS['book-open'](28, '')}</div>`],
  [`<button class="sd-tab active" id="sdTabLessons" onclick="switchSdTab('lessons')">📖 Matnli darsliklar</button>`, `<button class="sd-tab active" id="sdTabLessons" onclick="switchSdTab('lessons')">Darsliklar</button>`],
  [`<button class="sd-tab" id="sdTabVideos" onclick="switchSdTab('videos')">🎬 Videodarslar</button>`, `<button class="sd-tab" id="sdTabVideos" onclick="switchSdTab('videos')">Video darslar</button>`],
  [`<button class="sd-tab" id="sdTabQuizzes" onclick="switchSdTab('quizzes')">✏️ Testlar va Topshiriqlar</button>`, `<button class="sd-tab" id="sdTabQuizzes" onclick="switchSdTab('quizzes')">Testlar va topshiriqlar</button>`],
  [`<h2 id="newsModalTitle" style="margin-bottom:20px;font-size:20px">📰 Yangi e'lon qo'shish</h2>`, `<h2 id="newsModalTitle" style="margin-bottom:20px;font-size:20px">Yangi e'lon qo'shish</h2>`],
  [`<option value="info" selected>📢 E'lon / Yangilik (Ko'k)</option>`, `<option value="info" selected>E'lon / Yangilik</option>`],
  [`<option value="warning">⚠️ Ogohlantirish (Sariq)</option>`, `<option value="warning">Ogohlantirish</option>`],
  [`onclick="submitSaveNews()">💾 Saqlash</button>`, `onclick="submitSaveNews()">Saqlash</button>`],
  [`<div style="width:46px;height:46px;border-radius:14px;background:linear-gradient(135deg,var(--accent),var(--purple));display:flex;align-items:center;justify-content:center;font-size:22px;box-shadow:0 4px 16px var(--glow)">⭐</div>`,
   `<div style="width:40px;height:40px;border-radius:10px;background:var(--accent-light);color:var(--accent);display:flex;align-items:center;justify-content:center">${SVG_ICONS['graduation-cap'](22, '')}</div>`],
  [`onclick="submitModalGrade()">💾 Bahoni saqlash</button>`, `onclick="submitModalGrade()">Bahoni saqlash</button>`],

  // Landing features (if any remain)
  [`<div class="logo-icon">🎓</div>`, `<div class="logo-icon">${SVG_ICONS['graduation-cap'](22, '')}</div>`],
  [`<div class="feat-icon" style="background:rgba(59,130,246,.15)">📚</div>`, `<div class="feat-icon" style="background:var(--accent-light);color:var(--accent)">${SVG_ICONS['book-open'](24, '')}</div>`],
  [`<div class="feat-icon" style="background:rgba(139,92,246,.15)">🎬</div>`, `<div class="feat-icon" style="background:var(--accent-light);color:var(--accent)">${SVG_ICONS['video'](24, '')}</div>`],
  [`<div class="feat-icon" style="background:rgba(16,185,129,.15)">🤖</div>`, `<div class="feat-icon" style="background:var(--accent-light);color:var(--accent)">${SVG_ICONS['bot'](24, '')}</div>`],
  [`<div class="feat-icon" style="background:rgba(245,158,11,.15)">📊</div>`, `<div class="feat-icon" style="background:var(--accent-light);color:var(--accent)">${SVG_ICONS['bar-chart-2'](24, '')}</div>`],
  [`<div class="feat-icon" style="background:rgba(239,68,68,.15)">📝</div>`, `<div class="feat-icon" style="background:var(--accent-light);color:var(--accent)">${SVG_ICONS['clipboard-list'](24, '')}</div>`],
  [`<div class="feat-icon" style="background:rgba(6,182,212,.15)">🏆</div>`, `<div class="feat-icon" style="background:var(--accent-light);color:var(--accent)">${SVG_ICONS['check-circle'](24, '')}</div>`],
  [`<div class="feat-icon" style="background:rgba(59,130,246,.15)">📄</div>`, `<div class="feat-icon" style="background:var(--accent-light);color:var(--accent)">${SVG_ICONS['book-open'](24, '')}</div>`],
  [`<div class="feat-icon" style="background:rgba(139,92,246,.15)">🎬</div>`, `<div class="feat-icon" style="background:var(--accent-light);color:var(--accent)">${SVG_ICONS['video'](24, '')}</div>`]
];

let replacedCount = 0;
for (const [target, repl] of replacements) {
  if (content.includes(target)) {
    content = content.split(target).join(repl);
    replacedCount++;
  } else {
    // console.log('Notice: target not found:', target.slice(0, 40));
  }
}
console.log(`Executed ${replacedCount} static replacements.`);

// 2. Define and inject SVG helper code into <script>
const svgHelperCode = `
// ═══════════════════════════════════════════
// CORPORATE ICON & SVG HELPER (Lucide Standard)
// ═══════════════════════════════════════════
const SVG_ICONS = {
  'graduation-cap': (s, c) => \`<svg width="\${s}" height="\${s}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="\${c||''}"><path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c3 3 9 3 12 0v-5"/></svg>\`,
  'book-open': (s, c) => \`<svg width="\${s}" height="\${s}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="\${c||''}"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>\`,
  'video': (s, c) => \`<svg width="\${s}" height="\${s}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="\${c||''}"><path d="m22 8-6 4 6 4V8Z"/><rect width="14" height="12" x="2" y="6" rx="2"/></svg>\`,
  'layout-dashboard': (s, c) => \`<svg width="\${s}" height="\${s}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="\${c||''}"><rect width="7" height="9" x="3" y="3" rx="1"/><rect width="7" height="5" x="14" y="3" rx="1"/><rect width="7" height="9" x="14" y="12" rx="1"/><rect width="7" height="5" x="3" y="16" rx="1"/></svg>\`,
  'home': (s, c) => \`<svg width="\${s}" height="\${s}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="\${c||''}"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>\`,
  'bar-chart-2': (s, c) => \`<svg width="\${s}" height="\${s}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="\${c||''}"><line x1="18" x2="18" y1="20" y2="10"/><line x1="12" x2="12" y1="20" y2="4"/><line x1="6" x2="6" y1="20" y2="14"/></svg>\`,
  'clipboard-list': (s, c) => \`<svg width="\${s}" height="\${s}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="\${c||''}"><rect width="8" height="4" x="8" y="2" rx="1" ry="1"/><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><path d="M12 11h4"/><path d="M12 16h4"/><path d="M8 11h.01"/><path d="M8 16h.01"/></svg>\`,
  'check-square': (s, c) => \`<svg width="\${s}" height="\${s}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="\${c||''}"><polyline points="9 11 12 14 22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>\`,
  'check-circle': (s, c) => \`<svg width="\${s}" height="\${s}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="\${c||''}"><path d="m9 12 2 2 4-4"/><circle cx="12" cy="12" r="10"/></svg>\`,
  'bot': (s, c) => \`<svg width="\${s}" height="\${s}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="\${c||''}"><path d="M12 8V4H8"/><rect width="16" height="12" x="4" y="8" rx="2"/><path d="M2 14h2"/><path d="M20 14h2"/><path d="M15 13v2"/><path d="M9 13v2"/></svg>\`,
  'calendar': (s, c) => \`<svg width="\${s}" height="\${s}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="\${c||''}"><rect width="18" height="18" x="3" y="4" rx="2" ry="2"/><line x1="16" x2="16" y1="2" y2="6"/><line x1="8" x2="8" y1="2" y2="6"/><line x1="3" x2="21" y1="10" y2="10"/></svg>\`,
  'user': (s, c) => \`<svg width="\${s}" height="\${s}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="\${c||''}"><circle cx="12" cy="7" r="4"/><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/></svg>\`,
  'users': (s, c) => \`<svg width="\${s}" height="\${s}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="\${c||''}"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>\`,
  'user-check': (s, c) => \`<svg width="\${s}" height="\${s}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="\${c||''}"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><polyline points="16 11 18 13 22 9"/></svg>\`,
  'newspaper': (s, c) => \`<svg width="\${s}" height="\${s}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="\${c||''}"><path d="M4 22h16a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2v16a2 2 0 0 1-2 2Zm0 0a2 2 0 0 1-2-2v-9c0-1.1.9-2 2-2h2"/><path d="M18 14h-8"/><path d="M15 18h-5"/><path d="M10 6h8v4h-8V6Z"/></svg>\`,
  'layers': (s, c) => \`<svg width="\${s}" height="\${s}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="\${c||''}"><polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/></svg>\`,
  'upload': (s, c) => \`<svg width="\${s}" height="\${s}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="\${c||''}"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" x2="12" y1="3" y2="15"/></svg>\`,
  'log-out': (s, c) => \`<svg width="\${s}" height="\${s}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="\${c||''}"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" x2="21" y1="12" y2="9"/></svg>\`,
  'moon': (s, c) => \`<svg width="\${s}" height="\${s}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="\${c||''}"><path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/></svg>\`,
  'sun': (s, c) => \`<svg width="\${s}" height="\${s}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="\${c||''}"><circle cx="12" cy="12" r="4"/><path d="M12 2v2"/><path d="M12 20v2"/><path d="m4.93 4.93 1.41 1.41"/><path d="m17.66 17.66 1.41 1.41"/><path d="M2 12h2"/><path d="M20 12h2"/><path d="m6.34 17.66-1.41 1.41"/><path d="m19.07 4.93-1.41 1.41"/></svg>\`,
  'edit': (s, c) => \`<svg width="\${s}" height="\${s}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="\${c||''}"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/></svg>\`,
  'trash': (s, c) => \`<svg width="\${s}" height="\${s}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="\${c||''}"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/><line x1="10" x2="10" y1="11" y2="17"/><line x1="14" x2="14" y1="11" y2="17"/></svg>\`,
  'key': (s, c) => \`<svg width="\${s}" height="\${s}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="\${c||''}"><path d="m21 2-2 2m-1.5 1.5L14 9l-3-3-4 4 1.5 1.5L7 13l-4 4 1 1 2-2 2 2 1-1-2-2 1.5-1.5 2 2 4-4-3-3 3.5-3.5Z"/></svg>\`,
  'lock': (s, c) => \`<svg width="\${s}" height="\${s}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="\${c||''}"><rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>\`,
  'unlock': (s, c) => \`<svg width="\${s}" height="\${s}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="\${c||''}"><rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 9.9-1"/></svg>\`,
  'eye': (s, c) => \`<svg width="\${s}" height="\${s}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="\${c||''}"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>\`,
  'eye-off': (s, c) => \`<svg width="\${s}" height="\${s}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="\${c||''}"><path d="M9.88 9.88a3 3 0 1 0 4.24 4.24"/><path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68"/><path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61"/><line x1="2" x2="22" y1="2" y2="22"/></svg>\`,
  'check': (s, c) => \`<svg width="\${s}" height="\${s}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="\${c||''}"><polyline points="20 6 9 17 4 12"/></svg>\`,
  'x': (s, c) => \`<svg width="\${s}" height="\${s}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="\${c||''}"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>\`,
  'alert-circle': (s, c) => \`<svg width="\${s}" height="\${s}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="\${c||''}"><circle cx="12" cy="12" r="10"/><line x1="12" x2="12" y1="8" y2="12"/><line x1="12" x2="12.01" y1="16" y2="16"/></svg>\`,
  'refresh': (s, c) => \`<svg width="\${s}" height="\${s}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="\${c||''}"><path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/><path d="M21 3v5h-5"/><path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"/><path d="M8 16H3v5"/></svg>\`,
  'plus': (s, c) => \`<svg width="\${s}" height="\${s}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="\${c||''}"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>\`,
  'search': (s, c) => \`<svg width="\${s}" height="\${s}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="\${c||''}"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>\`,
  'settings': (s, c) => \`<svg width="\${s}" height="\${s}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="\${c||''}"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>\`,
  'shield': (s, c) => \`<svg width="\${s}" height="\${s}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="\${c||''}"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>\`,
  'play': (s, c) => \`<svg width="\${s}" height="\${s}" viewBox="0 0 24 24" fill="currentColor" class="\${c||''}"><polygon points="5 3 19 12 5 21 5 3"/></svg>\`
};

function getSvg(name, size = 16, cls = '') {
  if (SVG_ICONS[name]) {
    return SVG_ICONS[name](size, cls);
  }
  return '';
}

function getInitials(name) {
  if (!name || typeof name !== 'string') return 'SM';
  const parts = name.trim().split(/\\s+/);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
}
`;

const scriptStartTarget = "<script>\n// ═══════════════════════════════════════════\n// CONFIG";
if (content.includes(scriptStartTarget)) {
  const newScriptStart = "<script>\n" + svgHelperCode + "\n// ═══════════════════════════════════════════\n// CONFIG";
  content = content.replace(scriptStartTarget, newScriptStart);
  console.log('Injected SVG helper into <script>');
} else {
  console.log('Script start target not found!');
}


// 3. Update setAvatar function
const setAvatarOld = `function setAvatar(elId, url, emoji){
  const el = document.getElementById(elId);
  if(!el) return;
  const fullUrl = getFullAvatarUrl(url);
  if(fullUrl){ el.innerHTML = \`<img src="\${fullUrl}" alt="avatar" style="width:100%;height:100%;object-fit:cover">\`; }
  else       { el.textContent = emoji || '👤'; }
}`;

const setAvatarNew = `function setAvatar(elId, url, nameOrRole){
  const el = document.getElementById(elId);
  if(!el) return;
  const fullUrl = getFullAvatarUrl(url);
  if(fullUrl){
    el.innerHTML = \`<img src="\${fullUrl}" alt="avatar" style="width:100%;height:100%;object-fit:cover">\`;
  } else {
    const initials = getInitials(nameOrRole || currentUser?.full_name || 'SM');
    el.innerHTML = \`<span class="avatar-initials">\${initials}</span>\`;
  }
}`;

if (content.includes(setAvatarOld)) {
  content = content.replace(setAvatarOld, setAvatarNew);
  console.log('Replaced setAvatar function.');
}

// 4. Update initDashboard avatar calls
content = content.replace("setAvatar('sAvatar', avatar_url, emojis[role]);", "setAvatar('sAvatar', avatar_url, full_name || role);");
content = content.replace("setAvatar('topAvatar', avatar_url, emojis[role]);", "setAvatar('topAvatar', avatar_url, full_name || role);");

// 5. Update updateThemeIcons function
const themeOld = `function updateThemeIcons(icon) {
  const t1 = document.getElementById('themeBtn1');
  const t2 = document.getElementById('themeBtn2');
  if (t1) t1.textContent = icon;
  if (t2) t2.textContent = icon;
}`;

const themeNew = `function updateThemeIcons(isLightOrIcon) {
  const isLight = (isLightOrIcon === true || isLightOrIcon === '☀️' || document.documentElement.classList.contains('light-mode'));
  const slot = document.getElementById('themeIconSlot');
  if (slot) {
    slot.innerHTML = isLight ? SVG_ICONS['sun'](18, '') : SVG_ICONS['moon'](18, '');
  }
  const t1 = document.getElementById('themeBtn1');
  if (t1) {
    t1.innerHTML = isLight ? SVG_ICONS['sun'](18, '') : SVG_ICONS['moon'](18, '');
  }
}`;

if (content.includes(themeOld)) {
  content = content.replace(themeOld, themeNew);
  console.log('Replaced updateThemeIcons function.');
}

// 6. Update toast() function
const toastOld = `function toast(msg, type='info'){
  const c = document.getElementById('toasts') || createToastContainer();
  const t = document.createElement('div');
  t.className = \`toast \${type}\`;
  const icons = { success: '✓', error: '✕', info: 'ℹ' };
  t.innerHTML = \`<span class="toast-icon">\${icons[type]||'•'}</span><span>\${msg}</span>\`;
  c.appendChild(t);
  setTimeout(()=>{ t.style.opacity='0'; setTimeout(()=>t.remove(), 250); }, 3500);
}`;

const toastNew = `function toast(msg, type='info'){
  const cleanMsg = (msg || '').replace(/[\\u{1F300}-\\u{1F9FF}\\u{2600}-\\u{27BF}\\u{1F1E6}-\\u{1F1FF}\\u{1F600}-\\u{1F64F}\\u{1F680}-\\u{1F6FF}\\u{1F900}-\\u{1F9FF}\\u{1FA70}-\\u{1FAFF}]/gu, '').trim();
  const c = document.getElementById('toasts') || createToastContainer();
  const t = document.createElement('div');
  t.className = \`toast \${type}\`;
  let iconSvg = '';
  if (type === 'success') iconSvg = SVG_ICONS['check'](16, '');
  else if (type === 'error') iconSvg = SVG_ICONS['alert-circle'](16, '');
  else iconSvg = SVG_ICONS['check-circle'](16, '');
  t.innerHTML = \`<span class="toast-icon">\${iconSvg}</span><span>\${cleanMsg}</span>\`;
  c.appendChild(t);
  setTimeout(()=>{ t.style.opacity='0'; setTimeout(()=>t.remove(), 250); }, 3500);
}`;

if (content.includes(toastOld)) {
  content = content.replace(toastOld, toastNew);
  console.log('Replaced toast function.');
}

// 7. Update subjectCard cover icon
content = content.replace(
  `<div class="subject-cover" style="background:\${bg}">\${s.icon||'📚'}</div>`,
  `<div class="subject-cover" style="background:\${bg};color:var(--accent)">\${SVG_ICONS['book-open'](28, '')}</div>`
);

// 8. Update videoCard
content = content.replace(
  `<div class="play-btn">▶</div>`,
  `<div class="play-btn">\${SVG_ICONS['play'](16, '')}</div>`
);
content = content.replace(
  `<div class="v-tag" style="background:\${v.subject_color||'#3b82f6'}cc">\${v.subject_icon||''} \${v.subject_name||''}</div>`,
  `<div class="v-tag" style="background:\${v.subject_color||'#3b82f6'}cc">\${v.subject_name||''}</div>`
);
content = content.replace(
  `<div class="video-meta"><span>👁 \${(v.views||0).toLocaleString()}</span><span>👩‍🏫 \${v.teacher_name||''}</span></div>`,
  `<div class="video-meta"><span>\${(v.views||0).toLocaleString()} ko'rishlar</span><span>\${v.teacher_name||''}</span></div>`
);

// 9. Update loadUsers table templates
const userRowOld = `      let infoText = '—';
      if (u.role === 'teacher') {
        infoText = \`📖 \${u.subject || 'Fan yo\\'q'} <small style="color:var(--text3)">(\${u.class_name || 'Barcha sinflar'})</small>\`;
      } else if (u.role === 'student') {
        infoText = \`🏫 \${u.class_name || '—'}\`;
      }

      return \`
    <div class="tbl-row tbl-cols-7">
      <span><b>\${u.full_name}</b></span>
      <span>\${u.email}</span>
      <span><span class="role-badge \${rbMap[u.role]||'rb-student'}">\${rlMap[u.role]||u.role}</span></span>
      <span><span style="font-size:12px">\${infoText}</span></span>
      <span>
        <div style="display:flex;align-items:center;gap:6px">
          <code style="background:var(--card2);padding:4px 8px;border-radius:6px;font-family:monospace;font-size:12px;color:var(--accent2);font-weight:600">\${passText}</code>
          <button class="act-btn" style="width:24px;height:24px;font-size:11px" title="Parolni ko'rsatish/yashirish" onclick="toggleSingleUserPass(\${u.id})">\${isVisible ? '🙈' : '👁️'}</button>
        </div>
      </span>
      <span><span class="sb \${u.is_active?'sb-green':'sb-red'}">\${u.is_active?'Faol':'Bloklangan'}</span></span>
      <div class="act-btns">
        <button class="act-btn" title="Tahrirlash" onclick="openEditUserModal(\${u.id})">✏️</button>
        <button class="act-btn" title="Parolni o'zgartirish" onclick="resetUserPass(\${u.id}, '\${u.full_name}')">🔑</button>
        <button class="act-btn" title="Holatni o'zgartirish" onclick="toggleUserActive(\${u.id})">\${u.is_active?'🔒':'🔓'}</button>
        <button class="act-btn" title="O'chirish" onclick="deleteUser(\${u.id})">🗑️</button>
      </div>
    </div>\`;`;

const userRowNew = `      let infoText = '—';
      if (u.role === 'teacher') {
        infoText = \`\${u.subject || 'Fan biriktirilmagan'} <small style="color:var(--text3)">(\${u.class_name || 'Barcha sinflar'})</small>\`;
      } else if (u.role === 'student') {
        infoText = \`\${u.class_name || '—'}\`;
      }

      return \`
    <div class="tbl-row tbl-cols-7">
      <span><b>\${u.full_name}</b></span>
      <span>\${u.email}</span>
      <span><span class="role-badge \${rbMap[u.role]||'rb-student'}">\${rlMap[u.role]||u.role}</span></span>
      <span><span style="font-size:12px">\${infoText}</span></span>
      <span>
        <div style="display:flex;align-items:center;gap:6px">
          <code style="background:var(--card2);padding:4px 8px;border-radius:6px;font-family:monospace;font-size:12px;color:var(--accent2);font-weight:600">\${passText}</code>
          <button class="act-btn" style="width:24px;height:24px" title="Parolni ko'rsatish/yashirish" onclick="toggleSingleUserPass(\${u.id})">\${isVisible ? SVG_ICONS['eye-off'](13, '') : SVG_ICONS['eye'](13, '')}</button>
        </div>
      </span>
      <span><span class="sb \${u.is_active?'sb-green':'sb-red'}">\${u.is_active?'Faol':'Bloklangan'}</span></span>
      <div class="act-btns">
        <button class="act-btn" title="Tahrirlash" onclick="openEditUserModal(\${u.id})">\${SVG_ICONS['edit'](13, '')}</button>
        <button class="act-btn" title="Parolni o'zgartirish" onclick="resetUserPass(\${u.id}, '\${u.full_name}')">\${SVG_ICONS['key'](13, '')}</button>
        <button class="act-btn" title="Holatni o'zgartirish" onclick="toggleUserActive(\${u.id})">\${SVG_ICONS[u.is_active ? 'lock' : 'unlock'](13, '')}</button>
        <button class="act-btn" title="O'chirish" onclick="deleteUser(\${u.id})">\${SVG_ICONS['trash'](13, '')}</button>
      </div>
    </div>\`;`;

if (content.includes(userRowOld)) {
  content = content.replace(userRowOld, userRowNew);
  console.log('Replaced loadUsers row template.');
} else {
  console.log('userRowOld not found directly, checking partial replacement...');
}

// 10. Update loadAssignmentsData options & rows
content = content.replace(
  "teachers.map(t => `<option value=\"${t.id}\">👨‍🏫 ${t.full_name} (${t.email})${t.subject ? ' — ' + t.subject : ''}</option>`).join('')",
  "teachers.map(t => `<option value=\"${t.id}\">${t.full_name} (${t.email})${t.subject ? ' — ' + t.subject : ''}</option>`).join('')"
);
content = content.replace(
  "<span><span class=\"sb sb-green\">🎒 ${a.class_name || '—'}</span></span>",
  "<span><span class=\"sb sb-green\">${a.class_name || '—'}</span></span>"
);
content = content.replace(
  "<span><span class=\"sb sb-blue\">📚 ${a.subject_name || 'Umumiy / Asosiy'}</span></span>",
  "<span><span class=\"sb sb-blue\">${a.subject_name || 'Umumiy / Asosiy'}</span></span>"
);
content = content.replace(
  "<span style=\"font-size:13px;color:var(--text2)\">📅 ${dateStr}</span>",
  "<span style=\"font-size:13px;color:var(--text2)\">${dateStr}</span>"
);
content = content.replace(
  `<button class="act-btn" title="O'chirish" onclick="deleteAssignment(\${a.id})">🗑️</button>`,
  `<button class="act-btn" title="O'chirish" onclick="deleteAssignment(\${a.id})">\${SVG_ICONS['trash'](13, '')}</button>`
);

// 11. Update onAssignTeacherChange checkbox loop
content = content.replace(
  `<span>🎒 \${c.name} (\${c.grade_level}-sinf)</span>`,
  `<span>\${c.name} (\${c.grade_level}-sinf)</span>`
);
content = content.replace(
  `<option value="\${matchedSub.id}">📚 \${matchedSub.name} (Asosiy fan — Avtomatik)</option>`,
  `<option value="\${matchedSub.id}">\${matchedSub.name} (Asosiy fan — Avtomatik)</option>`
);
content = content.replace(
  `<option value="\${s.id}" \${isMain ? 'selected' : ''}>📚 \${s.name}\${isMain ? ' (Asosiy fan)' : ''}</option>`,
  `<option value="\${s.id}" \${isMain ? 'selected' : ''}>\${s.name}\${isMain ? ' (Asosiy fan)' : ''}</option>`
);
content = content.replace(
  `cachedSubjectsList.map(s => \`<option value="\${s.id}">📚 \${s.name}</option>\`).join('')`,
  `cachedSubjectsList.map(s => \`<option value="\${s.id}">\${s.name}</option>\`).join('')`
);

// 12. Update Schedule Module
content = content.replace(
  "teachers.map(t => `<option value=\"${t.id}\">👨‍🏫 ${t.full_name} (${t.subject || 'Fan biriktirilmagan'})</option>`).join('')",
  "teachers.map(t => `<option value=\"${t.id}\">${t.full_name} (${t.subject || 'Fan biriktirilmagan'})</option>`).join('')"
);
content = content.replace(
  "`<option value=\"${c.id}\">🎒 ${c.name} (${c.grade_level}-sinf)</option>`",
  "`<option value=\"${c.id}\">${c.name} (${c.grade_level}-sinf)</option>`"
);
content = content.replace(
  "`<option value=\"${s.id}\">${s.icon || '📚'} ${s.name}</option>`",
  "`<option value=\"${s.id}\">${s.name}</option>`"
);
content = content.replace(
  "const topLabel = isTeacherView ? `🎒 ${item.class_name || 'Sinf'}` : `📖 ${item.subject_name || 'Fan'}`;",
  "const topLabel = isTeacherView ? (item.class_name || 'Sinf') : (item.subject_name || 'Fan');"
);
content = content.replace(
  "const subLabel = isTeacherView ? `📖 ${item.subject_name || 'Fan'}` : `👨‍🏫 ${item.teacher_name || \"O'qituvchi\"}`;",
  "const subLabel = isTeacherView ? (item.subject_name || 'Fan') : (item.teacher_name || \"O'qituvchi\");"
);
content = content.replace(
  "if (tableTitle) tableTitle.textContent = `📋 ${currentUser?.full_name} — Dars jadvali`;",
  "if (tableTitle) tableTitle.textContent = `${currentUser?.full_name} — Dars jadvali`;"
);
content = content.replace(
  "if (tableTitle) tableTitle.textContent = `📋 ${currentUser?.class_name || ''} sinfi — Dars jadvali`;",
  "if (tableTitle) tableTitle.textContent = `${currentUser?.class_name || ''} sinfi — Dars jadvali`;"
);
content = content.replace(
  "tableTitle.textContent = `📋 ${selectedClassObj.name} sinfi — Dars jadvali`;",
  "tableTitle.textContent = `${selectedClassObj.name} sinfi — Dars jadvali`;"
);
content = content.replace(
  "tableTitle.textContent = `📋 ${res.class_name} sinfi — Sizning dars jadvalingiz`;",
  "tableTitle.textContent = `${res.class_name} sinfi — Sizning dars jadvalingiz`;"
);

// 13. Update Attendance module
content = content.replace(
  "<div style=\"font-size:48px;margin-bottom:12px\">⚠️</div>",
  `<div style="margin-bottom:12px;display:flex;justify-content:center">${SVG_ICONS['alert-circle'](40, '')}</div>`
);
content = content.replace(
  "classSelect.innerHTML = clsList.map(c => `<option value=\"${c.name}\" data-id=\"${c.id}\">🎒 ${c.name} (${c.grade_level}-sinf)</option>`).join('');",
  "classSelect.innerHTML = clsList.map(c => `<option value=\"${c.name}\" data-id=\"${c.id}\">${c.name} (${c.grade_level}-sinf)</option>`).join('');"
);
content = content.replace(
  `<button class="btn btn-ghost" style="padding:6px 12px;font-size:13px" onclick="markAllAttendance('present')">⚡ Barchasiga "Keldi" deb belgilash</button>`,
  `<button class="btn btn-ghost" style="padding:6px 12px;font-size:13px" onclick="markAllAttendance('present')">Barchasiga "Keldi" deb belgilash</button>`
);
content = content.replace(
  `<div class="s-avatar" style="width:38px;height:38px;font-size:16px">\${st.avatar_url ? \`<img src="\${st.avatar_url}" style="width:100%;height:100%;object-fit:cover;border-radius:50%">\` : '🎒'}</div>`,
  `<div class="s-avatar" style="width:38px;height:38px">\${st.avatar_url ? \`<img src="\${st.avatar_url}" style="width:100%;height:100%;object-fit:cover;border-radius:6px">\` : \`<span class="avatar-initials">\${getInitials(st.full_name)}</span>\`}</div>`
);
content = content.replace(
  `<button class="btn \${isPresent ? 'btn-primary' : 'btn-ghost'}" style="\${isPresent ? 'background:var(--green);border-color:var(--green)' : ''};padding:7px 16px;font-size:13px" onclick="setStudentAttStatus(\${st.id}, 'present')">\n                ✅ Keldi\n              </button>`,
  `<button class="btn \${isPresent ? 'btn-primary' : 'btn-ghost'}" style="\${isPresent ? 'background:var(--green);border-color:var(--green)' : ''};padding:7px 16px;font-size:13px" onclick="setStudentAttStatus(\${st.id}, 'present')">Keldi</button>`
);
content = content.replace(
  `<button class="btn \${isAbsent ? 'btn-primary' : 'btn-ghost'}" style="\${isAbsent ? 'background:var(--red);border-color:var(--red)' : ''};padding:7px 16px;font-size:13px" onclick="setStudentAttStatus(\${st.id}, 'absent')">\n                ❌ Kelmadi\n              </button>`,
  `<button class="btn \${isAbsent ? 'btn-primary' : 'btn-ghost'}" style="\${isAbsent ? 'background:var(--red);border-color:var(--red)' : ''};padding:7px 16px;font-size:13px" onclick="setStudentAttStatus(\${st.id}, 'absent')">Kelmadi</button>`
);
content = content.replace(
  `<button class="btn btn-primary" style="padding:12px 28px;font-size:15px" onclick="submitSaveAttendance()">💾 Davomatni saqlash</button>`,
  `<button class="btn btn-primary" style="padding:10px 24px;font-size:14px" onclick="submitSaveAttendance()">Davomatni saqlash</button>`
);

// 14. Update MyClass module
content = content.replace(
  `<button class="btn btn-ghost" onclick="loadMyClass()">🔄 Yangilash</button>`,
  `<button class="btn btn-ghost" onclick="loadMyClass()">Yangilash</button>`
);
content = content.replace(
  `\${ht.avatar_url ? \`<img src="\${ht.avatar_url}" style="width:100%;height:100%;object-fit:cover;border-radius:50%">\` : '👨‍💼'}`,
  `\${ht.avatar_url ? \`<img src="\${ht.avatar_url}" style="width:100%;height:100%;object-fit:cover;border-radius:6px">\` : \`<span class="avatar-initials" style="font-size:24px">\${getInitials(ht.full_name)}</span>\`}`
);
content = content.replace(
  `<div style="font-size:14px;color:var(--text2)">📚 Fan: <b>\${ht.subject || 'O\\'qituvchi'}</b> | ✉️ \${ht.email}</div>`,
  `<div style="font-size:14px;color:var(--text2)">Fan: <b>\${ht.subject || 'O\\'qituvchi'}</b> | \${ht.email}</div>`
);
content = content.replace(
  `📌 Sizning sinfingiz: <b>\${res.class_name}</b> (Sinf rahbari biriktirilmagan)`,
  `Sizning sinfingiz: <b>\${res.class_name}</b> (Sinf rahbari biriktirilmagan)`
);
content = content.replace("badgeText = '✅ Darsda';", "badgeText = 'Darsda';");
content = content.replace("badgeText = '❌ Kelmagan';", "badgeText = 'Kelmagan';");
content = content.replace("badgeText = '⏳ Belgilanmagan';", "badgeText = 'Belgilanmagan';");
content = content.replace(
  `\${c.avatar_url ? \`<img src="\${c.avatar_url}" style="width:100%;height:100%;object-fit:cover;border-radius:50%">\` : '🎒'}`,
  `\${c.avatar_url ? \`<img src="\${c.avatar_url}" style="width:100%;height:100%;object-fit:cover;border-radius:6px">\` : \`<span class="avatar-initials">\${getInitials(c.full_name)}</span>\`}`
);
content = content.replace(
  `<div style="font-size:44px;margin-bottom:12px">🏫</div>`,
  `<div style="margin-bottom:12px;display:flex;justify-content:center">${SVG_ICONS['graduation-cap'](44, '')}</div>`
);
content = content.replace(
  "headerEl.innerHTML = `Mening sinfim — <span style=\"color:var(--accent2)\">🎒 ${classInfo.name}</span> <small style=\"font-size:13px;color:var(--text3);font-weight:normal\">(Sinf rahbari: ${classInfo.class_teacher_name || currentUser?.full_name})</small>`;",
  "headerEl.innerHTML = `Mening sinfim — <span style=\"color:var(--accent2)\">${classInfo.name}</span> <small style=\"font-size:13px;color:var(--text3);font-weight:normal\">(Sinf rahbari: ${classInfo.class_teacher_name || currentUser?.full_name})</small>`;"
);
content = content.replace(
  `<div class="s-avatar" style="width:34px;height:34px;font-size:14px">\${u.avatar_url ? \`<img src="\${u.avatar_url}" style="width:100%;height:100%;object-fit:cover;border-radius:50%">\` : '🎒'}</div>`,
  `<div class="s-avatar" style="width:34px;height:34px">\${u.avatar_url ? \`<img src="\${u.avatar_url}" style="width:100%;height:100%;object-fit:cover;border-radius:6px">\` : \`<span class="avatar-initials">\${getInitials(u.full_name)}</span>\`}</div>`
);
content = content.replace(
  `<button class="act-btn" title="Tahrirlash" onclick="openEditUserModal(\${u.id})">✏️</button>`,
  `<button class="act-btn" title="Tahrirlash" onclick="openEditUserModal(\${u.id})">\${SVG_ICONS['edit'](13, '')}</button>`
);

// 15. Update Quizzes
content = content.replace(
  `const scoreText = isCompleted ? \`✅ \${q.my_score}/\${q.question_count} (\${q.my_percentage}%)\` : '';`,
  `const scoreText = isCompleted ? \`\${q.my_score}/\${q.question_count} (\${q.my_percentage}%)\` : '';`
);
content = content.replace(
  `<button class="btn btn-ghost" style="font-size:12px;padding:6px 12px" onclick="openQuestionModal(\${q.id})">➕ Savol</button>`,
  `<button class="btn btn-ghost" style="font-size:12px;padding:6px 12px" onclick="openQuestionModal(\${q.id})">Savol qo'shish</button>`
);
content = content.replace(
  `<button class="btn btn-ghost" style="font-size:12px;padding:6px 12px" onclick="viewQuizResults(\${q.id},'\${q.title}')">📊 Natijalar</button>`,
  `<button class="btn btn-ghost" style="font-size:12px;padding:6px 12px" onclick="viewQuizResults(\${q.id},'\${q.title}')">Natijalar</button>`
);
content = content.replace(
  `<button class="btn btn-ghost" style="font-size:12px;padding:6px 12px;color:var(--red);border-color:rgba(239,68,68,0.2)" onclick="deleteQuiz(\${q.id})">🗑️</button>`,
  `<button class="act-btn" style="color:var(--red);border-color:rgba(239,68,68,0.2)" onclick="deleteQuiz(\${q.id})">\${SVG_ICONS['trash'](13, '')}</button>`
);
content = content.replace(
  `<button class="btn btn-primary" style="font-size:12px;padding:6px 12px" onclick="startQuiz(\${q.id},'\${q.title}','\${q.description||''}')">✏️ Boshlash</button>`,
  `<button class="btn btn-primary" style="font-size:12px;padding:6px 12px" onclick="startQuiz(\${q.id},'\${q.title}','\${q.description||''}')">Boshlash</button>`
);
content = content.replace(
  "document.getElementById('resultsQuizTitle').textContent = `📊 Natijalar: ${title}`;",
  "document.getElementById('resultsQuizTitle').textContent = `Natijalar: ${title}`;"
);
content = content.replace(
  "document.getElementById('takeQuizTitle').textContent = `✏️ Test: ${title}`;",
  "document.getElementById('takeQuizTitle').textContent = `Test: ${title}`;"
);

// 16. Update Subject Detail Modal
content = content.replace(
  "document.getElementById('sdMeta').textContent = `👨‍🏫 O'qituvchi: ${currentSubjectDetail.teacher_name || 'Biriktirilgan'} • 🏫 ${currentSubjectDetail.class_name || currentUser?.class_name || 'Barcha sinflar'}`;",
  "document.getElementById('sdMeta').textContent = `O'qituvchi: ${currentSubjectDetail.teacher_name || 'Biriktirilgan'} • Sinf: ${currentSubjectDetail.class_name || currentUser?.class_name || 'Barcha sinflar'}`;"
);
content = content.replace(
  "<div style=\"font-weight:700;font-size:16px;color:var(--text)\">📖 ${l.title}</div>",
  "<div style=\"font-weight:700;font-size:16px;color:var(--text)\">${l.title}</div>"
);
content = content.replace(
  `<button class="btn btn-primary" style="padding:8px 18px;font-size:13px" onclick="alert('📖 ' + \${JSON.stringify(l.title)} + '\\\\n\\\\n' + \${JSON.stringify(l.content || l.description || 'Darslik matni yuklandi.')})">📖 O'qish</button>`,
  `<button class="btn btn-primary" style="padding:8px 18px;font-size:13px" onclick="alert(\${JSON.stringify(l.title)} + '\\\\n\\\\n' + \${JSON.stringify(l.content || l.description || 'Darslik matni yuklandi.')})">O'qish</button>`
);
content = content.replace(
  `<div style="font-size:36px;text-align:center;margin-bottom:10px">🎬</div>`,
  `<div style="margin-bottom:10px;display:flex;justify-content:center;color:var(--accent)">\${SVG_ICONS['video'](36, '')}</div>`
);
content = content.replace(
  `<div style="font-size:12px;color:var(--text2)">👁️ \${v.views || 0} marta ko'rilgan</div>`,
  `<div style="font-size:12px;color:var(--text2)">\${v.views || 0} marta ko'rilgan</div>`
);
content = content.replace(
  `<button class="btn btn-primary" style="margin-top:12px;width:100%;padding:8px;font-size:13px" onclick="closeModal('subjectDetailModal'); openVideoPlayerModal(\${v.id});">▶️ Videoni ko'rish</button>`,
  `<button class="btn btn-primary" style="margin-top:12px;width:100%;padding:8px;font-size:13px" onclick="closeModal('subjectDetailModal'); openVideoPlayerModal(\${v.id});">Videoni ko'rish</button>`
);
content = content.replace(
  `<div style=\"font-weight:700;font-size:16px;color:var(--text)\">✏️ \${q.title}</div>`,
  `<div style=\"font-weight:700;font-size:16px;color:var(--text)\">\${q.title}</div>`
);
content = content.replace(
  `<button class="btn btn-primary" style="padding:8px 18px;font-size:13px" onclick="closeModal('subjectDetailModal'); startQuiz(\${q.id});">🚀 Testni boshlash</button>`,
  `<button class="btn btn-primary" style="padding:8px 18px;font-size:13px" onclick="closeModal('subjectDetailModal'); startQuiz(\${q.id});">Testni boshlash</button>`
);

// 17. Update local AI replies
content = content.replace(
  "return `Assalomu alaykum, ${uName}! 🎓\\n\\nSizning joriy baholaringiz va test natijalaringizni chap menyudagi **\"Testlar\"** va **\"Baholar\"** bo'limida ko'rishingiz mumkin.`;",
  "return `Assalomu alaykum, ${uName}!\\n\\nSizning joriy baholaringiz va test natijalaringizni chap menyudagi **\"Testlar\"** va **\"Baholar\"** bo'limida ko'rishingiz mumkin.`;"
);
content = content.replace(
  "return `Salom, ${uName}! 📚\\n\\nSmartSchool platformasidagi barcha darslar va video ma'ruzalar **\"Darsliklar\"** va **\"Video darslar\"** menyusida jamlangan.`;",
  "return `Salom, ${uName}!\\n\\nSmartSchool platformasidagi barcha darslar va video ma'ruzalar **\"Darsliklar\"** va **\"Video darslar\"** menyusida jamlangan.`;"
);
content = content.replace(
  "return `Salom! 📝 Yangi uy vazifalari va topshiriqlaringizni ko'rish hamda javoblaringizni yuklash uchun **\"Topshiriqlar\"** bo'limiga o'ting.`;",
  "return `Salom! Yangi uy vazifalari va topshiriqlaringizni ko'rish hamda javoblaringizni yuklash uchun **\"Topshiriqlar\"** bo'limiga o'ting.`;"
);
content = content.replace(
  "return `Assalomu alaykum, ${uName}! 🤖\\n\\nMen SmartSchool AI yordamchisiman. Darslar, baholar, topshiriqlar va darsliklar bo'yicha sizga yordam berishga tayyorman. Yana qanday savollaringiz bor?`;",
  "return `Assalomu alaykum, ${uName}!\\n\\nMen SmartSchool AI yordamchisiman. Darslar, baholar, topshiriqlar va darsliklar bo'yicha sizga yordam berishga tayyorman. Yana qanday savollaringiz bor?`;"
);
content = content.replace("Chat tozalandi! Qanday savolingiz bor? 😊", "Chat tozalandi! Qanday savolingiz bor?");

fs.writeFileSync(filePath, content, 'utf8');
console.log('Successfully written updated index.html, new size:', content.length);
