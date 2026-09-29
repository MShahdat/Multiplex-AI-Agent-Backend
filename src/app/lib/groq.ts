import { Groq } from 'groq-sdk'
import config from '../config/index.js'
import { ProviderType } from '../../../generated/prisma/enums.js';


export const groqFallback = new Groq({
  apiKey: config.groq_api_key
})

export const MODEL_ALLOWED = [
  { name: "Qwen 3.8-27B", model: "qwen/qwen3.8-27b", type: ProviderType.GROQ, isPremium: false },
  { name: 'OpenAi GPT 120b', model: "openai/gpt-oss-120b", type: ProviderType.GROQ, isPremium: false },
  { name: "OpenAi GPT 20b", model: "openai/gpt-oss-20b", type: ProviderType.GROQ, isPremium: false },
  { name: "OpenAi GPT Safeguard", model: "openai/gpt-oss-safeguard-20b", type: ProviderType.GROQ, isPremium: true }
];



