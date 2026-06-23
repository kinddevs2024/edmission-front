import type { SupportedLng } from './config'

type NamespacePatch = Record<string, object>

export const supplementalPatches: Record<SupportedLng, NamespacePatch> = {
  en: {
    common: {
      new: 'New',
      thinking: 'Thinking',
      status: 'Status',
    },
    landing: {
      hero: {
        preview: {
          sampleUniversity: 'Global Engineering Institute',
          sampleLocation: 'Berlin, Germany',
        },
      },
    },
    admin: {
      studentDocuments: 'Student documents',
      studentLabel: 'Student',
      universityLabel: 'University',
      sourceLabel: 'Source',
      createdLabel: 'Created',
      documentLabel: 'Document',
      allStatuses: 'All statuses',
      interestedStatus: 'Interested',
      offerSent: 'Offer sent',
      pending: 'Pending',
      accepted: 'Accepted',
      rejected: 'Rejected',
      declined: 'Declined',
      accept: 'Accept',
      decline: 'Decline',
      offersTitle: 'Offers',
      studentProfile: 'Student profile',
      universityProfile: 'University profile',
      coveragePercent: 'Coverage %',
      registered: 'Registered',
      deadline: 'Deadline',
      subscriptionsMrr: 'Subscriptions & MRR',
      mrrLabel: 'MRR',
      universitiesVerify: 'Universities (verify)',
      auditLogsTitle: 'Audit logs',
      logs: 'Logs',
      typeLabel: 'Type',
      allTypes: 'All types',
      logTypeLogin: 'Login',
      logTypeRegister: 'Register',
      logTypeVerification: 'Verification',
      userId: 'User ID',
      filterByUser: 'Filter by user...',
      timeLabel: 'Time',
      userLabel: 'User',
      systemHealthTitle: 'System health',
      universityVerification: 'University verification',
      serviceUp: 'Up',
      serviceDown: 'Down',
    },
    school: {
      studentLabel: 'Student',
      selectStudentPlaceholder: 'Select a student',
      pageOf: 'Page {{page}} of {{totalPages}}',
    },
  },
  ru: {
    common: {
      new: 'Новое',
      thinking: 'Думает',
      status: 'Статус',
    },
    landing: {
      hero: {
        preview: {
          sampleUniversity: 'Глобальный инженерный институт',
          sampleLocation: 'Берлин, Германия',
        },
      },
    },
    admin: {
      studentDocuments: 'Документы студента',
      studentLabel: 'Студент',
      universityLabel: 'Университет',
      sourceLabel: 'Источник',
      createdLabel: 'Создано',
      documentLabel: 'Документ',
      allStatuses: 'Все статусы',
      interestedStatus: 'Интересуется',
      offerSent: 'Оффер отправлен',
      pending: 'В ожидании',
      accepted: 'Принято',
      rejected: 'Отклонено',
      declined: 'Отклонено',
      accept: 'Принять',
      decline: 'Отклонить',
      offersTitle: 'Офферы',
      studentProfile: 'Профиль студента',
      universityProfile: 'Профиль университета',
      coveragePercent: 'Процент покрытия',
      registered: 'Зарегистрирован',
      deadline: 'Дедлайн',
      subscriptionsMrr: 'Подписки и MRR',
      mrrLabel: 'MRR',
      universitiesVerify: 'Университеты (проверить)',
      auditLogsTitle: 'Журнал аудита',
      logs: 'Логи',
      typeLabel: 'Тип',
      allTypes: 'Все типы',
      logTypeLogin: 'Вход',
      logTypeRegister: 'Регистрация',
      logTypeVerification: 'Верификация',
      userId: 'ID пользователя',
      filterByUser: 'Фильтр по пользователю...',
      timeLabel: 'Время',
      userLabel: 'Пользователь',
      systemHealthTitle: 'Состояние системы',
      universityVerification: 'Подтверждение университетов',
      serviceUp: 'Работает',
      serviceDown: 'Недоступен',
    },
    school: {
      studentLabel: 'Студент',
      selectStudentPlaceholder: 'Выберите студента',
      pageOf: 'Страница {{page}} из {{totalPages}}',
    },
  },
  uz: {
    common: {
      new: 'Yangi',
      thinking: "O'ylamoqda",
      status: 'Status',
    },
    landing: {
      hero: {
        preview: {
          sampleUniversity: 'Global muhandislik instituti',
          sampleLocation: 'Berlin, Germaniya',
        },
      },
    },
    admin: {
      studentDocuments: 'Talaba hujjatlari',
      studentLabel: 'Talaba',
      universityLabel: 'Universitet',
      sourceLabel: 'Manba',
      createdLabel: 'Yaratilgan',
      documentLabel: 'Hujjat',
      allStatuses: 'Barcha statuslar',
      interestedStatus: 'Qiziqish bildirgan',
      offerSent: 'Taklif yuborilgan',
      pending: 'Kutilmoqda',
      accepted: 'Qabul qilingan',
      rejected: 'Rad etilgan',
      declined: 'Rad etilgan',
      accept: 'Qabul qilish',
      decline: 'Rad etish',
      offersTitle: 'Takliflar',
      studentProfile: 'Talaba profili',
      universityProfile: 'Universitet profili',
      coveragePercent: 'Qamrov foizi',
      registered: "Ro'yxatdan o'tgan",
      deadline: 'Muddat',
      subscriptionsMrr: 'Obunalar va MRR',
      mrrLabel: 'MRR',
      universitiesVerify: 'Universitetlar (tasdiqlash)',
      auditLogsTitle: 'Audit loglari',
      logs: 'Loglar',
      typeLabel: 'Turi',
      allTypes: 'Barcha turlar',
      logTypeLogin: 'Kirish',
      logTypeRegister: "Ro'yxatdan o'tish",
      logTypeVerification: 'Tasdiqlash',
      userId: 'Foydalanuvchi IDsi',
      filterByUser: 'Foydalanuvchi bo‘yicha filter...',
      timeLabel: 'Vaqt',
      userLabel: 'Foydalanuvchi',
      systemHealthTitle: 'Tizim holati',
      universityVerification: 'Universitetlarni tasdiqlash',
      serviceUp: 'Ishlayapti',
      serviceDown: 'Ishlamayapti',
    },
    school: {
      studentLabel: 'Talaba',
      selectStudentPlaceholder: 'Talabani tanlang',
      pageOf: '{{totalPages}} dan {{page}}-sahifa',
    },
  },
}

