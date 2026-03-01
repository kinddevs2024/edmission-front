# Список мелких деталей UX: подсказки, переводы, ошибки, иконки

## 1. Подсказки (hint / placeholder / tooltip) для полей ввода

### 1.1 Компонент Input
- **Нет пропа для подсказки под полем** — добавить `hint?: string` или `helperText?: string`, показывать мелким текстом под полем (или под ошибкой). Это поможет объяснить, что писать (например: «GPA по шкале 0–4», «Уровень языка: A1, B2, IELTS 6.5»).
- **Нет тултипа (иконка «?»)** — для сложных полей можно добавить опциональную иконку с подсказкой при наведении (например, для GPA, Match %, Coverage %).

### 1.2 Конкретные экраны
- **Login**: у полей Email и Password нет placeholder и подсказок (можно добавить placeholder типа «you@example.com», подсказку «Минимум 8 символов» под паролем только если нужна).
- **Register**: те же поля — нет placeholder; под паролем уже есть валидация, но подсказка «Минимум 8 символов» в самом поле (placeholder) или под полем улучшит понимание.
- **Forgot Password**: поле Email без placeholder (например «you@example.com»).
- **Student Profile**: часть полей уже с placeholder (gradePlaceholder, languagePlaceholder, country, bioPlaceholder), но **GPA** без подсказки «0–4»; **Avatar URL** — placeholder «https://...» есть, можно добавить короткую подсказку «Ссылка на изображение».
- **University Profile**: sloganPlaceholder, foundedPlaceholder, studentCountPlaceholder, descriptionPlaceholder есть; **Logo URL** — только «https://...», без подсказки.
- **University Onboarding**: много полей без placeholder и подсказок — University name, Slogan, Founded year, Number of students, Accreditation, Rating (0-100), Description, Country, City, Contact email, Phone. Нужны placeholder и/или hint на выбранных языках.
- **Scholarships (создание)**: Name, Coverage %, Max slots, Deadline, Eligibility — без placeholder/подсказок (что такое Coverage %, в каких единицах slots, формат даты).
- **Admin Verification**: placeholder «Add a comment...» — хардкод, нужен перевод.
- **Explore Universities**: placeholder «Search...» — перевести; фильтры Country, Sort — без подсказок.
- **Admin Logs**: placeholder «Filter by user...» — перевести.
- **Compare**: «Add university...» — перевести; колонки Name, Country, City, Rating, Match %, Scholarship — перевести.
- **Landing (контакт)**: placeholder уже через t(), но можно добавить подсказку под полем «Сообщение» (макс. длина, что писать).

---

## 2. Ошибки валидации и API — перевод на все языки

### 2.1 Валидация форм (Zod)
- **Login**: схема без кастомных сообщений — `z.string().email()` и `z.string().min(1)` дают сообщения на английском (например «Invalid email»). Нужно передавать переведённые сообщения через `t()`, как в Register для password и confirmPassword.
- **Register**: для name и email нет переведённых сообщений (например «Name is required», «Invalid email»). Добавить ключи в auth (errors.emailInvalid, errors.nameRequired и т.д.) и использовать в схеме.
- **Forgot Password**: если есть валидация email — сообщение перевести.
- **Student Profile / University Profile**: ошибки полей (`errors.firstName?.message` и т.д.) приходят из Zod — убедиться, что все сообщения заданы через `t()` (например errors.required, errors.invalidUrl, errors.gpaRange).

### 2.2 Ошибки с бэкенда (getApiError)
- **Сейчас**: `getApiError` возвращает `message` как есть с бэка (обычно английский). Пользователь видит «Invalid credentials» или «User already exists» на одном языке.
- **Нужно**: маппинг по коду ошибки (или по ключу) на ключи i18n и вывод `t('errors:invalidCredentials')` и т.д. Добавить namespace `errors` (или в common/auth) с переводами для всех языков (en, ru, uz): invalidCredentials, userExists, emailNotVerified, invalidToken, etc.
- **Где показываются**: Login, Register, ForgotPassword, VerifyEmail, StudentProfile, UniversityProfile, UniversityOnboarding, Scholarships, Verification, AIChatDrawer и везде, где вызывается getApiError.

---

## 3. «Забыл пароль» и ссылки вокруг авторизации

- **Текст «Forgot password?»** уже переведён (auth:forgotPassword) и выведен ссылкой на `/forgot-password` — ок.
- **Страница Reset password**: сейчас в роутере заглушка «Reset password (TODO)» — нужно сделать полноценную страницу с полями token (из URL), new password, confirm, и переведёнными лейблами/ошибками/подсказками.
- **Ссылки «Нет аккаунта? Регистрация» / «Уже есть аккаунт? Войти»** — уже через t(), проверить отображение на всех языках.

