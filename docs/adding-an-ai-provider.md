# Adding an AI provider

Every AI provider follows the interface in [`server/ai/provider.js`](../server/ai/provider.js):

- `name` is a required getter identifying the provider. The API includes it in its response.
- `explain(issue, opts)` is an async method. `issue` contains the issue title, body, labels, repository, language, and topics. `opts.context` is optional repository context.
- `explain` returns an object with `markdown` (a string for the explanation) and `plan` (an array of strings for the actionable steps). The mock provider also returns `issueTitle`; callers should not rely on that optional field.
- `explainStream(issue, opts)` is optional. The base class implements it by yielding the completed explanation's markdown. Providers can override it to yield generated text incrementally. The current streaming route is not implemented.

## Registered providers and configuration

`server/ai/index.js` registers these names:

| `AI_PROVIDER` | Status | Environment configuration |
|---|---|---|
| `mock` | Implemented; works offline and needs no key | `AI_PROVIDER=mock` |
| `gemini` | Implemented; sends requests from the server | `AI_PROVIDER=gemini` and `GEMINI_API_KEY` |
| `groq` | Registered stub; not implemented | `AI_PROVIDER=groq` and `GROQ_API_KEY` |
| `ollama` | Registered stub; not implemented | `AI_PROVIDER=ollama` and `OLLAMA_URL` |

Provider selection is made on the server when `server/ai/index.js` imports `AI_PROVIDER`. To configure Gemini, copy `.env.example` to the project-root `.env`, set `AI_PROVIDER=gemini`, and add your `GEMINI_API_KEY`. Restart the server after changing the environment. The API key is read by server configuration and must never be added to client code, returned in API responses, or committed. Keep `.env` private; only use placeholders in `.env.example`.

## Implementing and registering a provider

Here is the shape of a provider implementation; replace the placeholder with a server-side API call and validate its response before returning it:

```js
import { AIProvider } from './provider.js';
import { config } from '../config.js';

export class ExampleProvider extends AIProvider {
  get name() {
    return 'example';
  }

  async explain(issue, { context } = {}) {
    if (!config.exampleApiKey) {
      throw new Error('Example provider requires EXAMPLE_API_KEY in the server .env file.');
    }

    // Call the provider API here using the key on the server only.
    // Return the same contract as the other providers:
    return {
      markdown: `# ${issue.title}\n\nExplanation based on the issue and ${context || 'no extra context'}.`,
      plan: ['Inspect the relevant code', 'Make and test a focused change'],
    };
  }
}
```

For a real provider, add its environment variable to `server/config.js` and `.env.example`, then add its name and class to the registry in `server/ai/index.js`. Ensure API failures and missing configuration become clear server errors, and never expose credentials in client bundles or response data.

## Testing

Use the mock provider for a no-key end-to-end check of the Explain this issue UI:

1. Set `AI_PROVIDER=mock` in the project-root `.env` (or leave it unset; `mock` is the default).
2. Run `npm run dev`, select an issue, and click **Explain this issue**.
3. Confirm the response includes readable markdown and a list of plan steps.

For a real provider, select its name and configure its key only in the server `.env`, then try the same UI flow. Provider implementations should also have tests that stub the upstream HTTP response so the response shape, error handling, and key isolation can be checked without a real credential.
