
// ═══════════════════════════════════════════
// CONFIG
// ═══════════════════════════════════════════
const API = 'http://localhost:5000/api'; // Backend URL — o'zgartiring
let token = localStorage.getItem('ss_token');
let currentUser = JSON.parse(localStorage.getItem('ss_user') || 'null');
let loginRole = 'student';
let regRole   = 'student';
let uploadType = 'lesson';

// ═══════════════════════════════════════════
// PARTICLES
// ═══════════════════════════════════════════
const pc = document.getElementById('particles');
for(let i=0;i<28;i++){
  const p=document.createElement('div'); p.className='particle';
  p.style.cssText=`left:${Math.random()*100}%;top:${Math.random()*100}%;animation-duration:${5+Math.random()*8}s;animation-delay:${Math.random()*6}s;opacity:${.1+Math.random()*.25};width:${1+Math.random()*2}px;height:${1+Math.random()*2}px`;
  pc.appendChild(p);
}

// ═══════════════════════════════════════════
// API HELPER
// ═══════════════════════════════════════════
async function api(method, path, body=null, isForm=false){
  const opts = { method, headers: {} };
  if(token) opts.headers['Authorization'] = 'Bearer '+token;
  if(body && !isForm){ opts.headers['Content-Type']='application/json'; opts.body=JSON.stringify(body); }
  else if(body && isForm){ opts.body=body; }
  try {
    const r = await fetch(API+path, opts);
    return await r.json();
  } catch(e) {
    // Backend ulanmagan bo'lsa mock data qaytarish
    return { success: false, _offline: true };
  }
}

// ═══════════════════════════════════════════
// SCREENS
// ═══════════════════════════════════════════
function showScreen(id){
  document.querySelectorAll('.screen').forEach(s=>s.classList.remove('active'));
  document.getElementById(id).classList.add('active');
}
function gotoAuth(tab){ showScreen('auth'); switchTab(tab); }

// ═══════════════════════════════════════════
// AUTH
// ═══════════════════════════════════════════
function switchTab(tab){
  document.getElementById('loginForm').style.display = tab==='login'?'block':'none';
  document.getElementById('registerForm').style.display = tab==='register'?'block':'none';
  document.getElementById('tabLogin').classList.toggle('active', tab==='login');
  document.getElementById('tabReg').classList.toggle('active', tab==='register');
  document.getElementById('authTitle').textContent = tab==='login'?'Kirish':"Ro'yxatdan o'tish";
}
function selRole(prefix, r){
  if(prefix==='l') loginRole=r;
  else { regRole=r; document.getElementById('classRow').style.display=r==='student'?'block':'none'; }
  const p = prefix==='l'?'lr':'rr';
  ['student','teacher','admin'].forEach(x=>document.getElementById(`${p}_${x}`).classList.toggle('active',x===r));
}

async function doLogin(){
  const email=document.getElementById('lEmail').value.trim();
  const pass =document.getElementById('lPass').value.trim();
  if(!email||!pass) return toast('⚠️ Email va parolni kiriting','error');

  setBtnLoading('loginBtn',true,'Kirish...');
  const res = await api('POST','/auth/login',{email,password:pass});
  setBtnLoading('loginBtn',false,'Kirish →');

  if(res.success){
    token=res.token; currentUser=res.user;
    localStorage.setItem('ss_token',token);
    localStorage.setItem('ss_user',JSON.stringify(currentUser));
    initDashboard();
    showScreen('dashboard');
    toast('✅ Muvaffaqiyatli kirdingiz!','success');
  } else if(res._offline){
    // Demo mode — backend yo'q bo'lsa
    currentUser={id:1,full_name:email.split('@')[0],email,role:loginRole,avatar_url:null};
    token='demo_token'; localStorage.setItem('ss_token',token); localStorage.setItem('ss_user',JSON.stringify(currentUser));
    initDashboard(); showScreen('dashboard'); toast('🔧 Demo rejim (backend ulanmagan)','info');
  } else {
    toast(res.message||'Xato yuz berdi','error');
  }
}

