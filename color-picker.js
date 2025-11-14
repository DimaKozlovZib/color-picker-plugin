const vscode = acquireVsCodeApi();

// Глобальные переменные для хранения текущего состояния цвета
let currentColor = 'rgba(255, 0, 0, 1)';

// Параметры цвета в формате HSV (Hue, Saturation, Value) + Opacity
window.S = 0;       // Насыщенность (0-100%)
window.V = 100;     // Яркость (0-100%)
window.H = 0;       // Цветовой тон (0-360°)
window.opasity = 1; // Прозрачность (0-1)

// Константы для управления отступами и задержками
startPadding = 3;   // Отступ для кружков от краев канваса
timeoutTime = 50;   // Задержка для throttle обновлений (мс)

// Восстанавливает предыдущее состояние цвета из хранилища VS Code
const previousState = vscode.getState();
if (previousState) {
    currentColor = previousState.currentColor || currentColor;
}

document.addEventListener('DOMContentLoaded', function () {
    HueSelection();
    SaturationAndValueSelection(`rgba(${HueToRgb(0, 100, 100, 1)})`);
    opasityCanvas();
    updateColorDisplay();
    vscode.postMessage({ type: 'getSavedColors' });
});

// Обработчик изменения размера окна - перерисовывает все канвасы
window.addEventListener("resize", () => {
    HueSelection();
    SaturationAndValueSelection(`rgba(${HueToRgb(window.H, 100, 100, 1)})`);
    opasityCanvas();

    // Сброс позиций кружков к начальным значениям
    let circalBlock1 = document.querySelector(".color-block .circal");
    circalBlock1.style.left = 0;

    let circalBlock2 = document.querySelector(".saturation-block .circal");
    circalBlock2.style.left = 0;
    circalBlock2.style.top = 0;

    let circalBlock3 = document.querySelector(".opasity-block .circal");
    circalBlock3.style.left = 0;
})

// Объект для обратной совместимости с внешними системами
let colorPickerResult = {};

function colorPicker(resultSetterFunction) {
    // Инициализация цветовой палитры с callback функцией
    colorPickerResult = {
        set Result(value) {
            resultSetterFunction(value);
        }
    }
}

function HueSelection() {
    // Создает и настраивает палитру выбора цветового тона (Hue)
    let canvas = document.querySelector("#gradient-canvas");
    let block = document.querySelector(".color-block");

    let circalBlock = document.querySelector(".color-block .circal");
    let circalDiametr = circalBlock.offsetWidth;
    let circalRadius = circalDiametr / 2;

    let cx = canvas.getContext("2d");
    let w = canvas.width = canvas.parentNode.clientWidth;
    let h = canvas.height = canvas.parentNode.clientHeight;

    // Создание горизонтального градиента цветового спектра
    let gradientBg = cx.createLinearGradient(0, h / 2, w, h / 2);

    // Цвета спектра: красный, желтый, зеленый, голубой, синий, пурпурный, красный
    let hue = [
        [225, 0, 0],
        [225, 225, 0],
        [0, 225, 0],
        [0, 225, 225],
        [0, 0, 225],
        [225, 0, 225],
        [225, 0, 0]
    ];

    // Добавление цветовых остановок в градиент
    for (let i = 0; i <= 6; i++) {
        let color = `rgb(${hue[i][0]}, ${hue[i][1]}, ${hue[i][2]})`;
        gradientBg.addColorStop(i * 1 / 6, color);
    };

    // Отрисовка градиента на канвасе
    cx.fillStyle = gradientBg;
    cx.fillRect(0, 0, w, h);

    let moveCircal = false;

    // Центрирование кружка по вертикали
    circalBlock.style.top = (h / 2 - circalRadius) + "px";

    function updateCircalPosition(x) {
        // Обновляет позицию кружка и вычисляет значение Hue
        let posX = x - circalRadius;
        posX = Math.max(0, Math.min(posX, w - circalDiametr));
        circalBlock.style.left = posX + "px";

        // Вычисление Hue (0-360°) на основе позиции кружка
        window.H = (posX / (w - circalDiametr)) * 360;

        // Обновление палитры насыщенности/яркости с новым Hue
        SaturationAndValueSelection(`rgba(${HueToRgb(window.H, 100, 100, 1)})`);
        updateColorDisplay();
    }

    // Обработчики событий мыши
    block.onmousedown = (event) => {
        moveCircal = true;
        let x = event.clientX - block.getBoundingClientRect().left;
        updateCircalPosition(x);
    }

    block.onmousemove = (event) => {
        if (moveCircal) {
            let x = event.clientX - block.getBoundingClientRect().left;
            updateCircalPosition(x);
        }
    }

    block.onmouseup = () => {
        moveCircal = false;
    }

    block.onmouseleave = () => {
        moveCircal = false;
    }

    block.onblur = () => {
        moveCircal = false;
    }

    // Глобальный обработчик для случаев выхода за пределы блока
    document.addEventListener('mouseup', () => {
        moveCircal = false;
    });
}

