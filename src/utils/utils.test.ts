import { preProcessImage } from './utils';

describe('preProcessImage', () => {
  let mockGetContext: jest.SpyInstance;
  let mockToBlob: jest.Mock;
  let mockGetImageData: jest.Mock;
  let mockPutImageData: jest.Mock;
  let mockDrawImage: jest.Mock;
  let mockImageInstance: HTMLImageElement;

  beforeEach(() => {
    mockToBlob = jest.fn((callback) => callback(new Blob(['mockBlobContent'])));
    mockGetImageData = jest.fn(() => ({
      data: new Uint8ClampedArray([100, 150, 200, 255, 50, 60, 70, 255]), // Mock pixel data
      width: 1,
      height: 2,
    }));
    mockPutImageData = jest.fn();
    mockDrawImage = jest.fn();

    mockGetContext = jest.spyOn(HTMLCanvasElement.prototype, 'getContext').mockImplementation(() => ({
      getImageData: mockGetImageData,
      putImageData: mockPutImageData,
      drawImage: mockDrawImage,
      // Add other mock context methods if needed by the function
    } as any));

    // Mock HTMLCanvasElement.prototype.toBlob
    Object.defineProperty(HTMLCanvasElement.prototype, 'toBlob', {
      writable: true,
      value: mockToBlob,
    });

    // Mock Image constructor
    mockImageInstance = {
      onload: jest.fn(),
      onerror: jest.fn(),
      src: '',
      width: 100, // Mock width
      height: 100, // Mock height
    } as any;
    global.Image = jest.fn(() => mockImageInstance) as any;

    // Mock document.createElement for canvas
    const mockCanvas = {
      getContext: mockGetContext,
      toBlob: mockToBlob,
      width: 0,
      height: 0,
    } as HTMLCanvasElement;
    jest.spyOn(document, 'createElement').mockReturnValue(mockCanvas);
  });

  afterEach(() => {
    jest.restoreAllMocks(); // Restores all mocks, including spies
  });

  it('should process an HTMLCanvasElement input and resolve with a blob', async () => {
    const mockCanvas = document.createElement('canvas') as HTMLCanvasElement;
    mockCanvas.width = 10;
    mockCanvas.height = 10;

    const blob = await preProcessImage(mockCanvas);

    expect(mockGetContext).toHaveBeenCalledWith('2d');
    expect(mockGetImageData).toHaveBeenCalledWith(0, 0, mockCanvas.width, mockCanvas.height);
    expect(mockPutImageData).toHaveBeenCalled();
    expect(mockToBlob).toHaveBeenCalledTimes(1);
    expect(blob).toBeInstanceOf(Blob);
    expect(await blob.text()).toBe('mockBlobContent');
  });

  it('should process a data URL string input, create a canvas, and resolve with a blob', async () => {
    const dataUrl = 'data:image/png;base64,test';
    
    // Trigger onload manually for the test
    const promise = preProcessImage(dataUrl);
    if (mockImageInstance.onload) {
      (mockImageInstance.onload as EventListenerOrEventListenerObject)(new Event('load'));
    }
    
    const blob = await promise;

    expect(global.Image).toHaveBeenCalledTimes(1);
    expect(mockImageInstance.src).toBe(dataUrl);
    expect(document.createElement).toHaveBeenCalledWith('canvas');
    expect(mockDrawImage).toHaveBeenCalledWith(mockImageInstance, 0, 0);
    expect(mockGetContext).toHaveBeenCalledWith('2d'); // For the internally created canvas
    expect(mockGetImageData).toHaveBeenCalled();
    expect(mockPutImageData).toHaveBeenCalled();
    expect(mockToBlob).toHaveBeenCalledTimes(1);
    expect(blob).toBeInstanceOf(Blob);
    expect(await blob.text()).toBe('mockBlobContent');
  });

  it('should reject if getContext returns null for canvas input', async () => {
    mockGetContext.mockReturnValueOnce(null);
    const mockCanvas = document.createElement('canvas') as HTMLCanvasElement;
    await expect(preProcessImage(mockCanvas)).rejects.toThrow('Could not get canvas context');
  });

  it('should reject if getContext returns null for data URL input', async () => {
    const dataUrl = 'data:image/png;base64,test';
    // Mock successful image load, but failing getContext for the new canvas
    mockGetContext.mockImplementationOnce(() => ({ // For the initial check if any
        getImageData: mockGetImageData,
        putImageData: mockPutImageData,
        drawImage: mockDrawImage,
      } as any))
      .mockImplementationOnce(() => null); // For the canvas created after image load


    const promise = preProcessImage(dataUrl);
    if (mockImageInstance.onload) {
        (mockImageInstance.onload as EventListenerOrEventListenerObject)(new Event('load'));
    }

    await expect(promise).rejects.toThrow('Could not get canvas context for image loading');
  });

  it('should reject if image loading fails (onerror)', async () => {
    const dataUrl = 'data:image/png;base64,test_error';
    const errorEvent = new Event('error');

    const promise = preProcessImage(dataUrl);
    // Manually trigger onerror
    if (mockImageInstance.onerror) {
      (mockImageInstance.onerror as EventListenerOrEventListenerObject)(errorEvent);
    }

    await expect(promise).rejects.toThrow('Error loading image: ' + errorEvent);
  });
  
  it('should reject if toBlob fails', async () => {
    mockToBlob.mockImplementationOnce(callback => callback(null)); // Simulate toBlob failing
    const mockCanvas = document.createElement('canvas') as HTMLCanvasElement;
    await expect(preProcessImage(mockCanvas)).rejects.toThrow('Error converting to blob');
  });
});
