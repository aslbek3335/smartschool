-- ====================================================
-- Smart School — PostgreSQL Database Schema
-- ====================================================

-- Foydalanuvchilar jadvali
CREATE TABLE IF NOT EXISTS users (
  id            SERIAL PRIMARY KEY,
  full_name     VARCHAR(150) NOT NULL,
  email         VARCHAR(200) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role          VARCHAR(20)  NOT NULL CHECK (role IN ('student','teacher','admin')),
  avatar_url    TEXT,
  avatar_public_id TEXT,
  class_name    VARCHAR(20),          -- O'quvchi uchun (masalan: 9-A)
  subject       VARCHAR(100),         -- O'qituvchi uchun (masalan: Matematika)
  bio           TEXT,
  phone         VARCHAR(30),
  is_active     BOOLEAN DEFAULT TRUE,
  created_at    TIMESTAMP DEFAULT NOW(),
  updated_at    TIMESTAMP DEFAULT NOW()
);

-- Fanlar jadvali
CREATE TABLE IF NOT EXISTS subjects (
  id          SERIAL PRIMARY KEY,
  name        VARCHAR(100) NOT NULL,
  description TEXT,
  icon        VARCHAR(10),
  color       VARCHAR(30),
  teacher_id  INT REFERENCES users(id) ON DELETE SET NULL,
  class_name  VARCHAR(20),
  created_at  TIMESTAMP DEFAULT NOW()
);

-- Darsliklar (PDF/matn darslar) jadvali
CREATE TABLE IF NOT EXISTS lessons (
  id            SERIAL PRIMARY KEY,
  title         VARCHAR(255) NOT NULL,
  description   TEXT,
  subject_id    INT REFERENCES subjects(id) ON DELETE CASCADE,
  teacher_id    INT REFERENCES users(id) ON DELETE SET NULL,
  file_url      TEXT,
  file_public_id TEXT,
  file_type     VARCHAR(20) DEFAULT 'pdf',  -- pdf | text
  content       TEXT,                        -- matn darsi uchun
  order_num     INT DEFAULT 0,
  is_published  BOOLEAN DEFAULT FALSE,
  views         INT DEFAULT 0,
  created_at    TIMESTAMP DEFAULT NOW(),
  updated_at    TIMESTAMP DEFAULT NOW()
);

-- Video darslar jadvali
CREATE TABLE IF NOT EXISTS videos (
  id              SERIAL PRIMARY KEY,
  title           VARCHAR(255) NOT NULL,
  description     TEXT,
  subject_id      INT REFERENCES subjects(id) ON DELETE CASCADE,
  teacher_id      INT REFERENCES users(id) ON DELETE SET NULL,
  video_url       TEXT NOT NULL,
  video_public_id TEXT,
  thumbnail_url   TEXT,
  thumbnail_public_id TEXT,
  duration_sec    INT DEFAULT 0,
  views           INT DEFAULT 0,
  is_published    BOOLEAN DEFAULT FALSE,
  created_at      TIMESTAMP DEFAULT NOW(),
  updated_at      TIMESTAMP DEFAULT NOW()
);

-- O'quvchining dars progressi
CREATE TABLE IF NOT EXISTS lesson_progress (
  id          SERIAL PRIMARY KEY,
  student_id  INT REFERENCES users(id) ON DELETE CASCADE,
  lesson_id   INT REFERENCES lessons(id) ON DELETE CASCADE,
  is_done     BOOLEAN DEFAULT FALSE,
  done_at     TIMESTAMP,
  UNIQUE(student_id, lesson_id)
);

-- Video ko'rish tarixi
CREATE TABLE IF NOT EXISTS video_views (
  id          SERIAL PRIMARY KEY,
  student_id  INT REFERENCES users(id) ON DELETE CASCADE,
  video_id    INT REFERENCES videos(id) ON DELETE CASCADE,
  watched_sec INT DEFAULT 0,
  is_done     BOOLEAN DEFAULT FALSE,
  viewed_at   TIMESTAMP DEFAULT NOW(),
  UNIQUE(student_id, video_id)
);

-- Topshiriqlar
CREATE TABLE IF NOT EXISTS tasks (
  id          SERIAL PRIMARY KEY,
  title       VARCHAR(255) NOT NULL,
  description TEXT,
  subject_id  INT REFERENCES subjects(id) ON DELETE CASCADE,
  teacher_id  INT REFERENCES users(id) ON DELETE SET NULL,
  class_name  VARCHAR(20),
  deadline    TIMESTAMP,
  max_score   INT DEFAULT 100,
  created_at  TIMESTAMP DEFAULT NOW()
);