async function doRegister(){
  const full_name=document.getElementById('rName').value.trim();
  const email    =document.getElementById('rEmail').value.trim();
  const password =document.getElementById('rPass').value.trim();
  const class_name=document.getElementById('rClass').value;
  if(!full_name||!email||!password) return toast('⚠️ Barcha maydonlarni to\'ldiring','error');

  setBtnLoading('regBtn',true,'Yuklanmoqda...');
  const res = await api('POST','/auth/register',{full_name,email,password,role:regRole,class_name});
  setBtnLoading('regBtn',false,"Ro'yxatdan o'tish →");

  if(res.success){
    token=res.token; currentUser=res.user;
    localStorage.setItem('ss_token',token);
    localStorage.setItem('ss_user',JSON.stringify(currentUser));
    initDashboard(); showScreen('dashboard');
    toast("🎉 Muvaffaqiyatli ro'yxatdan o'tdingiz!",'success');
  } else if(res._offline){
    currentUser={id:Date.now(),full_name,email,role:regRole,class_name,avatar_url:null};
    token='demo_token'; localStorage.setItem('ss_token',token); localStorage.setItem('ss_user',JSON.stringify(currentUser));
    initDashboard(); showScreen('dashboard'); toast('🔧 Demo rejim (backend ulanmagan)','info');
  } else {
    toast(res.message||'Xato yuz berdi','error');
  }
}

// ═══════════════════════════════════════════
// DASHBOARD INIT
// ═══════════════════════════════════════════
function initDashboard(){
  if(!currentUser) return;
  const {full_name,email,role,avatar_url} = currentUser;
  const emojis={student:'🎒',teacher:'👩‍🏫',admin:'⚙️'};
  const labels={student:"O'quvchi",teacher:"O'qituvchi",admin:'Admin'};
  const rbClass={student:'rb-student',teacher:'rb-teacher',admin:'rb-admin'};

  // Sidebar user
  setAvatar('sAvatar', avatar_url, emojis[role]);
  setAvatar('topAvatar', avatar_url, emojis[role]);
  document.getElementById('sName').textContent=full_name;
  document.getElementById('sEmail').textContent=email;
  const rb=document.getElementById('sRoleBadge');
  rb.textContent=labels[role]; rb.className='role-badge '+rbClass[role];

  // Role-specific nav
  const isTeacher=role==='teacher'||role==='admin';
  const isAdmin=role==='admin';
  document.getElementById('teacherSec').style.display=isTeacher?'block':'none';
  document.getElementById('nav_upload').style.display=isTeacher?'flex':'none';
  document.getElementById('nav_myclass').style.display=isTeacher?'flex':'none';
  document.getElementById('adminSec').style.display=isAdmin?'block':'none';
  document.getElementById('nav_users').style.display=isAdmin?'flex':'none';
  document.getElementById('nav_analytics').style.display=isAdmin?'flex':'none';

  // Load data
  loadHomeData();
}

function setAvatar(elId, url, emoji){
  const el=document.getElementById(elId);
  if(url){ el.innerHTML=`<img src="${url}" alt="avatar">`; }
  else    { el.textContent=emoji; }
}

// ═══════════════════════════════════════════
// NAV
// ═══════════════════════════════════════════
const titles={home:'Bosh sahifa',subjects:'Darsliklar',videos:'Video darslar',ai:'AI Yordamchi',profile:'Profilim',upload:'Kontent yuklash',myclass:'Mening sinfim',users:'Foydalanuvchilar',analytics:'Statistika'};
function navTo(sec){
  document.querySelectorAll('.nav-item').forEach(n=>n.classList.remove('active'));
  const ni=document.getElementById('nav_'+sec);
  if(ni) ni.classList.add('active');
  document.querySelectorAll('.cs').forEach(s=>s.classList.remove('active'));
  const cs=document.getElementById('cs_'+sec);
  if(cs) cs.classList.add('active');
  document.getElementById('topTitle').textContent=titles[sec]||sec;

  // Lazy load
  if(sec==='subjects')  loadSubjects();
  if(sec==='videos')    loadVideos();
  if(sec==='profile')   loadProfile();
  if(sec==='upload')    loadMyContent();
  if(sec==='users')     loadUsers();
  if(sec==='analytics') loadStats();
}

