# File Upload System Documentation

Комплексная система загрузки и обработки файлов для Draiver Backend.

## Технологии

- **Multer**: Загрузка файлов через multipart/form-data
- **Sharp**: Обработка и оптимизация изображений
- **Memory Storage**: Обработка в памяти для Sharp
- **TypeScript**: Полная типизация

## Структура

```
backend/
├── src/
│   ├── middleware/
│   │   └── upload.ts           # Multer конфигурация
│   ├── services/
│   │   └── imageService.ts     # Sharp обработка
│   ├── controllers/
│   │   └── uploadController.ts # Контроллеры загрузки
│   └── routes/
│       └── uploadRoutes.ts     # Upload endpoints
└── uploads/
    ├── avatars/                # Пользовательские аватары
    ├── vehicles/               # Фото автомобилей
    └── documents/              # Документы водителей
```

## Endpoints

Все endpoints требуют авторизации (Bearer token).

### 1. Upload Avatar
**POST** `/api/upload/avatar`

Загрузка аватара пользователя.

**Request**:
```bash
curl -X POST http://localhost:5000/api/upload/avatar \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "avatar=@/path/to/image.jpg"
```

**Response**:
```json
{
  "success": true,
  "message": "Аватар успешно загружен",
  "user": {
    "id": "user-id",
    "firstName": "Имя",
    "lastName": "Фамилия",
    "avatarUrl": "/uploads/avatars/avatar_user-id_1234567890.jpg"
  }
}
```

**Обработка**:
- Resize: 400x400px
- Format: JPEG
- Quality: 85%
- Fit: cover (обрезка по центру)
- Автоматическое удаление старого аватара

### 2. Upload Vehicle Photo
**POST** `/api/upload/vehicle-photo`

Загрузка фотографии автомобиля (только для водителей).

**Request**:
```bash
curl -X POST http://localhost:5000/api/upload/vehicle-photo \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "photo=@/path/to/vehicle.jpg"
```

**Response**:
```json
{
  "success": true,
  "message": "Фото автомобиля успешно загружено",
  "photo": {
    "url": "/uploads/vehicles/vehicle_user-id_1234567890.jpg",
    "thumbnail": "/uploads/vehicles/thumb_vehicle_user-id_1234567890.jpg"
  },
  "profile": {
    "userId": "user-id",
    "vehicleMake": "Toyota",
    "vehicleModel": "Camry",
    "vehiclePhotoUrl": "/uploads/vehicles/vehicle_user-id_1234567890.jpg"
  }
}
```

**Обработка**:
- Main photo:
  - Resize: 800x600px (max, сохранение пропорций)
  - Format: JPEG
  - Quality: 85%
- Thumbnail:
  - Resize: 150x150px
  - Format: JPEG
  - Quality: 80%
  - Fit: cover
- Автоматическое удаление старых фото

### 3. Upload Driver Documents
**POST** `/api/upload/driver-documents`

Загрузка документов водителя (только для водителей).

**Fields**:
- `license`: Водительское удостоверение (max 1)
- `vehicleRegistration`: Свидетельство о регистрации ТС (max 1)
- `insurance`: Страховка (max 1)
- `technicalInspection`: Техосмотр (max 1)
- `driverPhoto`: Фото водителя (max 1)

**Request**:
```bash
curl -X POST http://localhost:5000/api/upload/driver-documents \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "license=@/path/to/license.pdf" \
  -F "insurance=@/path/to/insurance.jpg" \
  -F "vehicleRegistration=@/path/to/registration.pdf"
```

**Response**:
```json
{
  "success": true,
  "message": "Документы успешно загружены",
  "documents": {
    "license": "/uploads/documents/license_user-id_1234567890.pdf",
    "insurance": "/uploads/documents/insurance_user-id_1234567891.jpg",
    "vehicleRegistration": "/uploads/documents/vehicleRegistration_user-id_1234567892.pdf"
  }
}
```

**Обработка**:
- PDF: Сохранение как есть
- Images: Resize до 1200x1600px max, quality 90%, JPEG format

### 4. Delete Avatar
**DELETE** `/api/upload/avatar`

Удаление аватара пользователя.

**Request**:
```bash
curl -X DELETE http://localhost:5000/api/upload/avatar \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Response**:
```json
{
  "success": true,
  "message": "Аватар успешно удален"
}
```

### 5. Get Upload Statistics (Admin)
**GET** `/api/upload/stats`

Статистика загруженных файлов (только для админов).

**Request**:
```bash
curl -X GET http://localhost:5000/api/upload/stats \
  -H "Authorization: Bearer ADMIN_TOKEN"
