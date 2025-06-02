import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@deepgram/sdk';

const deepgram = createClient(process.env.DEEPGRAM_API_KEY!);

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const audioFile = formData.get('audio') as File;
    
    if (!audioFile) {
      return NextResponse.json({ error: 'No audio file provided' }, { status: 400 });
    }

    console.log('Processing audio file:', audioFile.name, 'Size:', audioFile.size);

    // Convert file to buffer
    const arrayBuffer = await audioFile.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Transcribe with Deepgram
    const { result, error } = await deepgram.listen.prerecorded.transcribeFile(
      buffer,
      {
        model: 'nova-2',
        language: 'en-US',
        punctuate: true,
        diarize: false,
        smart_format: true,
      }
    );

    if (error) {
      console.error('Deepgram error:', error);
      return NextResponse.json({ error: 'Transcription failed' }, { status: 500 });
    }

    const transcript = result?.results?.channels?.[0]?.alternatives?.[0]?.transcript || '';
    
    console.log('Transcription successful:', transcript.substring(0, 100) + '...');
    
    return NextResponse.json({ 
      transcript,
      success: true 
    });

  } catch (error) {
    console.error('Transcription error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}