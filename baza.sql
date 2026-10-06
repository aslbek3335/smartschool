INSERT INTO users (full_name, email, password, role) 
VALUES ('Asosiy Admin', 'admin@smartschool.uz', '$2b$10$X7vW7...hash_parol_yerda_bolishi_mumkin...', 'admin')
ON CONFLICT (email) DO NOTHING;