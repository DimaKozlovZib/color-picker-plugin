# 1. Техническое задание

## Название
**Color Picker для VS Code**

## Цель
Создание инструмента для работы с цветами непосредственно в среде разработки VS Code

## Основной функционал
- Визуальный интерфейс выбора цвета
- Сохранение часто используемых цветов в палитру
- Копирование цветов в различных форматах (HEX, RGB, HSL)
- Управление сохраненной палитрой (добавление, удаление)
- Интеграция с боковой панелью VS Code
- Сохранение состояния между сессиями

## Технические требования
- Реализация через Webview View API
- Сохранение данных в globalState VS Code
- Двусторонняя коммуникация между webview и extension
- Адаптивный пользовательский интерфейс
- Поддержка скриптов в webview
- Локализация сообщений (русский язык)

# 2. Архитектура плагина

## Блок-схема архитектуры
VS Code Host Environment\
├── Extension Context\
│ ├── activate()\
│ ├── deactivate()\
│\
└── ColorPickerProvider\
├── _extensionUri: vscode.Uri\
├── _context: vscode.ExtensionContext\
├── _view: WebviewView\
├── _savedColors: Array\
├── resolveWebviewView()\
├── _saveColor(color, name)\
├── _copyToClipboard(text)\
├── _deleteColor(index)\
└── _sendSavedColors()\
│\
Webview View\
├── HTML/CSS/JS Interface\
├── Color picker widget\
├── Saved colors list\
├── Format selection\
└── Copy buttons\
│\
VS Code API\
├── vscode.env.clipboard.writeText()\
├── vscode.window.showInformationMessage()\
├── context.globalState.update()\
└── context.globalState.get()


## Описание workflow

### 1. Активация расширения
- VS Code загружает и активирует расширение
- Вызывается функция activate()
- Регистрируется ColorPickerProvider

### 2. Инициализация интерфейса
- Пользователь открывает панель Color Picker
- Вызывается resolveWebviewView()
- Загружаются и компилируются HTML, CSS, JS файлы
- Настраивается обработчик сообщений

### 3. Работа с цветами
- Пользователь выбирает цвет в интерфейсе
- Webview отправляет сообщение типа saveColor
- Extension сохраняет цвет в globalState
- Обновленный список отправляется обратно в webview

### 4. Управление палитрой
- Сохранение цветов с автоматическими названиями
- Удаление цветов по индексу
- Копирование в буфер обмена
- Синхронизация состояния между сессиями

## Коммуникационная схема

Webview (Клиент) -> Extension (Хост) -> VS Code API

Сообщения:
- saveColor -> _saveColor() -> globalState.update()
- copyToClipboard -> _copyToClipboard() -> clipboard.writeText()
- savedColorsUpdate <- _sendSavedColors()
