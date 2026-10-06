const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config();
const pool = require('../config/db');
const jwt = require('jsonwebtoken');

/**
 * SmartSchool AI Chat Controller
 * To'g'ridan-to'g'ri Google Gemini API ga so'rov yuboradi.
 * Har qanday soxta/lokal zaxira (fallback) javoblar olib tashlangan.
 */
exports.handleChat = async (req, res) => {
  try {
    const { message } = req.body;

    // 1. Validatsiya: Xabar mavjudligini tekshirish
    if (!message || typeof message !== 'string' || !message.trim()) {
      return res.status(400).json({
        success: false,
        error: 'Xabar matni kiritilmadi.'
      });
    }

    // 2. Validatsiya: GEMINI_API_KEY mavjudligini tekshirish
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey || apiKey.trim() === '' || apiKey.includes('shu_yerga')) {
      console.error('❌ GEMINI_API_KEY topilmadi yoki .env faylida belgilanmagan.');
      return res.status(500).json({
        success: false,
        error: "GEMINI_API_KEY topilmadi yoki noto'g'ri sozlangan. Iltimos, backend/.env faylida GEMINI_API_KEY ni belgilang."
      });
    }

    // 3. Agar foydalanuvchi tizimga kirgan bo'lsa, uning kontekstini olish (ixtiyoriy)
    let userContextInfo = '';
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      try {
        const token = authHeader.split(' ')[1];
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const userRes = await pool.query(
          'SELECT id, full_name, email, role, class_name, subject FROM users WHERE id = $1 AND is_active = TRUE',
          [decoded.id]
        );
        if (userRes.rows.length) {
          const user = userRes.rows[0];
          userContextInfo = `\nFoydalanuvchi ma'lumotlari: Ismi: ${user.full_name}, Roli: ${user.role}${user.class_name ? `, Sinfi: ${user.class_name}` : ''}${user.subject ? `, Fani: ${user.subject}` : ''}.`;
        }
      } catch (tokenErr) {
        // Token xatosi bo'lsa ham chat to'xtatilmaydi
      }
    }

    // 4. @google/generative-ai orqali Gemini modelini ishga tushirish
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
      model: 'gemini-3.6-flash',
      systemInstruction: `Siz SmartSchool elektron ta'lim platformasining aqlli AI yordamchisiz. Foydalanuvchilarning darslar, topshiriqlar, baholar va ta'limga oid savollariga o'zbek tilida aniq, tushunarli va xushmuomala javob bering.${userContextInfo}`
    });

    // 5. So'rov yuborish va haqiqiy AI javobini olish
    const result = await model.generateContent(message);
    const replyText = result.response.text();

    return res.json({
      success: true,
      reply: replyText,
      provider: 'Google Gemini AI'
    });

  } catch (err) {
    // Hech qanday soxta zaxira qaytarilmaydi — haqiqiy xato log qilinadi va frontendga uzatiladi
    console.error('❌ Gemini API xatosi:', err);
    return res.status(500).json({
      success: false,
      error: err.message || "Gemini API bilan bog'lanishda xatolik yuz berdi."
    });
  }
};
