# FamilyBridge Supabase Functions

## AI providers

AI edge functions call provider APIs directly (no Lovable AI gateway).

- **Claude Haiku 4.5** (Anthropic) — used for coaching, chat, emotional analysis,
  document analysis, health scoring, and communication helpers. Requires the
  `ANTHROPIC_API_KEY` secret. Endpoint: `https://api.anthropic.com/v1/messages`.
- **Gemini 2.5 Flash** (Google AI) — used for image / screenshot analysis only
  (`analyze-image-clarity`, `analyze-medication-label`, `screenshot-coaching`).
  Requires the `GOOGLE_AI_API_KEY` secret. Endpoint:
  `https://generativelanguage.googleapis.com/v1beta/openai/chat/completions`.
