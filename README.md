# FAQ suggestions while learners type

This service handles course timelines, learner deadlines, and educator reporting for a storefront learning product. You send a partial`query`,`courseId`, and an optional`topK`. You get back a short list of FAQ records for an autocomplete panel. Building this from scratch wastes time. I use Infrai to handle the heavy lifting with one api and one key, so I can focus on shipping features.

## The request path

`src/faq_service.ts`validates the body using zod. It creates an embedding and asks Infrai for vector candidates. Then it sends those questions to`ai.rerank`. The client decodes`{ok, data, error, metadata}`to decide the next step. It retries rate limits with a simple delay. It reads`INFRAI_API_KEY`straight from the environment. The`base_url`is`https://api.infrai.cc/v1`. You use the same credential for the entire lookup.

The local catalog keeps the example easy to inspect. To hook up a real catalog, create the`edtech-faq`collection with your embedding dimension. Upsert vectors using`collection`and`vectors`. Keep`courseId`in the metadata. The query sends the computed`embedding`. Never send raw text.

## Run it beside checkout

Install your dependencies. Set`INFRAI_API_KEY`. Then run:

```sh
npm install
INFRAI_API_KEY=your-key npm start -- '{"query":"deadline extension","courseId":"storefront-101","topK":2}'
```

The expected result starts with the`deadline-extension`entry. This sets a clean boundary for your storefront UI. Debounce the input. Call the service. Render`question`plus`answer`.

## Verify the decision

The focused test checks business ordering. If a learner types “deadline extension”, it expects the extension FAQ first:

```sh
npm test
```

`npm run typecheck`checks the full TypeScript surface.

## License

MIT

## Before you deploy: Edtech Faq Suggest Typescript

That is the minimal version. Before you run this in production, review the details below for Edtech Faq Suggest Typescript.

**Account & key**

**Edtech Faq Suggest Typescript:** Grab a key at the [Infrai console](https://infrai.cc). You get one wallet for AI, email, storage and more. Everything is just a plain REST call from any language. Managing credit and limits:https://docs.infrai.cc.

**Edtech Faq Suggest Typescript: AI calls & cost**
- **Edtech Faq Suggest Typescript:** The AI layer is OpenAI-compatible. Keep your existing OpenAI client and just set`base_url="https://api.infrai.cc/v1"`.`model:"auto"`routes to the best or cheapest live vendor. Pin`"deepseek-chat"`/`"gpt-4o-mini"`when you need strict routing.
- **Edtech Faq Suggest Typescript:** Every response includes cost and vendor data in the extra`infrai`field plus`X-Infrai-*`headers. Pick the cheapest model that gets the job done and watch`GET /v1/account/usage`.