function mergeNamespacePatch(lng: SupportedLng, ns: string, patch: Record<string, unknown>) {
  const current = (supplementalPatches[lng][ns] as Record<string, unknown> | undefined) ?? {}
  supplementalPatches[lng][ns] = { ...current, ...patch }
}

mergeNamespacePatch('en', 'common', {
  messageButton: 'Message',
  addToCompare: 'Add to compare',
  more: 'More',
})

mergeNamespacePatch('en', 'common', {
  supportChat: 'Consulting chat',
  openSupportChat: 'Open consulting chat',
  supportConsultant: 'Support consultant',
  consultingChat: 'Consulting chat',
  openConsultingChat: 'Open consulting chat',
})

mergeNamespacePatch('en', 'school', {
  counsellorOfferReadOnlyHint: 'This is a read-only counsellor view. The student keeps control of accepting, declining, or postponing the offer.',
  backToOffers: 'Back to offers',
})

mergeNamespacePatch('ru', 'common', {
  supportChat: 'Чат с консультантом',
  openSupportChat: 'Открыть чат с консультантом',
  supportConsultant: 'Support-консультатор',
  consultingChat: 'Консультационный чат',
  openConsultingChat: 'Открыть консультационный чат',
})

mergeNamespacePatch('uz', 'common', {
  supportChat: 'Konsultant bilan chat',
  openSupportChat: 'Konsultant chatini ochish',
  supportConsultant: 'Support konsultant',
  consultingChat: 'Konsultatsiya chati',
  openConsultingChat: 'Konsultatsiya chatini ochish',
})

mergeNamespacePatch('en', 'student', {
  navSupportChat: 'Consulting chat',
})

mergeNamespacePatch('ru', 'student', {
  navSupportChat: 'Чат с консультантом',
})

mergeNamespacePatch('uz', 'student', {
  navSupportChat: 'Konsultant bilan chat',
})

mergeNamespacePatch('ru', 'common', {
  messageButton: 'Написать',
  addToCompare: 'Добавить к сравнению',
  more: 'Ещё',
})

mergeNamespacePatch('ru', 'school', {
  counsellorOfferReadOnlyHint: 'Это режим просмотра для counsellor. Студент сам принимает, отклоняет или откладывает оффер.',
  backToOffers: 'Назад к офферам',
})

