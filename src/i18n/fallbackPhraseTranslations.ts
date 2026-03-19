import i18next from 'i18next'
import type { SupportedLng } from './config'

type FallbackLng = Exclude<SupportedLng, 'en'>
type PhraseTranslations = Record<FallbackLng, string>
type I18nInstance = typeof i18next

const manualPhraseTranslations: Record<string, PhraseTranslations> = {
  '?': { ru: '?', uz: '?' },
  '(limit reached, upgrade to add more)': {
    ru: '(лимит достигнут, обновите тариф, чтобы добавить больше)',
    uz: "(limit tugadi, ko'proq qo'shish uchun tarifni yangilang)",
  },
  '{{count}} universities found': { ru: 'Найдено {{count}} университетов', uz: '{{count}} ta universitet topildi' },
  '14 days': { ru: '14 дней', uz: '14 kun' },
  '15 applications': { ru: '15 заявок', uz: '15 ta ariza' },
  '15 student requests': { ru: '15 запросов студентов', uz: "15 ta talaba so'rovi" },
  '3 applications': { ru: '3 заявки', uz: '3 ta ariza' },
  'A verification request will be sent. An administrator will review and add your university.': {
    ru: 'Будет отправлен запрос на подтверждение. Администратор проверит и добавит ваш университет.',
    uz: "Tasdiqlash so'rovi yuboriladi. Administrator universitetingizni ko'rib chiqib qo'shadi.",
  },
  'Accent color': { ru: 'Акцентный цвет', uz: 'Aksent rangi' },
  'Account under review': { ru: 'Аккаунт на проверке', uz: "Hisob tekshiruvda" },
  active: { ru: 'активно', uz: 'faol' },
  Add: { ru: 'Добавить', uz: "Qo'shish" },
  'Add certificate': { ru: 'Добавить сертификат', uz: 'Sertifikat qo‘shish' },
  'Add custom': { ru: 'Добавить свой вариант', uz: "O'z variantini qo'shish" },
  'Add custom faculty': { ru: 'Добавить свой факультет', uz: "O'z fakultetini qo'shish" },
  'Add custom program...': { ru: 'Добавить свою программу...', uz: "O'z dasturini qo'shish..." },
  'Add photo': { ru: 'Добавить фото', uz: 'Rasm qo‘shish' },
  'Add program': { ru: 'Добавить программу', uz: "Dastur qo'shish" },
  'Add scholarship': { ru: 'Добавить стипендию', uz: 'Stipendiya qo‘shish' },
  'Add transcripts, diplomas, language certificates, passport, etc.': {
    ru: 'Добавьте транскрипты, дипломы, языковые сертификаты, паспорт и т.д.',
    uz: 'Transkript, diplom, til sertifikati, pasport va boshqalarni qo‘shing.',
  },
  'Add your own faculty names and descriptions.': {
    ru: 'Добавьте свои названия и описания факультетов.',
    uz: "O'z fakultet nomlari va tavsiflarini qo'shing.",
  },
  'All faculties already added.': { ru: 'Все факультеты уже добавлены.', uz: "Barcha fakultetlar allaqachon qo'shilgan." },
  'All universities': { ru: 'Все университеты', uz: 'Barcha universitetlar' },
  'Also apply my profile defaults': { ru: 'Также применять значения профиля по умолчанию', uz: 'Profilimdagi standart qiymatlarni ham qo‘llash' },
  'Assigning School counsellor: user will get read-only access to the admin panel.': {
    ru: 'При назначении школьного консультанта пользователь получит доступ только для чтения в админ-панели.',
    uz: "School counsellor roli berilganda foydalanuvchi admin panelga faqat o'qish huquqi bilan kiradi.",
  },
  'Available placeholders: {{studentName}}, {{universityName}}, {{programName}}, {{date}}': {
    ru: 'Доступные плейсхолдеры: {{studentName}}, {{universityName}}, {{programName}}, {{date}}',
    uz: 'Mavjud placeholderlar: {{studentName}}, {{universityName}}, {{programName}}, {{date}}',
  },
  'Back to subscription': { ru: 'Назад к подписке', uz: 'Obunaga qaytish' },
  Body: { ru: 'Текст', uz: 'Matn' },
  'Cancel invitation': { ru: 'Отменить приглашение', uz: 'Taklifni bekor qilish' },
  Certificate: { ru: 'Сертификат', uz: 'Sertifikat' },
  Certificates: { ru: 'Сертификаты', uz: 'Sertifikatlar' },
  'Certificates & Testimonials': { ru: 'Сертификаты и отзывы', uz: 'Sertifikatlar va fikrlar' },
  'Change role': { ru: 'Изменить роль', uz: "Rolni o'zgartirish" },
  'ChatGPT-4': { ru: 'ChatGPT-4', uz: 'ChatGPT-4' },
  'Check programs you offer. Uncheck to hide. Add custom items below.': {
    ru: 'Отметьте программы, которые вы предлагаете. Снимите отметку, чтобы скрыть. Ниже можно добавить свои варианты.',
    uz: "Taklif qiladigan dasturlaringizni belgilang. Yashirish uchun belgini olib tashlang. Pastda o'z variantlaringizni qo'shishingiz mumkin.",
  },
  'Choose degree levels': { ru: 'Выберите уровни образования', uz: 'Daraja bosqichlarini tanlang' },
  'Choose faculties': { ru: 'Выберите факультеты', uz: 'Fakultetlarni tanlang' },
  'Choose faculties you are interested in. You can open each faculty to see what it includes.': {
    ru: 'Выберите интересующие вас факультеты. Можно открыть каждый факультет и посмотреть, что в него входит.',
    uz: "Qiziqqan fakultetlaringizni tanlang. Har bir fakultetni ochib, u nimalarni o'z ichiga olishini ko'rishingiz mumkin.",
  },
  'Choose program languages': { ru: 'Выберите языки программы', uz: 'Dastur tillarini tanlang' },
  'Choose target countries': { ru: 'Выберите целевые страны', uz: 'Maqsad mamlakatlarni tanlang' },
  'Choose whether to keep your profile defaults as an extra filter layer.': {
    ru: 'Выберите, сохранять ли значения профиля по умолчанию как дополнительный слой фильтра.',
    uz: "Profilingizdagi standart qiymatlarni qo'shimcha filtr qatlami sifatida saqlashni tanlang.",
  },
  'Choose whether to remove the message only for yourself or for everyone in this chat.': {
    ru: 'Выберите, удалить сообщение только у себя или у всех в этом чате.',
    uz: "Xabarni faqat o'zingiz uchunmi yoki bu chatdagi hamma uchunmi o'chirishni tanlang.",
  },
  'Click or drag to upload': { ru: 'Нажмите или перетащите для загрузки', uz: 'Yuklash uchun bosing yoki sudrab olib keling' },
  'Close menu': { ru: 'Закрыть меню', uz: 'Menyuni yopish' },
  'Close search': { ru: 'Закрыть поиск', uz: 'Qidiruvni yopish' },
  'Computer science, AI, law, MBA': { ru: 'Информатика, ИИ, право, MBA', uz: 'Kompyuter fanlari, AI, huquq, MBA' },
  'Contact support': { ru: 'Связаться с поддержкой', uz: "Qo'llab-quvvatlash bilan bog'lanish" },
  Copy: { ru: 'Копировать', uz: 'Nusxalash' },
  countries: { ru: 'стран', uz: 'ta mamlakat' },
  'Create university profile from catalog and notify the user?': {
    ru: 'Создать профиль университета из каталога и уведомить пользователя?',
    uz: 'Katalogdan universitet profilini yaratib, foydalanuvchini xabardor qilinsinmi?',
  },
  'Create user': { ru: 'Создать пользователя', uz: 'Foydalanuvchi yaratish' },
  'Custom faculties': { ru: 'Свои факультеты', uz: 'Maxsus fakultetlar' },
  'Customize: check only the programs you offer. Uncheck to hide.': {
    ru: 'Настройка: отметьте только те программы, которые вы предлагаете. Снимите отметку, чтобы скрыть.',
    uz: "Moslang: faqat taklif qiladigan dasturlaringizni belgilang. Yashirish uchun belgini olib tashlang.",
  },
  'Dark theme': { ru: 'Тёмная тема', uz: 'Qorong‘i mavzu' },
  DeepSeek: { ru: 'DeepSeek', uz: 'DeepSeek' },
  'DeepSeek v16': { ru: 'DeepSeek v16', uz: 'DeepSeek v16' },
  'Degree levels': { ru: 'Уровни образования', uz: 'Daraja bosqichlari' },
  'Delete certificate': { ru: 'Удалить сертификат', uz: 'Sertifikatni o‘chirish' },
  'Delete for everyone': { ru: 'Удалить для всех', uz: 'Hamma uchun o‘chirish' },
  'Delete for me': { ru: 'Удалить для меня', uz: 'Men uchun o‘chirish' },
  'Delete message': { ru: 'Удалить сообщение', uz: "Xabarni o'chirish" },
  'Delete this certificate?': { ru: 'Удалить этот сертификат?', uz: 'Ushbu sertifikat o‘chirilsinmi?' },
  'Delete this template?': { ru: 'Удалить этот шаблон?', uz: 'Ushbu shablon o‘chirilsinmi?' },
  'Delete?': { ru: 'Удалить?', uz: "O'chirilsinmi?" },
  'Documents (approved)': { ru: 'Документы (подтверждённые)', uz: 'Hujjatlar (tasdiqlangan)' },
  'Edit certificate': { ru: 'Редактировать сертификат', uz: 'Sertifikatni tahrirlash' },
  'Edit offer template': { ru: 'Редактировать шаблон оффера', uz: 'Taklif shablonini tahrirlash' },
  'Edit your message': { ru: 'Измените сообщение', uz: 'Xabaringizni tahrirlang' },
  'Editing message': { ru: 'Редактирование сообщения', uz: 'Xabar tahrirlanmoqda' },
  'Education (grades)': { ru: 'Образование (оценки)', uz: "Ta'lim (baholar)" },
  'Enter university name': { ru: 'Введите название университета', uz: 'Universitet nomini kiriting' },
  Experience: { ru: 'Опыт', uz: 'Tajriba' },
  faculties: { ru: 'факультетов', uz: 'ta fakultet' },
  'Faculties from catalog': { ru: 'Факультеты из каталога', uz: 'Katalogdagi fakultetlar' },
  'Failed to load profile.': { ru: 'Не удалось загрузить профиль.', uz: 'Profilni yuklab bo‘lmadi.' },
  Field: { ru: 'Направление', uz: "Yo'nalish" },
  File: { ru: 'Файл', uz: 'Fayl' },
  'Filter by degree levels, faculty coverage, program languages, and target student regions.': {
    ru: 'Фильтруйте по уровням образования, охвату факультетов, языкам программ и целевым регионам студентов.',
    uz: "Daraja bosqichlari, fakultet qamrovi, dastur tillari va maqsadli talabalar hududlari bo'yicha filtrlang.",
  },
  'Find a university by name, country, faculty, degree level, program language, tuition, requirements, founding year, student count, scholarships, and target countries.': {
    ru: 'Найдите университет по названию, стране, факультету, уровню образования, языку программы, стоимости, требованиям, году основания, числу студентов, стипендиям и целевым странам.',
    uz: "Universitetni nomi, mamlakati, fakulteti, daraja bosqichi, dastur tili, kontrakt narxi, talablar, tashkil topgan yili, talabalar soni, stipendiyalar va maqsad mamlakatlari bo'yicha toping.",
  },
  'Find your university in the list and click "Set" to send a verification request.': {
    ru: 'Найдите свой университет в списке и нажмите «Установить», чтобы отправить запрос на подтверждение.',
    uz: "Ro'yxatdan universitetingizni toping va tasdiqlash so'rovini yuborish uchun \"O'rnatish\"ni bosing.",
  },
  'Founded year from': { ru: 'Год основания от', uz: 'Tashkil topgan yil - dan' },
  'Founded year to': { ru: 'Год основания до', uz: 'Tashkil topgan yil - gacha' },
  'Free Trial': { ru: 'Бесплатный пробный период', uz: 'Bepul sinov' },
  'Full analytics': { ru: 'Полная аналитика', uz: "To'liq analitika" },
  'Full Filter': { ru: 'Полный фильтр', uz: "To'liq filtr" },
  'Global search': { ru: 'Глобальный поиск', uz: 'Global qidiruv' },
  Hobbies: { ru: 'Хобби', uz: 'Hobbi' },
  'Hobbies & activities': { ru: 'Хобби и активности', uz: 'Hobbi va faoliyatlar' },
  'IELTS, TOEFL, GPA, portfolio': { ru: 'IELTS, TOEFL, GPA, портфолио', uz: 'IELTS, TOEFL, GPA, portfolio' },
  Image: { ru: 'Изображение', uz: 'Rasm' },
  'Interests used: {{current}}': { ru: 'Использовано интересов: {{current}}', uz: 'Ishlatilgan qiziqishlar: {{current}}' },
  'Invitation cancelled.': { ru: 'Приглашение отменено.', uz: 'Taklif bekor qilindi.' },
  'Invitation sent.': { ru: 'Приглашение отправлено.', uz: 'Taklif yuborildi.' },
  items: { ru: 'элементов', uz: 'ta element' },
  'Landing Certificates': { ru: 'Лендинг-сертификаты', uz: 'Landing sertifikatlari' },
  'Language and theme': { ru: 'Язык и тема', uz: 'Til va mavzu' },
  Languages: { ru: 'Языки', uz: 'Tillar' },
  'Last updated: February 2025': { ru: 'Последнее обновление: февраль 2025', uz: 'Oxirgi yangilanish: 2025-yil fevral' },
  Layout: { ru: 'Макет', uz: 'Maket' },
  Level: { ru: 'Уровень', uz: 'Daraja' },
  'Light theme': { ru: 'Светлая тема', uz: "Yorug' mavzu" },
  Logo: { ru: 'Логотип', uz: 'Logotip' },
  'Main navigation': { ru: 'Основная навигация', uz: 'Asosiy navigatsiya' },
  'Manage certificates (universities) and testimonials (students) shown on the landing page.': {
    ru: 'Управляйте сертификатами (университеты) и отзывами (студенты), которые отображаются на лендинге.',
    uz: 'Landing sahifasida ko‘rsatiladigan sertifikatlar (universitetlar) va fikrlarni (talabalar) boshqaring.',
  },
  'Matching scope': { ru: 'Область совпадения', uz: 'Moslik doirasi' },
  'Max Premium': { ru: 'Макс Премиум', uz: 'Max Premium' },
  'Max tuition': { ru: 'Макс. стоимость', uz: 'Maks. kontrakt' },
  'Message actions': { ru: 'Действия с сообщением', uz: 'Xabar amallari' },
  'Min score': { ru: 'Мин. балл', uz: 'Min. ball' },
  'Min tuition': { ru: 'Мин. стоимость', uz: 'Min. kontrakt' },
  'Minimum requirements': { ru: 'Минимальные требования', uz: 'Minimal talablar' },
  'Minimum tuition (annual)': { ru: 'Минимальная стоимость (в год)', uz: 'Minimal kontrakt (yillik)' },
  'Narrow by tuition range, founding year, and university size.': {
    ru: 'Сузьте выбор по диапазону стоимости, году основания и размеру университета.',
    uz: 'Kontrakt oralig‘i, tashkil topgan yili va universitet hajmi bo‘yicha toraytiring.',
  },
  'Navigation menu': { ru: 'Навигационное меню', uz: 'Navigatsiya menyusi' },
  'Need help? Contact support for plan changes or billing questions.': {
    ru: 'Нужна помощь? Свяжитесь с поддержкой по вопросам тарифа или оплаты.',
    uz: "Yordam kerakmi? Tarifni o'zgartirish yoki to'lov savollari uchun qo'llab-quvvatlashga murojaat qiling.",
  },
  'New interests': { ru: 'Новые интересы', uz: 'Yangi qiziqishlar' },
  'Newest first': { ru: 'Сначала новые', uz: 'Avval yangilari' },
  'No certificates yet.': { ru: 'Пока нет сертификатов.', uz: 'Hali sertifikatlar yo‘q.' },
  'No faculties selected. Add from the catalog.': { ru: 'Факультеты не выбраны. Добавьте их из каталога.', uz: 'Fakultetlar tanlanmagan. Ularni katalogdan qo‘shing.' },
  'No options': { ru: 'Нет вариантов', uz: 'Variantlar yo‘q' },
  'No pending requests.': { ru: 'Нет ожидающих запросов.', uz: 'Kutilayotgan so‘rovlar yo‘q.' },
  'No requests.': { ru: 'Нет запросов.', uz: 'So‘rovlar yo‘q.' },
  'No templates yet. Create one to start.': { ru: 'Пока нет шаблонов. Создайте первый, чтобы начать.', uz: 'Hali shablonlar yo‘q. Boshlash uchun bittasini yarating.' },
  'No universities found. Try a different search or add your own.': {
    ru: 'Университеты не найдены. Попробуйте другой поиск или добавьте свой вариант.',
    uz: "Universitetlar topilmadi. Boshqa qidiruvni sinab ko'ring yoki o'z variantingizni qo'shing.",
  },
  'Offer templates': { ru: 'Шаблоны офферов', uz: 'Taklif shablonlari' },
  'Open / Download': { ru: 'Открыть / скачать', uz: 'Ochish / yuklab olish' },
  'Open menu': { ru: 'Открыть меню', uz: 'Menyuni ochish' },
  'Open search': { ru: 'Открыть поиск', uz: 'Qidiruvni ochish' },
  'Payment successful': { ru: 'Оплата прошла успешно', uz: 'To‘lov muvaffaqiyatli amalga oshdi' },
  Period: { ru: 'Период', uz: 'Davr' },
  Personal: { ru: 'Личное', uz: 'Shaxsiy' },
  'Portfolio / works': { ru: 'Портфолио / работы', uz: 'Portfolio / ishlar' },
  'Postpone 14 days': { ru: 'Отложить на 14 дней', uz: '14 kunga kechiktirish' },
  'Postpone 3 days': { ru: 'Отложить на 3 дня', uz: '3 kunga kechiktirish' },
  'Postpone 7 days': { ru: 'Отложить на 7 дней', uz: '7 kunga kechiktirish' },
  'Preferred student countries': { ru: 'Предпочтительные страны студентов', uz: 'Talabalar uchun afzal mamlakatlar' },
  Premium: { ru: 'Премиум', uz: 'Premium' },
  'Preparing voice message...': { ru: 'Подготовка голосового сообщения...', uz: 'Ovozli xabar tayyorlanmoqda...' },
  Present: { ru: 'По настоящее время', uz: 'Hozirgacha' },
  'Preview is not available.': { ru: 'Предпросмотр недоступен.', uz: "Ko'rib chiqish mavjud emas." },
  'Primary color': { ru: 'Основной цвет', uz: 'Asosiy rang' },
  'Privacy Policy': { ru: 'Политика конфиденциальности', uz: 'Maxfiylik siyosati' },
  'Profile (country, city)': { ru: 'Профиль (страна, город)', uz: 'Profil (mamlakat, shahar)' },
  'Profile matching off': { ru: 'Сопоставление профиля выключено', uz: 'Profil mosligi o‘chiq' },
  'Profile matching on': { ru: 'Сопоставление профиля включено', uz: 'Profil mosligi yoqilgan' },
  'Program languages': { ru: 'Языки программ', uz: 'Dastur tillari' },
  'Program query': { ru: 'Поиск по программе', uz: "Dastur bo'yicha qidiruv" },
  'Programs and faculties': { ru: 'Программы и факультеты', uz: 'Dasturlar va fakultetlar' },
  'Quick filters for fast discovery': { ru: 'Быстрые фильтры для быстрого поиска', uz: 'Tez qidiruv uchun tezkor filtrlar' },
  'Readiness for university': { ru: 'Готовность к университету', uz: 'Universitetga tayyorgarlik' },
  Ready: { ru: 'Готово', uz: 'Tayyor' },
  'Recording...': { ru: 'Идёт запись...', uz: 'Yozib olinmoqda...' },
  'Registered as:': { ru: 'Зарегистрирован как:', uz: "Ro'yxatdan o'tgan roli:" },
  'Reject this verification request?': { ru: 'Отклонить этот запрос на подтверждение?', uz: 'Ushbu tasdiqlash so‘rovi rad etilsinmi?' },
  'Remove this faculty category?': { ru: 'Удалить эту категорию факультета?', uz: 'Ushbu fakultet kategoriyasi olib tashlansinmi?' },
  'Replying to': { ru: 'Ответ на', uz: 'Javob berilmoqda' },
  'Requirements & Tuition': { ru: 'Требования и стоимость', uz: 'Talablar va kontrakt' },
  'Requirements query': { ru: 'Поиск по требованиям', uz: "Talablar bo'yicha qidiruv" },
  Reviewed: { ru: 'Проверено', uz: "Ko'rib chiqilgan" },
  'Scholarships only': { ru: 'Только со стипендиями', uz: 'Faqat stipendiyalar bilan' },
  Score: { ru: 'Балл', uz: 'Ball' },
  'Search by university identity, location, scholarships, and general text match.': {
    ru: 'Ищите по университету, локации, стипендиям и общему текстовому совпадению.',
    uz: 'Universitet ma’lumotlari, joylashuv, stipendiyalar va umumiy matn mosligi bo‘yicha qidiring.',
  },
  'Search universities by name, program, faculty, requirements, and country. Open the full filter for a deeper search across all university data.': {
    ru: 'Ищите университеты по названию, программе, факультету, требованиям и стране. Откройте полный фильтр для более глубокого поиска по всем данным университета.',
    uz: "Universitetlarni nomi, dasturi, fakulteti, talablari va mamlakati bo'yicha qidiring. Barcha universitet ma'lumotlari bo'yicha chuqurroq qidirish uchun to'liq filtrni oching.",
  },
  Select: { ru: 'Выбрать', uz: 'Tanlash' },
  'Select a faculty category to add.': { ru: 'Выберите категорию факультета для добавления.', uz: "Qo'shish uchun fakultet kategoriyasini tanlang." },
  'Select countries': { ru: 'Выберите страны', uz: 'Mamlakatlarni tanlang' },
  'Select faculties and customize which programs you offer. Add or remove items, delete categories.': {
    ru: 'Выберите факультеты и настройте, какие программы вы предлагаете. Добавляйте и удаляйте элементы, удаляйте категории.',
    uz: "Fakultetlarni tanlang va qaysi dasturlarni taklif qilishingizni sozlang. Elementlarni qo'shing yoki olib tashlang, kategoriyalarni o'chiring.",
  },
  'Select faculties that exist in your university. Open a faculty to see what it includes.': {
    ru: 'Выберите факультеты, которые есть в вашем университете. Откройте факультет, чтобы увидеть, что в него входит.',
    uz: "Universitetingizda mavjud fakultetlarni tanlang. Fakultetni ochib, u nimalarni o'z ichiga olishini ko'ring.",
  },
  'Select faculties. Expand to customize items.': { ru: 'Выберите факультеты. Раскройте, чтобы настроить элементы.', uz: 'Fakultetlarni tanlang. Elementlarni sozlash uchun kengaytiring.' },
  'Select hobbies': { ru: 'Выберите хобби', uz: 'Hobbilaringizni tanlang' },
  'Select hobbies and activities': { ru: 'Выберите хобби и активности', uz: 'Hobbi va faoliyatlarni tanlang' },
  'Select interests': { ru: 'Выберите интересы', uz: 'Qiziqishlarni tanlang' },
  'Select interests (e.g. IT, books, travel)': { ru: 'Выберите интересы (например, IT, книги, путешествия)', uz: 'Qiziqishlarni tanlang (masalan, IT, kitoblar, sayohat)' },
  'Select language': { ru: 'Выберите язык', uz: 'Tilni tanlang' },
  'Select your university': { ru: 'Выберите свой университет', uz: 'Universitetingizni tanlang' },
  Set: { ru: 'Установить', uz: "O'rnatish" },
  'Set a new password for': { ru: 'Установить новый пароль для', uz: 'Yangi parol o‘rnating:' },
  'Set your password': { ru: 'Установите пароль', uz: 'Parolingizni o‘rnating' },
  Standard: { ru: 'Стандарт', uz: 'Standart' },
  'Student count from': { ru: 'Количество студентов от', uz: 'Talabalar soni - dan' },
  'Student count to': { ru: 'Количество студентов до', uz: 'Talabalar soni - gacha' },
  'Target student countries': { ru: 'Целевые страны студентов', uz: 'Talabalar uchun maqsad mamlakatlar' },
  'Thank you for registering. Your university account will be verified and approved by our team. You will be notified once your account is active. Until then, you cannot access the platform.': {
    ru: 'Спасибо за регистрацию. Аккаунт вашего университета будет проверен и подтверждён нашей командой. Мы уведомим вас, когда он станет активным. До этого доступ к платформе будет недоступен.',
    uz: "Ro'yxatdan o'tganingiz uchun rahmat. Universitet akkauntingiz jamoamiz tomonidan tekshirilib tasdiqlanadi. Hisobingiz faollashgach sizga xabar beriladi. Ungacha platformaga kira olmaysiz.",
  },
  'This message will be removed only from your chat history.': {
    ru: 'Это сообщение будет удалено только из вашей истории чата.',
    uz: "Bu xabar faqat sizning chat tarixingizdan o'chiriladi.",
  },
  'Title (optional)': { ru: 'Заголовок (необязательно)', uz: 'Sarlavha (ixtiyoriy)' },
  'Top recommended students': { ru: 'Лучшие рекомендованные студенты', uz: 'Top tavsiya etilgan talabalar' },
  'Trial ends': { ru: 'Пробный период заканчивается', uz: 'Sinov muddati tugaydi' },
  'Tuition and scale': { ru: 'Стоимость и шкала', uz: 'Kontrakt va shkala' },
  'Tuition price': { ru: 'Стоимость обучения', uz: "Kontrakt narxi" },
  'Tuition: high to low': { ru: 'Стоимость: от высокой к низкой', uz: 'Kontrakt: yuqoridan pastga' },
  'Tuition: low to high': { ru: 'Стоимость: от низкой к высокой', uz: 'Kontrakt: pastdan yuqoriga' },
  'Uni requests': { ru: 'Запросы университетов', uz: 'Universitet so‘rovlari' },
  'University name, program, faculty, requirement': { ru: 'Название университета, программа, факультет, требование', uz: 'Universitet nomi, dastur, fakultet, talab' },
  'University or student name': { ru: 'Название университета или имя студента', uz: 'Universitet yoki talaba nomi' },
  'University requests': { ru: 'Запросы университетов', uz: 'Universitet so‘rovlari' },
  Unlimited: { ru: 'Безлимитно', uz: 'Cheksiz' },
  'Upload from device (JPEG, PNG, GIF, WebP, SVG) or paste URL below': {
    ru: 'Загрузите с устройства (JPEG, PNG, GIF, WebP, SVG) или вставьте URL ниже',
    uz: 'Qurilmadan yuklang (JPEG, PNG, GIF, WebP, SVG) yoki quyiga URL kiriting',
  },
  'Upload from device or paste a direct logo URL below': {
    ru: 'Загрузите с устройства или вставьте прямой URL логотипа ниже',
    uz: 'Qurilmadan yuklang yoki quyiga logotipning to‘g‘ridan-to‘g‘ri URL manzilini kiriting',
  },
  'User will receive an email with a link to set their password.': {
    ru: 'Пользователь получит email со ссылкой для установки пароля.',
    uz: "Foydalanuvchi parolini o'rnatish uchun havolali email oladi.",
  },
  'Using your profile': { ru: 'С учётом вашего профиля', uz: 'Profilingizdan foydalanilmoqda' },
  'Verification requests': { ru: 'Запросы на подтверждение', uz: 'Tasdiqlash so‘rovlari' },
  'Voice message ready': { ru: 'Голосовое сообщение готово', uz: 'Ovozli xabar tayyor' },
  'When enabled, the catalog also respects your preferred countries and interested faculties unless you explicitly override them in the filters above.': {
    ru: 'Когда включено, каталог также учитывает предпочитаемые страны и интересующие факультеты, если вы явно не переопределили их в фильтрах выше.',
    uz: "Yoqilganda katalog yuqoridagi filtrlarda ularni alohida o'zgartirmasangiz, afzal mamlakatlaringiz va qiziqqan fakultetlaringizni ham hisobga oladi.",
  },
  'Where would you like to study?': { ru: 'Где вы хотели бы учиться?', uz: "Qayerda o'qishni xohlaysiz?" },
  Years: { ru: 'Годы', uz: 'Yillar' },
  You: { ru: 'Вы', uz: 'Siz' },
  'You cancelled the checkout. No charges were made. You can try again anytime.': {
    ru: 'Вы отменили оплату. Списание не выполнено. Можно попробовать снова в любое время.',
    uz: "Siz to'lovni bekor qildingiz. Hech qanday mablag' yechilmadi. Istalgan payt qayta urinib ko'rishingiz mumkin.",
  },
  'You have reached the maximum number of student profiles for your current plan. Please upgrade your subscription to view more students.': {
    ru: 'Вы достигли максимального числа профилей студентов для текущего тарифа. Обновите подписку, чтобы видеть больше студентов.',
    uz: "Joriy tarifingiz uchun talabalar profillari limiti tugadi. Ko'proq talabalarni ko'rish uchun obunani yangilang.",
  },
  'You need to set a new password to continue. Use a strong password.': {
    ru: 'Чтобы продолжить, нужно установить новый пароль. Используйте надёжный пароль.',
    uz: "Davom etish uchun yangi parol o'rnatishingiz kerak. Kuchli paroldan foydalaning.",
  },
  'Your subscription has been updated. You can now use your new plan features.': {
    ru: 'Ваша подписка обновлена. Теперь можно пользоваться возможностями нового тарифа.',
    uz: "Obunangiz yangilandi. Endi yangi tarif imkoniyatlaridan foydalanishingiz mumkin.",
  },
  "Your university isn't in the list?": {
    ru: 'Вашего университета нет в списке?',
    uz: "Universitetingiz ro'yxatda yo'qmi?",
  },
}

