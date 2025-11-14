# Модуль Color Picker

Расширение VS Code для работы с цветами через визуальный интерфейс.

## Классы

### `ColorPickerProvider`
Провайдер для отображения и управления панелью выбора цветов в VS Code.

#### Конструктор
```javascript
constructor(extensionUri, context)
```
Создает экземпляр ColorPickerProvider.

**Параметры:**
- `extensionUri` (vscode.Uri) - URI расширения для доступа к ресурсам
- `context` (vscode.ExtensionContext) - контекст расширения для управления состоянием

#### Методы

##### `resolveWebviewView(webviewView, context, token)`
Инициализирует webview view при создании панели.

**Параметры:**
- `webviewView` (vscode.WebviewView) - создаваемый webview компонент
- `context` (vscode.WebviewViewResolveContext) - контекст разрешения
- `token` (vscode.CancellationToken) - токен для отслеживания отмены операции

**Пример:**
```javascript
// Вызывается автоматически при открытии панели Color Picker
resolveWebviewView(webviewView, context, token) {
    // Инициализация webview и настройка обработчиков
}
```

#### `_saveColor(color, name = '')`
Сохраняет цвет в палитру пользователя.

**Параметры:**
- `color` (string) - цвет в формате HEX (#RRGGBB)
- `name` (string) - пользовательское название цвета (опционально)

**Пример:**
```javascript
// Сохранение цвета с автоматическим названием
_saveColor('rgba(255, 255, 255, 1)');

// Сохранение цвета с пользовательским названием
_saveColor('rgba(255, 255, 255, 1)', 'Мой цвет');
```

#### `_copyToClipboard(text)`
Копирует текст в буфер обмена VS Code.

**Параметры:**
- `text` (string) - текст для копирования

**Пример:**
```javascript
// Копирование HEX значения цвета в буфер обмена
_copyToClipboard('rgba(255, 255, 255, 1)');
```

#### `_deleteColor(index)`
Удаляет цвет из сохраненной палитры по индексу.

**Параметры:**
- `index` (number) - индекс элемента в массиве сохраненных цветов

**Пример:**
```javascript
// Удаление цвета с индексом 0
_deleteColor(0);
```

#### `_sendSavedColors()`
Отправляет актуальный список цветов в webview.

**Пример:**
```javascript
// Синхронизация списка цветов с интерфейсом
_sendSavedColors();
```

## Функции

### `activate(context)`
Активирует расширение при запуске VS Code.

**Параметры:**
- `context` (vscode.ExtensionContext) - контекст расширения

**Пример:**

```javascript
// Регистрация провайдера в системе VS Code
activate(context) {
    const provider = new ColorPickerProvider(context.extensionUri, context);
    context.subscriptions.push(
        vscode.window.registerWebviewViewProvider(
            ColorPickerProvider.viewType,
            provider
        )
    );
}
```

### `deactivate()`
Деактивирует расширение при закрытии VS Code.

**Пример:**

```javascript
// Очистка ресурсов расширения
deactivate() {
    console.log('Advanced Color Picker extension deactivated');
}
```

## Структуры данных

### Сохраненный цвет
```javascript
{
    color: "rgba(255, 255, 255, 1)",          // HEX значение цвета
    name: "Color 1",           // Название цвета
    timestamp: "2024-01-15T10:30:00.000Z"  // Время создания в ISO формате
}
```

### Сообщения от Webview
```javascript
{
    type: "saveColor",   // Тип действия: сохранение цвета
    color: "rgba(255, 255, 255, 1)",   // Данные цвета
    name: "My Color"      // Название цвета
}

{
    type: "copyToClipboard",
    text: "rgba(255, 255, 255, 1)"           
}

{
    type: "deleteColor",    
    index: 0                  
}

{
    type: "getSavedColors"  
}
```

### Сообщения к Webview
```javascript
{
    type: "savedColorsUpdate",
    colors: [                  
        {
            color: "rgba(255, 255, 255, 1)",
            name: "Color 1", 
            timestamp: "2024-01-15T10:30:00.000Z"
        }
    ]
}
```