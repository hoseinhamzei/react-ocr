import { createWorker, Lang, OEM } from "tesseract.js";

function preProcessImage(result: string): Promise<Blob> {
    return new Promise((resolve, reject) => {

        const img = new Image();
        img.src = result;

        img.onload = () => {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');

            if (!ctx) {
                reject(new Error('Could not get canvas context'));
                return;
            }

            canvas.width = img.width;
            canvas.height = img.height;

            // draw the image on the canvas
            ctx.drawImage(img, 0, 0);

            const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            const data = imageData.data;

            // convert to grayscale
            for (let i = 0; i < data.length; i += 4) {
                const avg = (data[i] + data[i + 1] + data[i + 2]) / 3;
                data[i] = avg;     // Red
                data[i + 1] = avg; // Green
                data[i + 2] = avg; // Blue
            }

            ctx.putImageData(imageData, 0, 0);

            canvas.toBlob(blob => {
                if (blob) {
                    resolve(blob);
                } else {
                    reject(new Error("Error converting to blob"));
                }
            })
        };

        img.onerror = (error) => {
            reject(new Error('Error loading image: ' + error));
        };
    });
}

function initTesseractWorker(lang: string | string[] | Lang[]) {
    const worker = createWorker(lang, OEM.TESSERACT_LSTM_COMBINED);
    return worker;
}

const handWriteBlackList = [
    '!', '"', '#', '$', '%', '&', "'", '(', ')', '*', '+', ',', '-', '.', '/',
    ':', ';', '<', '=', '>', '?', '@', '[', '\\', ']', '^', '_', '`', '{', '|', '}', '~',
    '•', '€', '£', '¥', '©', '™', '®', '✔', '✖', '✓', '∞', '±', '°', '§', '¶', '♪', '♫'
];

export { preProcessImage, initTesseractWorker, handWriteBlackList };