mergeNamespacePatch('uz', 'common', {
  messageButton: 'Yozish',
  addToCompare: "Taqqoslashga qo'shish",
  more: "Ko'proq",
})

mergeNamespacePatch('en', 'university', {
  aiHelperText: 'Get suggestions, refine your profile, and explore answers about applications and scholarships.',
  openEdmissionAi: 'Open consulting chat',
  pipelineFunnelSteps: 'Interested → Contacted → Evaluating → Offer Sent → Accepted',
  total: 'Total',
  bestMatchScore: 'Best match score',
  loading: 'Loading…',
  noDataYet: 'No data yet.',
  noRecommendationsYet: 'No recommendations yet.',
  viewProfile: 'Profile',
})

mergeNamespacePatch('ru', 'university', {
  aiHelperText: 'Получайте предложения, улучшайте профиль и находите ответы о поступлении и стипендиях.',
  openEdmissionAi: 'Открыть чат с консультантом',
  pipelineFunnelSteps: 'Интерес → Связано → Рассмотрение → Оффер отправлен → Принято',
  total: 'Всего',
  bestMatchScore: 'Лучший балл совпадения',
  loading: 'Загрузка…',
  noDataYet: 'Пока нет данных.',
  noRecommendationsYet: 'Пока нет рекомендаций.',
  viewProfile: 'Профиль',
})

mergeNamespacePatch('uz', 'university', {
  aiHelperText: 'Takliflar oling, profilingizni yaxshilang va qabul hamda stipendyalar boʻyicha javoblar toping.',
  openEdmissionAi: 'Konsultant chatini ochish',
  pipelineFunnelSteps: 'Qiziqish → Bogʻlanish → Koʻrib chiqish → Taklif yuborilgan → Qabul qilingan',
  total: 'Jami',
  bestMatchScore: 'Eng yaxshi moslik bal',
  loading: 'Yuklanmoqda…',
  noDataYet: 'Hali maʻlumot yoʻq.',
  noRecommendationsYet: 'Hali tavsiyalar yoʻq.',
  viewProfile: 'Profil',
})

mergeNamespacePatch('uz', 'school', {
  counsellorOfferReadOnlyHint: 'Bu counsellor uchun faqat ko‘rish rejimi. Taklifni qabul qilish, rad etish yoki keyinga qoldirish talabaning o‘zida qoladi.',
  backToOffers: 'Takliflarga qaytish',
})

mergeNamespacePatch('en', 'school', {
  chats: 'Chats',
})

mergeNamespacePatch('ru', 'school', {
  chats: 'Чаты',
})

mergeNamespacePatch('uz', 'school', {
  chats: 'Chatlar',
})

mergeNamespacePatch('en', 'student', {
  stepAddPhone: 'Add your phone number for important updates',
  addPhoneTitle: 'Add your phone number',
  addPhoneHint: 'We can use it for urgent reminders about offers, messages, and documents.',
  addPhoneCta: 'Add phone',
})

mergeNamespacePatch('ru', 'student', {
  stepAddPhone: 'Добавьте номер телефона для важных уведомлений',
  addPhoneTitle: 'Добавьте номер телефона',
  addPhoneHint: 'Мы сможем использовать его для срочных напоминаний об офферах, сообщениях и документах.',
  addPhoneCta: 'Добавить номер',
})

mergeNamespacePatch('uz', 'student', {
  stepAddPhone: 'Muhim xabarlar uchun telefon raqamingizni qo‘shing',
  addPhoneTitle: 'Telefon raqamingizni qo‘shing',
  addPhoneHint: 'Offerlar, xabarlar va hujjatlar bo‘yicha shoshilinch eslatmalar uchun foydalanamiz.',
  addPhoneCta: 'Telefon qo‘shish',
})

mergeNamespacePatch('en', 'student', {
  interestedButton: 'Interested',
  showInterest: 'Show interest',
  degreeFoundation: 'Foundation',
  degreeAssociate: 'Associate',
})

mergeNamespacePatch('ru', 'student', {
  interestedButton: 'Интересует',
  showInterest: 'Показать интерес',
  degreeFoundation: 'Foundation',
  degreeAssociate: 'Associate',
})

mergeNamespacePatch('uz', 'student', {
  interestedButton: 'Qiziqdi',
  showInterest: 'Qiziqish bildirish',
  degreeFoundation: 'Foundation',
  degreeAssociate: 'Associate',
})