function SaturationAndValueSelection(color) {
    // Создает и настраивает палитру выбора насыщенности и яркости
    let canvas = document.querySelector("#saturation-canvas");
    let circalBlock = document.querySelector(".saturation-block .circal");
    let block = document.querySelector(".saturation-block");

    let w = canvas.width = canvas.parentNode.clientWidth
    let h = canvas.height = canvas.parentNode.clientHeight

    let cx = canvas.getContext("2d");
    cx.clearRect(0, 0, w, h)

    // Градиент насыщенности (горизонтальный): от белого к выбранному цвету
    let gradientBg = cx.createLinearGradient(0, h / 2, w, h / 2);
    gradientBg.addColorStop(0, "rgba(255, 255, 255, 1)");
    gradientBg.addColorStop(0.8, color);
    cx.fillStyle = gradientBg;
    cx.fillRect(0, 0, w, h);

    // Градиент яркости (вертикальный): от прозрачного к черному
    gradientBg = cx.createLinearGradient(w / 2, 0, w / 2, h);
    gradientBg.addColorStop(0, "rgba(0,0,0, 0)");
    gradientBg.addColorStop(0.7, "rgba(0,0,0, 0.7)");
    gradientBg.addColorStop(0.8, "rgba(0,0,0, 0.8)");
    gradientBg.addColorStop(0.9, "rgba(0,0,0, 0.9)");
    gradientBg.addColorStop(1, "rgba(0,0,0, 1)");
    cx.fillStyle = gradientBg;
    cx.fillRect(0, 0, w, h);

    let moveCircal = false;
    let circalDiametr = circalBlock.offsetWidth
    let circalRadius = circalDiametr / 2;

    // Переменная для throttle таймера
    timeoutObj = null;

    function updateCircalPosition(clientX, clientY) {
        // Обновляет позицию кружка и вычисляет Saturation/Value
        let rect = block.getBoundingClientRect();
        let x = clientX - rect.left;
        let y = clientY - rect.top;

        let posX = x - circalRadius;
        let posY = y - circalRadius;

        // Ограничение позиций в пределах канваса
        posX = Math.max(startPadding, Math.min(posX, w - circalDiametr));
        posY = Math.max(0, Math.min(posY, h - circalDiametr));

        circalBlock.style.left = posX + "px";
        circalBlock.style.top = posY + "px";

        // Вычисление Saturation (0-100%) и Value (0-100%)
        window.S = (posX / (w - circalDiametr - startPadding)) * 100;
        window.V = 100 - (posY / (h - circalDiametr)) * 100;

        // Обеспечение корректных диапазонов
        window.S = Math.max(0, Math.min(100, window.S));
        window.V = Math.max(0, Math.min(100, window.V));

        // Throttle обновления отображения для производительности
        if (timeoutObj) {
            clearTimeout(timeoutObj)
        }
        timeoutObj = setTimeout(() => {
            updateColorDisplay();
        }, timeoutTime)
    }

    // Обработчики событий с визуальной обратной связью
    block.addEventListener('mousedown', (event) => {
        moveCircal = true;
        updateCircalPosition(event.clientX, event.clientY);
        block.classList.add('active');
    });

    block.addEventListener('mousemove', (event) => {
        if (moveCircal) {
            updateCircalPosition(event.clientX, event.clientY);
        }
    });

    block.addEventListener('mouseup', () => {
        moveCircal = false;
        block.classList.remove('active');
    });

    block.addEventListener('mouseleave', () => {
        if (moveCircal) {
            moveCircal = false;
            block.classList.remove('active');
        }
    });

    document.addEventListener('mouseup', () => {
        if (moveCircal) {
            moveCircal = false;
            block.classList.remove('active');
        }
    });
}