---

## 4. Иконки и доступность (a11y)

- **Input (пароль)**: кнопка «показать/скрыть пароль» — `aria-label` сейчас на английском («Show password» / «Hide password»). Вынести в переводы (например common:showPassword / common:hidePassword) и использовать для aria-label.
- **Другие кнопки-иконки**: Close, Notifications, Open Edmission AI, Remove, Empty — проверить aria-label и при необходимости перевести через t().
- **Иконка «?» для подсказок**: если добавим тултипы к полям — использовать одну иконку (например, круг с вопросом) и единообразный стиль, aria-label «Подсказка» / t('common:hint').

---

## 5. Хардкод строк — перевести

### 5.1 Auth
- **VerifyEmail**: «Loading...» заменено на «Verifying your email…» — перевести; «Verification failed», «Go to login», «Email verified», «You can now sign in», «Sign in».

### 5.2 University
- **UniversityOnboarding**: все шаги (Overview, Media & Location, …), лейблы полей (University name, Slogan, …), кнопки (Next, Skip, Submit, Back), сообщения об ошибках.
- **Scholarships**: title «Create scholarship», лейблы Name, Coverage %, Max slots, Deadline, Eligibility, Cancel, Create.
- **Verification (admin)**: «Approve university», «Reject university», «Add a comment...», Approve, Reject, Cancel.
- **Pipeline**: стадии (Interested, Contacted, Evaluating, Offer Sent, Accepted, Rejected); «Student» как fallback имени.

### 5.3 Student
- **StudentOffers**: EmptyState title/description/actionLabel («No offers yet», «Show interest…», «Explore universities»).
- **StudentApplications**: фильтр Status, EmptyState.
- **ExploreUniversities**: фильтры (Country, Sort), placeholder Search, варианты сортировки и стран, EmptyState.
- **Compare**: заголовки колонок, «Add university...», «Yes»/«No» для Scholarship, aria-label «Remove».
- **UniversityDetail**: «No description.»; кнопка «Interested» / «Show interest».
- **MatchScore**: «Match breakdown» в тултипе — перевести.

### 5.4 Admin
- **UserManagement**: Role/Status, варианты (All roles, Student, University, Admin, All statuses, Active, Suspended), «No users found», «Try changing filters.», «Active»/«Suspended», Suspend/Unsuspend.
- **AdminLogs**: Type, User ID, placeholder «Filter by user...», варианты (All types, Login, Register, Verification).
- **SystemHealth**: «Up»/«Down».
- **Admin Dashboard / остальное**: проверить оставшиеся строки в admin.json и экранах.

### 5.5 Общее
- **BackendStatus**: «Unreachable» и прочие сообщения — перевести.
- **AIChatDrawer**: «Something went wrong. Try again.»; «Edmission AI»; «Ask me about…»; «Suggested questions»; «Type your question…»; «Loading…» и т.д.
- **MessageThread**: «Select a conversation»; «Type a message...»; «typing...».
- **ErrorState**: «Please try again or contact support.» — уже в компоненте, вынести в common и перевести.

---

## 6. Прочие мелочи

- **Единообразие**: везде, где есть кнопки «Save»/«Saving…», «Submit»/«Saving…», использовать общие ключи (common:save, common:submit) и при loading — один и тот же паттерн (кнопка с спиннером и тем же текстом или «Saving…» из переводов).
- **Пустые состояния (EmptyState)**: у всех title, description, actionLabel — из i18n, не хардкод.
- **Даты и числа**: уже есть formatDate и т.д.; проверить, что подписи вроде «Deadline», «Founded year» и подсказки формата (например «ГГГГ») переведены.
- **Модальные окна**: заголовки и кнопки (Cancel, Confirm, Delete, …) — общие ключи в common и использование везде.
- **Placeholder везде**: по возможности не пустые — нейтральный пример (email, имя, год) на выбранном языке.

---

## Приоритеты (кратко)

1. **Высокий**: перевод ошибок API и валидации (en, ru, uz); перевод сообщений на страницах Login/Register/ForgotPassword/VerifyEmail; добавить placeholder/hint для ключевых полей (email, пароль, GPA, университет).
2. **Средний**: подсказки (hint) для полей в формах профиля и онбординга; перевод всех хардкод-строк в админке и университетах; aria-label для иконок через t(); страница Reset password.
3. **Низкий**: иконка «?» с тултипом для сложных полей; единая подсказка «после 2 секунд ожидания» уже сделана через кнопки loading.

После утверждения списка можно разбить на задачи и править по пунктам (сначала переводы и ошибки, потом подсказки и хардкод).