mergeNamespacePatch('en', 'student', {
  completeMinimalProfileTitle: 'Complete your profile first',
  completeMinimalProfileDesc: 'Universities will appear after you complete the minimum student profile: name, location, and education history.',
  universitiesMapEyebrow: 'University map',
  universitiesMapTitle: 'Find universities by city and country',
  universitiesMapDescription: 'Browse Edmission universities geographically, open details from the map, and compare locations before shortlisting.',
  universities: 'Universities',
  countries: 'Countries',
  cities: 'Cities',
  mapSearchPlaceholder: 'Search university, city, or country',
  scholarshipsOnly: 'Scholarships only',
  mapResults: 'on map',
  withScholarships: 'with scholarships',
  locationNotSet: 'Location not set',
  cardScholarshipAvailable: 'Available',
  countryLevelLocation: 'Country level',
  mapUniversitiesPanel: 'Universities on this map',
  mapUniversitiesPanelHint: 'Select a university to move the map and open its details.',
  reduceMap: 'Reduce map',
  openMapFullscreen: 'Open full-screen map',
  cardTuitionLabel: 'Tuition',
  compareScholarship: 'Scholarship',
  noUniversitiesFound: 'No universities found',
  tryChangingFiltersOrSearch: 'Try changing filters or search to see more results.',
  clearFilters: 'Clear filters',
  allCountries: 'All countries',
})

mergeNamespacePatch('ru', 'student', {
  completeMinimalProfileTitle: 'Сначала заполните профиль',
  completeMinimalProfileDesc: 'Университеты появятся после заполнения минимального профиля студента: имя, местоположение и образование.',
  universitiesMapEyebrow: 'Карта университетов',
  universitiesMapTitle: 'Найдите университеты по городу и стране',
  universitiesMapDescription: 'Смотрите университеты Edmission на карте, открывайте детали и сравнивайте расположение перед выбором.',
  universities: 'Университеты',
  countries: 'Страны',
  cities: 'Города',
  mapSearchPlaceholder: 'Поиск по университету, городу или стране',
  scholarshipsOnly: 'Только со стипендиями',
  mapResults: 'на карте',
  withScholarships: 'со стипендиями',
  locationNotSet: 'Местоположение не указано',
  cardScholarshipAvailable: 'Доступно',
  countryLevelLocation: 'На уровне страны',
  mapUniversitiesPanel: 'Университеты на этой карте',
  mapUniversitiesPanelHint: 'Выберите университет, чтобы переместить карту и открыть детали.',
  reduceMap: 'Свернуть карту',
  openMapFullscreen: 'Открыть карту на весь экран',
  cardTuitionLabel: 'Стоимость',
  compareScholarship: 'Стипендия',
  noUniversitiesFound: 'Университеты не найдены',
  tryChangingFiltersOrSearch: 'Измените фильтры или поиск, чтобы увидеть больше результатов.',
  clearFilters: 'Сбросить фильтры',
  allCountries: 'Все страны',
})

mergeNamespacePatch('uz', 'student', {
  completeMinimalProfileTitle: 'Avval profilingizni to‘ldiring',
  completeMinimalProfileDesc: 'Universitetlar minimal talaba profili to‘ldirilgandan keyin ko‘rinadi: ism, manzil va ta’lim.',
  universitiesMapEyebrow: 'Universitetlar xaritasi',
  universitiesMapTitle: 'Universitetlarni shahar va mamlakat bo‘yicha toping',
  universitiesMapDescription: 'Edmission universitetlarini xaritada ko‘ring, tafsilotlarni oching va tanlashdan oldin joylashuvlarni solishtiring.',
  universities: 'Universitetlar',
  countries: 'Mamlakatlar',
  cities: 'Shaharlar',
  mapSearchPlaceholder: 'Universitet, shahar yoki mamlakat bo‘yicha qidirish',
  scholarshipsOnly: 'Faqat stipendiyali',
  mapResults: 'xaritada',
  withScholarships: 'stipendiya bilan',
  locationNotSet: 'Manzil ko‘rsatilmagan',
  cardScholarshipAvailable: 'Mavjud',
  countryLevelLocation: 'Mamlakat darajasida',
  mapUniversitiesPanel: 'Ushbu xaritadagi universitetlar',
  mapUniversitiesPanelHint: 'Xaritani siljitish va tafsilotlarni ochish uchun universitetni tanlang.',
  reduceMap: 'Xaritani kichraytirish',
  openMapFullscreen: 'Xaritani to‘liq ekranda ochish',
  cardTuitionLabel: 'Kontrakt',
  compareScholarship: 'Stipendiya',
  noUniversitiesFound: 'Universitetlar topilmadi',
  tryChangingFiltersOrSearch: 'Ko‘proq natija ko‘rish uchun filtr yoki qidiruvni o‘zgartiring.',
  clearFilters: 'Filtrlarni tozalash',
  allCountries: 'Barcha mamlakatlar',
})