function HueToRgb(H, S, V, op) {
    // Конвертирует HSV значения в RGB формат
    let f, p, q, t, lh, R, G, B;
    H = H == 360 ? 0 : H;
    S /= 100;
    V /= 100;

    lh = Math.floor(H / 60);
    f = H / 60 - lh;
    p = V * (1 - S);
    q = V * (1 - S * f);
    t = V * (1 - (1 - f) * S);

    // Выбор формулы конвертации в зависимости от сектора Hue
    switch (lh) {
        case 0: R = V; G = t; B = p; break;
        case 1: R = q; G = V; B = p; break;
        case 2: R = p; G = V; B = t; break;
        case 3: R = p; G = q; B = V; break;
        case 4: R = t; G = p; B = V; break;
        case 5: R = V; G = p; B = q; break;
    }
    return [Math.floor(R * 255), Math.floor(G * 255), Math.floor(B * 255), Math.round(op * 100) / 100];
}

function opasityCanvas() {
    // Создает и настраивает палитру выбора прозрачности (Opacity)
    let canvas = document.querySelector("#opasity-canvas");
    let w = canvas.width = canvas.parentNode.clientWidth;
    let h = canvas.height = canvas.parentNode.clientHeight;
    let cx = canvas.getContext("2d");

    // Градиент прозрачности: от черного непрозрачного к черному прозрачному
    let gradientBg = cx.createLinearGradient(0, h / 2, w, h / 2);

    // Белый фон для визуализации прозрачности
    cx.fillStyle = "rgb(255,255,255)";
    cx.fillRect(0, 0, w, h);

    gradientBg.addColorStop(0, "rgba(0,0,0,1)");
    gradientBg.addColorStop(0.5, "rgba(0,0,0,0.5)");
    gradientBg.addColorStop(1, "rgba(0,0,0,0)");
    cx.fillStyle = gradientBg;
    cx.fillRect(0, 0, w, h);

    let moveCircal = false;
    let block = document.querySelector(".opasity-block");
    let circalBlock = document.querySelector(".opasity-block .circal");
    let circalDiametr = circalBlock.offsetWidth;
    let circalRadius = circalDiametr / 2;

    circalBlock.style.top = (h / 2 - circalRadius) + "px";

    timeoutObj = null

    function updateCircalPosition(clientX) {
        // Обновляет позицию кружка и вычисляет значение прозрачности
        let rect = block.getBoundingClientRect();
        let x = clientX - rect.left;

        let posX = x + circalRadius;

        posX = Math.max(startPadding, Math.min(posX, w - circalDiametr));
        circalBlock.style.left = posX + "px";

        // Вычисление прозрачности (0-1) на основе позиции кружка
        window.opasity = posX / (w - circalDiametr - startPadding);

        // Throttle обновления отображения
        if (timeoutObj) {
            clearTimeout(timeoutObj)
        }
        timeoutObj = setTimeout(() => {
            updateColorDisplay();
        }, timeoutTime)
    }

    // Обработчики событий мыши
    block.onmousedown = (event) => {
        moveCircal = true;
        let x = event.clientX - block.getBoundingClientRect().left;
        updateCircalPosition(x);
    }

    block.onmousemove = (event) => {
        if (moveCircal) {
            let x = event.clientX - block.getBoundingClientRect().left;
            updateCircalPosition(x);
        }
    }

    block.onmouseup = () => {
        moveCircal = false;
    }

    block.onmouseleave = () => {
        moveCircal = false;
    }

    block.onblur = () => {
        moveCircal = false;
    }

    document.addEventListener('mouseup', () => {
        moveCircal = false;
    });
}

function updateColorDisplay() {
    // Обновляет отображение текущего цвета в интерфейсе
    const color = `rgba(${HueToRgb(window.H, window.S, window.V, window.opasity)})`;
    currentColor = color;

    // Обновление preview цвета
    document.getElementById('currentColor').style.background = color;
    updateColorFormats(color);

    // Сохранение состояния и уведомление расширения
    vscode.setState({ currentColor: color });
    vscode.postMessage({ type: 'colorChanged', color: color });
}

function updateColorFormats(color) {
    // Обновляет список форматов представления текущего цвета
    console.log(1, color)
    // Список всех поддерживаемых форматов
    const formats = [
        { name: 'HEX', value: rgbToHex(color) },
        { name: 'RGBA', value: color },
        { name: 'HSL', value: rgbToHsl(color) },
        { name: 'HSLA', value: rgbToHsla(color) },
        { name: 'HEX8', value: rgbTo8DigitHex(color) },
        { name: 'HSV', value: rgbToHsv(color) },
    ];
    console.log(formats)

    const container = document.getElementById('colorFormats');
    container.innerHTML = '';

    // Создание элементов для каждого формата
    formats.forEach(format => {
        const div = document.createElement('div');
        div.className = 'format-item';
        div.innerHTML = `
            <div class="format-name">${format.name}</div>
            <div class="format-value">${format.value}</div>
        `;
        div.onclick = () => copyFormat(format.value);
        container.appendChild(div);
    });
}