```

**Response**:
```json
{
  "success": true,
  "stats": {
    "usersWithAvatars": 15,
    "driversWithPhotos": 8,
    "totalUploads": 23
  }
}
```

## Валидация

### Изображения (Avatar, Vehicle Photo)
- **Форматы**: JPEG, PNG, WebP
- **Максимальный размер**: 5MB
- **Обработка**: Автоматическая оптимизация через Sharp

### Документы (Driver Documents)
- **Форматы**: PDF, JPEG, PNG
- **Максимальный размер**: 10MB
- **Количество**: До 5 файлов одновременно

## Примеры использования

### Frontend: Upload Avatar
```tsx
async function uploadAvatar(file: File) {
  const formData = new FormData();
  formData.append('avatar', file);

  const response = await fetch('/api/upload/avatar', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
    body: formData,
  });

  const data = await response.json();
  return data.user.avatarUrl;
}
```

### Frontend: Upload Vehicle Photo
```tsx
async function uploadVehiclePhoto(file: File) {
  const formData = new FormData();
  formData.append('photo', file);

  const response = await fetch('/api/upload/vehicle-photo', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
    body: formData,
  });

  const data = await response.json();
  return {
    url: data.photo.url,
    thumbnail: data.photo.thumbnail,
  };
}
```

### Frontend: Upload Documents
```tsx
async function uploadDriverDocuments(files: {
  license?: File;
  insurance?: File;
  vehicleRegistration?: File;
  technicalInspection?: File;
  driverPhoto?: File;
}) {
  const formData = new FormData();

  if (files.license) formData.append('license', files.license);
  if (files.insurance) formData.append('insurance', files.insurance);
  if (files.vehicleRegistration) {
    formData.append('vehicleRegistration', files.vehicleRegistration);
  }
  if (files.technicalInspection) {
    formData.append('technicalInspection', files.technicalInspection);
  }
  if (files.driverPhoto) formData.append('driverPhoto', files.driverPhoto);

  const response = await fetch('/api/upload/driver-documents', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
    body: formData,
  });

  return await response.json();
}
```

## Обработка изображений

### Avatar Processing
```typescript
// 400x400px, JPEG 85%, cover fit, center crop
await sharp(buffer)
  .resize(400, 400, {
    fit: 'cover',
    position: 'center',
  })
  .jpeg({ quality: 85 })
  .toFile(filepath);
```

### Vehicle Photo Processing
```typescript
// Main: 800x600px max, JPEG 85%
await sharp(buffer)
  .resize(800, 600, {
    fit: 'inside',
    withoutEnlargement: true,
  })
  .jpeg({ quality: 85 })
  .toFile(filepath);

// Thumbnail: 150x150px, JPEG 80%, cover fit
await sharp(buffer)
  .resize(150, 150, {
    fit: 'cover',
    position: 'center',
  })
  .jpeg({ quality: 80 })
  .toFile(thumbnailPath);
```

### Document Image Processing
```typescript
// Max 1200x1600px, JPEG 90%
await sharp(buffer)
  .resize(1200, 1600, {
    fit: 'inside',
    withoutEnlargement: true,
  })
  .jpeg({ quality: 90 })
  .toFile(filepath);
```

## Хранение файлов

### Локальное хранилище (development/production)
```
backend/uploads/
├── avatars/
│   ├── avatar_user123_1234567890.jpg
│   └── avatar_user456_1234567891.jpg
├── vehicles/
│   ├── vehicle_driver123_1234567890.jpg
│   ├── thumb_vehicle_driver123_1234567890.jpg
│   ├── vehicle_driver456_1234567891.jpg
│   └── thumb_vehicle_driver456_1234567891.jpg
└── documents/
    ├── license_driver123_1234567890.pdf
    ├── insurance_driver123_1234567891.jpg
    └── vehicleRegistration_driver123_1234567892.pdf
```

### Docker Volume
В docker-compose.yml добавьте volume для постоянного хранения:
```yaml
backend:
  volumes:
    - ./backend/uploads:/app/uploads
    - ./backend/logs:/app/logs
```

### Cloud Storage (будущее)
Для production рекомендуется использовать:
- AWS S3
- Google Cloud Storage
- Cloudflare R2
- Yandex Object Storage

## Безопасность

### Валидация типов файлов
```typescript
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const ALLOWED_DOCUMENT_TYPES = ['application/pdf', 'image/jpeg', 'image/png'];

