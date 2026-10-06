# 🎓 SmartSchool — To'liq Backend + Frontend

## Texnologiyalar
- **Backend**: Node.js + Express
- **Ma'lumotlar bazasi**: PostgreSQL
- **Fayl saqlash**: Cloudinary (video, PDF, rasm)
- **Auth**: JWT Token
- **Frontend**: HTML + CSS + Vanilla JS

---

## 📁 Loyiha tuzilmasi

```
smartschool/
├── backend/
│   ├── config/
│   │   ├── db.js            # PostgreSQL ulanish
│   │   ├── cloudinary.js    # Cloudinary + Multer sozlamalari
│   │   └── schema.sql       # Ma'lumotlar bazasi jadvallari
│   ├── controllers/
│   │   ├── authController.js    # Ro'yxatdan o'tish / Kirish
│   │   ├── profileController.js # Profil, avatar yuklash
│   │   ├── lessonController.js  # Darsliklar (PDF)
│   │   ├── videoController.js   # Video darslar
│   │   ├── subjectController.js # Fanlar
│   │   └── adminController.js   # Admin panel
│   ├── middleware/
│   │   └── auth.js          # JWT tekshirish
│   ├── routes/
│   │   ├── auth.js
│   │   ├── profile.js
│   │   ├── lessons.js
│   │   ├── videos.js
│   │   ├── subjects.js
│   │   └── admin.js
│   ├── server.js            # Asosiy server
│   ├── package.json
│   └── .env.example         # Environment o'zgaruvchilar namunasi
└── frontend/
    └── index.html           # To'liq frontend
```

---

## 🚀 O'rnatish

### 1. PostgreSQL bazasini yaratish
```sql
CREATE DATABASE smartschool;
```

### 2. Backend o'rnatish
```bash
cd backend
npm install

# .env faylini yarating
cp .env.example .env
# .env faylini o'zingizning ma'lumotlaringiz bilan to'ldiring
```

### 3. .env faylini to'ldirish
```env
PORT=5000
DB_HOST=localhost
DB_PORT=5432
DB_NAME=smartschool
DB_USER=postgres
DB_PASSWORD=YOUR_PASSWORD

JWT_SECRET=very_secret_key_here
JWT_EXPIRES_IN=7d

CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

FRONTEND_URL=http://localhost:3000
```

### 4. Ma'lumotlar bazasi jadvallarini yaratish
```bash
psql -U postgres -d smartschool -f config/schema.sql
```

### 5. Serverni ishga tushirish
```bash
# Production
npm start

# Development (auto-restart)
npm run dev
```

Server: http://localhost:5000

---

## 🌐 API Endpointlar

### Auth
| Method | Endpoint            | Tavsif                |
|--------|---------------------|-----------------------|
| POST   | /api/auth/register  | Ro'yxatdan o'tish     |
| POST   | /api/auth/login     | Kirish                |
| GET    | /api/auth/me        | Joriy foydalanuvchi   |

### Profil
| Method | Endpoint                  | Tavsif              |
|--------|---------------------------|---------------------|
| GET    | /api/profile/me           | Profilni olish      |
| PUT    | /api/profile/update       | Profilni yangilash  |
| POST   | /api/profile/avatar       | Avatar yuklash      |
| PUT    | /api/profile/change-password | Parol o'zgartirish |

### Darsliklar
| Method | Endpoint                  | Tavsif               |
|--------|---------------------------|----------------------|
| GET    | /api/lessons              | Barcha darslar       |
| GET    | /api/lessons/:id          | Bitta dars           |
| POST   | /api/lessons              | Yangi dars (PDF)     |
| PUT    | /api/lessons/:id          | Darsni yangilash     |
| DELETE | /api/lessons/:id          | Darsni o'chirish     |
| POST   | /api/lessons/:id/complete | Bajarildi belgilash  |

### Videolar
| Method | Endpoint                 | Tavsif               |
|--------|--------------------------|----------------------|
| GET    | /api/videos              | Barcha videolar      |
| GET    | /api/videos/:id          | Bitta video          |
| POST   | /api/videos              | Video yuklash        |
| PUT    | /api/videos/:id          | Videoni yangilash    |
| DELETE | /api/videos/:id          | Videoni o'chirish    |
| POST   | /api/videos/:id/progress | Ko'rish progressi    |

### Fanlar
| Method | Endpoint         | Tavsif          |
|--------|------------------|-----------------|
| GET    | /api/subjects    | Barcha fanlar   |
| POST   | /api/subjects    | Fan qo'shish    |
| PUT    | /api/subjects/:id| Fan yangilash   |
| DELETE | /api/subjects/:id| Fan o'chirish   |

### Admin
| Method | Endpoint                          | Tavsif                      |
|--------|-----------------------------------|-----------------------------|
| GET    | /api/admin/users                  | Foydalanuvchilar ro'yxati   |
| PUT    | /api/admin/users/:id/toggle-active| Bloklash / Faollashtirish   |
| DELETE | /api/admin/users/:id              | O'chirish                   |
| GET    | /api/admin/stats                  | Platforma statistikasi      |

---

## 🔐 Rollar va ruxsatlar
| Amal              | O'quvchi | O'qituvchi | Admin |
|-------------------|----------|------------|-------|
| Darslarni ko'rish | ✅       | ✅         | ✅    |
| Videolarni ko'rish| ✅       | ✅         | ✅    |
| Dars yuklash      | ❌       | ✅         | ✅    |
| Video yuklash     | ❌       | ✅         | ✅    |
| Foydalanuvchi boshqaruv | ❌ | ❌        | ✅    |
| Statistika        | ❌       | ❌         | ✅    |

---

## ☁️ Cloudinary sozlash
1. https://cloudinary.com ga o'ting
2. Bepul akkaunt oching
3. Dashboard'dan `Cloud name`, `API Key`, `API Secret` ni oling
4. `.env` fayliga joylashtiring

---

## 🎯 Keyingi qadamlar
- [ ] Test/viktorina tizimi
- [ ] Real-time chat (Socket.io)
- [ ] Email bildirishnomalar (Nodemailer)
- [ ] Natijalar eksport (PDF/Excel)
- [ ] Mobile app (React Native)