function saveColor() {
    // Сохраняет текущий цвет в список сохраненных цветов
    const nameInput = document.getElementById('colorNameInput');
    const colorName = nameInput.value.trim();
    vscode.postMessage({
        type: 'saveColor',
        color: currentColor,
        name: colorName
    });
    nameInput.value = '';
}

function copyFormat(text) {
    // Копирует текст в буфер обмена через VS Code API
    vscode.postMessage({
        type: 'copyToClipboard',
        text: text
    });
}

function deleteSavedColor(index) {
    // Удаляет сохраненный цвет по индексу
    vscode.postMessage({
        type: 'deleteColor',
        index: index
    });
}

function targetSavedColor(color) {
    // Устанавливает целевой цвет как текущий и обновляет все палитры
    // Конвертация RGB в HSV значения
    values = rgbToHsvValues(color)

    // Обновление глобальных переменных
    window.H = values[0]
    window.S = values[1]
    window.V = values[2]

    // Извлечение прозрачности из RGBA цвета
    const opacityMatch = color.match(/rgba?\([^)]+,\s*([\d.]+)\)/);
    if (opacityMatch) {
        window.opasity = parseFloat(opacityMatch[1]);
    }

    console.log(window, values)

    // Обновление позиций кружков и перерисовка интерфейса
    updateCircalPositions();
    SaturationAndValueSelection(`rgba(${HueToRgb(window.H, 100, 100, 1)})`);
    updateColorDisplay();
}

function updateCircalPositions() {
    // Обновляет позиции кружков на всех палитрах в соответствии с текущими значениями HSV
    // Палитра Hue
    const hueBlock = document.querySelector(".color-block");
    const hueCircal = document.querySelector(".color-block .circal");
    if (hueBlock && hueCircal) {
        const w = hueBlock.clientWidth;
        const circalDiametr = hueCircal.offsetWidth;
        const posX = (window.H / 360) * (w - circalDiametr);
        hueCircal.style.left = posX + "px";
    }

    // Палитра Saturation/Value
    const saturationBlock = document.querySelector(".saturation-block");
    const saturationCircal = document.querySelector(".saturation-block .circal");
    if (saturationBlock && saturationCircal) {
        const w = saturationBlock.clientWidth;
        const h = saturationBlock.clientHeight;
        const circalDiametr = saturationCircal.offsetWidth;

        const posX = (window.S / 100) * (w - circalDiametr - startPadding);
        const posY = ((100 - window.V) / 100) * (h - circalDiametr);

        saturationCircal.style.left = posX + "px";
        saturationCircal.style.top = posY + "px";
    }

    // Палитра Opacity
    const opacityBlock = document.querySelector(".opasity-block");
    const opacityCircal = document.querySelector(".opasity-block .circal");
    if (opacityBlock && opacityCircal) {
        const w = opacityBlock.clientWidth;
        const circalDiametr = opacityCircal.offsetWidth;
        const posX = window.opasity * (w - circalDiametr - startPadding);
        opacityCircal.style.left = posX + "px";
    }
}

function rgbToHex(rgba) {
    // Конвертирует RGB/RGBA цвет в HEX формат
    const match = rgba.match(/rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)(?:\s*,\s*([\d.]+))?\s*\)/);
    if (!match) return '#000000';

    const r = parseInt(match[1]).toString(16).padStart(2, '0');
    const g = parseInt(match[2]).toString(16).padStart(2, '0');
    const b = parseInt(match[3]).toString(16).padStart(2, '0');

    return `#${r}${g}${b}`.toUpperCase();
}

function rgbToHsl(rgba) {
    // Конвертирует RGB/RGBA цвет в HSL формат
    const match = rgba.match(/rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)(?:\s*,\s*([\d.]+))?\s*\)/);
    if (!match) return 'hsl(0, 0%, 0%)';

    // Нормализация RGB значений к диапазону 0-1
    let r = parseInt(match[1]) / 255;
    let g = parseInt(match[2]) / 255;
    let b = parseInt(match[3]) / 255;

    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    let h, s, l = (max + min) / 2;

    if (max === min) {
        h = s = 0;
    } else {
        const d = max - min;
        s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

        // Вычисление Hue в зависимости от доминирующего канала
        switch (max) {
            case r: h = (g - b) / d + (g < b ? 6 : 0); break;
            case g: h = (b - r) / d + 2; break;
            case b: h = (r - g) / d + 4; break;
        }
        h /= 6;
    }

    // Конвертация в градусы и проценты
    h = Math.round(h * 360);
    s = Math.round(s * 100);
    l = Math.round(l * 100);

    return `hsl(${h}, ${s}%, ${l}%)`;
}