-- Topshiriq javoblari
CREATE TABLE IF NOT EXISTS task_submissions (
  id          SERIAL PRIMARY KEY,
  task_id     INT REFERENCES tasks(id) ON DELETE CASCADE,
  student_id  INT REFERENCES users(id) ON DELETE CASCADE,
  content     TEXT,
  file_url    TEXT,
  score       INT,
  feedback    TEXT,
  submitted_at TIMESTAMP DEFAULT NOW(),
  graded_at   TIMESTAMP,
  UNIQUE(task_id, student_id)
);

-- Bildirishnomalar
CREATE TABLE IF NOT EXISTS notifications (
  id          SERIAL PRIMARY KEY,
  user_id     INT REFERENCES users(id) ON DELETE CASCADE,
  title       VARCHAR(255),
  message     TEXT,
  type        VARCHAR(30) DEFAULT 'info',  -- info | success | warning
  is_read     BOOLEAN DEFAULT FALSE,
  created_at  TIMESTAMP DEFAULT NOW()
);

-- Indekslar
CREATE INDEX IF NOT EXISTS idx_users_email   ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role    ON users(role);
CREATE INDEX IF NOT EXISTS idx_lessons_subject ON lessons(subject_id);
CREATE INDEX IF NOT EXISTS idx_videos_subject  ON videos(subject_id);
CREATE INDEX IF NOT EXISTS idx_tasks_class     ON tasks(class_name);

-- updated_at auto-trigger
CREATE OR REPLACE FUNCTION update_timestamp()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ language 'plpgsql';

CREATE TRIGGER update_users_timestamp    BEFORE UPDATE ON users    FOR EACH ROW EXECUTE FUNCTION update_timestamp();
CREATE TRIGGER update_lessons_timestamp  BEFORE UPDATE ON lessons  FOR EACH ROW EXECUTE FUNCTION update_timestamp();
CREATE TRIGGER update_videos_timestamp   BEFORE UPDATE ON videos   FOR EACH ROW EXECUTE FUNCTION update_timestamp();

-- ====================================================
-- Testlar (Quizzes) va Savollar
-- ====================================================

-- Testlar jadvali
CREATE TABLE IF NOT EXISTS quizzes (
  id           SERIAL PRIMARY KEY,
  title        VARCHAR(255) NOT NULL,
  description  TEXT,
  subject_id   INT REFERENCES subjects(id) ON DELETE CASCADE,
  teacher_id   INT REFERENCES users(id) ON DELETE SET NULL,
  created_at   TIMESTAMP DEFAULT NOW(),
  updated_at   TIMESTAMP DEFAULT NOW()
);

-- Savollar jadvali
CREATE TABLE IF NOT EXISTS questions (
  id              SERIAL PRIMARY KEY,
  quiz_id         INT REFERENCES quizzes(id) ON DELETE CASCADE,
  question_text   TEXT NOT NULL,
  options         JSONB NOT NULL, -- Variantlar: ["Option A", "Option B", ...]
  correct_option  INT NOT NULL,   -- To'g'ri javob indeksi (0-3)
  created_at      TIMESTAMP DEFAULT NOW()
);

-- Test topshirish urinishlari jadvali
CREATE TABLE IF NOT EXISTS quiz_attempts (
  id              SERIAL PRIMARY KEY,
  quiz_id         INT REFERENCES quizzes(id) ON DELETE CASCADE,
  student_id      INT REFERENCES users(id) ON DELETE CASCADE,
  score           INT NOT NULL,          -- To'g'ri javoblar soni
  total_questions INT NOT NULL,          -- Jami savollar soni
  percentage      DECIMAL(5,2) NOT NULL, -- Foiz (masalan: 83.33)
  attempted_at    TIMESTAMP DEFAULT NOW(),
  UNIQUE(student_id, quiz_id)
);

CREATE INDEX IF NOT EXISTS idx_quizzes_subject ON quizzes(subject_id);
CREATE INDEX IF NOT EXISTS idx_questions_quiz  ON questions(quiz_id);
CREATE INDEX IF NOT EXISTS idx_quiz_attempts_student ON quiz_attempts(student_id);

CREATE TRIGGER update_quizzes_timestamp BEFORE UPDATE ON quizzes FOR EACH ROW EXECUTE FUNCTION update_timestamp();
