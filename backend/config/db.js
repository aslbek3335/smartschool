const path = require('path');
const { Pool } = require('pg');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const hasDatabaseUrl = process.env.DATABASE_URL && process.env.DATABASE_URL.trim() !== '';

const poolConfig = hasDatabaseUrl
  ? {
      connectionString: process.env.DATABASE_URL.trim(),
      ssl: { rejectUnauthorized: false }
    }
  : {
      host: process.env.DB_HOST,
      port: process.env.DB_PORT,
      database: process.env.DB_NAME,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false
    };

const pool = new Pool(poolConfig);

pool.on('error', (err) => {
  console.error('❌ PostgreSQL ulanishida kutilmagan xatolik:', err.message);
});

async function initDatabase() {
  try {
    // 1. Create tables if they do not exist yet
    await pool.query(`
      CREATE TABLE IF NOT EXISTS classes (
        id SERIAL PRIMARY KEY,
        name VARCHAR(50) UNIQUE NOT NULL,
        grade_level INT NOT NULL,
        class_type VARCHAR(20) NOT NULL CHECK (class_type IN ('primary', 'secondary')),
        primary_teacher_id INT REFERENCES users(id) ON DELETE SET NULL,
        class_leader_id INT REFERENCES users(id) ON DELETE SET NULL,
        pe_teacher_id INT REFERENCES users(id) ON DELETE SET NULL,
        created_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS class_subject_teachers (
        id SERIAL PRIMARY KEY,
        class_id INT REFERENCES classes(id) ON DELETE CASCADE,
        subject_id INT REFERENCES subjects(id) ON DELETE CASCADE,
        teacher_id INT REFERENCES users(id) ON DELETE CASCADE,
        created_at TIMESTAMP DEFAULT NOW(),
        UNIQUE (class_id, subject_id)
      );

      CREATE TABLE IF NOT EXISTS attendance (
        id SERIAL PRIMARY KEY,
        student_id INT REFERENCES users(id) ON DELETE CASCADE,
        class_name VARCHAR(50) NOT NULL,
        date DATE NOT NULL,
        status VARCHAR(20) NOT NULL CHECK (status IN ('present', 'absent', 'late', 'excused')),
        marked_by_teacher_id INT REFERENCES users(id) ON DELETE SET NULL,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW(),
        UNIQUE (student_id, date)
      );

      CREATE TABLE IF NOT EXISTS news (
        id SERIAL PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        content TEXT NOT NULL,
        category VARCHAR(50) DEFAULT 'info',
        event_date DATE DEFAULT CURRENT_DATE,
        author_id INT REFERENCES users(id) ON DELETE SET NULL,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS teacher_classes (
        id SERIAL PRIMARY KEY,
        teacher_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        class_id INT NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
        subject_id INT REFERENCES subjects(id) ON DELETE SET NULL,
        created_at TIMESTAMP DEFAULT NOW(),
        UNIQUE (teacher_id, class_id)
      );
    `);

    // 2. Safely alter tables to add required columns
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
          WHERE table_name='users' AND column_name='password'
        ) THEN 
          ALTER TABLE users ALTER COLUMN password DROP NOT NULL; 
        END IF; 
      END $$;

      UPDATE users SET username = email WHERE username IS NULL;

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
    `);

    try {
      await pool.query(`
        UPDATE users u
        SET class_id = c.id
        FROM classes c
        WHERE u.role = 'student'
          AND u.class_id IS NULL
          AND (
            LOWER(u.class_name) = LOWER(c.name)
            OR c.grade_level = NULLIF(REGEXP_REPLACE(u.class_name, '[^0-9]', '', 'g'), '')::int
          );
      `);
    } catch (e) {
      // Ignore student class mapping errors on fresh databases
    }

    // 3. Seed news if empty
    const newsCount = await pool.query('SELECT COUNT(*) FROM news');
    if (parseInt(newsCount.rows[0].count) === 0) {
      await pool.query(`
        INSERT INTO news (title, content, category, event_date) VALUES
        ('🚨 O''quv ishlari bo''yicha umumiy yig''ilish', 'Barcha o''qituvchilar va sinf rahbarlari diqqatiga! Juma kuni soat 15:00 da o''quv ishlari bo''yicha yig''ilish bo''lib o''tadi.', 'urgent', CURRENT_DATE + INTERVAL '2 days'),
        ('🏆 Futbol va Shaxmat bo''yicha maktab musobaqasi', 'Maktabimizda barcha sinflar o''rtasida sport haftaligi doirasida futbol va shaxmat musobaqasi o''tkaziladi. Ro''yxatdan o''ting!', 'event', CURRENT_DATE + INTERVAL '7 days'),
        ('📢 Yangi o''quv yili darsliklari va kutubxona tartibi', 'Kutubxonamiz yangi darsliklar bilan to''liq ta''minlandi. O''quvchilar o''z sinf rahbarlaridan darslik majmualarini olishlari mumkin.', 'info', CURRENT_DATE)
      `);
    }

    // 4. Seed classes if empty
    const classesCount = await pool.query('SELECT COUNT(*) FROM classes');
    if (parseInt(classesCount.rows[0].count) === 0) {
      await pool.query(`
        INSERT INTO classes (name, grade_level, class_type)
        SELECT c.name, c.grade_level, c.class_type
        FROM (VALUES
          ('1-sinf', 1, 'primary'),
          ('2-sinf', 2, 'primary'),
          ('3-sinf', 3, 'primary'),
          ('4-sinf', 4, 'primary'),
          ('5-sinf', 5, 'secondary'),
          ('6-sinf', 6, 'secondary'),
          ('7-sinf', 7, 'secondary'),
          ('8-sinf', 8, 'secondary'),
          ('9-sinf', 9, 'secondary'),
          ('10-sinf', 10, 'secondary'),
          ('11-sinf', 11, 'secondary')
        ) AS c(name, grade_level, class_type)
        WHERE NOT EXISTS (
          SELECT 1 FROM classes WHERE LOWER(classes.name) = LOWER(c.name)
        );
      `);
    }

    // 5. Ensure standard subjects exist
    const standardSubjects = [
      { name: 'Matematika', description: 'Matematika va hisoblash asoslari', icon: '📐', color: '#3b82f6', is_primary: true, grade_range: 'both' },
      { name: 'Ona tili', description: 'Ona tili va adabiyot darslari', icon: '📖', color: '#10b981', is_primary: true, grade_range: 'both' },
      { name: "O'qish", description: "O'qish savodxonligi va nutq o'stirish", icon: '📚', color: '#8b5cf6', is_primary: true, grade_range: 'primary' },
      { name: 'Tabiatshunoslik', description: 'Tabiiy fanlar va atrof-muhit', icon: '🌱', color: '#10b981', is_primary: true, grade_range: 'primary' },
      { name: "Tasviriy san'at", description: "Rasm va tasviriy san'at asoslari", icon: '🎨', color: '#ec4899', is_primary: true, grade_range: 'both' },
      { name: 'Texnologiya', description: 'Mehnat va texnologiya darslari', icon: '✂️', color: '#f59e0b', is_primary: true, grade_range: 'both' },
      { name: 'Musiqa', description: 'Musiqa madaniyati va qo\'shiqlar', icon: '🎵', color: '#6366f1', is_primary: true, grade_range: 'both' },
      { name: 'Tarbiya', description: 'Odobnoma va tarbiya saboqlari', icon: '🤝', color: '#14b8a6', is_primary: true, grade_range: 'both' },
      { name: 'Jismoniy tarbiya', description: 'Sport va sog\'lom turmush tarzi', icon: '⚽', color: '#ef4444', is_primary: true, grade_range: 'both' },
      { name: 'Ingliz tili', description: 'Ingliz tili darsliklari va audio materiallar', icon: '🌐', color: '#ef4444', is_primary: true, grade_range: 'both' },
      { name: 'Fizika', description: 'Fizika nazariyasi va laboratoriyalar', icon: '⚛️', color: '#8b5cf6', is_primary: false, grade_range: 'secondary' },
      { name: 'Kimyo', description: 'Kimyo darslari va tajribalar', icon: '🧪', color: '#f59e0b', is_primary: false, grade_range: 'secondary' },
      { name: 'Biologiya', description: 'Biologiya va tabiatshunoslik', icon: '🔬', color: '#10b981', is_primary: false, grade_range: 'secondary' },
      { name: 'Informatika', description: 'Dasturlash va IT savodxonlik', icon: '💻', color: '#06b6d4', is_primary: false, grade_range: 'secondary' },
      { name: 'Tarix', description: "O'zbekiston va jahon tarixi", icon: '🏛️', color: '#d97706', is_primary: false, grade_range: 'secondary' },
      { name: 'Astronomiya', description: "Koinot va astronomiya asoslari", icon: '🌌', color: '#3b82f6', is_primary: false, grade_range: 'secondary' },
      { name: 'Robototexnika', description: "Robototexnika va IT loyihalar", icon: '🤖', color: '#10b981', is_primary: false, grade_range: 'secondary' },
      { name: 'Algebra', description: 'Algebra va matematik analiz', icon: '📐', color: '#3b82f6', is_primary: false, grade_range: 'secondary' },
      { name: 'Geometriya', description: 'Geometriya va fazoviy shakllar', icon: '📐', color: '#3b82f6', is_primary: false, grade_range: 'secondary' },
      { name: 'Geografiya', description: 'Tabiiy va iqtisodiy geografiya', icon: '🌍', color: '#10b981', is_primary: false, grade_range: 'secondary' },
      { name: 'Adabiyot', description: 'Adabiyot va badiiy asarlar', icon: '📚', color: '#ec4899', is_primary: false, grade_range: 'secondary' },
      { name: "Boshlang'ich ta'lim fanlari", description: "Boshlang'ich ta'limning integratsiyalashgan fanlar majmuasi", icon: '🎒', color: '#ec4899', is_primary: true, grade_range: 'primary' }
    ];

    for (const sub of standardSubjects) {
      const exist = await pool.query('SELECT id FROM subjects WHERE LOWER(name) = LOWER($1)', [sub.name]);
      if (!exist.rows.length) {
        await pool.query(
          `INSERT INTO subjects (name, description, icon, color, is_primary, grade_range) VALUES ($1, $2, $3, $4, $5, $6)`,
          [sub.name, sub.description, sub.icon, sub.color, sub.is_primary, sub.grade_range]
        );
      } else {
        await pool.query(
          `UPDATE subjects SET is_primary = $1, grade_range = $2 WHERE id = $3`,
          [sub.is_primary, sub.grade_range, exist.rows[0].id]
        );
      }
    }

    console.log('✅ PostgreSQL ga muvaffaqiyatli ulandi (barcha jadvallar va ustunlar tayyor)');
  } catch (err) {
    console.error('❌ Table init error:', err.message);
  }
}

initDatabase();

module.exports = pool;
