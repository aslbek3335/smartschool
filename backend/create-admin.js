const pool = require('./config/db');
const bcrypt = require('bcryptjs');

async function createAdmin() {
  try {
    const password = '123456';
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Mavjud ustunlarni moslashtirish (agar jadval eski variantda bo'lsa)
    await pool.query(`
      ALTER TABLE users ADD COLUMN IF NOT EXISTS password_hash VARCHAR(255);
      ALTER TABLE users ADD COLUMN IF NOT EXISTS password VARCHAR(255);
      ALTER TABLE users ADD COLUMN IF NOT EXISTS plain_password VARCHAR(255);
      ALTER TABLE users ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE;
      ALTER TABLE users ADD COLUMN IF NOT EXISTS class_name VARCHAR(50);
      ALTER TABLE users ADD COLUMN IF NOT EXISTS subject VARCHAR(100);
      ALTER TABLE users ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT NOW();
    `);

    // Yangi adminni qo'shish yoki mavjudini yangilash (idempotent)
    const upsertQuery = `
      INSERT INTO users (full_name, email, password_hash, password, plain_password, role, is_active)
      VALUES ($1, $2, $3, $3, $4, $5, $6)
      ON CONFLICT (email) DO UPDATE SET
        full_name = EXCLUDED.full_name,
        password_hash = EXCLUDED.password_hash,
        password = EXCLUDED.password,
        plain_password = EXCLUDED.plain_password,
        role = EXCLUDED.role,
        is_active = EXCLUDED.is_active,
        updated_at = NOW()
      RETURNING id, full_name, email, role, is_active, plain_password;
    `;

    const email = 'admin@smartschool.uz';
    const result = await pool.query(upsertQuery, [
      'Asosiy Admin',
      email,
      hashedPassword,
      password,
      'admin',
      true
    ]);

    console.log('\n========================================');
    console.log('✅ Asosiy Admin muvaffaqiyatli yaratildi!');
    console.log('========================================');
    console.log('ID:             ', result.rows[0].id);
    console.log('Ismi:           ', result.rows[0].full_name);
    console.log('Email:          ', result.rows[0].email);
    console.log('Parol:          ', result.rows[0].plain_password);
    console.log('Roli:           ', result.rows[0].role);
    console.log('Faollik holati: ', result.rows[0].is_active);
    console.log('========================================\n');

  } catch (error) {
    console.error('❌ Xatolik yuz berdi:', error.message);
  } finally {
    process.exit(0);
  }
}

createAdmin();
