import Groq from 'groq-sdk'
import config from '../config/index.js'


export const groqFallback = new Groq({
  apiKey: config.groq_api_key
})

export const GROQ_ALLOWED = [
  'llama-3.3-70b-versatile',
  'llama-3.1-8b-instant',
  'openai/gpt-oss-120b'
];