mergeNamespacePatch('ru', 'landing', {
  walkthrough: {
    eyebrow: 'Обзор платформы',
  },
  footer: {
    universities: {
      0: 'Поиск студентов',
      1: 'Воронка',
    },
  },
})

mergeNamespacePatch('uz', 'landing', {
  walkthrough: {
    eyebrow: 'Platforma ko‘rinishi',
  },
  footer: {
    universities: {
      0: 'Talabalarni qidirish',
      1: 'Jarayon',
    },
  },
})

mergeNamespacePatch('en', 'university', {
  layoutClassic: 'Classic',
  layoutModern: 'Modern',
  layoutMinimal: 'Minimal',
  offerTemplateDefaultTitle: 'Offer for {{studentName}}',
  offerTemplateDefaultBody: 'Dear {{studentName}},\n\nWe are pleased to offer you admission to {{programName}}.',
  navFlyers: 'Flyers',
  flyers: {
    pageTitle: 'Flyers',
    pageHint: 'Create visual posts for students. Primary option is upload from device; editor mode is optional.',
    addFlyer: 'Add flyer',
    createWithEditor: 'Create with Redactor Editor',
    optionalTitle: 'Title (optional)',
    optionalTitlePlaceholder: 'Optional post title',
    uploadFromDevice: 'Upload from device',
    fileSelected: 'File selected and ready to publish',
    dropzoneTitle: 'Click to choose a file',
    dropzoneHint: 'Images, videos and documents are supported',
    publish: 'Publish flyer',
    saving: 'Saving...',
    empty: 'No flyers yet. Click "Add flyer" to publish your first post.',
    editorTitle: 'Create flyer with editor',
    editorPost: 'Created with editor',
  },
})

mergeNamespacePatch('ru', 'university', {
  layoutClassic: 'Классический',
  layoutModern: 'Современный',
  layoutMinimal: 'Минималистичный',
  offerTemplateDefaultTitle: 'Оффер для {{studentName}}',
  offerTemplateDefaultBody: 'Здравствуйте, {{studentName}}!\n\nМы рады предложить вам зачисление на программу {{programName}}.',
  navFlyers: 'Флайеры',
  flyers: {
    pageTitle: 'Флайеры',
    pageHint: 'Создавайте визуальные посты для студентов. Основной вариант — загрузка с устройства, редактор — дополнительный.',
    addFlyer: 'Добавить флайер',
    createWithEditor: 'Создать через редактор',
    optionalTitle: 'Название (необязательно)',
    optionalTitlePlaceholder: 'Необязательное название поста',
    uploadFromDevice: 'Загрузить с устройства',
    fileSelected: 'Файл выбран и готов к публикации',
    dropzoneTitle: 'Нажмите, чтобы выбрать файл',
    dropzoneHint: 'Поддерживаются изображения, видео и документы',
    publish: 'Опубликовать флайер',
    saving: 'Сохранение...',
    empty: 'Пока нет флайеров. Нажмите «Добавить флайер», чтобы опубликовать первый пост.',
    editorTitle: 'Создать флайер в редакторе',
    editorPost: 'Создано через редактор',
  },
})

