export interface FileValidationOptions {
  maxSizeMB?: number
  allowedTypes?: string[]
  allowedExtensions?: string[]
}

export interface ProcessedFile {
  buffer: Buffer
  filename: string
  mimeType: string
  size: number
}

export class FileUtils {
  static async processFormDataFile(
    formData: FormData, 
    fieldName: string,
    options: FileValidationOptions = {}
  ): Promise<{ success: true; file: ProcessedFile } | { success: false; error: string }> {
    const file = formData.get(fieldName) as File | null
    
    if (!file) {
      return { success: false, error: `No ${fieldName} provided` }
    }

    // Validate file size
    const maxSize = (options.maxSizeMB || 10) * 1024 * 1024 // Default 10MB
    if (file.size > maxSize) {
      return { 
        success: false, 
        error: `File size exceeds ${options.maxSizeMB || 10}MB limit` 
      }
    }

    // Validate file type
    if (options.allowedTypes && !options.allowedTypes.includes(file.type)) {
      return { 
        success: false, 
        error: `Invalid file type. Allowed types: ${options.allowedTypes.join(', ')}` 
      }
    }

    // Validate file extension
    if (options.allowedExtensions) {
      const extension = file.name.split('.').pop()?.toLowerCase()
      if (!extension || !options.allowedExtensions.includes(extension)) {
        return { 
          success: false, 
          error: `Invalid file extension. Allowed extensions: ${options.allowedExtensions.join(', ')}` 
        }
      }
    }

    try {
      const arrayBuffer = await file.arrayBuffer()
      const buffer = Buffer.from(arrayBuffer)
      
      return {
        success: true,
        file: {
          buffer,
          filename: file.name,
          mimeType: file.type,
          size: file.size
        }
      }
    } catch (error) {
      return { 
        success: false, 
        error: 'Failed to process file' 
      }
    }
  }

  static isValidURL(url: string): boolean {
    try {
      const urlObj = new URL(url)
      return urlObj.protocol === 'http:' || urlObj.protocol === 'https:'
    } catch {
      return false
    }
  }

  static getFileExtension(filename: string): string {
    return filename.split('.').pop()?.toLowerCase() || ''
  }

  static getMimeTypeFromExtension(extension: string): string {
    const mimeTypes: Record<string, string> = {
      'pdf': 'application/pdf',
      'doc': 'application/msword',
      'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'txt': 'text/plain',
      'jpg': 'image/jpeg',
      'jpeg': 'image/jpeg',
      'png': 'image/png',
      'gif': 'image/gif',
      'webp': 'image/webp',
      'mp3': 'audio/mpeg',
      'wav': 'audio/wav',
      'mp4': 'video/mp4',
      'webm': 'video/webm'
    }
    
    return mimeTypes[extension] || 'application/octet-stream'
  }
}