import { NextRequest, NextResponse } from 'next/server';
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
    const file = formData.get('file') as File;
    
    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // Validate file type
    const validTypes = [
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/msword'
    ];
    
    if (!validTypes.includes(file.type)) {
      return NextResponse.json({ 
        error: 'Invalid file type. Please upload PDF, DOC, or DOCX.' 
      }, { status: 400 });
    }

    // File size limit (10MB - increased for better compatibility)
    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      return NextResponse.json({ 
        error: 'File too large. Maximum size is 10MB.' 
      }, { status: 400 });
    }

    console.log('Processing resume file:', file.name, 'Type:', file.type, 'Size:', file.size);

    // Convert file to buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    let extractedText = '';

    // Extract text based on file type
    if (file.type === 'application/pdf') {
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
          fileName: file.name
        });
        
        return NextResponse.json({ 
          error: 'Failed to parse PDF. This could be due to the PDF being password-protected, corrupted, image-based (scanned), or using unsupported formatting. Please try a text-based PDF or convert your resume to a Word document.' 
        }, { status: 500 });
        
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
    } else if (file.type.includes('word') || file.type.includes('document')) {
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
        return NextResponse.json({ 
          error: 'Failed to parse document. Please ensure the file is not corrupted.' 
        }, { status: 500 });
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
      
      return NextResponse.json({ 
        error: 'Could not extract sufficient readable text from the file. This may indicate the PDF is image-based (scanned), password-protected, or uses complex formatting. For best results, please use a text-based PDF or Word document.' 
      }, { status: 400 });
    }

    console.log('Successfully extracted text. Length:', extractedText.length, 'Words:', extractedText.split(/\s+/).length);

    return NextResponse.json({
      text: extractedText,
      filename: file.name,
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
    
    return NextResponse.json({ 
      error: 'Failed to process resume file. Please try a different file format or ensure the file is not corrupted.' 
    }, { status: 500 });
    
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