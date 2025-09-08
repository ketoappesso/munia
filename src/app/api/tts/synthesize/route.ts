import { NextRequest, NextResponse } from 'next/server';
import { createVolcengineTTSClient, CHINESE_VOICES } from '@/lib/volcengine/tts-client';
import { z } from 'zod';
import { auth } from '@/auth';

// Validation schema
const synthesizeSchema = z.object({
  text: z.string().min(1).max(5000), // Max 5000 characters
  voice: z.string().optional(), // Allow any voice ID including custom ones like S_r3YGBCoB1
  speed: z.number().min(0.5).max(2.0).optional(),
  volume: z.number().min(0).max(2.0).optional(),
  pitch: z.number().min(0.5).max(2.0).optional(),
  encoding: z.enum(['mp3', 'wav']).optional(),
});

// Simple in-memory cache for frequently requested text
const ttsCache = new Map<string, { data: string; timestamp: number }>();
const CACHE_TTL = 1000 * 60 * 60; // 1 hour

// Generate cache key
function getCacheKey(text: string, voice?: string, speed?: number): string {
  return `${text.slice(0, 100)}_${voice || 'BV001'}_${speed || 1.0}`;
}

// Clean old cache entries
function cleanCache() {
  const now = Date.now();
  for (const [key, value] of ttsCache.entries()) {
    if (now - value.timestamp > CACHE_TTL) {
      ttsCache.delete(key);
    }
  }
}

export async function POST(request: NextRequest) {
  try {
    // Check authentication (optional - remove if you want public access)
    // Temporarily disabled for testing
    // const session = await auth();
    // if (!session?.user) {
    //   return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    // }

    // Parse and validate request body
    const body = await request.json();
    const validation = synthesizeSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid request data', details: validation.error.issues },
        { status: 400 }
      );
    }

    const { text, voice, speed, volume, pitch, encoding } = validation.data;

    // Check cache first
    const cacheKey = getCacheKey(text, voice, speed);
    const cached = ttsCache.get(cacheKey);
    
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      console.log('Returning cached TTS audio for:', text.slice(0, 50));
      return NextResponse.json({
        success: true,
        audio: cached.data,
        cached: true,
      });
    }

    // Clean cache periodically
    if (ttsCache.size > 100) {
      cleanCache();
    }

    // Create TTS client
    const ttsClient = createVolcengineTTSClient();

    // Check if TTS service is configured
    if (!ttsClient.isConfigured()) {
      console.warn('Volcengine TTS not configured, returning fallback response');
      return NextResponse.json({
        success: false,
        error: 'TTS service not configured',
        fallback: true,
      });
    }

    // Synthesize speech
    // For custom voices (S_xxxxx), pass directly; for standard voices, use the constant
    const voiceId = voice && voice.startsWith('S_') 
      ? voice 
      : (voice ? `${voice}_streaming` : CHINESE_VOICES.BV001);
    
    console.log('Synthesizing TTS with params:', {
      text: text.slice(0, 50) + '...',
      voiceId,
      speed: speed || 1.0,
      volume: volume || 1.0,
      pitch: pitch || 1.0,
      encoding: encoding || 'mp3',
    });
    
    const audioBase64 = await ttsClient.synthesizeToBase64({
      text,
      voiceType: voiceId,
      speed: speed || 1.0,
      volume: volume || 1.0,
      pitch: pitch || 1.0,
      encoding: encoding || 'mp3',
    });

    if (!audioBase64) {
      console.error('TTS synthesis failed - no audio data returned');
      return NextResponse.json(
        { 
          success: false,
          error: 'Failed to synthesize speech',
          fallback: true 
        },
        { status: 500 }
      );
    }

    // Cache the result
    ttsCache.set(cacheKey, {
      data: audioBase64,
      timestamp: Date.now(),
    });

    // Return audio data
    return NextResponse.json({
      success: true,
      audio: audioBase64,
      cached: false,
      duration: ttsClient.estimateDuration(text, speed || 1.0),
    });

  } catch (error) {
    console.error('Error in TTS synthesis:', error);
    return NextResponse.json(
      { 
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error',
        fallback: true
      },
      { status: 500 }
    );
  }
}

// GET endpoint to check TTS service status
export async function GET(request: NextRequest) {
  try {
    const ttsClient = createVolcengineTTSClient();
    
    return NextResponse.json({
      configured: ttsClient.isConfigured(),
      voices: Object.keys(CHINESE_VOICES),
      cacheSize: ttsCache.size,
    });

  } catch (error) {
    console.error('Error checking TTS status:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}