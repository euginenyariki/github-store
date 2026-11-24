# RepoVault

A small, local-first explorer for public GitHub repositories. Search the GitHub API without a token, shortlist projects with your own notes and export the collection.

## Features

- **Live GitHub search** — query, language filter and sort by stars, forks or freshness
- **Starter set** shown offline or when GitHub's unauthenticated rate limit is hit
- **Saved collection** — star a repo, add a private note, filter and remove
- **JSON export** for backup or sharing
- **Dark mode** and responsive cards

## Run it

```bash
python3 -m http.server 8000
# visit http://localhost:8000
```

Opening `index.html` directly also works if your browser allows cross-origin requests to the GitHub API.

## Notes

- No API key or token is stored in the app. Search uses GitHub's public REST endpoint, which is rate-limited (~10 requests/minute unauthenticated).
- Saved repositories and notes live in `localStorage` under `repovault:v1`; they are never uploaded.

## Stack

HTML5, CSS custom properties and vanilla JavaScript with `fetch`.

## License

MIT — see [LICENSE](LICENSE).
