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

function preProcessCanvas(canvas: HTMLCanvasElement): Promise<Blob> | undefined {
    if (!canvas) return;
    // preprocess the canvas image for better OCR results
    return new Promise((resolve, reject) => {
        const context = canvas.getContext('2d');
        if (context) {
            const imageData = context.getImageData(0, 0, canvas.width, canvas.height);

            const preprocessedCanvas = document.createElement('canvas');
            preprocessedCanvas.width = canvas.width;
            preprocessedCanvas.height = canvas.height;
            const preprocessedContext = preprocessedCanvas.getContext('2d');

            if (preprocessedContext) {
                // convert to grayscale
                const grayData = preprocessedContext.createImageData(imageData.width, imageData.height);
                for (let i = 0; i < imageData.data.length; i += 4) {
                    const avg = (imageData.data[i] + imageData.data[i + 1] + imageData.data[i + 2]) / 3;
                    grayData.data[i] = avg; // R
                    grayData.data[i + 1] = avg; // G
                    grayData.data[i + 2] = avg; // B
                    grayData.data[i + 3] = imageData.data[i + 3]; // A
                }
                preprocessedContext.putImageData(grayData, 0, 0);

                // Convert to blob for Tesseract
                preprocessedCanvas.toBlob((blob) => {
                    if(blob){
                        resolve(blob);
                    }else{
                        reject(new Error("Error converting to blob"));
                    }
                });
            }
        }
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

export { preProcessImage, preProcessCanvas, initTesseractWorker, handWriteBlackList };