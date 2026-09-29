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

Payment callbacks use a per-order HMAC in the Cacofy POST webhook URL, validated before updating orders; this prevents arbitrary public requests from approving payments when the provider supplies no documented callback signature.
Keep card checkout disabled until a real card processor exists; the inherited card flow simulated approval without collecting payment.