// Проверка MIME type
if (!ALLOWED_IMAGE_TYPES.includes(file.mimetype)) {
  throw new AppError('Неверный формат файла', 400);
}
```

### Ограничения размера
```typescript
const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5MB
const MAX_DOCUMENT_SIZE = 10 * 1024 * 1024; // 10MB

multer({
  limits: {
    fileSize: MAX_IMAGE_SIZE,
    files: 1,
  },
});
```

### Уникальные имена файлов
```typescript
// Формат: prefix_userId_timestamp_random.ext
const filename = `avatar_${userId}_${Date.now()}_${randomString}${ext}`;
```

### Автоудаление старых файлов
```typescript
// Удаление аватара при загрузке нового
if (user?.avatarUrl) {
  await deleteFileByUrl(user.avatarUrl);
}
```

## Утилиты

### ensureUploadDirs()
Создает директории для загрузки при старте приложения.

### getFileMetadata(buffer)
Получает метаданные изображения (width, height, format, size).

### validateImageDimensions(buffer, minWidth, minHeight)
Проверяет минимальные размеры изображения.

### convertToWebP(buffer, filename, directory)
Конвертирует изображение в WebP формат.

### cleanupOldFiles(directory, daysOld)
Удаляет файлы старше указанного количества дней.

## Производительность

### Memory Storage vs Disk Storage
- **Memory Storage**: Быстрее для обработки через Sharp
- **Disk Storage**: Экономит память для больших файлов
- Текущая реализация: Memory Storage (оптимально для нашего use case)

### Оптимизация изображений
- JPEG с качеством 85% - отличный баланс размера и качества
- Thumbnails с качеством 80% - достаточно для превью
- Resize перед сохранением - экономия места на диске

## Мониторинг

### Логирование
```typescript
console.log('Avatar metadata:', metadata);
console.error('Failed to delete file:', filepath, error);
```

### Статистика
Endpoint `/api/upload/stats` предоставляет:
- Количество пользователей с аватарами
- Количество водителей с фото авто
- Общее количество загрузок

## Troubleshooting

### Ошибка: "Файл не загружен"
Проверьте:
- Правильный Content-Type: multipart/form-data
- Правильное имя поля (avatar, photo, etc.)
- Размер файла не превышает лимит

### Ошибка: "Неверный формат файла"
Разрешены только:
- Изображения: JPEG, PNG, WebP
- Документы: PDF, JPEG, PNG

### Ошибка: "Профиль водителя не найден"
Только водители могут загружать фото автомобилей и документы.

### Файлы не сохраняются
Проверьте права доступа к директории uploads/:
```bash
chmod -R 755 backend/uploads
```

## TODO

⏳ **Будущие улучшения**:
- [ ] Интеграция с AWS S3 / Google Cloud Storage
- [ ] WebP формат по умолчанию (с JPEG fallback)
- [ ] Автоматическая очистка старых файлов (cron)
- [ ] Virus scanning для загруженных файлов
- [ ] Image EXIF data stripping для приватности
- [ ] Прогресс-бар загрузки на frontend
- [ ] Multiple upload для vehicle photos (галерея)
- [ ] Video upload для vehicle showcase
- [ ] CDN интеграция для быстрой отдачи статики

## Best Practices

1. **Всегда обрабатывайте изображения** перед сохранением (resize, optimize)
2. **Удаляйте старые файлы** при загрузке новых
3. **Валидируйте MIME types** и размеры
4. **Используйте уникальные имена** файлов для предотвращения конфликтов
5. **Храните URLs в БД**, не пути файловой системы
6. **Логируйте ошибки** загрузки для отладки
7. **Используйте CDN** в production для статики
8. **Настройте CORS** для загрузки с frontend домена
9. **Ограничьте rate limiting** для upload endpoints
10. **Мониторьте размер** директории uploads/

## Примеры ошибок

### 400 Bad Request
```json
{
  "success": false,
  "message": "Неверный формат файла. Разрешены только JPEG, PNG и WebP"
}
```

### 401 Unauthorized
```json
{
  "success": false,
  "message": "Не авторизован"
}
```

### 403 Forbidden
```json
{
  "success": false,
  "message": "Доступ запрещен"
}
```

### 404 Not Found
```json
{
  "success": false,
  "message": "Профиль водителя не найден"
}
```