// ═══════════════════════════════════════════
// HOME DATA
// ═══════════════════════════════════════════
async function loadHomeData(){
  loadSubjectsInto('homeSubjects', 3);
  if(currentUser?.role==='student'){
    const res=await api('GET','/profile/me');
    if(res.success){
      document.getElementById('hc1').textContent=res.stats.lessons_done||0;
      document.getElementById('hc2').textContent=res.stats.videos_done||0;
      document.getElementById('hc3').textContent=res.stats.tasks_done||0;
    }
  }
}

// ═══════════════════════════════════════════
// SUBJECTS
// ═══════════════════════════════════════════
const mockSubjects=[
  {id:1,name:'Matematika',icon:'📐',color:'#3b82f6',lesson_count:45,video_count:12,bg:'linear-gradient(135deg,rgba(59,130,246,.2),rgba(139,92,246,.2))'},
  {id:2,name:'Fizika',icon:'🔬',color:'#10b981',lesson_count:38,video_count:9,bg:'linear-gradient(135deg,rgba(16,185,129,.2),rgba(6,182,212,.2))'},
  {id:3,name:'Kimyo',icon:'🧪',color:'#8b5cf6',lesson_count:40,video_count:8,bg:'linear-gradient(135deg,rgba(139,92,246,.2),rgba(59,130,246,.2))'},
  {id:4,name:'Tarix',icon:'🌍',color:'#f59e0b',lesson_count:52,video_count:15,bg:'linear-gradient(135deg,rgba(245,158,11,.2),rgba(239,68,68,.2))'},
  {id:5,name:'Ona tili',icon:'📖',color:'#06b6d4',lesson_count:60,video_count:18,bg:'linear-gradient(135deg,rgba(6,182,212,.2),rgba(16,185,129,.2))'},
  {id:6,name:'Ingliz tili',icon:'🌐',color:'#ef4444',lesson_count:48,video_count:20,bg:'linear-gradient(135deg,rgba(239,68,68,.2),rgba(245,158,11,.2))'},
];

async function loadSubjectsInto(containerId, limit=99){
  const el=document.getElementById(containerId);
  const res=await api('GET','/subjects');
  const subjects=res.success?res.subjects:mockSubjects.slice(0,limit);
  el.innerHTML=subjects.slice(0,limit).map(s=>subjectCard(s)).join('');
}
function loadSubjects(){ loadSubjectsInto('subjectsGrid'); }

function subjectCard(s){
  const bg=s.bg||`linear-gradient(135deg,rgba(59,130,246,.15),rgba(139,92,246,.15))`;
  return `<div class="subject-card">
    <div class="subject-cover" style="background:${bg}">${s.icon||'📚'}</div>
    <div class="subject-info">
      <h3>${s.name}</h3>
      <p>${s.class_name||''} • ${s.lesson_count||0} dars • ${s.video_count||0} video</p>
      <div class="progress-bar"><div class="progress-fill" style="width:${Math.floor(Math.random()*60+20)}%"></div></div>
      <div class="progress-text"><span>Progress</span><span>${s.lesson_count||0} ta dars</span></div>
    </div>
  </div>`;
}

