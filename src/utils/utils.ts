function preProcessImage(input: HTMLCanvasElement | string): Promise<Blob> {
    return new Promise((resolve, reject) => {
        const processCanvas = (canvasToProcess: HTMLCanvasElement) => {
            const ctx = canvasToProcess.getContext('2d');
            if (!ctx) {
                reject(new Error('Could not get canvas context'));
                return;
            }

            const imageData = ctx.getImageData(0, 0, canvasToProcess.width, canvasToProcess.height);
            const data = imageData.data;

            // Convert to grayscale and apply binarization
            for (let i = 0; i < data.length; i += 4) {
                const avg = (data[i] + data[i + 1] + data[i + 2]) / 3;
                const threshold = 127;
                const binaryColor = avg > threshold ? 255 : 0;
                data[i] = binaryColor;     // Red
                data[i + 1] = binaryColor; // Green
                data[i + 2] = binaryColor; // Blue
            }

            ctx.putImageData(imageData, 0, 0);

            canvasToProcess.toBlob(blob => {
                if (blob) {
                    resolve(blob);
                } else {
                    reject(new Error("Error converting to blob"));
                }
            });
        };

        if (typeof input === 'string') {
            const img = new Image();
            img.src = input;
            img.onload = () => {
                const canvas = document.createElement('canvas');
                canvas.width = img.width;
                canvas.height = img.height;
                const ctx = canvas.getContext('2d');
                if (!ctx) {
                    reject(new Error('Could not get canvas context for image loading'));
                    return;
                }
                ctx.drawImage(img, 0, 0);
                processCanvas(canvas);
            };
            img.onerror = (error) => {
                reject(new Error('Error loading image: ' + error));
            };
        } else {
            // Input is already an HTMLCanvasElement
            processCanvas(input);
        }
    });
}

export { preProcessImage };