# Buffer Canvas

(name is subject to change)

Basically https://github.com/heyman/heynote/ but as a (self-hostable) website.

I really like `heynote`, but I dislike desktop programs.

This is going to be my attempt to implement something like `heynote` as a website, 
which would allow easy mobile access and build in sync / share capabilities.

## Tech Stack 

- Basic plain old JS (frontend)
- Tailwind CSS (frontend)
- Code mirror (frontend editor)

- Golang (backend)
- SQLite (persistent database)
- Prettier (code formatter - runs on server)

## Roadmap 

Some things are reasonable, some a lot more esoteric and wishful thinking :).

- Implement this roadmap on my new `heynote` clone website 
- basic vim & helix bindings
- block based sharing (somehow manage the possible abuse)
- mobile support (at least reading)
- browser based sessions / local storage (to avoid data loss on accidental closing the website)
- profile based sync / share (anonymous login & e2e)
- live markdown rendering
  - live latex rendering
- CI / CD
- `kubectl` command runner
- I know its cliché, but support for OpenAI style APIs

## Architecture

Not really the current architecture, just my imagination.

```mermaid
Flowchart TB
```