// ═══════════════════════════════════════════
// VIDEOS
// ═══════════════════════════════════════════
const mockVideos=[
  {id:1,title:'Kvadrat tenglamalar — to\'liq qo\'llanma',subject_name:'Matematika',subject_icon:'📐',subject_color:'#3b82f6',teacher_name:'Nilufar o\'qituvchi',views:2400,duration_sec:1122,thumbnail_url:null},
  {id:2,title:'Nyuton qonunlari — amaliy misollar',subject_name:'Fizika',subject_icon:'🔬',subject_color:'#10b981',teacher_name:'Bobur o\'qituvchi',views:1800,duration_sec:1455,thumbnail_url:null},
  {id:3,title:'O\'zbekiston mustaqilligi tarixi',subject_name:'Tarix',subject_icon:'🌍',subject_color:'#ef4444',teacher_name:'Malika o\'qituvchi',views:3100,duration_sec:1928,thumbnail_url:null},
  {id:4,title:'Davriy sistema elementlari',subject_name:'Kimyo',subject_icon:'🧪',subject_color:'#8b5cf6',teacher_name:'Sardor o\'qituvchi',views:1200,duration_sec:930,thumbnail_url:null},
  {id:5,title:'Fe\'l zamonlari — grammatika',subject_name:'Ona tili',subject_icon:'📖',subject_color:'#06b6d4',teacher_name:'Dilnoza o\'qituvchi',views:2000,duration_sec:1725,thumbnail_url:null},
  {id:6,title:'Past Tense vs Present Perfect',subject_name:'Ingliz tili',subject_icon:'🌐',subject_color:'#f59e0b',teacher_name:'Jasur o\'qituvchi',views:4200,duration_sec:1278,thumbnail_url:null},
];

async function loadVideos(q=''){
  const el=document.getElementById('videosGrid');
  const res=await api('GET','/videos'+(q?`?search=${encodeURIComponent(q)}`:''));
  const videos=res.success?res.videos:mockVideos;
  if(!videos.length){ el.innerHTML='<div style="color:var(--text2);font-size:14px">Video topilmadi.</div>'; return; }
  el.innerHTML=videos.map(v=>videoCard(v)).join('');
}

function videoCard(v){
  const dur=v.duration_sec?`${Math.floor(v.duration_sec/60)}:${String(v.duration_sec%60).padStart(2,'0')}`:'—';
  const bg=`background:linear-gradient(135deg,rgba(${hexToRgb(v.subject_color||'#3b82f6')},.25),rgba(0,0,0,.4))`;
  const thumb=v.thumbnail_url?`<img src="${v.thumbnail_url}" alt="">`:'';
  return `<div class="video-card">
    <div class="video-thumb" style="${bg}">${thumb}
      <div class="play-btn">▶</div>
      <div class="v-duration">${dur}</div>
      <div class="v-tag" style="background:${v.subject_color||'#3b82f6'}cc">${v.subject_icon||''} ${v.subject_name||''}</div>
    </div>
    <div class="video-info">
      <h3>${v.title}</h3>
      <div class="video-meta"><span>👁 ${(v.views||0).toLocaleString()}</span><span>👩‍🏫 ${v.teacher_name||''}</span></div>
    </div>
  </div>`;
}

let searchTimer;
function searchVideos(q){ clearTimeout(searchTimer); searchTimer=setTimeout(()=>loadVideos(q),400); }

// ═══════════════════════════════════════════
// PROFILE
// ═══════════════════════════════════════════
async function loadProfile(){
  const res=await api('GET','/profile/me');
  const u=res.success?res.user:currentUser;
  if(!u) return;

  document.getElementById('pName').value=u.full_name||'';
  document.getElementById('pEmail').value=u.email||'';
  document.getElementById('pPhone').value=u.phone||'';
  document.getElementById('pBio').value=u.bio||'';
  document.getElementById('pSubject').value=u.subject||u.class_name||'';

  const emojis={student:'🎒',teacher:'👩‍🏫',admin:'⚙️'};
  const pAv=document.getElementById('profileAvatar');
  if(u.avatar_url) pAv.innerHTML=`<img src="${u.avatar_url}" alt="avatar">`;
  else pAv.textContent=emojis[u.role]||'👤';

  // Stats
  if(res.stats){
    const s=res.stats;
    const statsEl=document.getElementById('profileStats');
    if(u.role==='student'){
      statsEl.innerHTML=`
        <div class="dc dc-blue"><div class="dc-lbl">Darslar</div><div class="dc-num" style="color:var(--accent2)">${s.lessons_done}</div></div>
        <div class="dc dc-green"><div class="dc-lbl">Videolar</div><div class="dc-num" style="color:var(--green)">${s.videos_done}</div></div>
        <div class="dc dc-gold"><div class="dc-lbl">Topshiriqlar</div><div class="dc-num" style="color:var(--gold)">${s.tasks_done}</div></div>`;
    } else {
      statsEl.innerHTML=`
        <div class="dc dc-blue"><div class="dc-lbl">Darsliklar</div><div class="dc-num" style="color:var(--accent2)">${s.lessons_created}</div></div>
        <div class="dc dc-green"><div class="dc-lbl">Videolar</div><div class="dc-num" style="color:var(--green)">${s.videos_created}</div></div>
        <div class="dc dc-gold"><div class="dc-lbl">Topshiriqlar</div><div class="dc-num" style="color:var(--gold)">${s.tasks_created}</div></div>`;
    }
  }
}

