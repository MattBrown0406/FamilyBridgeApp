# FamilyBridge Supabase Functions

## AI model override

FIIS-related edge functions now read the model from environment variables instead of hardcoding it.

Set one of these in Lovable/Supabase function secrets:

- `FIIS_AI_MODEL` - preferred override for FIIS and related recovery coaching/document-analysis functions
- `FAMILYBRIDGE_AI_MODEL` - optional broader fallback if `FIIS_AI_MODEL` is unset

If neither is set, functions keep the current default:

- `google/gemini-3-flash-preview`
