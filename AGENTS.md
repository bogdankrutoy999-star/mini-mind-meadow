<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

- Chat AI calls use Google's native HTTPS streaming API through /api/chat; read GEMINI_API_KEY only inside server handlers, never fall back to Lovable AI. Chat threads remain in browser localStorage (src/lib/chat-store.ts).
- Translate Google SSE into Mini events in src/lib/gemini.ts so provider errors, completion and cancellation are explicit without redesigning the existing chat UI.
- Build chat requests with the shared request factory on every server call so the runtime UTC date and Google Search availability stay consistent and testable.
- Treat explicit chat cancellation as HTTP 499 before streaming and clean EOF during streaming so Stop and disconnects never become server crashes.
