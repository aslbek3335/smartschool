const pool = require('../backend/config/db');
const jwt = require('../backend/node_modules/jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'smartschool_secret_key_2024';

async function runTests() {
  console.log('--- STARTING PRIMARY TEACHER MULTI-SUBJECT TESTS ---');
  let passCount = 0;
  let failCount = 0;

  function assert(cond, msg) {
    if (cond) {
      console.log(`✅ PASS: ${msg}`);
      passCount++;
    } else {
      console.error(`❌ FAIL: ${msg}`);
      failCount++;
    }
  }

  try {
    // 0. Get admin token
    const adminUserRes = await pool.query("SELECT id, email, role FROM users WHERE role = 'admin' LIMIT 1");
    assert(adminUserRes.rows.length > 0, "Admin user exists in DB");
    const admin = adminUserRes.rows[0];
    const adminToken = jwt.sign({ id: admin.id, role: 'admin' }, JWT_SECRET, { expiresIn: '1d' });

    // 1. Create a test Primary Teacher via API
    const testEmail = `primary_teacher_${Date.now()}@maktab.uz`;
    const primarySubjects = [
      'Matematika', 'Ona tili', "O'qish", 'Tabiatshunoslik',
      "Tasviriy san'at", 'Texnologiya', 'Musiqa', 'Tarbiya'
    ];

    const createRes = await fetch('http://localhost:5005/api/admin/users', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminToken}`
      },
      body: JSON.stringify({
        full_name: "Nilufar Rahimova (Boshlang'ich)",
        email: testEmail,
        password: "password123",
        role: "teacher",
        class_ids: [2], // 2-sinf
        is_primary_teacher: true,
        subjects: primarySubjects
      })
    });

    const createData = await createRes.json();
    assert(createRes.status === 201 && createData.success, `Primary teacher created via API (status: ${createRes.status})`);
    const teacherId = createData.user.id;

    // 2. Verify Database records
    const userRow = await pool.query('SELECT id, role, subject FROM users WHERE id = $1', [teacherId]);
    assert(userRow.rows[0].subject === "Boshlang'ich ta'lim fanlari", `Teacher subject field is set to "Boshlang'ich ta'lim fanlari"`);

    const cstRows = await pool.query(
      `SELECT cst.class_id, cst.subject_id, s.name as subject_name
       FROM class_subject_teachers cst
       JOIN subjects s ON cst.subject_id = s.id
       WHERE cst.teacher_id = $1 AND cst.class_id = 2`,
      [teacherId]
    );
    assert(cstRows.rows.length >= 8, `class_subject_teachers has at least 8 rows for class 2 (actual: ${cstRows.rows.length})`);

    const tsRows = await pool.query(
      `SELECT ts.subject_id, s.name as subject_name
       FROM teacher_subjects ts
       JOIN subjects s ON ts.subject_id = s.id
       WHERE ts.teacher_id = $1`,
      [teacherId]
    );
    assert(tsRows.rows.length >= 8, `teacher_subjects has at least 8 subjects (actual: ${tsRows.rows.length})`);

    const classRow = await pool.query('SELECT id, primary_teacher_id FROM classes WHERE id = 2');
    assert(classRow.rows[0].primary_teacher_id === teacherId, `classes.primary_teacher_id for 2-sinf is set to teacherId (${teacherId})`);

    // 3. Verify GET /api/admin/teachers/:id/teaching-info
    const infoRes = await fetch(`http://localhost:5005/api/admin/teachers/${teacherId}/teaching-info`, {
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });
    const infoData = await infoRes.json();
    assert(infoData.success === true, "GET /teaching-info returns success: true");
    assert(infoData.is_primary_teacher === true, "GET /teaching-info returns is_primary_teacher: true");
    assert(infoData.classes.length === 1 && infoData.classes[0].id === 2, "GET /teaching-info returns class 2");
    assert(infoData.subjects.length >= 8, `GET /teaching-info returns all ${infoData.subjects.length} subjects`);

    // 4. Verify teacher token and GET /api/subjects
    const teacherToken = jwt.sign({ id: teacherId, role: 'teacher' }, JWT_SECRET, { expiresIn: '1d' });
    const teacherSubjRes = await fetch('http://localhost:5005/api/subjects', {
      headers: { 'Authorization': `Bearer ${teacherToken}` }
    });
    const teacherSubjData = await teacherSubjRes.json();
    assert(teacherSubjData.success === true, "GET /api/subjects for teacher returns success: true");
    assert(teacherSubjData.subjects.length >= 8, `GET /api/subjects returns all ${teacherSubjData.subjects.length} subjects for the teacher`);

    // 5. Grading: Find or create a student in 2-sinf
    let student = (await pool.query("SELECT id, full_name, class_name FROM users WHERE role = 'student' AND (class_name = '2-sinf' OR class_name = '2-A') LIMIT 1")).rows[0];
    if (!student) {
      const sRes = await pool.query(
        `INSERT INTO users (full_name, email, password_hash, password, plain_password, role, class_name)
         VALUES ('Azizbek 2-sinf', 'azizbek_2_${Date.now()}@maktab.uz', 'hash', '123456', '123456', 'student', '2-sinf')
         RETURNING id, full_name, class_name`
      );
      student = sRes.rows[0];
    }
    assert(student !== undefined, `Student in 2-sinf found/created: ${student.full_name}`);

    // Grade across multiple primary subjects: Matematika (id: 1), Ona tili, O'qish
    const onaTiliSubId = (await pool.query("SELECT id FROM subjects WHERE LOWER(name) = 'ona tili' LIMIT 1")).rows[0]?.id;
    const oqishSubId = (await pool.query("SELECT id FROM subjects WHERE LOWER(name) = 'o''qish' LIMIT 1")).rows[0]?.id;
    const mathSubId = (await pool.query("SELECT id FROM subjects WHERE LOWER(name) = 'matematika' LIMIT 1")).rows[0]?.id;

    const grade1 = await fetch('http://localhost:5005/api/grades', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${teacherToken}`
      },
      body: JSON.stringify({
        student_id: student.id,
        subject_id: mathSubId,
        score: 95,
        grade_type: 'nazorat',
        comment: 'Ajoyib hisoblash'
      })
    });
    const grade1Data = await grade1.json();
    assert(grade1.status === 201 && grade1Data.success, `Grade for Matematika submitted successfully (score: 95)`);

    const grade2 = await fetch('http://localhost:5005/api/grades', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${teacherToken}`
      },
      body: JSON.stringify({
        student_id: student.id,
        subject_id: onaTiliSubId,
        score: 90,
        grade_type: 'faollik',
        comment: 'Chiroyli yozuv'
      })
    });
    const grade2Data = await grade2.json();
    assert(grade2.status === 201 && grade2Data.success, `Grade for Ona tili submitted successfully (score: 90)`);

    const grade3 = await fetch('http://localhost:5005/api/grades', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${teacherToken}`
      },
      body: JSON.stringify({
        student_id: student.id,
        subject_id: oqishSubId,
        score: 100,
        grade_type: 'uy_vazifasi',
        comment: "Ifodali o'qish"
      })
    });
    const grade3Data = await grade3.json();
    assert(grade3.status === 201 && grade3Data.success, `Grade for O'qish submitted successfully (score: 100)`);

    // 6. Test schedule creation: Schedule 2-sinf lessons with this teacher
    await pool.query("DELETE FROM schedules WHERE class_id = 2 AND day_of_week = 'Shanba' AND lesson_number = 5");
    const schRes = await fetch('http://localhost:5005/api/admin/schedules', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminToken}`
      },
      body: JSON.stringify({
        class_id: 2,
        teacher_id: teacherId,
        subject_id: onaTiliSubId,
        day_of_week: 'Shanba',
        lesson_number: 5
      })
    });
    const schData = await schRes.json();
    if (!schData.success) {
      console.error('Schedule creation failed details:', schRes.status, schData);
    }
    assert((schRes.status === 200 || schRes.status === 201) && schData.success, `Schedule created for primary teacher (2-sinf, Ona tili, Shanba 5-soat)`);

    // 7. Test PUT /api/admin/users/:id (Updating teacher to primary with specific subjects)
    const updateRes = await fetch(`http://localhost:5005/api/admin/users/${teacherId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminToken}`
      },
      body: JSON.stringify({
        full_name: "Nilufar Rahimova (Yangilangan)",
        email: testEmail,
        role: "teacher",
        class_ids: [1], // changed from 2-sinf to 1-sinf
        is_primary_teacher: true,
        subjects: ['Matematika', 'Ona tili', "O'qish", 'Tabiatshunoslik']
      })
    });
    const updateData = await updateRes.json();
    assert(updateRes.status === 200 && updateData.success, "PUT /api/admin/users/:id updated teacher to 1-sinf and 4 subjects");

    const updatedCst = await pool.query(
      "SELECT cst.class_id, s.name as subject_name FROM class_subject_teachers cst JOIN subjects s ON cst.subject_id = s.id WHERE cst.teacher_id = $1",
      [teacherId]
    );
    assert(updatedCst.rows.length === 4, `class_subject_teachers updated to exactly 4 rows (actual: ${updatedCst.rows.length})`);
    assert(updatedCst.rows.every(r => r.class_id === 1), "All updated assignments are for 1-sinf");

    const class1Row = await pool.query('SELECT primary_teacher_id FROM classes WHERE id = 1');
    assert(class1Row.rows[0].primary_teacher_id === teacherId, "classes.primary_teacher_id for 1-sinf set to teacherId");

    // 8. Cleanup test user
    await pool.query('DELETE FROM users WHERE id = $1', [teacherId]);
    console.log('🧹 Cleaned up test teacher');

  } catch (err) {
    console.error('Test error:', err);
    failCount++;
  }

  console.log(`\n--- TEST SUMMARY: ${passCount} PASSED, ${failCount} FAILED ---`);
  process.exit(failCount > 0 ? 1 : 0);
}

runTests();
