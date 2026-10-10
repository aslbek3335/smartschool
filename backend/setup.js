/**
 * SmartSchool — To'liq DB Setup & Seed Skripti
 * Foydalanish: node setup.js   yoki   npm run setup
 *
 * Bu skript:
 *  1. Barcha jadvallarni yaratadi (IF NOT EXISTS — xavfsiz)
 *  2. Standart sinflar, fanlar, videodarslar, yangiliklar seed qiladi
 *  3. Admin foydalanuvchisini yaratadi / yangilaydi
 */

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const { Pool } = require('pg');
const bcrypt   = require('bcryptjs');

const hasDatabaseUrl = process.env.DATABASE_URL && process.env.DATABASE_URL.trim() !== '';

const pool = new Pool(
  hasDatabaseUrl
    ? { connectionString: process.env.DATABASE_URL.trim(), ssl: { rejectUnauthorized: false } }
    : {
        host:     process.env.DB_HOST,
        port:     process.env.DB_PORT,
        database: process.env.DB_NAME,
        user:     process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        ssl:      process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
      }
);

async function run() {
  console.log('\n🚀 SmartSchool DB Setup boshlanmoqda...\n');

  // ── 1. JADVALLAR ──────────────────────────────────────────────
  console.log('📦 1-qadam: Jadvallar yaratilmoqda...');

  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id               SERIAL PRIMARY KEY,
      full_name        VARCHAR(150) NOT NULL,
      email            VARCHAR(200) UNIQUE NOT NULL,
      username         VARCHAR(200),
      password_hash    VARCHAR(255),
      password         VARCHAR(255),
      plain_password   VARCHAR(255),
      role             VARCHAR(20) NOT NULL CHECK (role IN ('student','teacher','admin')),
      avatar_url       TEXT,
      avatar_public_id TEXT,
      class_name       VARCHAR(50),
      subject          VARCHAR(100),
      bio              TEXT,
      phone            VARCHAR(30),
      is_active        BOOLEAN DEFAULT TRUE,
      created_at       TIMESTAMP DEFAULT NOW(),
      updated_at       TIMESTAMP DEFAULT NOW()
    );
  `);
  console.log('  ✅ users');

  await pool.query(`
    CREATE TABLE IF NOT EXISTS subjects (
      id          SERIAL PRIMARY KEY,
      name        VARCHAR(100) NOT NULL,
      description TEXT,
      icon        VARCHAR(50),
      color       VARCHAR(30),
      teacher_id  INT,
      class_name  VARCHAR(20),
      is_primary  BOOLEAN DEFAULT FALSE,
      grade_range VARCHAR(20) DEFAULT 'both',
      created_at  TIMESTAMP DEFAULT NOW()
    );
  `);
  console.log('  ✅ subjects');

  await pool.query(`
    CREATE TABLE IF NOT EXISTS classes (
      id                 SERIAL PRIMARY KEY,
      name               VARCHAR(50) UNIQUE NOT NULL,
      grade_level        INT NOT NULL,
      class_type         VARCHAR(20) NOT NULL DEFAULT 'secondary'
                           CHECK (class_type IN ('primary','secondary')),
      primary_teacher_id INT,
      class_teacher_id   INT,
      class_leader_id    INT,
      pe_teacher_id      INT,
      created_at         TIMESTAMP DEFAULT NOW()
    );
  `);
  console.log('  ✅ classes');

  await pool.query(`
    ALTER TABLE users ADD COLUMN IF NOT EXISTS class_id INT REFERENCES classes(id) ON DELETE SET NULL;
  `).catch(() => {});

  await pool.query(`
    CREATE TABLE IF NOT EXISTS lessons (
      id              SERIAL PRIMARY KEY,
      title           VARCHAR(255) NOT NULL,
      description     TEXT,
      subject_id      INT REFERENCES subjects(id) ON DELETE CASCADE,
      teacher_id      INT REFERENCES users(id)   ON DELETE SET NULL,
      class_id        INT REFERENCES classes(id) ON DELETE SET NULL,
      target_class_id INT REFERENCES classes(id) ON DELETE SET NULL,
      grade_level     INT,
      file_url        TEXT,
      file_public_id  TEXT,
      file_type       VARCHAR(20) DEFAULT 'pdf',
      content         TEXT,
      order_num       INT DEFAULT 0,
      is_published    BOOLEAN DEFAULT FALSE,
      views           INT DEFAULT 0,
      created_at      TIMESTAMP DEFAULT NOW(),
      updated_at      TIMESTAMP DEFAULT NOW()
    );
  `);
  console.log('  ✅ lessons');

  await pool.query(`
    CREATE TABLE IF NOT EXISTS videos (
      id                  SERIAL PRIMARY KEY,
      title               VARCHAR(255) NOT NULL,
      description         TEXT,
      subject_id          INT REFERENCES subjects(id) ON DELETE CASCADE,
      teacher_id          INT REFERENCES users(id)   ON DELETE SET NULL,
      class_id            INT REFERENCES classes(id) ON DELETE SET NULL,
      target_class_id     INT REFERENCES classes(id) ON DELETE SET NULL,
      grade_level         INT,
      video_url           TEXT NOT NULL,
      video_public_id     TEXT,
      thumbnail_url       TEXT,
      thumbnail_public_id TEXT,
      duration_sec        INT DEFAULT 0,
      views               INT DEFAULT 0,
      is_published        BOOLEAN DEFAULT FALSE,
      created_at          TIMESTAMP DEFAULT NOW(),
      updated_at          TIMESTAMP DEFAULT NOW()
    );
  `);
  await pool.query(`CREATE OR REPLACE VIEW video_lessons AS SELECT * FROM videos;`).catch(() => {});
  console.log('  ✅ videos + video_lessons view');

  // ── schedules (ASOSIY YETISHMAYOTGAN JADVAL) ──
  await pool.query(`
    CREATE TABLE IF NOT EXISTS schedules (
      id            SERIAL PRIMARY KEY,
      class_id      INT REFERENCES classes(id)  ON DELETE CASCADE,
      teacher_id    INT REFERENCES users(id)    ON DELETE CASCADE,
      subject_id    INT REFERENCES subjects(id) ON DELETE CASCADE,
      day_of_week   VARCHAR(20) NOT NULL
                      CHECK (day_of_week IN ('Dushanba','Seshanba','Chorshanba','Payshanba','Juma','Shanba')),
      lesson_number INT NOT NULL CHECK (lesson_number BETWEEN 1 AND 7),
      start_time    TIME,
      end_time      TIME,
      room          VARCHAR(50),
      created_at    TIMESTAMP DEFAULT NOW(),
      UNIQUE (class_id, day_of_week, lesson_number)
    );
  `);
  console.log('  ✅ schedules');

  // ── grades (ASOSIY YETISHMAYOTGAN JADVAL) ──
  await pool.query(`
    CREATE TABLE IF NOT EXISTS grades (
      id         SERIAL PRIMARY KEY,
      student_id INT REFERENCES users(id)    ON DELETE CASCADE,
      teacher_id INT REFERENCES users(id)    ON DELETE SET NULL,
      subject_id INT REFERENCES subjects(id) ON DELETE CASCADE,
      class_id   INT REFERENCES classes(id)  ON DELETE SET NULL,
      score      INT NOT NULL CHECK (score BETWEEN 0 AND 100),
      grade_type VARCHAR(30) DEFAULT 'homework',
      comment    TEXT,
      graded_at  TIMESTAMP DEFAULT NOW(),
      created_at TIMESTAMP DEFAULT NOW()
    );
  `);
  console.log('  ✅ grades');

  await pool.query(`
    CREATE TABLE IF NOT EXISTS attendance (
      id                   SERIAL PRIMARY KEY,
      student_id           INT REFERENCES users(id) ON DELETE CASCADE,
      class_name           VARCHAR(50),
      date                 DATE NOT NULL,
      status               VARCHAR(20) NOT NULL
                             CHECK (status IN ('present','absent','late','excused')),
      marked_by_teacher_id INT REFERENCES users(id) ON DELETE SET NULL,
      created_at           TIMESTAMP DEFAULT NOW(),
      updated_at           TIMESTAMP DEFAULT NOW(),
      UNIQUE (student_id, date)
    );
  `);
  console.log('  ✅ attendance');

  await pool.query(`
    CREATE TABLE IF NOT EXISTS news (
      id         SERIAL PRIMARY KEY,
      title      VARCHAR(255) NOT NULL,
      content    TEXT NOT NULL,
      category   VARCHAR(50) DEFAULT 'info',
      event_date DATE DEFAULT CURRENT_DATE,
      author_id  INT REFERENCES users(id) ON DELETE SET NULL,
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    );
  `);
  console.log('  ✅ news');

  await pool.query(`
    CREATE TABLE IF NOT EXISTS class_subject_teachers (
      id         SERIAL PRIMARY KEY,
      class_id   INT REFERENCES classes(id)  ON DELETE CASCADE,
      subject_id INT REFERENCES subjects(id) ON DELETE CASCADE,
      teacher_id INT REFERENCES users(id)   ON DELETE CASCADE,
      created_at TIMESTAMP DEFAULT NOW(),
      UNIQUE (class_id, subject_id)
    );
  `);
  console.log('  ✅ class_subject_teachers');

  await pool.query(`
    CREATE TABLE IF NOT EXISTS teacher_classes (
      id         SERIAL PRIMARY KEY,
      teacher_id INT NOT NULL REFERENCES users(id)   ON DELETE CASCADE,
      class_id   INT NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
      subject_id INT          REFERENCES subjects(id) ON DELETE SET NULL,
      created_at TIMESTAMP DEFAULT NOW(),
      UNIQUE (teacher_id, class_id)
    );
  `);
  console.log('  ✅ teacher_classes');

  await pool.query(`
    CREATE TABLE IF NOT EXISTS tasks (
      id          SERIAL PRIMARY KEY,
      title       VARCHAR(255) NOT NULL,
      description TEXT,
      subject_id  INT REFERENCES subjects(id) ON DELETE CASCADE,
      teacher_id  INT REFERENCES users(id)   ON DELETE SET NULL,
      class_name  VARCHAR(20),
      deadline    TIMESTAMP,
      max_score   INT DEFAULT 100,
      created_at  TIMESTAMP DEFAULT NOW()
    );
  `);
  console.log('  ✅ tasks');

  await pool.query(`
    CREATE TABLE IF NOT EXISTS task_submissions (
      id           SERIAL PRIMARY KEY,
      task_id      INT REFERENCES tasks(id)  ON DELETE CASCADE,
      student_id   INT REFERENCES users(id) ON DELETE CASCADE,
      content      TEXT,
      file_url     TEXT,
      score        INT,
      feedback     TEXT,
      submitted_at TIMESTAMP DEFAULT NOW(),
      graded_at    TIMESTAMP,
      UNIQUE (task_id, student_id)
    );
  `);
  console.log('  ✅ task_submissions');

  await pool.query(`
    CREATE TABLE IF NOT EXISTS quizzes (
      id          SERIAL PRIMARY KEY,
      title       VARCHAR(255) NOT NULL,
      description TEXT,
      subject_id  INT REFERENCES subjects(id) ON DELETE CASCADE,
      teacher_id  INT REFERENCES users(id)   ON DELETE SET NULL,
      created_at  TIMESTAMP DEFAULT NOW(),
      updated_at  TIMESTAMP DEFAULT NOW()
    );
  `);
  await pool.query(`
    CREATE TABLE IF NOT EXISTS questions (
      id             SERIAL PRIMARY KEY,
      quiz_id        INT REFERENCES quizzes(id) ON DELETE CASCADE,
      question_text  TEXT NOT NULL,
      options        JSONB NOT NULL,
      correct_option INT NOT NULL,
      created_at     TIMESTAMP DEFAULT NOW()
    );
  `);
  await pool.query(`
    CREATE TABLE IF NOT EXISTS quiz_attempts (
      id              SERIAL PRIMARY KEY,
      quiz_id         INT REFERENCES quizzes(id) ON DELETE CASCADE,
      student_id      INT REFERENCES users(id)  ON DELETE CASCADE,
      score           INT NOT NULL,
      total_questions INT NOT NULL,
      percentage      DECIMAL(5,2) NOT NULL,
      attempted_at    TIMESTAMP DEFAULT NOW(),
      UNIQUE (student_id, quiz_id)
    );
  `);
  console.log('  ✅ quizzes, questions, quiz_attempts');

  await pool.query(`
    CREATE TABLE IF NOT EXISTS lesson_progress (
      id         SERIAL PRIMARY KEY,
      student_id INT REFERENCES users(id)   ON DELETE CASCADE,
      lesson_id  INT REFERENCES lessons(id) ON DELETE CASCADE,
      is_done    BOOLEAN DEFAULT FALSE,
      done_at    TIMESTAMP,
      UNIQUE (student_id, lesson_id)
    );
    CREATE TABLE IF NOT EXISTS video_views (
      id          SERIAL PRIMARY KEY,
      student_id  INT REFERENCES users(id)  ON DELETE CASCADE,
      video_id    INT REFERENCES videos(id) ON DELETE CASCADE,
      watched_sec INT DEFAULT 0,
      is_done     BOOLEAN DEFAULT FALSE,
      viewed_at   TIMESTAMP DEFAULT NOW(),
      UNIQUE (student_id, video_id)
    );
    CREATE TABLE IF NOT EXISTS notifications (
      id         SERIAL PRIMARY KEY,
      user_id    INT REFERENCES users(id) ON DELETE CASCADE,
      title      VARCHAR(255),
      message    TEXT,
      type       VARCHAR(30) DEFAULT 'info',
      is_read    BOOLEAN DEFAULT FALSE,
      created_at TIMESTAMP DEFAULT NOW()
    );
  `);
  console.log('  ✅ lesson_progress, video_views, notifications');

  // ── Ustunlar xavfsizligi (eski jadvallarni idempotent yangilash) ──
  await pool.query(`
    ALTER TABLE users 
      ADD COLUMN IF NOT EXISTS username VARCHAR(255),
      ADD COLUMN IF NOT EXISTS password VARCHAR(255),
      ADD COLUMN IF NOT EXISTS password_hash VARCHAR(255),
      ADD COLUMN IF NOT EXISTS plain_password VARCHAR(255),
      ADD COLUMN IF NOT EXISTS avatar_url TEXT,
      ADD COLUMN IF NOT EXISTS avatar_public_id TEXT,
      ADD COLUMN IF NOT EXISTS bio TEXT,
      ADD COLUMN IF NOT EXISTS phone VARCHAR(30),
      ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE,
      ADD COLUMN IF NOT EXISTS class_name VARCHAR(50),
      ADD COLUMN IF NOT EXISTS class_id INT REFERENCES classes(id) ON DELETE SET NULL,
      ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT NOW();

    DO $$ 
    BEGIN 
      IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name='users' AND column_name='password' AND is_nullable='NO'
      ) THEN 
        ALTER TABLE users ALTER COLUMN password DROP NOT NULL; 
      END IF; 
    END $$;

    ALTER TABLE subjects 
      ADD COLUMN IF NOT EXISTS description TEXT,
      ADD COLUMN IF NOT EXISTS icon VARCHAR(50),
      ADD COLUMN IF NOT EXISTS color VARCHAR(30),
      ADD COLUMN IF NOT EXISTS teacher_id INT REFERENCES users(id) ON DELETE SET NULL,
      ADD COLUMN IF NOT EXISTS class_name VARCHAR(20),
      ADD COLUMN IF NOT EXISTS is_primary BOOLEAN DEFAULT FALSE,
      ADD COLUMN IF NOT EXISTS grade_range VARCHAR(20) DEFAULT 'both';

    ALTER TABLE classes 
      ADD COLUMN IF NOT EXISTS class_type VARCHAR(20) DEFAULT 'secondary',
      ADD COLUMN IF NOT EXISTS class_teacher_id INT REFERENCES users(id) ON DELETE SET NULL,
      ADD COLUMN IF NOT EXISTS class_leader_id INT REFERENCES users(id) ON DELETE SET NULL,
      ADD COLUMN IF NOT EXISTS primary_teacher_id INT REFERENCES users(id) ON DELETE SET NULL,
      ADD COLUMN IF NOT EXISTS pe_teacher_id INT REFERENCES users(id) ON DELETE SET NULL;

    ALTER TABLE attendance 
      ADD COLUMN IF NOT EXISTS class_name VARCHAR(50),
      ADD COLUMN IF NOT EXISTS marked_by_teacher_id INT REFERENCES users(id) ON DELETE SET NULL,
      ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT NOW();

    ALTER TABLE teacher_classes 
      ADD COLUMN IF NOT EXISTS subject_id INT REFERENCES subjects(id) ON DELETE SET NULL,
      ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT NOW();

    ALTER TABLE videos 
      ADD COLUMN IF NOT EXISTS class_id INT REFERENCES classes(id) ON DELETE SET NULL,
      ADD COLUMN IF NOT EXISTS target_class_id INT REFERENCES classes(id) ON DELETE SET NULL,
      ADD COLUMN IF NOT EXISTS grade_level INT;

    ALTER TABLE lessons 
      ADD COLUMN IF NOT EXISTS class_id INT REFERENCES classes(id) ON DELETE SET NULL,
      ADD COLUMN IF NOT EXISTS target_class_id INT REFERENCES classes(id) ON DELETE SET NULL,
      ADD COLUMN IF NOT EXISTS grade_level INT;
  `).catch(() => {});

  // Indekslar
  await pool.query(`
    CREATE INDEX IF NOT EXISTS idx_users_email        ON users(email);
    CREATE INDEX IF NOT EXISTS idx_users_role         ON users(role);
    CREATE INDEX IF NOT EXISTS idx_lessons_subject    ON lessons(subject_id);
    CREATE INDEX IF NOT EXISTS idx_videos_subject     ON videos(subject_id);
    CREATE INDEX IF NOT EXISTS idx_grades_student     ON grades(student_id);
    CREATE INDEX IF NOT EXISTS idx_grades_subject     ON grades(subject_id);
    CREATE INDEX IF NOT EXISTS idx_schedules_class    ON schedules(class_id);
    CREATE INDEX IF NOT EXISTS idx_attendance_student ON attendance(student_id);
    CREATE INDEX IF NOT EXISTS idx_tasks_class        ON tasks(class_name);
  `);
  console.log('  ✅ Indekslar');

  // ── 2. SINFLAR ────────────────────────────────────────────────
  console.log('\n📦 2-qadam: Sinflar seed qilinmoqda...');
  const { rows: [{ count: cCount }] } = await pool.query('SELECT COUNT(*) FROM classes');
  if (parseInt(cCount) === 0) {
    await pool.query(`
      INSERT INTO classes (name, grade_level, class_type) VALUES
        ('1-sinf',1,'primary'),('2-sinf',2,'primary'),('3-sinf',3,'primary'),('4-sinf',4,'primary'),
        ('5-sinf',5,'secondary'),('6-sinf',6,'secondary'),('7-sinf',7,'secondary'),('8-sinf',8,'secondary'),
        ('9-sinf',9,'secondary'),('10-sinf',10,'secondary'),('11-sinf',11,'secondary')
      ON CONFLICT (name) DO NOTHING;
    `);
    console.log('  ✅ 11 ta sinf yaratildi');
  } else {
    console.log(`  ℹ️  Sinflar allaqachon mavjud (${cCount} ta)`);
  }

  // ── 3. FANLAR ─────────────────────────────────────────────────
  console.log('\n📦 3-qadam: Fanlar seed qilinmoqda...');
  const subs = [
    ['Matematika','📐','#3b82f6',true,'both'],
    ['Ona tili','📖','#10b981',true,'both'],
    ["O'qish",'📚','#8b5cf6',true,'primary'],
    ['Tabiatshunoslik','🌱','#10b981',true,'primary'],
    ["Tasviriy san'at",'🎨','#ec4899',true,'both'],
    ['Texnologiya','✂️','#f59e0b',true,'both'],
    ['Musiqa','🎵','#6366f1',true,'both'],
    ['Tarbiya','🤝','#14b8a6',true,'both'],
    ['Jismoniy tarbiya','⚽','#ef4444',true,'both'],
    ['Ingliz tili','🌐','#ef4444',true,'both'],
    ['Fizika','⚛️','#8b5cf6',false,'secondary'],
    ['Kimyo','🧪','#f59e0b',false,'secondary'],
    ['Biologiya','🔬','#10b981',false,'secondary'],
    ['Informatika','💻','#06b6d4',false,'secondary'],
    ['Tarix','🏛️','#d97706',false,'secondary'],
    ['Geografiya','🌍','#10b981',false,'secondary'],
    ['Adabiyot','📚','#ec4899',false,'secondary'],
    ['Algebra','📐','#3b82f6',false,'secondary'],
    ['Geometriya','📐','#3b82f6',false,'secondary'],
    ['Astronomiya','🌌','#3b82f6',false,'secondary'],
    ['Robototexnika','🤖','#10b981',false,'secondary'],
    ["Boshlang'ich ta'lim fanlari",'🎒','#ec4899',true,'primary'],
  ];
  let addedS = 0;
  for (const [name, icon, color, is_primary, grade_range] of subs) {
    const ex = await pool.query('SELECT id FROM subjects WHERE LOWER(name)=LOWER($1)', [name]);
    if (!ex.rows.length) {
      await pool.query(
        `INSERT INTO subjects (name, icon, color, is_primary, grade_range, description)
         VALUES ($1,$2,$3,$4,$5,$6)`,
        [name, icon, color, is_primary, grade_range, `${name} fani darsliklari va materiallari`]
      );
      addedS++;
    }
  }
  console.log(`  ✅ ${addedS} ta yangi fan, ${subs.length - addedS} ta allaqachon mavjud`);

  // ── 4. YANGILIKLAR ────────────────────────────────────────────
  console.log('\n📦 4-qadam: Yangiliklar seed qilinmoqda...');
  const { rows: [{ count: nCount }] } = await pool.query('SELECT COUNT(*) FROM news');
  if (parseInt(nCount) === 0) {
    await pool.query(`
      INSERT INTO news (title, content, category, event_date) VALUES
      ($1,$2,'urgent', CURRENT_DATE + INTERVAL '2 days'),
      ($3,$4,'event',  CURRENT_DATE + INTERVAL '7 days'),
      ($5,$6,'info',   CURRENT_DATE)
    `, [
      "🚨 O'quv ishlari bo'yicha umumiy yig'ilish",
      "Barcha o'qituvchilar va sinf rahbarlari diqqatiga! Juma kuni soat 15:00 da yig'ilish bo'lib o'tadi.",
      "🏆 Futbol va Shaxmat bo'yicha maktab musobaqasi",
      "Barcha sinflar o'rtasida sport haftaligi doirasida musobaqa o'tkaziladi. Ro'yxatdan o'ting!",
      "📢 Yangi o'quv yili darsliklari va kutubxona tartibi",
      "Kutubxonamiz yangi darsliklar bilan to'liq ta'minlandi.",
    ]);
    console.log("  ✅ 3 ta yangilik qo'shildi");
  } else {
    console.log(`  ℹ️  Yangiliklar allaqachon mavjud (${nCount} ta)`);
  }

  // ── 5. VIDEO DARSLAR ──────────────────────────────────────────
  console.log('\n📦 5-qadam: Video darslar seed qilinmoqda...');
  const { rows: [{ count: vCount }] } = await pool.query('SELECT COUNT(*) FROM videos');
  if (parseInt(vCount) === 0) {
    const videos = [
      ["Kvadrat tenglamalar — To'liq qo'llanma", 'Matematika', 'https://www.youtube.com/watch?v=sB_i1eG4x4E', 'https://img.youtube.com/vi/sB_i1eG4x4E/hqdefault.jpg', 1122, 2400],
      ['Nyuton qonunlari — Amaliy misollar',     'Fizika',     'https://www.youtube.com/watch?v=kKKM8Y-u7ds', 'https://img.youtube.com/vi/kKKM8Y-u7ds/hqdefault.jpg', 1455, 1800],
      ["O'zbekiston mustaqilligi tarixi",         'Tarix',      'https://www.youtube.com/watch?v=snbUv9E4VPE', 'https://img.youtube.com/vi/snbUv9E4VPE/hqdefault.jpg', 1928, 3100],
      ["Davriy sistema va kimyoviy bog'lanish",   'Kimyo',      'https://www.youtube.com/watch?v=0RRVV4Diomg', 'https://img.youtube.com/vi/0RRVV4Diomg/hqdefault.jpg', 930,  1200],
      ["Ona tili: Fe'l zamonlari va grammatika",  'Ona tili',   'https://www.youtube.com/watch?v=aircAruvnKk', 'https://img.youtube.com/vi/aircAruvnKk/hqdefault.jpg', 1725, 2000],
      ['Ingliz tili: Past Tense vs Present Perfect','Ingliz tili','https://www.youtube.com/watch?v=kJQP7kiw5Fk','https://img.youtube.com/vi/kJQP7kiw5Fk/hqdefault.jpg', 1278, 4200],
    ];
    for (const [title, subName, url, thumb, dur, views] of videos) {
      const sr = await pool.query('SELECT id FROM subjects WHERE LOWER(name)=LOWER($1)', [subName]);
      await pool.query(
        `INSERT INTO videos (title, subject_id, video_url, thumbnail_url, duration_sec, views, is_published)
         VALUES ($1,$2,$3,$4,$5,$6,TRUE)`,
        [title, sr.rows[0]?.id || null, url, thumb, dur, views]
      );
      console.log(`  + ${title}`);
    }
  } else {
    console.log(`  ℹ️  Videolar allaqachon mavjud (${vCount} ta)`);
  }

  // ── 6. ADMIN ──────────────────────────────────────────────────
  console.log('\n📦 6-qadam: Admin tekshirilmoqda...');
  const adminPwd   = process.env.ADMIN_PASSWORD || '123456';
  const adminEmail = process.env.ADMIN_EMAIL    || 'admin@smartschool.uz';

  const { rows: adminRows } = await pool.query('SELECT id, password_hash, password FROM users WHERE email = $1', [adminEmail]);
  if (adminRows.length === 0) {
    const hash = await bcrypt.hash(adminPwd, 10);
    await pool.query(`
      INSERT INTO users (full_name, email, username, password_hash, password, plain_password, role, is_active)
      VALUES ('Asosiy Admin', $1, $1, $2, $2, $3, 'admin', TRUE)
      ON CONFLICT (email) DO NOTHING;
    `, [adminEmail, hash, adminPwd]);
    console.log(`  ✅ Admin yaratildi: ${adminEmail}  /  Parol: ${adminPwd}`);
  } else {
    // Agar admin mavjud bo'lsa, lekin paroli bo'sh bo'lsa, tiklaymiz
    if (!adminRows[0].password_hash && !adminRows[0].password) {
      const hash = await bcrypt.hash(adminPwd, 10);
      await pool.query(`
        UPDATE users SET password_hash = $1, password = $1, plain_password = $2, is_active = TRUE, updated_at = NOW()
        WHERE email = $3
      `, [hash, adminPwd, adminEmail]);
      console.log(`  ✅ Admin paroli tiklandi: ${adminEmail}`);
    } else {
      console.log(`  ℹ️  Admin allaqachon mavjud (${adminEmail})`);
    }
  }

  // ── YAKUNIY HISOBOT ───────────────────────────────────────────
  const counts = await Promise.all([
    pool.query('SELECT COUNT(*) FROM users'),
    pool.query('SELECT COUNT(*) FROM classes'),
    pool.query('SELECT COUNT(*) FROM subjects'),
    pool.query('SELECT COUNT(*) FROM videos'),
    pool.query('SELECT COUNT(*) FROM news'),
    pool.query('SELECT COUNT(*) FROM schedules'),
    pool.query('SELECT COUNT(*) FROM grades'),
  ]);
  const [uc,cc,sc,vc,nc,shc,gc] = counts.map(r => r.rows[0].count);

  console.log(`
╔══════════════════════════════════════════╗
║   🎉 SmartSchool DB Setup yakunlandi!    ║
╠══════════════════════════════════════════╣
║  Foydalanuvchilar : ${String(uc).padEnd(22)}║
║  Sinflar          : ${String(cc).padEnd(22)}║
║  Fanlar           : ${String(sc).padEnd(22)}║
║  Video darslar    : ${String(vc).padEnd(22)}║
║  Yangiliklar      : ${String(nc).padEnd(22)}║
║  Jadvallar        : ${String(shc).padEnd(22)}║
║  Baholar          : ${String(gc).padEnd(22)}║
╠══════════════════════════════════════════╣
║  Admin login : ${adminEmail.padEnd(26)}║
║  Admin parol : ${adminPwd.padEnd(26)}║
╚══════════════════════════════════════════╝
`);

  await pool.end();
  process.exit(0);
}

run().catch(err => {
  console.error('\n❌ Setup xatosi:', err.message);
  process.exit(1);
});
