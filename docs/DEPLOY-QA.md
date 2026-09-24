# تشغيل مجتمع الأسئلة (Q&A) على VPS — دليل النشر

الميزة تعمل بجزأين: صفحات ثابتة (موجودة بالفعل بعد هذا الدفع) + خادم Node يشغّل واجهة `/api/qa`.
**بدون الخادم**: تظهر صناديق الأسئلة برسالة «المجتمع يبدأ قريبًا» — لا أخطاء ولا صفحات مكسورة.

## الوضع الحالي (منذ 2026-09-24): «بلا شبكة» على Cloudflare Pages

الموقع منشور على Cloudflare Pages بلا خادم Node، فكان `qa.js` يطلق `/api/qa/me` و`/api/qa/questions`
على كل صفحة ويحصل على 404 (رآها Googlebot ~120 مرة أسبوعيًا). لذلك:

- `qa.js` لا يرسل أي طلب شبكة ما لم يُفعَّل صراحةً، ويعرض حالة «المجتمع يبدأ قريبًا» مباشرة.
- المرحلة `scripts/seo-phase73-qa-offline.mjs` (آخر السلسلة) تُرقّم وسم `qa.js?v=…` وتحذف
  `qa.js`/`qa.css` من الصفحات التي لا تحوي صندوق `qa-box`.

**التفعيل عند جاهزية الخادم** (بعد توجيه `/api/qa` إليه كما في الأسفل): أضف `data-qa-api="on"` إلى
وسم `<html>` في مولّد الصفحات (`scripts/render-static.mjs`) — أو `window.__QA_API__ = true` في سكربت
مضمّن قبل `qa.js` — ثم أعد البناء. لا حاجة لتعديل `qa.js` نفسه.

## المتطلبات على الـ VPS

1. **Node.js 18+** — تحقق: `node -v`
2. **MySQL** — Hostinger يوفر قواعد MySQL من لوحة التحكم (Databases → MySQL). أنشئ قاعدة مثل `obourguide_qa` ومستخدمًا بكلمة مرور.
3. **pm2** لتشغيل الخادم دائمًا: `npm i -g pm2`

## خطوات النشر

```bash
cd /path/to/new-obour-city-guide
git pull origin main

# 1) متغيرات البيئة — أنشئ ملف .env في جذر المشروع:
cat > .env <<'EOF'
DATABASE_URL=mysql://USER:PASSWORD@localhost:3306/obourguide_qa
ADMIN_EMAIL=you@example.com
NODE_ENV=production
PORT=3000
EOF

# 2) ثبّت الاعتماديات الإنتاجية (مرة أو عند تغيير package.json)
npm install --omit=dev

# 3) ابنِ الموقع (السلسلة كاملة + vite + esbuild للخادم)
npm run build

# 4) شغّل الخادم دائمًا
pm2 start dist/index.js --name obourguide
pm2 save && pm2 startup   # مرة واحدة فقط

# للتحديثات اللاحقة: git pull && npm run build && pm2 restart obourguide
```

الجداول تُنشأ تلقائيًا عند أول إقلاع — لا migrations يدوية.
أول بريد يسجل مطابقًا لـ ADMIN_EMAIL يصبح مشرفًا (يستطيع حذف الأسئلة والإجابات).

## إن كان الموقع يُقدَّم حاليًا عبر nginx مباشرة (ملفات ثابتة فقط)

وجّه `/api` إلى خادم Node وقدّم الباقي من `dist/public`:

```nginx
server {
  listen 80;
  server_name obourguide.com www.obourguide.com;
  root /path/to/new-obour-city-guide/dist/public;

  location /api/ {
    proxy_pass http://127.0.0.1:3000;
    proxy_set_header Host $host;
    proxy_set_header X-Forwarded-For $remote_addr;
  }
  location / {
    try_files $uri $uri/ /404/index.html;
  }
}
```

ثم: `nginx -t && systemctl reload nginx`

## اختبار سريع بعد التشغيل

```bash
curl -s https://obourguide.com/api/qa/topics     # يجب أن يرد {"topics":[]}
# سجّل حسابك من https://obourguide.com/ask/ ثم اسأل سؤالًا تجريبيًا واحذفه كمشرف
```

## ملاحظات

- `DATABASE_URL` و`.env` لا تُلتزم أبدًا بالمستودع (.gitignore يغطيها — تحقق).
- كوكي الجلسة httpOnly وSecure في الإنتاج؛ كلمات المرور مخزنة scrypt.
- الحذف متاح للمشرف من الواجهة نفسها (رابط «حذف» يظهر لمشرف فقط).
