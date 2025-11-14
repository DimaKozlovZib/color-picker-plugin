const vscode = require('vscode');
const path = require('path');
const fs = require('fs');

class ColorPickerProvider {
    static viewType = 'color-picker-view';

    constructor(extensionUri, context) {
        this._extensionUri = extensionUri;
        this._context = context;
        this._view = undefined;
        this._savedColors = this._context.globalState.get('savedColors', []);
    }

    resolveWebviewView(webviewView, context, token) {
        // Инициализация webview для отображения color picker
        this._view = webviewView;

        webviewView.webview.options = {
            enableScripts: true,
            localResourceRoots: [this._extensionUri]
        };

        // Загрузка HTML, CSS и JS файлов для интерфейса color picker
        const htmlPath = path.join(this._extensionUri.fsPath, 'color-picker.html');
        const cssPath = path.join(this._extensionUri.fsPath, 'color-picker.css');
        const jsPath = path.join(this._extensionUri.fsPath, 'color-picker.js');

        let htmlContent = fs.readFileSync(htmlPath, 'utf8');
        const cssContent = fs.readFileSync(cssPath, 'utf8');
        const jsContent = fs.readFileSync(jsPath, 'utf8');

        // Вставка CSS и JS в HTML шаблон
        htmlContent = htmlContent.replace('/* CSS_PLACEHOLDER */', cssContent);
        htmlContent = htmlContent.replace('// JS_PLACEHOLDER', jsContent);

        webviewView.webview.html = htmlContent;

        // Обработка сообщений от webview
        webviewView.webview.onDidReceiveMessage(data => {
            switch (data.type) {
                case 'saveColor':
                    this._saveColor(data.color, data.name);
                    break;
                case 'copyToClipboard':
                    this._copyToClipboard(data.text);
                    break;
                case 'deleteColor':
                    this._deleteColor(data.index);
                    break;
                case 'getSavedColors':
                    this._sendSavedColors();
                    break;
            }
        });

        this._sendSavedColors();
    }

    _saveColor(color, name = '') {
        // Сохранение цвета в глобальное состояние расширения
        const colorName = name || `Color ${this._savedColors.length + 1}`;
        this._savedColors.push({
            color: color,
            name: colorName,
            timestamp: new Date().toISOString()
        });

        this._context.globalState.update('savedColors', this._savedColors);
        this._sendSavedColors();

        vscode.window.showInformationMessage(`Цвет "${colorName}" сохранён!`);
    }

    _copyToClipboard(text) {
        // Копирование текста в буфер обмена
        vscode.env.clipboard.writeText(text).then(() => {
            vscode.window.showInformationMessage(`Скопировано: ${text}`);
        });
    }

    _deleteColor(index) {
        // Удаление цвета из сохраненных по индексу
        const colorName = this._savedColors[index].name;
        this._savedColors.splice(index, 1);
        this._context.globalState.update('savedColors', this._savedColors);
        this._sendSavedColors();
        vscode.window.showInformationMessage(`Цвет "${colorName}" удалён!`);
    }

    _sendSavedColors() {
        // Отправка обновленного списка сохраненных цветов в webview
        if (this._view) {
            this._view.webview.postMessage({
                type: 'savedColorsUpdate',
                colors: this._savedColors
            });
        }
    }
}

function activate(context) {
    // Активация расширения - регистрация провайдера color picker
    console.log('Advanced Color Picker extension activated');

    const provider = new ColorPickerProvider(context.extensionUri, context);

    context.subscriptions.push(
        vscode.window.registerWebviewViewProvider(
            ColorPickerProvider.viewType,
            provider
        )
    );
}

function deactivate() {
    // Деактивация расширения
    console.log('Advanced Color Picker extension deactivated');
}

module.exports = {
    activate,
    deactivate
};