async function saveProfile(){
  const body={
    full_name: document.getElementById('pName').value.trim(),
    phone:     document.getElementById('pPhone').value.trim(),
    bio:       document.getElementById('pBio').value.trim(),
  };
  const subVal=document.getElementById('pSubject').value.trim();
  if(currentUser?.role==='student') body.class_name=subVal;
  else body.subject=subVal;

  const res=await api('PUT','/profile/update',body);
  if(res.success){
    currentUser={...currentUser,...res.user};
    localStorage.setItem('ss_user',JSON.stringify(currentUser));
    document.getElementById('sName').textContent=currentUser.full_name;
    toast('✅ Profil saqlandi!','success');
  } else {
    toast(res._offline?'✅ Demo: profil saqlandi (offline)':res.message||'Xato','info');
  }
}

async function uploadAvatar(input){
  if(!input.files[0]) return;
  const fd=new FormData(); fd.append('avatar',input.files[0]);
  const res=await api('POST','/profile/avatar',fd,true);
  if(res.success){
    currentUser.avatar_url=res.user.avatar_url;
    localStorage.setItem('ss_user',JSON.stringify(currentUser));
    setAvatar('sAvatar',res.user.avatar_url,null);
    setAvatar('topAvatar',res.user.avatar_url,null);
    const pAv=document.getElementById('profileAvatar');
    pAv.innerHTML=`<img src="${res.user.avatar_url}" alt="avatar">`;
    toast('✅ Avatar yangilandi!','success');
  } else {
    // Demo: show preview
    const url=URL.createObjectURL(input.files[0]);
    document.getElementById('profileAvatar').innerHTML=`<img src="${url}" alt="avatar">`;
    document.getElementById('sAvatar').innerHTML=`<img src="${url}" alt="avatar">`;
    document.getElementById('topAvatar').innerHTML=`<img src="${url}" alt="avatar">`;
    toast('🔧 Demo: avatar yangilandi (offline)','info');
  }
}

function openPassModal(){ document.getElementById('passModal').style.display='block'; }
async function changePassword(){
  const old_password=document.getElementById('oldPass').value;
  const new_password=document.getElementById('newPass').value;
  if(!old_password||!new_password) return toast('Iltimos maydonlarni to\'ldiring','error');
  const res=await api('PUT','/profile/change-password',{old_password,new_password});
  if(res.success){ closeModal('passModal'); toast('✅ Parol o\'zgartirildi!','success'); }
  else toast(res._offline?'✅ Demo: parol o\'zgartirildi':res.message||'Xato','info');
}

// ═══════════════════════════════════════════
// UPLOAD
// ═══════════════════════════════════════════
function openUploadModal(type){
  uploadType=type;
  document.getElementById('uploadModal').style.display='block';
  document.getElementById('uploadModalTitle').textContent=type==='video'?'🎬 Video dars yuklash':'📄 Darslik (PDF) yuklash';
  document.getElementById('uploadIcon').textContent=type==='video'?'🎬':'📄';
  document.getElementById('uploadDropText').innerHTML=type==='video'
    ?'MP4, MOV fayl tashlang yoki <span>tanlang</span>'
    :'PDF fayl tashlang yoki <span>tanlang</span>';
  document.getElementById('uploadFileInput').accept=type==='video'?'video/*':'.pdf';
  document.getElementById('uploadProgress').style.display='none';
}

