const pool = require('./config/db');

async function seedData() {
  console.log('--- Ma\'lumotlarni seed qilish boshlandi ---');
  try {
    // 1. Ensure video_lessons view
    await pool.query(`
      ALTER TABLE videos ALTER COLUMN video_url TYPE TEXT;
      CREATE OR REPLACE VIEW video_lessons AS SELECT * FROM videos;
    `);

    // 2. Sample YouTube videos
    const sampleVideos = [
      {
        title: 'Kvadrat tenglamalar — To\'liq qo\'llanma va misollar',
        description: 'Kvadrat tenglamalarni diskriminant va Viyet teoremasi yordamida yechish usullari.',
        subject_name: 'Matematika',
        video_url: 'https://www.youtube.com/watch?v=sB_i1eG4x4E',
        thumbnail_url: 'https://img.youtube.com/vi/sB_i1eG4x4E/hqdefault.jpg',
        duration_sec: 1122,
        views: 2400
      },
      {
        title: 'Nyuton qonunlari — Amaliy misollar va dinamika',
        description: 'Nyutonning 1, 2 va 3-qonunlari, inersiya va kuch tushunchalari.',
        subject_name: 'Fizika',
        video_url: 'https://www.youtube.com/watch?v=kKKM8Y-u7ds',
        thumbnail_url: 'https://img.youtube.com/vi/kKKM8Y-u7ds/hqdefault.jpg',
        duration_sec: 1455,
        views: 1800
      },
      {
        title: 'O\'zbekiston mustaqilligi tarixi va Amir Temur davlati',
        description: 'O\'rta asrlar va yangi davr O\'zbekiston tarixi darsligi.',
        subject_name: 'Tarix',
        video_url: 'https://www.youtube.com/watch?v=snbUv9E4VPE',
        thumbnail_url: 'https://img.youtube.com/vi/snbUv9E4VPE/hqdefault.jpg',
        duration_sec: 1928,
        views: 3100
      },
      {
        title: 'Davriy sistema elementlari va kimyoviy bog\'lanish',
        description: 'Mendeleyev davriy jadvali va kimyoviy reaksiyalar.',
        subject_name: 'Kimyo',
        video_url: 'https://www.youtube.com/watch?v=0RRVV4Diomg',
        thumbnail_url: 'https://img.youtube.com/vi/0RRVV4Diomg/hqdefault.jpg',
        duration_sec: 930,
        views: 1200
      },
      {
        title: 'Ona tili: Fe\'l zamonlari va grammatika',
        description: 'O\'tgan, hozirgi va kelasi zamon fe\'llarining imlosi va qo\'llanishi.',
        subject_name: 'Ona tili',
        video_url: 'https://www.youtube.com/watch?v=aircAruvnKk',
        thumbnail_url: 'https://img.youtube.com/vi/aircAruvnKk/hqdefault.jpg',
        duration_sec: 1725,
        views: 2000
      },
      {
        title: 'Ingliz tili: Past Tense vs Present Perfect',
        description: 'Ingliz tili zamonlarini to\'g\'ri farqlash va kundalik muloqotda qo\'llash.',
        subject_name: 'Ingliz tili',
        video_url: 'https://www.youtube.com/watch?v=kJQP7kiw5Fk',
        thumbnail_url: 'https://img.youtube.com/vi/kJQP7kiw5Fk/hqdefault.jpg',
        duration_sec: 1278,
        views: 4200
      }
    ];

    for (const sv of sampleVideos) {
      const subRes = await pool.query('SELECT id FROM subjects WHERE LOWER(name) = LOWER($1)', [sv.subject_name]);
      const subId = subRes.rows.length ? subRes.rows[0].id : null;
      
      const exist = await pool.query('SELECT id FROM videos WHERE video_url = $1', [sv.video_url]);
      if (!exist.rows.length) {
        await pool.query(
          'INSERT INTO videos (title, description, subject_id, video_url, thumbnail_url, duration_sec, views, is_published) VALUES ($1, $2, $3, $4, $5, $6, $7, TRUE)',
          [sv.title, sv.description, subId, sv.video_url, sv.thumbnail_url, sv.duration_sec, sv.views]
        );
        console.log('+ Videodars qo\'shildi: ' + sv.title);
      } else {
        await pool.query(
          'UPDATE videos SET title = $1, description = $2, thumbnail_url = $3, is_published = TRUE WHERE id = $4',
          [sv.title, sv.description, sv.thumbnail_url, exist.rows[0].id]
        );
      }
    }

    console.log('🎉 Barcha namunaviy videodarslar muvaffaqiyatli saqlandi!');
  } catch (err) {
    console.error('❌ Seeding xatosi:', err.message);
  } finally {
    process.exit(0);
  }
}

seedData();