const phraseCaches = new Map<FallbackLng, Map<string, string>>()

function walkResourceStrings(resource: unknown, prefix = '', out: Array<[string, string]> = []): Array<[string, string]> {
  if (!resource || typeof resource !== 'object' || Array.isArray(resource)) {
    if (prefix && typeof resource === 'string') out.push([prefix, resource])
    return out
  }
  for (const [key, value] of Object.entries(resource)) {
    const next = prefix ? `${prefix}.${key}` : key
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      walkResourceStrings(value, next, out)
    } else if (typeof value === 'string') {
      out.push([next, value])
    }
  }
  return out
}

function getAtPath(resource: unknown, path: string): unknown {
  return path.split('.').reduce<unknown>((acc, part) => {
    if (!acc || typeof acc !== 'object' || Array.isArray(acc)) return undefined
    return (acc as Record<string, unknown>)[part]
  }, resource)
}

function getCachedPhraseMap(i18n: I18nInstance, lng: FallbackLng): Map<string, string> {
  const cached = phraseCaches.get(lng)
  if (cached) return cached

  const phraseMap = new Map<string, string>()
  const englishBundles = i18n.store.data.en ?? {}
  const localizedBundles = i18n.store.data[lng] ?? {}

  for (const [ns, englishResource] of Object.entries(englishBundles)) {
    const localizedResource = localizedBundles[ns]
    if (!localizedResource || typeof localizedResource !== 'object') continue

    for (const [path, englishText] of walkResourceStrings(englishResource)) {
      const localizedText = getAtPath(localizedResource, path)
      if (typeof localizedText === 'string') {
        phraseMap.set(englishText, localizedText)
      }
    }
  }

  phraseCaches.set(lng, phraseMap)
  return phraseMap
}

