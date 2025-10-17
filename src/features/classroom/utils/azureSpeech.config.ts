import * as SpeechSDK from 'microsoft-cognitiveservices-speech-sdk'

export function checkAzureSpeechSDK() {
  try {
    // console.log('Checking Azure Speech SDK availability...')
    
    if (!SpeechSDK) {
      throw new Error('Azure Speech SDK chưa được import')
    }
    
    const components = {
      hasSpeechConfig: typeof SpeechSDK.SpeechConfig === 'function',
      hasSpeechSynthesizer: typeof SpeechSDK.SpeechSynthesizer === 'function',
      hasAudioConfig: typeof SpeechSDK.AudioConfig === 'function',
      hasResultReason: typeof SpeechSDK.ResultReason === 'object',
    }
    
    const missingComponents = Object.entries(components)
      .filter(([_, exists]) => !exists)
      .map(([name]) => name)
    
    if (missingComponents.length > 0) {
      throw new Error(`Azure Speech SDK thiếu các thành phần: ${missingComponents.join(', ')}`)
    }
    
    // console.log('Azure Speech SDK availability check passed!')
    
    return {
      isAvailable: true,
      sdk: SpeechSDK,
      error: null
    }
  } catch (error) {
    console.error('Azure Speech SDK check failed:', error)
    return {
      isAvailable: false,
      sdk: null,
      error: error instanceof Error ? error.message : 'Unknown error checking Azure Speech SDK'
    }
  }
}

export function createAzureSpeechConfig(key?: string, region?: string) {
  try {
    const apiKey = key || import.meta.env.VITE_AZURE_SPEECH_KEY
    const apiRegion = region || import.meta.env.VITE_AZURE_SPEECH_REGION
    
    if (!apiKey || !apiRegion) {
      throw new Error('Missing Azure Speech API key or region')
    }
    
    const config = SpeechSDK.SpeechConfig.fromSubscription(apiKey, apiRegion)
    
    config.speechSynthesisLanguage = 'vi-VN'
    config.speechSynthesisVoiceName = 'vi-VN-HoaiMyNeural'
    
    return config
  } catch (error) {
    console.error('Error creating Azure Speech config:', error)
    return null
  }
}

export const sdkStatus = checkAzureSpeechSDK()