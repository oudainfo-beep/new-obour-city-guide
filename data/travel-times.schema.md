# مخطط بيانات أزمنة التنقل (travel-times)

ملف `travel-times.json` مصفوفة JSON فارغة حاليًا. يُملأ بقياسات فعلية على الطرق، لا بتقديرات نظرية.

## كيفية التعبئة

كل عنصر في المصفوفة يمثل قياسًا لمسار واحد في اتجاه واحد:

```json
{
  "route": "Obour → Nasr City",
  "from": "العبور الجديدة، الحي الأول",
  "to": "مدينة نصر، مكرم عبيد",
  "distance_km": 28,
  "minutes_morning_peak": 55,
  "minutes_offpeak": 35,
  "measured_at": "2026-08-15",
  "method": "GPS/Stopwatch"
}
```

## الحقول

| الحقل | النوع | الوصف |
|-------|-------|-------|
| `route` | string | اسم المسار موجز (مثال: العبور → مدينة نصر) |
| `from` | string | نقطة الانطلاق بالتفصيل الكافي |
| `to` | string | نقطة الوصول بالتفصيل الكافي |
| `distance_km` | number | المسافة بالكيلومتر حسب جهاز GPS أو خرائط معتمدة |
| `minutes_morning_peak` | number | الدقائق في ذروة الصباح (7:30–9:00) |
| `minutes_offpeak` | number | الدقائق خارج الذروة |
| `measured_at` | string (YYYY-MM-DD) | تاريخ القياس الفعلي |
| `method` | string | طريقة القياس: `GPS/Stopwatch` أو `Maps estimate` أو `Repeated average` |

## قواعد

- لا تُدخل تقديرات نظرية.
- لا تُدخل أرقام من خرائط Google دون قياس ميداني تأكيدي.
- اذكر طريقة القياس بوضوح.
- عند إضافة قياسات، سيتم بناء صفحة `/travel-times/` عليها لاحقًا.
