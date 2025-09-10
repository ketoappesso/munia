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
// Currently confirmed working voices with v3 API
export const STANDARD_VOICES = {
  FEMALE_SHUANGKUAI: {
    id: 'zh_female_shuangkuaisisi_moon_bigtts',
    name: 'Shuangkuai Sisi',
    nameZh: '双快思思',
    description: 'Energetic and clear female voice',
    descriptionZh: '活泼清晰女声',
  },
  MALE_AHU: {
    id: 'zh_male_ahu_conversation_wvae_bigtts',
    name: 'Ahu Conversation',
    nameZh: '阿虎对话',
    description: 'Natural conversational male voice',
    descriptionZh: '自然对话男声',
  },
};

// Get voice ID for a user based on their phone number or custom voice setting
export function getVoiceForUser(
  phoneNumber?: string | null,
  customVoiceId?: string | null,
  defaultVoice: string = 'zh_female_shuangkuaisisi_moon_bigtts'
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