function rgbToHsla(rgba) {
    // Конвертирует RGB/RGBA цвет в HSLA формат
    const hsl = rgbToHsl(rgba);
    const match = rgba.match(/rgba?\([^)]+,\s*([\d.]+)\)/);
    const alpha = match ? parseFloat(match[1]) : 1;

    return hsl.replace('hsl', 'hsla').replace(')', `, ${alpha})`);
}

function rgbTo8DigitHex(rgba) {
    // Конвертирует RGB/RGBA цвет в 8-значный HEX формат (с альфа-каналом)
    const match = rgba.match(/rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)(?:\s*,\s*([\d.]+))?\s*\)/);
    if (!match) return '#000000FF';

    const r = parseInt(match[1]).toString(16).padStart(2, '0');
    const g = parseInt(match[2]).toString(16).padStart(2, '0');
    const b = parseInt(match[3]).toString(16).padStart(2, '0');
    const a = Math.round((match[4] ? parseFloat(match[4]) : 1) * 255).toString(16).padStart(2, '0');

    return `#${r}${g}${b}${a}`.toUpperCase();
}

function rgbToHsvValues(rgba) {
    // Конвертирует RGB/RGBA цвет в HSV значения
    const match = rgba.match(/rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)(?:\s*,\s*([\d.]+))?\s*\)/);
    if (!match) return null;

    // Нормализация RGB значений
    const r = parseInt(match[1]) / 255;
    const g = parseInt(match[2]) / 255;
    const b = parseInt(match[3]) / 255;

    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    const d = max - min;

    let h = 0;
    if (d !== 0) {
        // Вычисление Hue в зависимости от доминирующего канала
        switch (max) {
            case r: h = (g - b) / d + (g < b ? 6 : 0); break;
            case g: h = (b - r) / d + 2; break;
            case b: h = (r - g) / d + 4; break;
        }
        h /= 6;
    }

    const s = max === 0 ? 0 : d / max;
    const v = max;

    return [Math.round(h * 360), Math.round(s * 100), Math.round(v * 100)];
}

function rgbToHsv(rgba) {
    // Конвертирует RGB/RGBA цвет в HSV строковый формат
    values = rgbToHsvValues(rgba);
    return `hsv(${values[0]}, ${values[1]}%, ${values[2]}%)`
}

// Обработчик сообщений от VS Code расширения
window.addEventListener('message', event => {
    const message = event.data;
    if (message.type === 'savedColorsUpdate') {
        updateSavedColorsList(message.colors);
    }
});

function updateSavedColorsList(colors) {
    // Обновляет список сохраненных цветов в интерфейсе
    const container = document.getElementById('savedColorsList');
    container.innerHTML = '';

    if (colors.length === 0) {
        container.innerHTML = '<div class="empty-state">Нет сохранённых цветов</div>';
        return;
    }

    // Отображение цветов в обратном порядке (последние сохраненные - сверху)
    for (let i = colors.length - 1; i >= 0; i--) {
        let colorData = colors[i];

        const item = document.createElement('div');
        item.className = 'saved-color-item';
        item.innerHTML = `
            <div class="color-preview" style="background: ${colorData.color};"></div>
            <div class="color-info" onclick="targetSavedColor('${colorData.color}')">
                <div class="color-name">${colorData.name}</div>
                <div class="color-value">${colorData.color}</div>
            </div>
            <div class="saved-actions">
                <button class="saved-button" onclick="deleteSavedColor(${i})">
                    <svg xmlns="http://www.w3.org/2000/svg" height="20px" viewBox="0 -960 960 960" width="20px" fill="#fff">
                        <path d="M280-120q-33 0-56.5-23.5T200-200v-520h-40v-80h200v-40h240v40h200v80h-40v520q0 33-23.5 56.5T680-120H280Zm400-600H280v520h400v-520ZM360-280h80v-360h-80v360Zm160 0h80v-360h-80v360ZM280-720v520-520Z"/>
                    </svg>
                </button>
            </div>
        `;
        container.appendChild(item);
    }
}