import { NextRequest } from 'next/server';
import { ApiResponse } from '@/lib/api-responses';
import { FileUtils } from '@/lib/file-utils';
import mammoth from 'mammoth';
import { promises as fs } from 'fs';
import path from 'path';
import { randomUUID } from 'crypto';

// Dynamic import for pdf2json
const getPdf2Json = async () => {
  const PDF2Json = (await import('pdf2json')).default;
  return PDF2Json;
};

export async function POST(request: NextRequest) {
  let tempFilePath: string | null = null;
  
  try {
    const formData = await request.formData();
    const fileResult = await FileUtils.processFormDataFile(formData, 'file', {
      maxSizeMB: 5, // Reduced from 10MB for security
      allowedTypes: [
        'application/pdf',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/msword'
      ],
      allowedExtensions: ['pdf', 'docx', 'doc']
    });

    if (!fileResult.success) {
      return ApiResponse.badRequest(fileResult.error);
    }

    const { file } = fileResult;

    console.log('Processing resume file:', file.filename, 'Type:', file.mimeType, 'Size:', file.size);

    const buffer = file.buffer;
    let extractedText = '';

    // Extract text based on file type
    if (file.mimeType === 'application/pdf') {
      try {
        // Create a temporary file for pdf2json (it requires file path)
        const tempDir = path.join(process.cwd(), 'tmp');
        
        // Ensure tmp directory exists
        try {
          await fs.access(tempDir);
        } catch {
          await fs.mkdir(tempDir, { recursive: true });
        }
        
        const tempFileName = `${randomUUID()}.pdf`;
        tempFilePath = path.join(tempDir, tempFileName);
        
        // Write buffer to temporary file
        await fs.writeFile(tempFilePath, buffer);
        
        // Use pdf2json to extract text
        const PDF2Json = await getPdf2Json();
        const pdfParser = new PDF2Json();
        
        // Extract text using promise wrapper
        const pdfData = await new Promise((resolve, reject) => {
          pdfParser.on('pdfParser_dataError', (errData: any) => {
            console.error('PDF parsing error:', errData);
            reject(new Error(errData.parserError || 'PDF parsing failed'));
          });
          
          pdfParser.on('pdfParser_dataReady', (pdfData: any) => {
            resolve(pdfData);
          });
          
          // Load and parse the PDF
          pdfParser.loadPDF(tempFilePath);
        });
        
        // Extract text from parsed data
        if (pdfData && typeof pdfData === 'object' && 'Pages' in pdfData) {
          const pages = (pdfData as any).Pages;
          const textContent: string[] = [];
          
          pages.forEach((page: any) => {
            if (page.Texts) {
              page.Texts.forEach((textObj: any) => {
                if (textObj.R) {
                  textObj.R.forEach((run: any) => {
                    if (run.T) {
                      // Decode URI component to handle special characters
                      const decodedText = decodeURIComponent(run.T);
                      textContent.push(decodedText);
                    }
                  });
                }
              });
            }
          });
          
          extractedText = textContent.join(' ');
        }
        
        console.log('PDF parsed successfully using pdf2json. Text length:', extractedText.length);
        
      } catch (pdfError) {
        console.error('PDF parsing error:', {
          error: pdfError,
          message: pdfError instanceof Error ? pdfError.message : 'Unknown error',
          name: pdfError instanceof Error ? pdfError.name : 'Unknown',
          fileSize: file.size,
          fileName: file.filename
        });
        
        return ApiResponse.internalServerError(
          'Failed to parse PDF. This could be due to the PDF being password-protected, corrupted, image-based (scanned), or using unsupported formatting. Please try a text-based PDF or convert your resume to a Word document.'
        );
        
      } finally {
        // Clean up temporary file
        if (tempFilePath) {
          try {
            await fs.unlink(tempFilePath);
          } catch (cleanupError) {
            console.warn('Failed to clean up temporary file:', cleanupError);
          }
        }
      }
    } else if (file.mimeType.includes('word') || file.mimeType.includes('document')) {
      try {
        const result = await mammoth.extractRawText({ buffer });
        extractedText = result.value;
        
        // Log any warnings from mammoth
        if (result.messages && result.messages.length > 0) {
          console.warn('Document parsing warnings:', result.messages);
        }
        
        console.log('Word document parsed successfully. Text length:', extractedText.length);
        
      } catch (docError) {
        console.error('Document parsing error:', docError);
        return ApiResponse.internalServerError(
          'Failed to parse document. Please ensure the file is not corrupted.'
        );
      }
    }

    // Clean up extracted text
    extractedText = extractedText
      .replace(/\s+/g, ' ') // Replace multiple spaces with single space
      .replace(/\n{3,}/g, '\n\n') // Replace multiple newlines with double newline
      .trim();

    // Validate extracted text
    if (!extractedText || extractedText.length < 50) {
      console.log('Insufficient text extracted. Length:', extractedText.length);
      console.log('First 200 chars:', extractedText.substring(0, 200));
      
      return ApiResponse.badRequest(
        'Could not extract sufficient readable text from the file. This may indicate the PDF is image-based (scanned), password-protected, or uses complex formatting. For best results, please use a text-based PDF or Word document.'
      );
    }

    console.log('Successfully extracted text. Length:', extractedText.length, 'Words:', extractedText.split(/\s+/).length);

    return ApiResponse.success({
      text: extractedText,
      filename: file.filename,
      wordCount: extractedText.split(/\s+/).length,
      success: true
    });

  } catch (error) {
    console.error('Resume extraction error:', {
      error,
      message: error instanceof Error ? error.message : 'Unknown error',
      name: error instanceof Error ? error.name : 'Unknown',
      stack: error instanceof Error ? error.stack : undefined
    });
    
    return ApiResponse.internalServerError(
      'Failed to process resume file. Please try a different file format or ensure the file is not corrupted.'
    );
    
  } finally {
    // Ensure temporary file cleanup
    if (tempFilePath) {
      try {
        await fs.unlink(tempFilePath);
      } catch (cleanupError) {
        console.warn('Final cleanup failed:', cleanupError);
      }
    }
  }
}