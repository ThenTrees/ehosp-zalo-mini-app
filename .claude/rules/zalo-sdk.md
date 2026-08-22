# Zalo SDK surface

`zmp-sdk` is used in exactly three places — keep it that way and route any new SDK usage through a clearly owned module rather than scattering imports:

- `getUserInfo` — `src/state.ts`
- `chooseImage` — `src/components/form/textarea-with-image-upload.tsx`
- `openChat` — `src/pages/services/index.tsx` (opens the OA chat; the OA is `template.oaID` in `app-config.json`)
