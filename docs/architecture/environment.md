# Environment Strategy

- Each app owns its .env.example in apps/<app>.
- Shared defaults live in the root .env.example.
- Public web variables use the NEXT*PUBLIC* prefix.
- Do not commit real secrets.
