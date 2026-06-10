# FamilyBridge ASC Build Notes — 2026-06-09

Use these notes for the next App Store Connect build metadata / review notes.

## User-facing changes

- Family Dashboard document uploads now support Apple iWork files:
  - Apple Pages (`.pages`)
  - Apple Numbers (`.numbers`)
  - Existing supported formats remain supported: PDF, DOC/DOCX, TXT, PNG/JPG/JPEG
- Provider / moderator document uploads now support the same Apple Pages and Numbers files.
- Family chat notification coverage has been expanded so moderators/providers assigned to a family's caseload receive message notifications when a family member posts in chat.
- Completed native push notification support for installed iOS/Android apps using Firebase Cloud Messaging, enabling closed/background app alerts after Firebase/APNs credentials and a new ASC build are configured.

## Technical / reviewer-facing notes

- Document upload MIME handling now includes Apple iWork fallback MIME types for iOS/Safari cases where `File.type` is empty.
- Family chat message notification trigger now includes:
  - direct family members
  - family admins/moderators/co-moderators
  - organization owners/admins/staff tied to the family's provider organization
  - active temporary moderator assignments
  - active paid moderator assignments
  - active co-moderator transfer/co-care relationships
- Notification trigger cleanup keeps one push trigger on notification rows to avoid double-sending browser/web pushes.

## ASC build requirement

- The Apple Pages / Numbers upload UI change requires a new iOS build because FamilyBridge bundles web assets into the Capacitor app.
- The database-side caseload notification trigger can ship server-side without a new binary once the Supabase migration is applied.
- True native iOS push notifications while the installed app is closed/backgrounded still require native push/APNS/FCM wiring and a new ASC build. Current codebase primarily has web push + in-app notification support.
