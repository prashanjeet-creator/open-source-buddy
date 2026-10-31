// Common interface every AI provider implements. Register concrete providers
// in index.js; name identifies the selected provider in API responses.
//
//   explain(issue, opts)        -> { issueTitle?, markdown: string, plan: string[] }
//   explainStream(issue, opts)  -> async generator that yields strings
//
// `issue` has: title, body, labels (string[]), repo, language, topics.
// `opts.context` is optional extra text (for example the repo's README).
export class AIProvider {
  get name() {
    throw new Error('Provider must define a name');
  }

  async explain() {
    throw new Error('Provider must implement explain()');
  }

  async *explainStream(issue, opts) {
    const result = await this.explain(issue, opts);
    yield result.markdown;
  }
}

export class NotImplementedError extends Error {
  constructor(message) {
    super(message);
    this.code = 'NOT_IMPLEMENTED';
  }
}
