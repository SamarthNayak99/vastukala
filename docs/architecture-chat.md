# Ask Vastukala

`/ask` is a separate architecture conversation page, linked as **Ask Vastukala** in the main navigation. Visitors can ask about Indian monuments, materials, layouts, regional styles and structural principles. The page supports follow-up questions, suggested prompts, source links, related monument records, cancellation and a fresh conversation. Light and dark themes use the archive's existing theme tokens.

## Connection

Set `GROQ_API_KEY` in the ignored server `.env` and restart the API. Configure the same name as an encrypted Vercel Production environment variable before deploying. Never add a `VITE_` prefix or place the key in browser code. `GROQ_MODEL` optionally overrides the default `openai/gpt-oss-120b`, hosted by Groq. This does not call the OpenAI API or require an OpenAI key.

Groq offers a free plan with account/model-specific quotas. No billing setup or upgrade is performed by this integration. A key does not itself guarantee a free account: the owner should keep their Groq account on the Free plan. Provider quota failures return a friendly retry message. The API also limits each client IP to eight requests per minute; that memory-based limiter is per server instance, while Groq applies account-wide quotas.

## Retrieval and evidence

1. Validate the question (1–1500 characters) and up to six recent messages (6000 history characters total).
2. Read a fixed, public-only projection of at most 500 published catalogue records. Rank up to four using names, aliases, locations, materials, styles, elements and narrative text; recent user questions help resolve follow-ups. This is lexical retrieval, not semantic/vector search, so paraphrases and non-English names can miss records.
3. Load up to three supporting citations for each selected record with a parameterized query. Bound excerpt lengths keep prompts manageable.
4. Send the public excerpts, question and recent conversation to Groq. There are no model tools, arbitrary SQL execution, database writes or live web search. The instructions distinguish catalogue-supported claims from general architectural knowledge and preserve unknown dates and uncertainty.
5. Validate the JSON answer, discard unknown citation IDs and return only server-supplied reference URLs. If the model omits citation IDs, a separate disclosure lists the sources supplied as context and explicitly states that individual supporting references were not identified. Citation IDs identify supplied evidence; automated citation filtering does not prove that every generated statement is supported. Users should verify research claims.

## HTTP endpoints

- `GET /api/chat/status`: availability boolean and provider name; no credential values.
- `POST /api/chat`: `{message, history?: [{role: 'user' | 'assistant', content}]}`. Returns `{answer, sources, contextSources, buildings, basis, provider, model}`. `sources` contains model-selected references; `contextSources` contains retrieved context, which may be uncited. Invalid input returns 400; rate limits return 429; provider/unconfigured errors return 503; timeout returns 504; malformed generated answers return 502. Responses are not cached.

Conversation text stays in React memory and disappears on refresh. The application does not persist conversations or questions in PostgreSQL or browser storage. Questions, recent messages and relevant public records are transmitted to Groq for generation; the chat page discloses this. Groq's own data policies still apply.

## Validation

Run `node --test tests/chat.test.mjs` for request bounds, retrieval/follow-up ranking, public SQL projection, parameterized evidence lookup, citation filtering, model request construction, provider errors and invalid model output. These tests mock Groq and require neither a key nor PostgreSQL. Run `npm run build` for the complete frontend build. A live smoke test should cover one named-monument answer with sources and one general structural explanation.
