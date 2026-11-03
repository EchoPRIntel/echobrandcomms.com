# Echo Brand Communications — website

Static site for **echobrandcomms.com**. Plain HTML, CSS and vanilla JavaScript; no build step, no dependencies.

```
index.html          Home
services.html       Services, process, the Echo system
results.html        Results, success stories, awards, testimonials
about.html          Founder story and mission
contact.html        Booking link + email
blog/               Journal index and posts
404.html            Not-found page (GitHub Pages serves it automatically)
assets/css/style.css
assets/js/main.js
assets/img/         All images (clients, press, awards, services, blog)
scripts/            Asset manifest + fetch script (only needed to re-download images)
```

## Before launch

1. **Booking link** — in `contact.html`, replace `https://calendly.com/` with Vitalia's real scheduling URL (one occurrence).
2. **LinkedIn** — in the footer of every page, replace `https://www.linkedin.com/` with the Echo / Vitalia LinkedIn URL (search-and-replace across all `.html` files).
3. **Email** is already set to `vitalia@echobrandcomms.com`.

## Deploy on GitHub Pages (free)

1. Create a new GitHub account for Echo, then a repository called `echobrandcomms.com` (any name works).
2. Upload the contents of this folder to the repository root (drag-and-drop in the GitHub web UI is fine).
3. In the repository: **Settings → Pages → Build and deployment → Source: "Deploy from a branch"**, branch `main`, folder `/ (root)`. Save.
4. Still in **Settings → Pages → Custom domain**, enter `echobrandcomms.com` and tick **Enforce HTTPS** once the check passes. The `CNAME` file in this folder keeps that setting across deploys.
5. At the domain registrar, point the domain at GitHub Pages:
   - `A` records for `@` → `185.199.108.153`, `185.199.109.153`, `185.199.110.153`, `185.199.111.153`
   - `CNAME` record for `www` → `<github-username>.github.io`
   DNS can take up to a few hours to propagate.

Every later change is just: edit the file, commit to `main`, and the site updates within a minute.

## Editing content

Pages are plain HTML. Copy, stats and testimonials live directly in each page. To add a journal post, copy one of the files in `blog/`, change the text and cover image, and add a card to `blog/index.html`.