function fileSelected(input){
  if(!input.files[0]) return;
  const f=input.files[0];
  document.getElementById('uploadDropText').innerHTML=`✅ <span>${f.name}</span> (${(f.size/1024/1024).toFixed(1)} MB)`;
}

async function submitUpload(){
  const title   =document.getElementById('uploadTitle').value.trim();
  const desc    =document.getElementById('uploadDesc').value.trim();
  const subjectId=document.getElementById('uploadSubject').value;
  const file    =document.getElementById('uploadFileInput').files[0];

  if(!title)    return toast('Sarlavha kiriting','error');
  if(!subjectId) return toast('Fan tanlang','error');
  if(!file)     return toast('Fayl tanlang','error');

  const fd=new FormData();
  fd.append('title',title); fd.append('description',desc); fd.append('subject_id',subjectId);
  if(uploadType==='video'){ fd.append('video',file); }
  else                     { fd.append('file',file); }

  // Show progress
  document.getElementById('uploadProgress').style.display='block';
  document.getElementById('uploadSubmitBtn').disabled=true;

  // Simulate progress (real upload via XHR for progress)
  await uploadWithProgress(fd, uploadType==='video'?'/videos':'/lessons');
}

function uploadWithProgress(fd, endpoint){
  return new Promise((resolve)=>{
    const xhr=new XMLHttpRequest();
    xhr.open('POST', API+endpoint);
    if(token) xhr.setRequestHeader('Authorization','Bearer '+token);

    xhr.upload.onprogress=(e)=>{
      if(e.lengthComputable){
        const pct=Math.round(e.loaded/e.total*100);
        document.getElementById('upFill').style.width=pct+'%';
        document.getElementById('upPct').textContent=pct+'%';
        document.getElementById('upStatus').textContent=pct<100?'Yuklanmoqda...':'Qayta ishlanyapti...';
      }
    };
    xhr.onload=()=>{
      document.getElementById('uploadSubmitBtn').disabled=false;
      try{
        const res=JSON.parse(xhr.responseText);
        if(res.success){ closeModal('uploadModal'); toast('✅ Muvaffaqiyatli yuklandi!','success'); loadMyContent(); }
        else toast(res.message||'Xato','error');
      }catch(e){
        closeModal('uploadModal'); toast('✅ Demo: yuklandi (offline)','info');
      }
      resolve();
    };
    xhr.onerror=()=>{
      document.getElementById('uploadSubmitBtn').disabled=false;
      document.getElementById('upFill').style.width='100%';
      document.getElementById('upStatus').textContent='Demo rejim — backend ulanmagan';
      setTimeout(()=>{ closeModal('uploadModal'); toast('🔧 Demo: yuklandi (offline)','info'); },1500);
      resolve();
    };
    xhr.send(fd);
  });
}

async function loadMyContent(){
  const tbl=document.getElementById('myContentTable');
  const [lRes,vRes]=await Promise.all([api('GET','/lessons'),api('GET','/videos')]);
  const lessons=(lRes.success?lRes.lessons:[]).map(l=>({...l,_type:'lesson'}));
  const videos=(vRes.success?vRes.videos:[]).map(v=>({...v,_type:'video'}));
  const all=[...lessons,...videos].sort((a,b)=>new Date(b.created_at)-new Date(a.created_at));

  if(!all.length){
    tbl.innerHTML=`<div class="tbl-head tbl-cols-4"><span>Sarlavha</span><span>Tur</span><span>Status</span><span>Amallar</span></div>
      <div style="padding:20px;color:var(--text2);font-size:14px">Hali kontent yuklanmagan.</div>`; return;
  }
  tbl.innerHTML=`<div class="tbl-head tbl-cols-4"><span>Sarlavha</span><span>Tur</span><span>Status</span><span>Amallar</span></div>`
    + all.slice(0,20).map(c=>`
    <div class="tbl-row tbl-cols-4">
      <span>${c.title}</span>
      <span>${c._type==='video'?'🎬 Video':'📄 Darslik'}</span>
      <span><span class="sb ${c.is_published?'sb-green':'sb-blue'}">${c.is_published?'Chiqarilgan':'Qoralama'}</span></span>
      <div class="act-btns">
        <button class="act-btn" onclick="togglePublish('${c._type}',${c.id},${!c.is_published})">
          ${c.is_published?'👁':'✅'}
        </button>
        <button class="act-btn" onclick="deleteContent('${c._type}',${c.id})">🗑️</button>
      </div>
    </div>`).join('');
}

