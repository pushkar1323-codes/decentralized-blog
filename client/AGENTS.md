<!-- BEGIN:nextjs-agent-rules -->
# Notes for AI coding assistants

This project pins an exact Next.js version in `package.json` — check that
version (and `REQUIREMENTS.md` at the repo root) before assuming API
behavior from training data, since Next.js does introduce real breaking
changes between major versions.

There is no `node_modules/next/dist/docs/` in the real, published Next.js
package — an earlier version of this file pointed there, which doesn't
exist. For authoritative API docs, use https://nextjs.org/docs or the
installed package's own type definitions/source, not a fabricated path.
<!-- END:nextjs-agent-rules -->
