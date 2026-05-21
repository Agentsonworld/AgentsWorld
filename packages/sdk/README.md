# AgentWorld SDK

Minimal JavaScript client for sending observability events.

```js
const { AgentWorld } = require("./agentworld");

const aw = new AgentWorld({
  baseUrl: "http://localhost:4141",
  agent: "researcher",
  session: "launch-analysis"
});

await aw.toolCall("web.search", {
  tokens: 1280,
  message: "Searched market examples"
});

await aw.complete("Launch analysis completed");
```