mergeNamespacePatch('uz', 'university', {
  layoutClassic: 'Klassik',
  layoutModern: 'Zamonaviy',
  layoutMinimal: 'Minimal',
  navPipeline: 'Jarayon',
  viewPipeline: 'Jarayonga',
  analyticsPipelineFunnel: 'Jarayon voronkasi',
  analyticsSamePipelineData: 'Jarayon ma’lumotlari status bo‘yicha.',
  offerTemplateDefaultTitle: '{{studentName}} uchun taklif',
  offerTemplateDefaultBody: 'Hurmatli {{studentName}},\n\nSizga {{programName}} dasturiga qabul taklif qilinayotganidan mamnunmiz.',
  navFlyers: 'Flayerlar',
  flyers: {
    pageTitle: 'Flayerlar',
    pageHint: 'Talabalar uchun vizual postlar yarating. Asosiy usul — qurilmadan yuklash, redaktor esa qo‘shimcha.',
    addFlyer: 'Flayer qo‘shish',
    createWithEditor: 'Redaktor orqali yaratish',
    optionalTitle: 'Sarlavha (ixtiyoriy)',
    optionalTitlePlaceholder: 'Post uchun ixtiyoriy sarlavha',
    uploadFromDevice: 'Qurilmadan yuklash',
    fileSelected: 'Fayl tanlandi va nashrga tayyor',
    dropzoneTitle: 'Fayl tanlash uchun bosing',
    dropzoneHint: 'Rasm, video va hujjatlar qo‘llab-quvvatlanadi',
    publish: 'Flayerni nashr qilish',
    saving: 'Saqlanmoqda...',
    empty: 'Hali flayerlar yo‘q. Birinchi postni chiqarish uchun «Flayer qo‘shish» tugmasini bosing.',
    editorTitle: 'Redaktorda flayer yaratish',
    editorPost: 'Redaktor orqali yaratilgan',
  },
})

mergeNamespacePatch('en', 'university', {
  studentsMapEyebrow: 'Student map',
  studentsMapTitle: 'Find students by city and country',
  studentsMapDescription: 'Browse discoverable students geographically, open profiles from the map, and focus outreach by location.',
  studentsMapPanel: 'Students on this map',
  studentsMapPanelHint: 'Select a student to move the map and open profile details.',
  noStudentsFound: 'No students found',
  tryChangingFiltersOrSearchStudents: 'Try changing filters or search to see more students.',
})

mergeNamespacePatch('ru', 'university', {
  studentsMapEyebrow: 'Карта студентов',
  studentsMapTitle: 'Найдите студентов по городу и стране',
  studentsMapDescription: 'Смотрите доступных студентов на карте, открывайте профили и фокусируйте работу по локации.',
  studentsMapPanel: 'Студенты на этой карте',
  studentsMapPanelHint: 'Выберите студента, чтобы переместить карту и открыть профиль.',
  noStudentsFound: 'Студенты не найдены',
  tryChangingFiltersOrSearchStudents: 'Измените фильтры или поиск, чтобы увидеть больше студентов.',
})

mergeNamespacePatch('uz', 'university', {
  studentsMapEyebrow: 'Talabalar xaritasi',
  studentsMapTitle: 'Talabalarni shahar va mamlakat bo‘yicha toping',
  studentsMapDescription: 'Ko‘rinadigan talabalarni xaritada ko‘ring, profillarni oching va joylashuv bo‘yicha ishni aniqlang.',
  studentsMapPanel: 'Ushbu xaritadagi talabalar',
  studentsMapPanelHint: 'Xaritani siljitish va profilni ochish uchun talabani tanlang.',
  noStudentsFound: 'Talabalar topilmadi',
  tryChangingFiltersOrSearchStudents: 'Ko‘proq talaba ko‘rish uchun filtr yoki qidiruvni o‘zgartiring.',
})

mergeNamespacePatch('en', 'documents', {
  type: {
    offer: 'Offer',
    scholarship: 'Scholarship',
  },
  universityDocuments: {
    uploadDocument: 'Upload document',
    continueToEditor: 'Continue to editor',
    uploadDropzoneTitle: 'Click to choose a file',
    uploadDropzoneHint: 'Image or PDF works best as template background',
    fileSelected: 'File selected and ready to continue',
  },
})

mergeNamespacePatch('ru', 'documents', {
  type: {
    offer: 'Оффер',
    scholarship: 'Стипендия',
  },
  universityDocuments: {
    uploadDocument: 'Загрузить документ',
    continueToEditor: 'Продолжить в редактор',
    uploadDropzoneTitle: 'Нажмите, чтобы выбрать файл',
    uploadDropzoneHint: 'Изображение или PDF лучше всего подходят как фон шаблона',
    fileSelected: 'Файл выбран и готов к продолжению',
  },
})

