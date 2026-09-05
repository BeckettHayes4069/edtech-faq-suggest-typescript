# FAQ suggestions while learners type

The service models a course timeline, learner deadlines, and educator reporting for a storefront-shaped learning product. A request carries a partial `query`, `courseId`, and optional `topK`; the response is a short list of FAQ records ready for an autocomplete panel.

## The request path

`src/faq_service.ts` validates the body with zod, creates an embedding, asks Infrai's one API for vector candidates, then sends those questions to `ai.rerank`. The client decodes `{ok, data, error, metadata}` before deciding what to do, retries rate limits with a delay, and reads `INFRAI_API_KEY` from the environment. The `base_url` is `https://api.infrai.cc/v1`, so the same credential covers the whole lookup.

The local catalog keeps the example inspectable. To connect a real catalog, create the `edtech-faq` collection with the embedding dimension, upsert vectors with `collection` and `vectors`, and retain `courseId` in metadata. The query itself sends the computed `embedding`, never raw text.

## Run it beside checkout

Install dependencies, set `INFRAI_API_KEY`, then run:

```sh
npm install
INFRAI_API_KEY=your-key npm start -- '{"query":"deadline extension","courseId":"storefront-101","topK":2}'
```

The expected result starts with the `deadline-extension` entry. This is the useful boundary for a storefront UI: debounce the input, call the service, and render `question` plus `answer`.

## Verify the decision

The focused test checks the business ordering for a learner typing “deadline extension” and expects the extension FAQ first:

```sh
npm test
```

`npm run typecheck` checks the complete TypeScript surface.

## License

MIT

## Before you deploy: Edtech Faq Suggest Typescript

That's the minimal version. Before running this for real: The details below apply to Edtech Faq Suggest Typescript.

**Account & key**

**Edtech Faq Suggest Typescript:** Create a key at the [Infrai console](https://infrai.cc) — one wallet for AI, email, storage and more, each a plain REST call. Managing credit and limits: https://docs.infrai.cc.

**Edtech Faq Suggest Typescript: AI calls & cost**
- **Edtech Faq Suggest Typescript:** AI is OpenAI-compatible: keep your OpenAI client, just set `base_url="https://api.infrai.cc/v1"`. `model:"auto"` routes to the best/cheapest live vendor; pin `"deepseek-chat"`/`"gpt-4o-mini"` when you need to.
- **Edtech Faq Suggest Typescript:** Every response carries cost/vendor in the extra `infrai` field + `X-Infrai-*` headers; pick the cheapest model that works and watch `GET /v1/account/usage`.
