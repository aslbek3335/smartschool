const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', 'frontend', 'index.html');
let content = fs.readFileSync(filePath, 'utf8');

const replacements = [
  // Theme button 1 in landing
  [`<button class="btn btn-ghost" onclick="toggleTheme()" id="themeBtn1" style="padding: 0; font-size: 18px; width: 42px; height: 42px; display: flex; align-items: center; justify-content: center; border-radius: 50%;">🌙</button>`,
   `<button class="btn btn-ghost" onclick="toggleTheme()" id="themeBtn1" style="padding: 0; width: 42px; height: 42px; display: flex; align-items: center; justify-content: center; border-radius: 50%;"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/></svg></button>`],

  // Modals h2 titles
  [`<h2 style="margin-bottom:24px">📝 Yangi topshiriq</h2>`, `<h2 style="margin-bottom:24px">Yangi topshiriq</h2>`],
  [`<h2 style="margin-bottom:8px">📤 Topshiriq topshirish</h2>`, `<h2 style="margin-bottom:8px">Topshiriq topshirish</h2>`],
  [`<h2 style="margin-bottom:24px">✏️ Yangi test yaratish</h2>`, `<h2 style="margin-bottom:24px">Yangi test yaratish</h2>`],
  [`<h2 style="margin-bottom:16px">➕ Savol qo'shish</h2>`, `<h2 style="margin-bottom:16px">Savol qo'shish</h2>`],
  [`<h2 style="margin-bottom:24px">👥 Yangi foydalanuvchi qo'shish</h2>`, `<h2 style="margin-bottom:24px">Yangi foydalanuvchi qo'shish</h2>`],
  [`<h2 style="margin-bottom:24px">✏️ Foydalanuvchini tahrirlash</h2>`, `<h2 style="margin-bottom:24px">Foydalanuvchini tahrirlash</h2>`],
  [`<h2 style="margin-bottom:24px">📚 Yangi fan qo'shish</h2>`, `<h2 style="margin-bottom:24px">Yangi fan qo'shish</h2>`],
  [`<div class="fg"><label>Ikonka (Emoji)</label><input type="text" id="subIcon" value="📚" placeholder="Masalan: 🧬"></div>`,
   `<div class="fg" style="display:none"><label>Ikonka</label><input type="text" id="subIcon" value="" placeholder="Fan kodi"></div>`],
  [`<span style="font-size:18px;line-height:1;flex-shrink:0">⚠️</span>`, `<span style="display:inline-flex;align-items:center;line-height:1;flex-shrink:0"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" x2="12" y1="8" y2="12"/><line x1="12" x2="12.01" y1="16" y2="16"/></svg></span>`],

  // Toast messages
  [`toast('⛔ Token xato yoki autentifikatsiya muddati tugadi. Qayta kiring.', 'error');`, `toast('Token muddati tugadi. Qayta kiring.', 'error');`],
  [`toast(\`⚠️ API Endpoint topilmadi (404): \${path}\`, 'error');`, `toast(\`API Endpoint topilmadi (404): \${path}\`, 'error');`],
  [`toast(\`❌ Server xatosi (\${r.status}). Backend jurnalini tekshiring.\`, 'error');`, `toast(\`Server xatosi (\${r.status}). Backend jurnalini tekshiring.\`, 'error');`],
  [`toast('🌐 Server bilan bog\\'lanishda xatolik! Backend running hamda port 5005 ning ochiqligini tekshiring.', 'error');`, `toast('Server bilan bog\\'lanishda xatolik! Port 5005 ning ochiqligini tekshiring.', 'error');`],

  // Mock grades options
  [`<option value="6">📖 Ona tili</option>`, `<option value="6">Ona tili</option>`],
  [`<option value="14">🌐 Ingliz tili</option>`, `<option value="14">Ingliz tili</option>`],
  [`<option value="15">🧪 Kimyo</option>`, `<option value="15">Kimyo</option>`],
  [`<option value="5">⚛️ Fizika</option>`, `<option value="5">Fizika</option>`],
  [`<option value="4">🔬 Biologiya</option>`, `<option value="4">Biologiya</option>`],
  [`subSelect.innerHTML = \`<option value="1">📚 Matematika</option>\`;`, `subSelect.innerHTML = \`<option value="1">Matematika</option>\`;`],

  // Grade toast
  [`toast(\`✅ \${res.message || 'Baho muvaffaqiyatli saqlandi!'}\`, 'success');`, `toast(res.message || 'Baho muvaffaqiyatli saqlandi!', 'success');`],
  [`<div class="dc-lbl">\${a.icon||'📚'} \${a.subject_name}</div>`, `<div class="dc-lbl">\${a.subject_name}</div>`],
  [`<span style="font-size:12.5px;color:var(--text3)">📅 \${new Date(g.grade_date).toLocaleDateString('uz-UZ')}</span>`, `<span style="font-size:12.5px;color:var(--text3)">\${new Date(g.grade_date).toLocaleDateString('uz-UZ')}</span>`],
  [`<span><b>\${g.subject_icon||'📚'} \${g.subject_name||''}</b></span>`, `<span><b>\${g.subject_name||''}</b></span>`],
  [`<span style="color:var(--text2)">👨‍🏫 \${g.teacher_name||'O\\'qituvchi'}</span>`, `<span style="color:var(--text2)">\${g.teacher_name||'O\\'qituvchi'}</span>`],

  // Tasks
  [`<span style="background:rgba(59,130,246,.15);color:var(--accent2);padding:4px 12px;border-radius:20px;font-size:12px;font-weight:700">\${t.subject_icon||'📚'} \${t.subject_name||''}</span>`,
   `<span style="background:var(--accent-light);color:var(--accent);padding:4px 12px;border-radius:6px;font-size:12px;font-weight:600">\${t.subject_name||''}</span>`],
  [`\${myScore!==null ? \`<span style="color:var(--green);font-weight:700">✅ \${myScore}/\${t.max_score||100}</span>\``,
   `\${myScore!==null ? \`<span style="color:var(--green);font-weight:700">\${myScore}/\${t.max_score||100}</span>\``],
  [`: \`<button class="btn btn-primary" style="font-size:12px;padding:7px 14px" onclick="openSubmitModal(\${t.id},'\${t.title}')">📤 Topshirish</button>\`}`,
   `: \`<button class="btn btn-primary" style="font-size:12px;padding:7px 14px" onclick="openSubmitModal(\${t.id},'\${t.title}')">Topshirish</button>\`}`],
  [`toast('✅ Topshiriq yaratildi!','success');`, `toast('Topshiriq yaratildi!','success');`],
  [`toast('✅ Topshiriq topshirildi!','success');`, `toast('Topshiriq topshirildi!','success');`],

  // Student info alert
  [`alert(\`🎒 O'quvchi ma'lumotlari:\\n\\nIsm: \${name}\\nEmail: \${email}\\nSinf: \${className}\`);`, `alert(\`O'quvchi ma'lumotlari:\\n\\nIsm: \${name}\\nEmail: \${email}\\nSinf: \${className}\`);`],
  [`toast(\`✉️ \${name} ga xabar yuborildi!\`, 'success');`, `toast(\`\${name} ga xabar yuborildi!\`, 'success');`],
  [`btn.innerHTML = showAllPasswords ? '🙈 Parollarni yashirish' : '👁️ Parollarni ko\\'rsatish';`, `btn.innerHTML = showAllPasswords ? 'Parollarni yashirish' : 'Parollarni ko\\'rsatish';`],
  [`return toast('⚠️ Parol kamida 6 ta belgi bo\\'lishi kerak', 'error');`, `return toast('Parol kamida 6 ta belgi bo\\'lishi kerak', 'error');`],
  [`toast(res.success?res.message:'🔧 Demo: holat o\\'zgartirildi','info');`, `toast(res.success?res.message:'Holat o\\'zgartirildi','info');`],
  [`toast(res.success?'O\\'chirildi':'🔧 Demo: o\\'chirildi','info');`, `toast(res.success?'O\\'chirildi':'O\\'chirildi','info');`],

  // Primary subjects list icons
  [`{ name: 'Matematika', icon: '📐' },`, `{ name: 'Matematika', icon: '' },`],
  [`{ name: 'Ona tili', icon: '📖' },`, `{ name: 'Ona tili', icon: '' },`],
  [`{ name: "O'qish", icon: '📚' },`, `{ name: "O'qish", icon: '' },`],
  [`{ name: 'Tabiatshunoslik', icon: '🌱' },`, `{ name: 'Tabiatshunoslik', icon: '' },`],
  [`{ name: "Tasviriy san'at", icon: '🎨' },`, `{ name: "Tasviriy san'at", icon: '' },`],
  [`{ name: 'Texnologiya', icon: '✂️' },`, `{ name: 'Texnologiya', icon: '' },`],
  [`{ name: 'Musiqa', icon: '🎵' },`, `{ name: 'Musiqa', icon: '' },`],
  [`{ name: 'Tarbiya', icon: '🤝' },`, `{ name: 'Tarbiya', icon: '' },`],
  [`{ name: 'Jismoniy tarbiya', icon: '⚽' },`, `{ name: 'Jismoniy tarbiya', icon: '' },`],
  [`{ name: 'Ingliz tili', icon: '🌐' }`, `{ name: 'Ingliz tili', icon: '' }`],

  // Primary class label
  [`<span>🎒 \${c.name}</span>`, `<span>\${c.name}</span>`],

  // Add user error
  [`showAddUserError('⚠️ Barcha maydonlarni to\\'ldiring');`, `showAddUserError('Barcha maydonlarni to\\'ldiring');`],
  [`showAddUserError('⚠️ Parol kamida 6 ta belgi bo\\'lishi kerak');`, `showAddUserError('Parol kamida 6 ta belgi bo\\'lishi kerak');`],
  [`showAddUserError('⚠️ O\\'qituvchilar uchun "Fan" kiritilishi majburiy!');`, `showAddUserError('O\\'qituvchilar uchun "Fan" kiritilishi majburiy!');`],
  [`toast('🎉 Foydalanuvchi muvaffaqiyatli yaratildi!', 'success');`, `toast('Foydalanuvchi muvaffaqiyatli yaratildi!', 'success');`],
  [`return toast('⚠️ Barcha majburiy maydonlarni to\\'ldiring', 'error');`, `return toast('Barcha majburiy maydonlarni to\\'ldiring', 'error');`],
  [`return toast('⚠️ O\\'qituvchilar uchun "Fan" kiritilishi majburiy!', 'error');`, `return toast('O\\'qituvchilar uchun "Fan" kiritilishi majburiy!', 'error');`],
  [`toast('🎉 Foydalanuvchi ma\\'lumotlari yangilandi!', 'success');`, `toast('Foydalanuvchi ma\\'lumotlari yangilandi!', 'success');`],

  // Add subject
  [`document.getElementById('subIcon').value = '📚';`, `document.getElementById('subIcon').value = '';`],
  [`const icon = document.getElementById('subIcon').value.trim() || '📚';`, `const icon = document.getElementById('subIcon').value.trim() || '';`],
  [`if (!name) return toast('⚠️ Fan nomini kiriting', 'error');`, `if (!name) return toast('Fan nomini kiriting', 'error');`],
  [`toast('🎉 Yangi fan muvaffaqiyatli yaratildi!', 'success');`, `toast('Yangi fan muvaffaqiyatli yaratildi!', 'success');`],

  // Mock News
  [`{ id: 1, title: "🚨 1-chorak yakuniy imtihonlari jadvali e'lon qilindi", category: "urgent", event_date: "2026-09-10", author_name: "Admin" },`,
   `{ id: 1, title: "1-chorak yakuniy imtihonlari jadvali e'lon qilindi", category: "urgent", event_date: "2026-09-10", author_name: "Admin" },`],
  [`{ id: 2, title: "🏆 Maktablar o'rtasida shaxmat musobaqasi o'tkaziladi", category: "event", event_date: "2026-09-15", author_name: "Zavuch" },`,
   `{ id: 2, title: "Maktablar o'rtasida shaxmat musobaqasi o'tkaziladi", category: "event", event_date: "2026-09-15", author_name: "Zavuch" },`],
  [`{ id: 3, title: "📢 Yangi o'quv yili uchun masofaviy darsliklar yuklandi", category: "info", event_date: "2026-09-01", author_name: "Admin" }`,
   `{ id: 3, title: "Yangi o'quv yili uchun masofaviy darsliklar yuklandi", category: "info", event_date: "2026-09-01", author_name: "Admin" }`],

  // Cat badges
  [`urgent: '<span class="sb sb-red">🚨 Shoshilinch</span>',`, `urgent: '<span class="sb sb-red">Shoshilinch</span>',`],
  [`event:  '<span class="sb sb-green">🏆 Tadbir</span>',`, `event:  '<span class="sb sb-green">Tadbir</span>',`],
  [`info:   '<span class="sb sb-blue">📢 E\\'lon</span>',`, `info:   '<span class="sb sb-blue">E\\'lon</span>',`],
  [`warning:'<span class="sb sb-gold">⚠️ Ogohlantirish</span>'`, `warning:'<span class="sb sb-gold">Ogohlantirish</span>'`],
  [`const badge = catBadges[n.category] || '<span class="sb sb-blue">📢 E\\'lon</span>';`, `const badge = catBadges[n.category] || '<span class="sb sb-blue">E\\'lon</span>';`],
  [`<span style="font-size:12px;color:var(--text3)">📅 \${dateStr}</span>`, `<span style="font-size:12px;color:var(--text3)">\${dateStr}</span>`],
  [`<span>✍️ \${authorSafe}</span>`, `<span>\${authorSafe}</span>`],
  [`<span>\${catBadges[n.category] || '<span class="sb sb-blue">📢 E\\'lon</span>'}</span>`, `<span>\${catBadges[n.category] || '<span class="sb sb-blue">E\\'lon</span>'}</span>`],
  [`<button class="act-btn" title="Tahrirlash" onclick="editNews(\${n.id})">✏️</button>`, `<button class="act-btn" title="Tahrirlash" onclick="editNews(\${n.id})">\${SVG_ICONS['edit'](13, '')}</button>`],
  [`<button class="act-btn" title="O'chirish" onclick="deleteNews(\${n.id})">🗑️</button>`, `<button class="act-btn" title="O'chirish" onclick="deleteNews(\${n.id})">\${SVG_ICONS['trash'](13, '')}</button>`],
  [`document.getElementById('newsModalTitle').textContent = '📰 Yangi e\\'lon qo\\'shish';`, `document.getElementById('newsModalTitle').textContent = 'Yangi e\\'lon qo\\'shish';`],
  [`document.getElementById('newsModalTitle').textContent = '✏️ E\\'lonni tahrirlash';`, `document.getElementById('newsModalTitle').textContent = 'E\\'lonni tahrirlash';`],
  [`return toast('⚠️ Sarlavha va e\\'lon matnini kiriting', 'error');`, `return toast('Sarlavha va e\\'lon matnini kiriting', 'error');`],
  [`toast(res.message || '🎉 E\\'lon muvaffaqiyatli saqlandi!', 'success');`, `toast(res.message || 'E\\'lon muvaffaqiyatli saqlandi!', 'success');`],
  [`toast('🗑️ E\\'lon o\\'chirildi', 'success');`, `toast('E\\'lon o\\'chirildi', 'success');`],

  // Assignments alerts & options
  [`classesContainer.innerHTML = \`<span style="color:var(--red);font-size:13px">⚠️ Ushbu o'qituvchiga ro'yxatdan o'tishda sinf biriktirilmagan.</span>\`;`,
   `classesContainer.innerHTML = \`<span style="color:var(--red);font-size:13px">Ushbu o'qituvchiga ro'yxatdan o'tishda sinf biriktirilmagan.</span>\`;`],
  [`alertEl.innerHTML = \`⚠️ <b>\${teacherObj?.full_name || res.teacher?.full_name}</b> ga ro'yxatdan o'tishda hali sinflar biriktirilmagan.\`;`,
   `alertEl.innerHTML = \`<b>\${teacherObj?.full_name || res.teacher?.full_name}</b> ga ro'yxatdan o'tishda hali sinflar biriktirilmagan.\`;`],
  [`classesContainer.innerHTML = \`<span style="color:var(--red);font-size:13px">❌ Ma'lumot olishda xatolik</span>\`;`,
   `classesContainer.innerHTML = \`<span style="color:var(--red);font-size:13px">Ma'lumot olishda xatolik</span>\`;`],
  [`subjectSelect.innerHTML = \`<option value="">❌ Ma'lumot olishda xatolik</option>\`;`,
   `subjectSelect.innerHTML = \`<option value="">Ma'lumot olishda xatolik</option>\`;`],
  [`toast(\`✅ \${res.message}\`, 'success');`, `toast(res.message, 'success');`],
  [`alertEl.textContent = \`✅ \${res.message}\`;`, `alertEl.textContent = res.message;`],
  [`toast(\`❌ \${res?.message || 'Biriktirishda xatolik yuz berdi'}\`, 'error');`, `toast(res?.message || 'Biriktirishda xatolik yuz berdi', 'error');`],
  [`alertEl.textContent = \`❌ \${res?.message || 'Biriktirishda xatolik'}\`;`, `alertEl.textContent = res?.message || 'Biriktirishda xatolik';`],

  // Schedule alerts & options
  [`schClassSelect.innerHTML = \`<option value="">❌ Biriktirilgan sinf yo'q</option>\`;`,
   `schClassSelect.innerHTML = \`<option value="">Biriktirilgan sinf yo'q</option>\`;`],
  [`alertEl.innerHTML = \`⚠️ <b>\${res.teacher.full_name}</b> ga hali sinf biriktirilmagan! Avval <a href="javascript:void(0)" onclick="navTo('assignments')" style="color:var(--accent2);font-weight:700;text-decoration:underline">"Dars biriktirish"</a> bo'limida o'qituvchini sinfga biriktiring.\`;`,
   `alertEl.innerHTML = \`<b>\${res.teacher.full_name}</b> ga hali sinf biriktirilmagan! Avval <a href="javascript:void(0)" onclick="navTo('assignments')" style="color:var(--accent2);font-weight:700;text-decoration:underline">"Dars biriktirish"</a> bo'limida o'qituvchini sinfga biriktiring.\`;`],
  [`toast(\`⚠️ \${res?.message || 'Xatolik yuz berdi'}\`, 'error');`, `toast(res?.message || 'Xatolik yuz berdi', 'error');`],
  [`alertEl.textContent = \`⚠️ \${res?.message || 'Konflikt yoki xatolik'}\`;`, `alertEl.textContent = res?.message || 'Konflikt yoki xatolik';`],
  [`toast('👋 Chiqdingiz','info');`, `toast('Tizimdan chiqdingiz','info');`],

  // Quizzes
  [`<span style="background:rgba(59,130,246,.15);color:var(--accent2);padding:4px 12px;border-radius:20px;font-size:12px;font-weight:700">\${q.subject_icon||'📚'} \${q.subject_name||''}</span>`,
   `<span style="background:var(--accent-light);color:var(--accent);padding:4px 12px;border-radius:6px;font-size:12px;font-weight:600">\${q.subject_name||''}</span>`],
  [`toast('✅ Test yaratildi! Savollar qo\\'shishingiz mumkin.','success');`, `toast('Test yaratildi! Savollar qo\\'shishingiz mumkin.','success');`],
  [`toast('✅ Savol testga muvaffaqiyatli qo\\'shildi!','success');`, `toast('Savol testga muvaffaqiyatli qo\\'shildi!','success');`],
  [`toast('🗑️ Test o\\'chirildi','success');`, `toast('Test o\\'chirildi','success');`],
  [`alert(\`🎉 Test topshirildi!\\n\\nNatija: \${r.score} / \${r.total_questions} ta to'g'ri (\${r.percentage}%)\`);`,
   `alert(\`Test topshirildi!\\n\\nNatija: \${r.score} / \${r.total_questions} ta to'g'ri (\${r.percentage}%)\`);`],

  // AI Chat
  [`⚠️ <b>Xatolik:</b> \${formatAiText(res.error)}`, `<b>Xatolik:</b> \${formatAiText(res.error)}`],
  [`<div style="font-size:10px;color:var(--text3,#64748b);margin-top:3px;padding-left:4px">❌ Gemini API Error</div>`,
   `<div style="font-size:10px;color:var(--text3,#64748b);margin-top:3px;padding-left:4px">Gemini API Error</div>`],
  [`<div style="font-size:10px;color:var(--text3,#64748b);margin-top:3px;padding-left:4px">🤖 \${provider}</div>`,
   `<div style="font-size:10px;color:var(--text3,#64748b);margin-top:3px;padding-left:4px">\${provider}</div>`],
  [`⚠️ <b>Server bilan bog'lanishda xato:</b> \${err.message}`, `<b>Server bilan bog'lanishda xato:</b> \${err.message}`],
  [`<div style="font-size:10px;color:var(--text3,#64748b);margin-top:3px;padding-left:4px">❌ Xatolik</div>`,
   `<div style="font-size:10px;color:var(--text3,#64748b);margin-top:3px;padding-left:4px">Xatolik</div>`],

  // Mock subjects
  [`{id:1,name:'Matematika',icon:'📐'`, `{id:1,name:'Matematika',icon:''`],
  [`{id:2,name:'Fizika',icon:'🔬'`, `{id:2,name:'Fizika',icon:''`],
  [`{id:3,name:'Kimyo',icon:'🧪'`, `{id:3,name:'Kimyo',icon:''`],
  [`{id:4,name:'Tarix',icon:'🌍'`, `{id:4,name:'Tarix',icon:''`],
  [`{id:5,name:'Ona tili',icon:'📖'`, `{id:5,name:'Ona tili',icon:''`],
  [`{id:6,name:'Ingliz tili',icon:'🌐'`, `{id:6,name:'Ingliz tili',icon:''`],

  // Mock videos
  [`subject_icon:'📐'`, `subject_icon:''`],
  [`subject_icon:'🔬'`, `subject_icon:''`],
  [`subject_icon:'🌍'`, `subject_icon:''`],
  [`subject_icon:'🧪'`, `subject_icon:''`],
  [`subject_icon:'📖'`, `subject_icon:''`],
  [`subject_icon:'🌐'`, `subject_icon:''`]
];

let count = 0;
for (const [target, repl] of replacements) {
  if (content.includes(target)) {
    content = content.split(target).join(repl);
    count++;
  }
}
console.log(`Executed ${count} replacements in phase 2.`);

fs.writeFileSync(filePath, content, 'utf8');
console.log('Saved index.html, new size:', content.length);