async function togglePublish(type, id, val){
  const endpoint=type==='video'?`/videos/${id}`:`/lessons/${id}`;
  const res=await api('PUT',endpoint,{is_published:val});
  if(res.success||res._offline){ toast(val?'✅ Chiqarildi':'Qoralamaga qaytarildi','success'); loadMyContent(); }
}
async function deleteContent(type, id){
  if(!confirm('Rostdan ham o\'chirmoqchimisiz?')) return;
  const endpoint=type==='video'?`/videos/${id}`:`/lessons/${id}`;
  const res=await api('DELETE',endpoint);
  if(res.success||res._offline){ toast('🗑️ O\'chirildi','success'); loadMyContent(); }
}

// ═══════════════════════════════════════════
// ADMIN - USERS
// ═══════════════════════════════════════════
async function loadUsers(){
  const tbl=document.getElementById('usersTable');
  const res=await api('GET','/admin/users');
  const users=res.success?res.users:[
    {id:1,full_name:'Alisher Karimov',email:'alisher@school.uz',role:'student',is_active:true},
    {id:2,full_name:'Nilufar Toshmatova',email:'nilufar@school.uz',role:'teacher',is_active:true},
    {id:3,full_name:'Admin User',email:'admin@school.uz',role:'admin',is_active:true},
  ];
  const rbMap={student:'rb-student',teacher:'rb-teacher',admin:'rb-admin'};
  const rlMap={student:"O'quvchi",teacher:"O'qituvchi",admin:'Admin'};
  tbl.innerHTML=`<div class="tbl-head tbl-cols-5"><span>Ism</span><span>Email</span><span>Rol</span><span>Status</span><span>Amallar</span></div>`
    +users.map(u=>`
    <div class="tbl-row tbl-cols-5">
      <span>${u.full_name}</span><span>${u.email}</span>
      <span><span class="role-badge ${rbMap[u.role]||'rb-student'}">${rlMap[u.role]||u.role}</span></span>
      <span><span class="sb ${u.is_active?'sb-green':'sb-red'}">${u.is_active?'Faol':'Bloklangan'}</span></span>
      <div class="act-btns">
        <button class="act-btn" onclick="toggleUserActive(${u.id})">${u.is_active?'🔒':'🔓'}</button>
        <button class="act-btn" onclick="deleteUser(${u.id})">🗑️</button>
      </div>
    </div>`).join('');
}

async function toggleUserActive(id){
  const res=await api('PUT',`/admin/users/${id}/toggle-active`);
  toast(res.success?res.message:'🔧 Demo: holat o\'zgartirildi','info');
  loadUsers();
}
async function deleteUser(id){
  if(!confirm('Foydalanuvchini o\'chirishni tasdiqlaysizmi?')) return;
  const res=await api('DELETE',`/admin/users/${id}`);
  toast(res.success?'O\'chirildi':'🔧 Demo: o\'chirildi','info');
  loadUsers();
}

// ═══════════════════════════════════════════
// ADMIN - STATS
// ═══════════════════════════════════════════
async function loadStats(){
  const res=await api('GET','/admin/stats');
  if(res.success){
    const s=res.stats;
    document.getElementById('st_users').textContent=s.total_users;
    document.getElementById('st_students').textContent=s.total_students;
    document.getElementById('st_teachers').textContent=s.total_teachers;
    document.getElementById('st_views').textContent=s.total_views;
  }
}