function interpolateTemplate(i18n: I18nInstance, template: string, values: Record<string, unknown>, lng: FallbackLng): string {
  return i18n.services.interpolator.interpolate(template, values, lng)
}

export function clearFallbackPhraseCaches(): void {
  phraseCaches.clear()
}

export function translateFallbackPhrase(
  i18n: I18nInstance,
  phrase: string,
  lng: SupportedLng,
  values: Record<string, unknown> = {}
): string | null {
  if (lng === 'en') return phrase

  const localizedLng = lng as FallbackLng
  const cached = getCachedPhraseMap(i18n, localizedLng)
  const fromResources = cached.get(phrase)
  if (fromResources) {
    return interpolateTemplate(i18n, fromResources, values, localizedLng)
  }

  const manual = manualPhraseTranslations[phrase]?.[localizedLng]
  if (manual) {
    return interpolateTemplate(i18n, manual, values, localizedLng)
  }

  const postponeMatch = phrase.match(/^Postpone (\d+) days$/)
  if (postponeMatch) {
    return localizedLng === 'ru'
      ? `Отложить на ${postponeMatch[1]} дней`
      : `${postponeMatch[1]} kunga kechiktirish`
  }

  const universityCountMatch = phrase.match(/^(\d+) applications$/)
  if (universityCountMatch) {
    return localizedLng === 'ru'
      ? `${universityCountMatch[1]} заявок`
      : `${universityCountMatch[1]} ta ariza`
  }

  const requestCountMatch = phrase.match(/^(\d+) student requests$/)
  if (requestCountMatch) {
    return localizedLng === 'ru'
      ? `${requestCountMatch[1]} запросов студентов`
      : `${requestCountMatch[1]} ta talaba so'rovi`
  }

  return null
}
