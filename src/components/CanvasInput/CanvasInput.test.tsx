/**
 * Unit tests for the CanvasInput component
 * 
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import CanvasInput from './CanvasInput';
import { useOCR } from '../../hooks/useOCR';

// Mock the useOCR hook
jest.mock('../../hooks/useOCR');

describe('CanvasInput Component', () => {
  const mockPerformOCR = jest.fn();
  const mockOnDetect = jest.fn();
  
  // Mock canvas methods
  const mockContext = {
    clearRect: jest.fn(),
    beginPath: jest.fn(),
    moveTo: jest.fn(),
    lineTo: jest.fn(),
    stroke: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();

    // Mock useOCR hook
    (useOCR as jest.Mock).mockReturnValue({
      performOCR: mockPerformOCR,
      isOCRPending: false,
      detectedText: '',
      error: null,
    });

    // Mock canvas getContext
    HTMLCanvasElement.prototype.getContext = jest.fn(() => mockContext as any);
    
    // Mock toBlob
    HTMLCanvasElement.prototype.toBlob = jest.fn(function(callback) {
      const blob = new Blob(['fake-image-data'], { type: 'image/png' });
      callback(blob);
    });
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  /**
   * 1. RENDERING
   * Verifies the component renders with correct structure
   */
  it('should render canvas with correct attributes', () => {
    render(<CanvasInput onDetect={mockOnDetect} />);

    const canvas = screen.getByTestId('canvas-element');
    expect(canvas).toBeInTheDocument();
    expect(canvas).toHaveAttribute('role', 'img');
    expect(canvas).toHaveAttribute('tabIndex', '0');
  });

  /**
   * 2. DRAWING WITH MOUSE
   * Tests basic drawing functionality with mouse events
   */
  it('should handle mouse drawing', () => {
    render(<CanvasInput onDetect={mockOnDetect} />);
    
    const canvas = screen.getByTestId('canvas-element');

    // Start drawing
    fireEvent.mouseDown(canvas, { nativeEvent: { offsetX: 10, offsetY: 10 } });
    expect(mockContext.beginPath).toHaveBeenCalled();
    expect(mockContext.moveTo).toHaveBeenCalled();

    // Draw a line
    fireEvent.mouseMove(canvas, { nativeEvent: { offsetX: 20, offsetY: 20 } });
    expect(mockContext.lineTo).toHaveBeenCalled();
    expect(mockContext.stroke).toHaveBeenCalled();

    // Stop drawing
    fireEvent.mouseUp(canvas);
  });

  /**
   * 3. TOUCH EVENTS
   * Tests drawing with touch for mobile devices
   */
  it('should handle touch drawing', () => {
    render(<CanvasInput onDetect={mockOnDetect} />);
    
    const canvas = screen.getByTestId('canvas-element');

    // Mock getBoundingClientRect for touch coordinate calculation
    canvas.getBoundingClientRect = jest.fn(() => ({
      left: 0,
      top: 0,
      width: 400,
      height: 300,
      right: 400,
      bottom: 300,
      x: 0,
      y: 0,
      toJSON: () => {},
    }));

    const touchStart = {
      touches: [{ clientX: 50, clientY: 50 }],
      preventDefault: jest.fn(),
    };

    const touchMove = {
      touches: [{ clientX: 60, clientY: 60 }],
      preventDefault: jest.fn(),
    };

    fireEvent.touchStart(canvas, touchStart);
    expect(mockContext.beginPath).toHaveBeenCalled();

    fireEvent.touchMove(canvas, touchMove);
    expect(mockContext.stroke).toHaveBeenCalled();

    fireEvent.touchEnd(canvas);
  });

  /**
   * 4. AUTO OCR TRIGGER
   * Tests that OCR is triggered after drawing stops (with timeout)
   */
  it('should trigger OCR after drawing timeout', async () => {
    const mockFile = new File(['fake'], 'canvas-image.png', { type: 'image/png' });
    global.File = jest.fn(() => mockFile) as any;

    render(<CanvasInput onDetect={mockOnDetect} timeout={2} />);
    
    const canvas = screen.getByTestId('canvas-element');

    // Mock getBoundingClientRect
    canvas.getBoundingClientRect = jest.fn(() => ({
      left: 0,
      top: 0,
      width: 400,
      height: 300,
      right: 400,
      bottom: 300,
      x: 0,
      y: 0,
      toJSON: () => {},
    }));

    // Draw something
    fireEvent.mouseDown(canvas, { nativeEvent: { offsetX: 10, offsetY: 10 } });
    fireEvent.mouseMove(canvas, { nativeEvent: { offsetX: 20, offsetY: 20 } });
    fireEvent.mouseUp(canvas);

    // Wait for timeout (2 seconds)
    jest.advanceTimersByTime(2000);

    await waitFor(() => {
      expect(mockPerformOCR).toHaveBeenCalled();
    });
  });

  /**
   * 5. CANVAS CLEARING
   * Verifies canvas is cleared after OCR completes
   */
  it('should clear canvas after OCR', async () => {
    render(<CanvasInput onDetect={mockOnDetect} timeout={1} />);
    
    const canvas = screen.getByTestId('canvas-element');

    // Mock getBoundingClientRect
    canvas.getBoundingClientRect = jest.fn(() => ({
      left: 0,
      top: 0,
      width: 400,
      height: 300,
      right: 400,
      bottom: 300,
      x: 0,
      y: 0,
      toJSON: () => {},
    }));

    // Draw and trigger OCR
    fireEvent.mouseDown(canvas, { nativeEvent: { offsetX: 10, offsetY: 10 } });
    fireEvent.mouseMove(canvas, { nativeEvent: { offsetX: 20, offsetY: 20 } });
    fireEvent.mouseUp(canvas);

    jest.advanceTimersByTime(1000);

    await waitFor(() => {
      expect(mockContext.clearRect).toHaveBeenCalled();
    });
  });

  /**
   * 6. ONDETECT CALLBACK
   * Tests that onDetect is called when text is detected
   */
  it('should call onDetect when text is detected', async () => {
    // Mock useOCR to return detected text
    (useOCR as jest.Mock).mockReturnValue({
      performOCR: mockPerformOCR,
      isOCRPending: false,
      detectedText: 'Hello World',
      error: null,
    });

    render(<CanvasInput onDetect={mockOnDetect} />);

    await waitFor(() => {
      expect(mockOnDetect).toHaveBeenCalledWith('Hello World');
    });
  });

  /**
   * 7. LOADING STATE
   * Verifies loading indicator is shown during OCR processing
   */
  it('should show loading indicator when OCR is pending', () => {
    (useOCR as jest.Mock).mockReturnValue({
      performOCR: mockPerformOCR,
      isOCRPending: true,
      detectedText: '',
      error: null,
    });

    render(<CanvasInput onDetect={mockOnDetect} />);

    expect(screen.getByText('Please Wait...')).toBeInTheDocument();
    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  /**
   * 8. CUSTOM LOADING CONTENT
   * Tests custom loading indicator
   */
  it('should render custom loading content', () => {
    (useOCR as jest.Mock).mockReturnValue({
      performOCR: mockPerformOCR,
      isOCRPending: true,
      detectedText: '',
      error: null,
    });

    render(
      <CanvasInput 
        onDetect={mockOnDetect} 
        loadingContent={<div>Custom Loading...</div>}
      />
    );

    expect(screen.getByText('Custom Loading...')).toBeInTheDocument();
  });
});
