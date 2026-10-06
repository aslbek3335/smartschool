const pool = require('./config/db');

async function migrate() {
  console.log('--- Migratsiya boshlanmoqda ---');
  try {
    // 1. users jadvali
    await pool.query(`
      ALTER TABLE users 
      ADD COLUMN IF NOT EXISTS avatar_url TEXT,
      ADD COLUMN IF NOT EXISTS avatar_public_id TEXT,
      ADD COLUMN IF NOT EXISTS bio TEXT,
      ADD COLUMN IF NOT EXISTS phone VARCHAR(30),
      ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT NOW();
    `);
    console.log('✅ users jadvali yangilandi (avatar_url, avatar_public_id, bio, phone, updated_at)');

    // 2. subjects jadvali
    await pool.query(`
      ALTER TABLE subjects 
      ADD COLUMN IF NOT EXISTS description TEXT,
      ADD COLUMN IF NOT EXISTS icon VARCHAR(50),
      ADD COLUMN IF NOT EXISTS color VARCHAR(30),
      ADD COLUMN IF NOT EXISTS teacher_id INT REFERENCES users(id) ON DELETE SET NULL,
      ADD COLUMN IF NOT EXISTS class_name VARCHAR(20);
    `);
    console.log('✅ subjects jadvali yangilandi (description, icon, color, teacher_id, class_name)');

    // 3. classes jadvali
    await pool.query(`
      ALTER TABLE classes 
      ADD COLUMN IF NOT EXISTS class_type VARCHAR(20) DEFAULT 'secondary',
      ADD COLUMN IF NOT EXISTS primary_teacher_id INT REFERENCES users(id) ON DELETE SET NULL,
      ADD COLUMN IF NOT EXISTS class_leader_id INT REFERENCES users(id) ON DELETE SET NULL,
      ADD COLUMN IF NOT EXISTS pe_teacher_id INT REFERENCES users(id) ON DELETE SET NULL;
    `);
    console.log('✅ classes jadvali yangilandi (class_type, primary_teacher_id, class_leader_id, pe_teacher_id)');

    // 4. attendance jadvali
    await pool.query(`
      ALTER TABLE attendance 
      ADD COLUMN IF NOT EXISTS class_name VARCHAR(50),
      ADD COLUMN IF NOT EXISTS marked_by_teacher_id INT REFERENCES users(id) ON DELETE SET NULL,
      ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT NOW();
    `);
    console.log('✅ attendance jadvali yangilandi (class_name, marked_by_teacher_id, updated_at)');

    console.log('🎉 Migratsiya muvaffaqiyatli yakunlandi!');
  } catch (err) {
    console.error('❌ Migratsiyada xatolik:', err);
  } finally {
    await pool.end();
  }
}

migrate();
