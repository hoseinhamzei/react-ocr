/**
 * Unit tests for the ImageInput component
 * 
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import ImageInput from './ImageInput';
import { useOCR } from '../../hooks/useOCR';

// Mock the useOCR hook
jest.mock('../../hooks/useOCR');

describe('ImageInput Component', () => {
  const mockPerformOCR = jest.fn();
  const mockOnDetect = jest.fn();
  const mockOnFile = jest.fn();
  const mockOnStartDetecting = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();

    // Mock useOCR hook
    (useOCR as jest.Mock).mockReturnValue({
      performOCR: mockPerformOCR,
      isOCRPending: false,
      detectedText: '',
      error: null,
    });
  });

  /**
   * 1. RENDERING
   * Verifies the component renders with correct structure and accessibility
   */
  it('should render with correct structure and attributes', () => {
    render(<ImageInput onDetect={mockOnDetect} />);

    const container = screen.getByTestId('image-input-container');
    const input = screen.getByTestId('image-input-element');

    expect(container).toBeInTheDocument();
    expect(container).toHaveAttribute('role', 'region');
    expect(container).toHaveAttribute('aria-label', 'Image File Input for OCR');
    
    expect(input).toBeInTheDocument();
    expect(input).toHaveAttribute('type', 'file');
    expect(input).toHaveAttribute('accept', 'image/*');
  });

  /**
   * 2. FILE SELECTION
   * Tests file selection via file input
   * Learning: Mock file input change events with FileList
   */
  it('should handle file selection', async () => {
    render(<ImageInput onDetect={mockOnDetect} onFile={mockOnFile} />);
    
    const input = screen.getByTestId('image-input-element') as HTMLInputElement;
    const file = new File(['dummy content'], 'test.png', { type: 'image/png' });

    // Create a mock FileList
    Object.defineProperty(input, 'files', {
      value: [file],
      configurable: true,
    });

    fireEvent.change(input);

    await waitFor(() => {
      expect(mockOnFile).toHaveBeenCalledWith(file);
      expect(mockPerformOCR).toHaveBeenCalledWith(file);
    });
  });

  /**
   * 3. DRAG AND DROP
   * Tests drag and drop file upload
   */
  it('should handle drag and drop', async () => {
    render(<ImageInput onDetect={mockOnDetect} onFile={mockOnFile} />);
    
    const container = screen.getByTestId('image-input-container');
    const file = new File(['dummy content'], 'dropped.png', { type: 'image/png' });

    const dropEvent = {
      preventDefault: jest.fn(),
      dataTransfer: {
        files: [file],
      },
    };

    fireEvent.drop(container, dropEvent);

    await waitFor(() => {
      expect(mockOnFile).toHaveBeenCalledWith(file);
      expect(mockPerformOCR).toHaveBeenCalledWith(file);
    });
  });

  /**
   * 4. DRAG OVER HANDLING
   * Tests that component handles dragOver event
   */
  it('should handle drag over events', () => {
    render(<ImageInput onDetect={mockOnDetect} />);
    
    const container = screen.getByTestId('image-input-container');

    // Verify the component handles dragOver without errors
    expect(() => {
      fireEvent.dragOver(container);
    }).not.toThrow();
  });

  /**
   * 5. CLICK TO OPEN FILE DIALOG
   * Tests that clicking the container triggers file input click
   */
  it('should open file dialog on click', () => {
    render(<ImageInput onDetect={mockOnDetect} />);
    
    const container = screen.getByTestId('image-input-container');
    const input = screen.getByTestId('image-input-element') as HTMLInputElement;
    
    input.click = jest.fn();

    fireEvent.click(container);

    expect(input.click).toHaveBeenCalled();
  });

  /**
   * 6. ONDETECT CALLBACK
   * Tests that onDetect is called when OCR completes
   */
  it('should call onDetect when text is detected', async () => {
    (useOCR as jest.Mock).mockReturnValue({
      performOCR: mockPerformOCR,
      isOCRPending: false,
      detectedText: 'Detected from image',
      error: null,
    });

    render(<ImageInput onDetect={mockOnDetect} />);

    await waitFor(() => {
      expect(mockOnDetect).toHaveBeenCalledWith('Detected from image');
    });
  });

  /**
   * 7. START DETECTING CALLBACK
   * Tests onStartDetecting callback is triggered
   */
  it('should call onStartDetecting when processing starts', async () => {
    render(
      <ImageInput 
        onDetect={mockOnDetect}
        onStartDetecting={mockOnStartDetecting}
      />
    );
    
    const input = screen.getByTestId('image-input-element') as HTMLInputElement;
    const file = new File(['content'], 'test.png', { type: 'image/png' });

    Object.defineProperty(input, 'files', {
      value: [file],
      configurable: true,
    });

    fireEvent.change(input);

    await waitFor(() => {
      expect(mockOnStartDetecting).toHaveBeenCalled();
    });
  });

  /**
   * 8. LOADING STATE
   * Verifies loading indicator during OCR processing
   */
  it('should show loading indicator when OCR is pending', () => {
    (useOCR as jest.Mock).mockReturnValue({
      performOCR: mockPerformOCR,
      isOCRPending: true,
      detectedText: '',
      error: null,
    });

    render(<ImageInput onDetect={mockOnDetect} />);

    expect(screen.getByText('Please Wait...')).toBeInTheDocument();
    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  /**
   * 9. CUSTOM HINT TEXT
   * Tests custom hint text rendering
   */
  it('should render custom hint text', () => {
    const customHint = 'Drop your document here';
    
    render(<ImageInput onDetect={mockOnDetect} hint={customHint} />);

    expect(screen.getByText(customHint)).toBeInTheDocument();
  });

  /**
   * 10. CUSTOM LOADING CONTENT
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
      <ImageInput 
        onDetect={mockOnDetect} 
        loadingContent={<div>Processing image...</div>}
      />
    );

    expect(screen.getByText('Processing image...')).toBeInTheDocument();
  });
});
