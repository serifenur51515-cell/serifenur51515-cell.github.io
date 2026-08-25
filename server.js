const express = require('express');
const jwt = require('jsonwebtoken');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

const SECRET_KEY = 'staj_gizli_anahtari';

// 1. LOGIN ENDPOINT'I (Giriş yapma ve JWT Token üretme)
app.post('/auth/login', (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'E-posta ve şifre zorunludur!' });
  }

  // Token üretiliyor
  const token = jwt.sign(
    { userId: 1, email: email },
    SECRET_KEY,
    { expiresIn: '1h' }
  );

  return res.status(200).json({
    message: 'Giriş başarılı!',
    token: token
  });
});

// 2. JWT TOKEN DOĞRULAMA KONTROLÜ (Middleware)
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Token bulunamadı, yetkisiz erişim!' });
  }

  jwt.verify(token, SECRET_KEY, (err, user) => {
    if (err) {
      return res.status(401).json({ error: 'Geçersiz veya süresi dolmuş token!' });
    }
    req.user = user;
    next();
  });
}

// 3. KORUMALI ENDPOINT (/transactions - Filtreleme ve Sayfalama Desteği)
app.get('/transactions', authenticateToken, (req, res) => {
  const { type, category, page = 1, limit = 10 } = req.query;

  let result = [
    { id: 1, title: 'Market Alışverişi', amount: 250, type: 'gider', category: 'market' },
    { id: 2, title: 'Maaş', amount: 15000, type: 'gelir', category: 'maaş' },
    { id: 3, title: 'Elektrik Faturası', amount: 450, type: 'gider', category: 'fatura' }
  ];

  // Kategori Filtresi
  if (category) {
    result = result.filter(item => item.category === category);
  }

  // Tür Filtresi (gelir / gider)
  if (type) {
    result = result.filter(item => item.type === type);
  }

  // Sayfalama (Pagination)
  const pageNum = parseInt(page);
  const limitNum = parseInt(limit);
  const startIndex = (pageNum - 1) * limitNum;
  const endIndex = pageNum * limitNum;
  const paginatedResult = result.slice(startIndex, endIndex);

  res.json({
    page: pageNum,
    limit: limitNum,
    total: result.length,
    data: paginatedResult
  });
});

// 4. SUNUCUYU BAŞLATMA
const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Sunucu http://localhost:${PORT} adresinde aktif çalışıyor.`);
});