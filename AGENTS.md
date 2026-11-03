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

- Chat AI calls go through authenticated /api/chat (Lovable AI Gateway, Gemini); keys stay server-side and the handler validates each bearer session.
- Persist conversations in owner-scoped Cloud chat_threads with RLS; never adopt unowned legacy browser chats into an account, to avoid cross-account disclosure.
- Keep app pages under the client-only _authenticated gate; auth, registration and password recovery remain public, with one root auth state subscriber.
