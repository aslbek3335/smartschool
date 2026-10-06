const pool = require('../backend/config/db');

async function check() {
  const res = await pool.query(`
    SELECT conrelid::regclass AS table_name, conname, pg_get_constraintdef(oid) AS def
    FROM pg_constraint
    WHERE conrelid IN ('class_subject_teachers'::regclass, 'teacher_classes'::regclass, 'teacher_subjects'::regclass)
  `);
  console.log('Constraints:', res.rows);

  const cols1 = await pool.query(`
    SELECT column_name, data_type, is_nullable
    FROM information_schema.columns
    WHERE table_name = 'class_subject_teachers'
  `);
  console.log('class_subject_teachers columns:', cols1.rows);

  const cols2 = await pool.query(`
    SELECT column_name, data_type, is_nullable
    FROM information_schema.columns
    WHERE table_name = 'teacher_classes'
  `);
  console.log('teacher_classes columns:', cols2.rows);

  process.exit(0);
}

check().catch(e => { console.error(e); process.exit(1); });
