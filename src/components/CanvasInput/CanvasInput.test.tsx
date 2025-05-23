import React from 'react';
import { render, fireEvent, screen, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import CanvasInput from './CanvasInput';
import { performGoogleVisionOCR } from '../../utils/googleVisionApi';
import { preProcessImage } from '../../utils/utils';
import { createWorker } from 'tesseract.js';

// Mock dependencies
jest.mock('tesseract.js', () => ({
  createWorker: jest.fn(),
}));

jest.mock('../../utils/googleVisionApi', () => ({
  performGoogleVisionOCR: jest.fn(),
}));

jest.mock('../../utils/utils', () => ({
  preProcessImage: jest.fn(),
}));

// Mock for canvas context
const mockGetContext = jest.fn();
const mockBeginPath = jest.fn();
const mockMoveTo = jest.fn();
const mockLineTo = jest.fn();
const mockStroke = jest.fn();
const mockClearRect = jest.fn();
const mockToDataURL = jest.fn();
const mockToBlob = jest.fn();

describe('CanvasInput', () => {
  const mockOnDetect = jest.fn();
  const mockRecognize = jest.fn();
  const mockSetParameters = jest.fn();
  let mockTesseractWorker: { recognize: jest.Mock, setParameters: jest.Mock };


  beforeEach(() => {
    jest.useFakeTimers(); // Use fake timers for setTimeout

    // Reset mocks for each test
    mockOnDetect.mockClear();
    (performGoogleVisionOCR as jest.Mock).mockClear();
    (preProcessImage as jest.Mock).mockClear();
    (createWorker as jest.Mock).mockClear();
    mockRecognize.mockClear();
    mockSetParameters.mockClear();
    
    mockGetContext.mockClear();
    mockBeginPath.mockClear();
    mockMoveTo.mockClear();
    mockLineTo.mockClear();
    mockStroke.mockClear();
    mockClearRect.mockClear();
    mockToDataURL.mockClear();
    mockToBlob.mockClear();

    // Setup tesseract.js mock implementation
    mockTesseractWorker = {
      recognize: mockRecognize.mockResolvedValue({ data: { text: 'Tesseract Text' } }),
      setParameters: mockSetParameters,
    };
    (createWorker as jest.Mock).mockResolvedValue(mockTesseractWorker);
    
    // Setup preProcessImage mock
    (preProcessImage as jest.Mock).mockResolvedValue(new Blob(['processed-blob']));

    // Setup canvas context mocks
     HTMLCanvasElement.prototype.getContext = mockGetContext.mockReturnValue({
      beginPath: mockBeginPath,
      moveTo: mockMoveTo,
      lineTo: mockLineTo,
      stroke: mockStroke,
      clearRect: mockClearRect,
      // Ensure other methods used by the component are mocked if necessary
    });
    HTMLCanvasElement.prototype.toDataURL = mockToDataURL.mockReturnValue('data:image/png;base64,mocked-base64-data');
    HTMLCanvasElement.prototype.toBlob = mockToBlob.mockImplementation(callback => callback(new Blob(['canvas-blob'])));


    // Suppress console errors and logs for cleaner test output
    jest.spyOn(console, 'error').mockImplementation(() => {});
    jest.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.runOnlyPendingTimers(); // Run any pending timers
    jest.useRealTimers(); // Restore real timers
    jest.restoreAllMocks(); // Restore all console mocks etc.
  });

  test('renders the canvas element', () => {
    render(<CanvasInput onDetect={mockOnDetect} />);
    const canvasElement = screen.getByRole('graphics-canvas'); // Assuming canvas might have an implicit role or use a test-id
    expect(canvasElement).toBeInTheDocument();
  });

  test('handles mouse drawing events and updates drawing state', () => {
    render(<CanvasInput onDetect={mockOnDetect} />);
    const canvasElement = screen.getByRole('graphics-canvas');

    fireEvent.mouseDown(canvasElement, { nativeEvent: { offsetX: 10, offsetY: 10 } });
    expect(mockGetContext).toHaveBeenCalledWith('2d', { willReadFrequently: true });
    expect(mockBeginPath).toHaveBeenCalled();
    expect(mockMoveTo).toHaveBeenCalledWith(10, 10);
    // Add assertion for isDrawing state if possible/needed, though it's internal

    fireEvent.mouseMove(canvasElement, { nativeEvent: { offsetX: 20, offsetY: 20 } });
    expect(mockLineTo).toHaveBeenCalledWith(20, 20);
    expect(mockStroke).toHaveBeenCalled();

    fireEvent.mouseUp(canvasElement);
    // isDrawing should be false now, setTimeout for detectText should be called
    expect(setTimeout).toHaveBeenCalledTimes(1);
    expect(setTimeout).toHaveBeenLastCalledWith(expect.any(Function), 3000); // Default timeout
  });
  
  test('handles touch drawing events', () => {
    render(<CanvasInput onDetect={mockOnDetect} />);
    const canvasElement = screen.getByRole('graphics-canvas');
    
    // Mock getBoundingClientRect for touch events
    const mockGetBoundingClientRect = jest.fn(() => ({ left: 0, top: 0, width: 400, height: 300, right: 400, bottom: 300, x:0, y:0, toJSON: () => {} }));
    HTMLCanvasElement.prototype.getBoundingClientRect = mockGetBoundingClientRect;

    fireEvent.touchStart(canvasElement, { touches: [{ clientX: 10, clientY: 10 }] });
    expect(mockGetContext).toHaveBeenCalledWith('2d', { willReadFrequently: true });
    expect(mockBeginPath).toHaveBeenCalled();
    expect(mockMoveTo).toHaveBeenCalledWith(10, 10); // Assuming rect.left and rect.top are 0

    fireEvent.touchMove(canvasElement, { touches: [{ clientX: 20, clientY: 20 }] });
    expect(mockLineTo).toHaveBeenCalledWith(20, 20);
    expect(mockStroke).toHaveBeenCalled();

    fireEvent.touchEnd(canvasElement);
    expect(setTimeout).toHaveBeenCalledTimes(1);
    expect(setTimeout).toHaveBeenLastCalledWith(expect.any(Function), 3000);
  });


  test('triggers Tesseract OCR after drawing and calls onDetect', async () => {
    render(<CanvasInput onDetect={mockOnDetect} ocrService="tesseract" />);
    const canvasElement = screen.getByRole('graphics-canvas');

    fireEvent.mouseDown(canvasElement, { nativeEvent: { offsetX: 10, offsetY: 10 } });
    fireEvent.mouseMove(canvasElement, { nativeEvent: { offsetX: 20, offsetY: 20 } });
    fireEvent.mouseUp(canvasElement);

    await act(async () => {
      jest.advanceTimersByTime(3000); // Advance timer for detectText
    });
    
    expect(preProcessImage).toHaveBeenCalledWith(canvasElement);
    expect(mockTesseractWorker.setParameters).toHaveBeenCalledWith(expect.any(Object));
    expect(mockTesseractWorker.recognize).toHaveBeenCalledWith(new Blob(['processed-blob']));
    expect(mockOnDetect).toHaveBeenCalledWith('Tesseract Text');
    expect(mockClearRect).toHaveBeenCalled(); // Check if canvas is cleared
  });

  test('triggers Google Vision OCR after drawing and calls onDetect', async () => {
    (performGoogleVisionOCR as jest.Mock).mockResolvedValueOnce('Google Vision Text');
    render(
      <CanvasInput
        onDetect={mockOnDetect}
        ocrService="googleVision"
        googleVisionApiKey="test-key"
      />
    );
    const canvasElement = screen.getByRole('graphics-canvas');

    fireEvent.mouseDown(canvasElement, { nativeEvent: { offsetX: 10, offsetY: 10 } });
    fireEvent.mouseMove(canvasElement, { nativeEvent: { offsetX: 20, offsetY: 20 } });
    fireEvent.mouseUp(canvasElement);
    
    await act(async () => {
      jest.advanceTimersByTime(3000);
    });

    expect(HTMLCanvasElement.prototype.toDataURL).toHaveBeenCalledWith('image/png');
    expect(performGoogleVisionOCR).toHaveBeenCalledWith('mocked-base64-data', 'test-key');
    expect(mockOnDetect).toHaveBeenCalledWith('Google Vision Text');
    expect(mockClearRect).toHaveBeenCalled();
  });

  test('logs error and does not attempt Google Vision OCR if API key is missing', async () => {
    render(<CanvasInput onDetect={mockOnDetect} ocrService="googleVision" />); // No API key
    const canvasElement = screen.getByRole('graphics-canvas');

    fireEvent.mouseDown(canvasElement, { nativeEvent: { offsetX: 10, offsetY: 10 } });
    fireEvent.mouseUp(canvasElement);

    await act(async () => {
      jest.advanceTimersByTime(3000);
    });
    
    expect(console.error).toHaveBeenCalledWith("Google Vision API key is required for 'googleVision' service.");
    expect(performGoogleVisionOCR).not.toHaveBeenCalled();
    expect(mockOnDetect).not.toHaveBeenCalled();
  });

  test('handleClear clears the canvas', () => {
    render(<CanvasInput onDetect={mockOnDetect} />);
    const canvasElement = screen.getByRole('graphics-canvas');

    // Simulate some drawing
    fireEvent.mouseDown(canvasElement, { nativeEvent: { offsetX: 10, offsetY: 10 } });
    fireEvent.mouseUp(canvasElement);
    
    // Manually call detectText which then calls handleClear or call handleClear directly if possible
    // For this test, let's assume detectText is called and it completes, then calls handleClear
    // Or, if there's a clear button, we'd click that. Here, we'll call handleClear via OCR completion.
    
    act(() => {
      jest.advanceTimersByTime(3000); // Trigger OCR
    });
    
    // Assuming OCR process calls handleClear
    expect(mockClearRect).toHaveBeenCalled();
  });
  
  test('shows loading indicator during OCR processing', async () => {
    (preProcessImage as jest.Mock).mockReturnValue(new Promise(resolve => setTimeout(() => resolve(new Blob(['processed-blob'])), 100))); // delay preProcess
    render(<CanvasInput onDetect={mockOnDetect} ocrService="tesseract" loadingContent={<div>OCR In Progress...</div>}/>);
    const canvasElement = screen.getByRole('graphics-canvas');

    fireEvent.mouseDown(canvasElement, { nativeEvent: { offsetX: 10, offsetY: 10 } });
    fireEvent.mouseUp(canvasElement);

    act(() => {
      jest.advanceTimersByTime(3000); // Trigger detectText
    });
    
    // Loading state should be active immediately after detectText is called
    // We might need to wait for the state update that sets loading to true
    expect(screen.getByText('OCR In Progress...')).toBeInTheDocument();

    await act(async () => {
      jest.advanceTimersByTime(100); // Advance timer for preProcessImage
    });
    // After processing, loading should be false
    // Depending on timing and how loading state is managed, this might need adjustment
    // or checking for absence of loading indicator after onDetect is called.
    expect(mockOnDetect).toHaveBeenCalled(); // Ensure OCR completed
    expect(screen.queryByText('OCR In Progress...')).not.toBeInTheDocument();
  });

});

// Add a dummy role to canvas for easier selection in tests, if not already present
// This is because 'canvas' is not a standard ARIA role.
// Consider adding data-testid="canvas-input" to the canvas in the component for robust selection.
// For now, we'll assume a role is assigned or use a more generic selector if needed.
// In the tests above, I've used getByRole('graphics-canvas') which is a common, though not standard, role.
// If this fails, use screen.getByTestId('your-canvas-testid') after adding the test ID.

beforeAll(() => {
    // Add a role to the canvas prototype for testing purposes
    // This is a bit of a hack, ideally use data-testid
    Object.defineProperty(HTMLCanvasElement.prototype, 'role', {
        get() { return 'graphics-canvas'; },
        configurable: true,
    });
});