mergeNamespacePatch('uz', 'documents', {
  type: {
    offer: 'Taklif',
    scholarship: 'Stipendiya',
  },
  universityDocuments: {
    uploadDocument: 'Hujjat yuklash',
    continueToEditor: 'Redaktorga o‘tish',
    uploadDropzoneTitle: 'Fayl tanlash uchun bosing',
    uploadDropzoneHint: 'Rasm yoki PDF shablon foni uchun eng mos',
    fileSelected: 'Fayl tanlandi va davom etishga tayyor',
  },
})

mergeNamespacePatch('en', 'admin', {
  analytics: 'Analytics',
  analyticsRangeTitle: 'Analytics period',
  analyticsToday: 'Today',
  analyticsLast7Days: 'Last 7 days',
  analyticsLast30Days: 'Last 30 days',
  analyticsCustomRange: 'Custom',
  analyticsFrom: 'From',
  analyticsTo: 'To',
  analyticsTotalVisitors: 'Site visitors',
  analyticsUniversityVisitors: 'Universities visited',
  analyticsStudentVisitors: 'Students visited',
  analyticsRegistrations: 'Registrations',
  analyticsTrackingHint: 'Visit analytics starts collecting data after this tracking is deployed.',
})

mergeNamespacePatch('ru', 'admin', {
  analytics: 'Аналитика',
  analyticsRangeTitle: 'Период аналитики',
  analyticsToday: 'Сегодня',
  analyticsLast7Days: 'Последние 7 дней',
  analyticsLast30Days: 'Последние 30 дней',
  analyticsCustomRange: 'Свои даты',
  analyticsFrom: 'С',
  analyticsTo: 'По',
  analyticsTotalVisitors: 'Посетители сайта',
  analyticsUniversityVisitors: 'Университеты, открывшие сайт',
  analyticsStudentVisitors: 'Студенты, открывшие сайт',
  analyticsRegistrations: 'Регистрации',
  analyticsTrackingHint: 'Аналитика посещений начнет собираться после выкладки этого трекинга.',
})

mergeNamespacePatch('uz', 'admin', {
  analytics: 'Analitika',
  analyticsRangeTitle: 'Analitika davri',
  analyticsToday: 'Bugun',
  analyticsLast7Days: "So'nggi 7 kun",
  analyticsLast30Days: "So'nggi 30 kun",
  analyticsCustomRange: 'Ixtiyoriy sana',
  analyticsFrom: 'Dan',
  analyticsTo: 'Gacha',
  analyticsTotalVisitors: 'Saytga kirganlar',
  analyticsUniversityVisitors: 'Saytni ochgan universitetlar',
  analyticsStudentVisitors: 'Saytni ochgan talabalar',
  analyticsRegistrations: "Ro'yxatdan o'tishlar",
  analyticsTrackingHint: 'Tashrif analitikasi ushbu treking joylangandan keyin yigʻila boshlaydi.',
})

mergeNamespacePatch('en', 'common', {
  aiSupportTitle: 'Edmission.uz Support',
  aiSupportSpeaking: 'Speaking',
  aiSupportListening: 'Listening',
  aiSupportConnecting: 'Connecting',
  aiSupportReady: 'Ready',
  aiSupportCall: 'Call',
  aiSupportStartCall: 'Start call',
  aiSupportStartSupportCall: 'Start Edmission support call',
  aiSupportEndCall: 'End call',
  aiSupportOpenChat: 'Open chat',
  aiSupportChat: 'Chat',
  aiSupportCloseChat: 'Close chat',
  aiSupportEmptyChat: 'Chat messages will appear here.',
  aiSupportMessagePlaceholder: 'Message Edmission support...',
  aiSupportStartToType: 'Start the call to type',
  aiSupportSendMessage: 'Send message',
  aiSupportMicOn: 'Turn microphone on',
  aiSupportMicOff: 'Turn microphone off',
  aiSupportMinimize: 'Minimize AI call',
  aiSupportOpenFull: 'Open full AI chat',
  aiSupportExpand: 'Expand AI call',
  aiSupportAgentMissing: 'Consulting chat is not configured.',
  aiSupportMicrophoneUnavailable: 'Microphone access is not available in this browser.',
  aiSupportStartFailed: 'Could not start the call.',
  aiSupportStartBeforeMessage: 'Start the call before sending a message.',
  aiSupportSendFailed: 'Could not send the message.',
  smsApplicationUpdates: 'Send important updates to my phone',
  smsApplicationUpdatesPhoneHint: 'Add your phone number above to enable phone notifications.',
  open: 'Open',
})

