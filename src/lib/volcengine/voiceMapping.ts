// Voice mapping for custom voice IDs based on phone numbers
// These are custom voices trained for specific users

export interface VoiceMapping {
  phoneNumber: string;
  voiceId: string;
  name: string;
  description?: string;
}

// Custom voice mappings for featured users
export const CUSTOM_VOICE_MAPPINGS: VoiceMapping[] = [
  {
    phoneNumber: '18874748888',
    voiceId: 'S_r3YGBCoB1',
    name: '猿素大师兄',
    description: '专属定制语音',
  },
  // Add more custom voice mappings here as needed
];

// Standard voice options for users without custom voices
export const STANDARD_VOICES = {
  BV001: {
    id: 'BV001_streaming',
    name: 'Female Voice',
    nameZh: '女声',
    description: 'Professional female voice',
    descriptionZh: '专业女声',
  },
  BV002: {
    id: 'BV002_streaming',
    name: 'Male Voice',
    nameZh: '男声',
    description: 'Professional male voice',
    descriptionZh: '专业男声',
  },
  BV003: {
    id: 'BV003_streaming',
    name: 'Child Voice',
    nameZh: '童声',
    description: 'Youthful voice',
    descriptionZh: '活泼童声',
  },
  BV004: {
    id: 'BV004_streaming',
    name: 'News Voice',
    nameZh: '新闻播音',
    description: 'Professional news anchor voice',
    descriptionZh: '专业新闻播音',
  },
  BV005: {
    id: 'BV005_streaming',
    name: 'Storytelling Voice',
    nameZh: '故事讲述',
    description: 'Warm storytelling voice',
    descriptionZh: '温暖故事讲述',
  },
};

// Get voice ID for a user based on their phone number or custom voice setting
export function getVoiceForUser(
  phoneNumber?: string | null,
  customVoiceId?: string | null,
  defaultVoice: string = 'BV005_streaming'
): string {
  // First, check if user has a custom voice ID set
  if (customVoiceId) {
    return customVoiceId;
  }

  // Check if phone number matches any custom voice mapping
  if (phoneNumber) {
    const mapping = CUSTOM_VOICE_MAPPINGS.find(
      (m) => m.phoneNumber === phoneNumber
    );
    if (mapping) {
      return mapping.voiceId;
    }
  }

  // Return default voice for users without custom voices
  return defaultVoice;
}

// Check if a voice ID is a custom voice (starts with S_)
export function isCustomVoice(voiceId: string): boolean {
  return voiceId.startsWith('S_');
}

// Get voice display name
export function getVoiceDisplayName(voiceId: string, language: 'en' | 'zh' = 'zh'): string {
  // Check if it's a custom voice
  if (isCustomVoice(voiceId)) {
    const mapping = CUSTOM_VOICE_MAPPINGS.find((m) => m.voiceId === voiceId);
    if (mapping) {
      return mapping.name;
    }
    return language === 'zh' ? '专属语音' : 'Custom Voice';
  }

  // Check standard voices
  const standardVoice = Object.values(STANDARD_VOICES).find((v) => v.id === voiceId);
  if (standardVoice) {
    return language === 'zh' ? standardVoice.nameZh : standardVoice.name;
  }

  return language === 'zh' ? '默认语音' : 'Default Voice';
}