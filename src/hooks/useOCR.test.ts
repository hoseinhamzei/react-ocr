/**
 * Unit tests for the useOCR hook
 * 
 */

import { renderHook, waitFor } from '@testing-library/react';
import { useOCR, CustomOCRHandler } from './useOCR';
import { createWorker, OEM } from 'tesseract.js';
import { performTesseractOcr } from '../utils/ocr/tesseract';
import { performGroqOcr } from '../utils/ocr/groq';

// Mock external dependencies to isolate the hook's logic
jest.mock('tesseract.js');
jest.mock('../utils/ocr/tesseract');
jest.mock('../utils/ocr/groq');

describe('useOCR Hook', () => {
  const mockWorker = {
    terminate: jest.fn().mockResolvedValue(undefined),
  };

  // Mock FileReader for all tests - prevents actual file operations
  const setupFileReader = (base64Data = 'mockBase64Data') => {
    const mockFileReader = {
      readAsDataURL: jest.fn(function(this: FileReader) {
        setTimeout(() => {
          // @ts-ignore
          this.result = `data:image/png;base64,${base64Data}`;
          this.onload?.({} as ProgressEvent<FileReader>);
        }, 0);
      }),
    };
    global.FileReader = jest.fn(() => mockFileReader) as any;
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (createWorker as jest.Mock).mockResolvedValue(mockWorker);
    setupFileReader();
  });

  /**
   * 1. INITIALIZATION
   *  Verifies the hook returns the correct interface with default values
   */
  it('should initialize with default values', () => {
    const { result } = renderHook(() => useOCR({}));

    expect(result.current.performOCR).toBeInstanceOf(Function);
    expect(result.current.isOCRPending).toBe(false);
    expect(result.current.detectedText).toBe('');
    expect(result.current.error).toBe(null);
  });

  /**
   * 2. WORKER LIFECYCLE
   * Tests that the Tesseract worker is created and properly cleaned up
   */
  it('should create and terminate Tesseract worker', async () => {
    const { unmount } = renderHook(() => useOCR({ ocrService: 'tesseract' }));

    expect(createWorker).toHaveBeenCalledWith('eng', OEM.TESSERACT_LSTM_COMBINED);

    unmount();

    await waitFor(() => expect(mockWorker.terminate).toHaveBeenCalled());
  });

  /**
   * 3. TESSERACT OCR
   * Tests basic OCR functionality with Tesseract
   */
  it('should perform OCR using Tesseract', async () => {
    const mockText = 'Detected text';
    (performTesseractOcr as jest.Mock).mockResolvedValue(mockText);

    const { result } = renderHook(() => useOCR({ ocrService: 'tesseract' }));
    const mockFile = new File(['dummy'], 'test.png', { type: 'image/png' });

    await result.current.performOCR(mockFile);

    await waitFor(() => {
      expect(result.current.detectedText).toBe(mockText);
      expect(result.current.isOCRPending).toBe(false);
    });

    expect(performTesseractOcr).toHaveBeenCalled();
  });

  /**
   * 4. GROQ SERVICE
   * Tests cloud-based OCR with Groq API
   */
  it('should perform OCR using Groq API', async () => {
    const mockText = 'Groq detected text';
    (performGroqOcr as jest.Mock).mockResolvedValue(mockText);

    const { result } = renderHook(() => 
      useOCR({ ocrService: 'groq', groqApiKey: 'test-key' })
    );

    const mockFile = new File(['dummy'], 'test.png', { type: 'image/png' });
    await result.current.performOCR(mockFile);

    await waitFor(() => {
      expect(result.current.detectedText).toBe(mockText);
      expect(performGroqOcr).toHaveBeenCalledWith('test-key', 'mockBase64Data');
    });
  });

  /**
   * 5. CUSTOM HANDLER
   * Tests extensibility - users can provide their own OCR implementation
   */
  it('should use custom OCR handler', async () => {
    const mockCustomHandler: CustomOCRHandler = jest.fn().mockResolvedValue('Custom result');

    const { result } = renderHook(() => 
      useOCR({ ocrService: 'custom', customOCRHandler: mockCustomHandler })
    );

    const mockFile = new File(['dummy'], 'test.png', { type: 'image/png' });
    await result.current.performOCR(mockFile);

    await waitFor(() => {
      expect(result.current.detectedText).toBe('Custom result');
      expect(mockCustomHandler).toHaveBeenCalledWith({
        file: mockFile,
        base64: 'mockBase64Data'
      });
    });
  });

  /**
   * 6. LOADING STATE
   * Verifies isOCRPending flag during processing
   */
  it('should set isOCRPending during processing', async () => {
    (performTesseractOcr as jest.Mock).mockImplementation(
      () => new Promise(resolve => setTimeout(() => resolve('text'), 50))
    );

    const { result } = renderHook(() => useOCR({ ocrService: 'tesseract' }));
    const mockFile = new File(['dummy'], 'test.png', { type: 'image/png' });

    const ocrPromise = result.current.performOCR(mockFile);

    await waitFor(() => expect(result.current.isOCRPending).toBe(true));
    await ocrPromise;
    await waitFor(() => expect(result.current.isOCRPending).toBe(false));
  });

  /**
   * 7. ERROR: MISSING CONFIGURATION
   * Tests error handling when required API key is missing
   */
  it('should handle missing Groq API key', async () => {
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

    const { result } = renderHook(() => useOCR({ ocrService: 'groq' }));
    const mockFile = new File(['dummy'], 'test.png', { type: 'image/png' });

    await result.current.performOCR(mockFile);

    await waitFor(() => {
      expect(result.current.error?.message).toContain('Groq API key is missing');
      expect(result.current.isOCRPending).toBe(false);
    });

    consoleErrorSpy.mockRestore();
  });

  /**
   * 8. ERROR: OCR FAILURE
   * Tests error handling when OCR processing fails
   */
  it('should handle OCR processing errors', async () => {
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
    const ocrError = new Error('OCR failed');
    (performTesseractOcr as jest.Mock).mockRejectedValue(ocrError);

    const { result } = renderHook(() => useOCR({ ocrService: 'tesseract' }));
    const mockFile = new File(['dummy'], 'test.png', { type: 'image/png' });

    await expect(result.current.performOCR(mockFile)).rejects.toThrow('OCR failed');

    await waitFor(() => {
      expect(result.current.error).toBe(ocrError);
      expect(result.current.isOCRPending).toBe(false);
    });

    consoleErrorSpy.mockRestore();
  });
});