mergeNamespacePatch('ru', 'common', {
  aiSupportTitle: 'Поддержка Edmission.uz',
  aiSupportSpeaking: 'Говорит',
  aiSupportListening: 'Слушает',
  aiSupportConnecting: 'Подключение',
  aiSupportReady: 'Готово',
  aiSupportCall: 'Звонок',
  aiSupportStartCall: 'Начать звонок',
  aiSupportStartSupportCall: 'Начать звонок в поддержку Edmission',
  aiSupportEndCall: 'Завершить звонок',
  aiSupportOpenChat: 'Открыть чат',
  aiSupportChat: 'Чат',
  aiSupportCloseChat: 'Закрыть чат',
  aiSupportEmptyChat: 'Сообщения чата появятся здесь.',
  aiSupportMessagePlaceholder: 'Сообщение в поддержку Edmission...',
  aiSupportStartToType: 'Начните звонок, чтобы писать',
  aiSupportSendMessage: 'Отправить сообщение',
  aiSupportMicOn: 'Включить микрофон',
  aiSupportMicOff: 'Выключить микрофон',
  aiSupportMinimize: 'Свернуть AI-звонок',
  aiSupportOpenFull: 'Открыть полный AI-чат',
  aiSupportExpand: 'Развернуть AI-звонок',
  aiSupportAgentMissing: 'Чат поддержки не настроен.',
  aiSupportMicrophoneUnavailable: 'Доступ к микрофону недоступен в этом браузере.',
  aiSupportStartFailed: 'Не удалось начать звонок.',
  aiSupportStartBeforeMessage: 'Начните звонок перед отправкой сообщения.',
  aiSupportSendFailed: 'Не удалось отправить сообщение.',
  smsApplicationUpdates: 'Отправлять важные обновления на мой номер',
  smsApplicationUpdatesPhoneHint: 'Добавьте номер телефона выше, чтобы включить уведомления на номер.',
  open: 'Открыть',
})

mergeNamespacePatch('uz', 'common', {
  aiSupportTitle: 'Edmission.uz yordam xizmati',
  aiSupportSpeaking: 'Gapiryapti',
  aiSupportListening: 'Tinglayapti',
  aiSupportConnecting: 'Ulanmoqda',
  aiSupportReady: 'Tayyor',
  aiSupportCall: 'Qo‘ng‘iroq',
  aiSupportStartCall: 'Qo‘ng‘iroqni boshlash',
  aiSupportStartSupportCall: 'Edmission yordamiga qo‘ng‘iroq qilish',
  aiSupportEndCall: 'Qo‘ng‘iroqni tugatish',
  aiSupportOpenChat: 'Chatni ochish',
  aiSupportChat: 'Chat',
  aiSupportCloseChat: 'Chatni yopish',
  aiSupportEmptyChat: 'Chat xabarlari shu yerda ko‘rinadi.',
  aiSupportMessagePlaceholder: 'Edmission yordamiga xabar...',
  aiSupportStartToType: 'Yozish uchun qo‘ng‘iroqni boshlang',
  aiSupportSendMessage: 'Xabar yuborish',
  aiSupportMicOn: 'Mikrofonni yoqish',
  aiSupportMicOff: 'Mikrofonni o‘chirish',
  aiSupportMinimize: 'AI qo‘ng‘iroqni kichraytirish',
  aiSupportOpenFull: 'To‘liq AI chatni ochish',
  aiSupportExpand: 'AI qo‘ng‘iroqni kengaytirish',
  aiSupportAgentMissing: 'Yordam chati sozlanmagan.',
  aiSupportMicrophoneUnavailable: 'Bu brauzerda mikrofondan foydalanib bo‘lmaydi.',
  aiSupportStartFailed: 'Qo‘ng‘iroqni boshlab bo‘lmadi.',
  aiSupportStartBeforeMessage: 'Xabar yuborishdan oldin qo‘ng‘iroqni boshlang.',
  aiSupportSendFailed: 'Xabarni yuborib bo‘lmadi.',
  smsApplicationUpdates: 'Muhim yangiliklarni telefon raqamimga yuborish',
  smsApplicationUpdatesPhoneHint: 'Telefon bildirishnomalarini yoqish uchun yuqorida raqamingizni kiriting.',
  open: 'Ochish',
})
