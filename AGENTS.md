# Session instructions

- At the start of every new session, read all `.md` files in `./changelog/` to understand what was done before.
- Each change must be saved as a separate `.md` file in `./changelog/`.
- After every batch of changes, ask the user "Применить изменения в репозитории?" If they say yes, commit and push.

# Session context (last updated: 31.05.2026)

## Проект: tuba-kz — сайт мебельной компании в Алматы

### Установленные правила
- После каждого батча изменений спрашивать "Применить изменения в репозитории?"

### Что уже сделано
1. Интегрирована Strata flex-сетка (`assets/css/grid.css`)
2. Добавлены секции: Instagram CTA, "5 бесплатных услуг" (perks), партнёры/бренды, SEO текст, кнопка телефона
3. Портфолио: тёмный фон #141414, навигация в лайтбоксе (← → Escape), убран grayscale, улучшен ховер
4. Применены редакторские правки: новый hero-оффер, преимущества с конкретикой, CTA "Получить расчет в WhatsApp", блок доверия (6 карточек), FAQ +5 вопросов, усилен footer
5. Логотип `assets/tuba-logo.jpg` скопирован из `Tuba.kz сайт/assets/TUBA LOGO 29.01.26.jpg.jpeg`
6. SVG водяной знак "TUBA" на всех секциях (кроме hero и props-strip) с инверсией на тёмном фоне
7. Favicon заменён на logo JPG, в хедере добавлен `<img class="brand-logo">` перед названием
8. **Аудит (31.05):** исправлен баг фильтрации в лайтбоксе, добавлен счётчик `3 из 12`, поправлен чат-шаблон WhatsApp, SEO title, 20 проектов переименованы из "Прихожая 1" в детальные названия

### Источники данных
- Фото работ: `assets/` (исходники в `C:\Users\Мурат\OneDrive\Documents\Tuba.kz сайт\assets\`)
- Логотип: `assets/tuba-logo.jpg` (исходник: `TUBA LOGO 29.01.26.jpg.jpeg`)
- Редакторское ТЗ: `C:\Users\Мурат\OneDrive\Documents\Tuba.kz сайт\tuba_editor_recommendations.md`