// ═══════════════════════════════════════════
// AI CHAT
// ═══════════════════════════════════════════
async function sendAI(){
  const input=document.getElementById('aiInput');
  const text=input.value.trim();
  if(!text) return;
  input.value='';
  appendMsg(text,'user');
  const typing=appendTyping();
  try {
    const r=await fetch('https://api.anthropic.com/v1/messages',{
      method:'POST', headers:{'Content-Type':'application/json'},
      body:JSON.stringify({
        model:'claude-sonnet-4-20250514', max_tokens:1000,
        system:`Sen SmartSchool platformasining AI yordamchisisn. O'zbek tilida javob ber. O'quvchilarga maktab fanlarida yordam ber. Javoblarni qisqa, aniq va tushunarli qil.`,
        messages:[{role:'user',content:text}]
      })
    });
    typing.remove();
    if(r.ok){ const d=await r.json(); appendMsg(d.content?.map(b=>b.text||'').join('')||'Javob bera olmadim.','ai'); }
    else appendMsg('Hozircha javob bera olmayapman.','ai');
  } catch(e) { typing.remove(); appendMsg('Internet aloqasida muammo.','ai'); }
}

function appendMsg(text,who){
  const msgs=document.getElementById('aiMsgs');
  const d=document.createElement('div'); d.className=`msg msg-${who}`;
  const t=new Date().toLocaleTimeString('uz-UZ',{hour:'2-digit',minute:'2-digit'});
  d.innerHTML=`<div class="msg-bubble">${text.replace(/\n/g,'<br>')}</div><div class="msg-time">${t}</div>`;
  msgs.appendChild(d); msgs.scrollTop=msgs.scrollHeight; return d;
}
function appendTyping(){
  const msgs=document.getElementById('aiMsgs');
  const d=document.createElement('div'); d.className='msg msg-ai';
  d.innerHTML='<div class="msg-bubble"><div class="typing"><div class="td"></div><div class="td"></div><div class="td"></div></div></div>';
  msgs.appendChild(d); msgs.scrollTop=msgs.scrollHeight; return d;
}

// ═══════════════════════════════════════════
// UTILS
// ═══════════════════════════════════════════
function closeModal(id){ document.getElementById(id).style.display='none'; }

function toast(msg,type='info'){
  const t=document.createElement('div'); t.className=`toast ${type}`;
  t.textContent=msg; document.body.appendChild(t);
  setTimeout(()=>t.remove(),3200);
}

function setBtnLoading(id,loading,text){
  const b=document.getElementById(id);
  if(!b) return;
  b.disabled=loading;
  b.innerHTML=loading?`<span class="spinner"></span>${text}`:text;
}

function hexToRgb(hex){
  const r=parseInt(hex.slice(1,3),16),g=parseInt(hex.slice(3,5),16),b=parseInt(hex.slice(5,7),16);
  return `${r},${g},${b}`;
}

function doLogout(){
  localStorage.removeItem('ss_token'); localStorage.removeItem('ss_user');
  token=null; currentUser=null;
  showScreen('landing'); toast('👋 Chiqtingiz','info');
}

// ═══════════════════════════════════════════
// THEME (DAY / NIGHT)
// ═══════════════════════════════════════════
const savedTheme = localStorage.getItem('ss_theme') || 'dark';
if (savedTheme === 'light') { document.documentElement.classList.add('light-mode'); updateThemeIcons('☀️'); }

function toggleTheme() {
  const isLight = document.documentElement.classList.toggle('light-mode');
  localStorage.setItem('ss_theme', isLight ? 'light' : 'dark');
  updateThemeIcons(isLight ? '☀️' : '🌙');
}

function updateThemeIcons(icon) {
  const b1 = document.getElementById('themeBtn1');
  const b2 = document.getElementById('themeBtn2');
  if (b1) b1.textContent = icon;
  if (b2) b2.textContent = icon;
}

// Auto-login if token exists
if(token && currentUser){ initDashboard(); showScreen('dashboard'); }

