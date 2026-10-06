const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', 'frontend', 'index.html');
let content = fs.readFileSync(filePath, 'utf8');

const replacements = [
  // Auth toasts
  [`if(!email||!pass) return toast('⚠️ Email va parolni kiriting','error');`, `if(!email||!pass) return toast('Email va parolni kiriting','error');`],
  [`toast('✅ Muvaffaqiyatli kirdingiz!','success');`, `toast('Muvaffaqiyatli kirdingiz!','success');`],
  [`toast('❌ Backendga ulanib bo\\'lmadi. Server ishlaydimi?','error');`, `toast('Backendga ulanib bo\\'lmadi. Server holatini tekshiring.','error');`],
  [`if(!full_name||!email||!password) return toast('⚠️ Barcha maydonlarni to\\'ldiring','error');`, `if(!full_name||!email||!password) return toast('Barcha maydonlarni to\\'ldiring','error');`],
  [`toast("🎉 Muvaffaqiyatli ro'yxatdan o'tdingiz!",'success');`, `toast("Muvaffaqiyatli ro'yxatdan o'tdingiz!",'success');`],
  [`toast('🔧 Demo rejim (backend ulanmagan)','info');`, `toast('Demo rejim (backend ulanmagan)','info');`],

  // Emojis mapping removal
  [`const emojis={student:'🎒',teacher:'👩‍🏫',admin:'⚙️'};`, `const emojis={student:'',teacher:'',admin:''};`],

  // Video modal
  [`document.getElementById('wmMeta').textContent = \`👩‍🏫 \${v.teacher_name || 'O\\'qituvchi'} • \${v.subject_name || 'Fan'}\`;`,
   `document.getElementById('wmMeta').textContent = \`\${v.teacher_name || 'O\\'qituvchi'} • \${v.subject_name || 'Fan'}\`;`],
  [`document.getElementById('wmViews').textContent = \`👁 \${(v.views || 0).toLocaleString()} ko'rishlar\`;`,
   `document.getElementById('wmViews').textContent = \`\${(v.views || 0).toLocaleString()} ko'rishlar\`;`],
  [`toast('⚠️ Video faylini ijro etib bo\\'lmadi', 'error');`, `toast('Video faylini ijro etib bo\\'lmadi', 'error');`],

  // Profile
  [`else pAv.textContent=emojis[u.role]||'👤';`, `else pAv.innerHTML=\`<span class="avatar-initials" style="font-size:28px">\${getInitials(u.full_name)}</span>\`;`],
  [`toast('✅ Profil saqlandi!','success');`, `toast('Profil saqlandi!','success');`],
  [`toast(res._offline?'✅ Demo: profil saqlandi (offline)':res.message||'Xato','info');`, `toast(res._offline?'Demo: profil saqlandi (offline)':res.message||'Xato','info');`],
  [`toast('✅ Avatar muvaffaqiyatli saqlandi va yangilandi!','success');`, `toast('Avatar muvaffaqiyatli saqlandi va yangilandi!','success');`],
  [`if(res.success){ closeModal('passModal'); toast('✅ Parol o\\'zgartirildi!','success'); }`, `if(res.success){ closeModal('passModal'); toast('Parol o\\'zgartirildi!','success'); }`],
  [`else toast(res._offline?'✅ Demo: parol o\\'zgartirildi':res.message||'Xato','info');`, `else toast(res._offline?'Demo: parol o\\'zgartirildi':res.message||'Xato','info');`],

  // Upload modal & content
  [`document.getElementById('uploadModalTitle').textContent=type==='video'?'🎬 Video dars yuklash':'📄 Darslik (PDF) yuklash';`,
   `document.getElementById('uploadModalTitle').textContent=type==='video'?'Video dars yuklash':'Darslik (PDF) yuklash';`],
  [`document.getElementById('uploadIcon').textContent=type==='video'?'🎬':'📄';`,
   `document.getElementById('uploadIcon').innerHTML=type==='video'?SVG_ICONS['video'](36, ''):SVG_ICONS['book-open'](36, '');`],
  [`document.getElementById('uploadDropText').innerHTML=\`✅ <span>\${f.name}</span> (\${(f.size/1024/1024).toFixed(1)} MB)\`;`,
   `document.getElementById('uploadDropText').innerHTML=\`<span>\${f.name}</span> (\${(f.size/1024/1024).toFixed(1)} MB)\`;`],
  [`if(res.success){ closeModal('uploadModal'); toast('✅ Muvaffaqiyatli yuklandi!','success'); loadMyContent(); }`,
   `if(res.success){ closeModal('uploadModal'); toast('Muvaffaqiyatli yuklandi!','success'); loadMyContent(); }`],
  [`closeModal('uploadModal'); toast('✅ Demo: yuklandi (offline)','info');`,
   `closeModal('uploadModal'); toast('Demo: yuklandi (offline)','info');`],
  [`setTimeout(()=>{ closeModal('uploadModal'); toast('🔧 Demo: yuklandi (offline)','info'); },1500);`,
   `setTimeout(()=>{ closeModal('uploadModal'); toast('Demo: yuklandi (offline)','info'); },1500);`],
  [`<span>\${c._type==='video'?'🎬 Video':'📄 Darslik'}</span>`,
   `<span>\${c._type==='video'?'Video':'Darslik'}</span>`],
  [`\${c.is_published?'👁':'✅'}`,
   `\${c.is_published?'Faol':'Qoralama'}`],
  [`<button class="act-btn" onclick="deleteContent('\${c._type}',\${c.id})">🗑️</button>`,
   `<button class="act-btn" onclick="deleteContent('\${c._type}',\${c.id})">\${SVG_ICONS['trash'](13, '')}</button>`],
  [`if(res.success||res._offline){ toast(val?'✅ Chiqarildi':'Qoralamaga qaytarildi','success'); loadMyContent(); }`,
   `if(res.success||res._offline){ toast(val?'Chiqarildi':'Qoralamaga qaytarildi','success'); loadMyContent(); }`],
  [`if(res.success||res._offline){ toast("🗑️ O'chirildi",'success'); loadMyContent(); }`,
   `if(res.success||res._offline){ toast("O'chirildi",'success'); loadMyContent(); }`],

  // Subject dropdowns
  [`const allOpts = allSubjects.map(s=>\`<option value="\${s.id}">\${s.icon||'📚'} \${s.name}</option>\`).join('');`,
   `const allOpts = allSubjects.map(s=>\`<option value="\${s.id}">\${s.name}</option>\`).join('');`],
  [`const teacherOpts = teacherSubjects.map(s=>\`<option value="\${s.id}">\${s.icon||'📚'} \${s.name}</option>\`).join('');`,
   `const teacherOpts = teacherSubjects.map(s=>\`<option value="\${s.id}">\${s.name}</option>\`).join('');`],

  // Teacher grading classes
  [`selectEl.innerHTML = \`<option value="">❌ Biriktirilgan sinflar yo'q</option>\`;`,
   `selectEl.innerHTML = \`<option value="">Biriktirilgan sinflar yo'q</option>\`;`],
  [`<div style="font-size:44px;margin-bottom:12px">📚</div>`,
   `<div style="margin-bottom:12px;display:flex;justify-content:center">\${SVG_ICONS['book-open'](44, '')}</div>`],
  [`if (classTitle) classTitle.textContent = \`👥 \${res.class_name} sinfi o'quvchilari\`;`,
   `if (classTitle) classTitle.textContent = \`\${res.class_name} sinfi o'quvchilari\`;`],

  // Options mock
  [`<option value="1">📐 Matematika</option>`, `<option value="1">Matematika</option>`],
  [`<option value="7">📚 O'qish</option>`, `<option value="7">O'qish</option>`],
  [`<option value="8">🌱 Tabiatshunoslik</option>`, `<option value="8">Tabiatshunoslik</option>`],

  // Assignments cached list
  [`cachedTeachersList.map(t => \`<option value="\${t.id}">👨‍🏫 \${t.full_name} (\${t.email})\${t.subject ? ' — ' + t.subject : ''}</option>\`).join('');`,
   `cachedTeachersList.map(t => \`<option value="\${t.id}">\${t.full_name} (\${t.email})\${t.subject ? ' — ' + t.subject : ''}</option>\`).join('');`],
  [`subjectSelect.innerHTML = \`<option value="\${matchedSub.id}">📚 \${matchedSub.name} (Asosiy fan — Avtomatik)</option>\`;`,
   `subjectSelect.innerHTML = \`<option value="\${matchedSub.id}">\${matchedSub.name} (Asosiy fan — Avtomatik)</option>\`;`],

  // Schedule options
  [`\`<option value="\${c.id}">🎒 \${c.name} (\${c.grade_level}-sinf)</option>\``,
   `\`<option value="\${c.id}">\${c.name} (\${c.grade_level}-sinf)</option>\``],
  [`\`<option value="\${s.id}">\${s.icon || '📚'} \${s.name}</option>\``,
   `\`<option value="\${s.id}">\${s.name}</option>\``],

  // Theme icons
  [`if (savedTheme === 'light') { document.documentElement.classList.add('light-mode'); updateThemeIcons('☀️'); }`,
   `if (savedTheme === 'light') { document.documentElement.classList.add('light-mode'); updateThemeIcons(true); }`],
  [`updateThemeIcons(isLight ? '☀️' : '🌙');`,
   `updateThemeIcons(isLight);`],

  // My class refresh buttons
  [`<button class="btn btn-ghost" onclick="loadMyClass()">🔄 Yangilash</button>`,
   `<button class="btn btn-ghost" onclick="loadMyClass()">Yangilash</button>`],

  // Subject detail
  [`currentSubjectDetail = subjects.find(s => s.id === subjectId) || { id: subjectId, name: 'Fan darsligi', icon: '📚' };`,
   `currentSubjectDetail = subjects.find(s => s.id === subjectId) || { id: subjectId, name: 'Fan darsligi', icon: '' };`],
  [`document.getElementById('sdIcon').textContent = currentSubjectDetail.icon || '📚';`,
   `document.getElementById('sdIcon').innerHTML = SVG_ICONS['book-open'](28, '');`]
];

let count = 0;
for (const [target, repl] of replacements) {
  if (content.includes(target)) {
    content = content.split(target).join(repl);
    count++;
  }
}
console.log(`Executed ${count} replacements in phase 3.`);

fs.writeFileSync(filePath, content, 'utf8');
console.log('Saved index.html, new size:', content.length);
