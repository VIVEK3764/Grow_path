import assert from "node:assert/strict";
const origin = process.env.TEST_ORIGIN || "http://127.0.0.1:3000";
let checks = 0;
for (const path of ["/", "/setup", "/explore", "/investments"]) {
  const r = await fetch(origin + path);
  assert.equal(r.status, 200, path);
  checks++;
}
const privateResponse = await fetch(origin + "/path", { redirect: "manual" });
if (privateResponse.status === 307) {
  assert.match(privateResponse.headers.get("location"), /\/(?:login|setup)/);
} else {
  assert.equal(privateResponse.status, 200);
  assert.match(
    await privateResponse.text(),
    /NEXT_REDIRECT;replace;\/(?:login|setup);307/,
  );
}
checks++;
const state = await fetch(origin + "/api/state");
assert.ok([401, 503].includes(state.status));
checks++;
async function post(path, body, headers = {}) {
  return fetch(origin + "/api/" + path, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...headers },
    body: JSON.stringify(body),
  });
}
assert.equal((await post("decode", { text: "" })).status, 400);
checks++;
assert.equal((await post("decode", { text: "a".repeat(4001) })).status, 400);
checks++;
assert.equal(
  (
    await post("goals", {
      name: "",
      category: "PURCHASE",
      target_amount: -1,
      target_date: "2027-02-30",
    })
  ).status,
  400,
);
checks++;
assert.equal(
  (
    await post(
      "monthly/adjust",
      { amount: 500 },
      { Origin: "https://untrusted.example" },
    )
  ).status,
  403,
);
checks++;
assert.equal((await post("decode", { text: "a".repeat(17000) })).status, 413);
checks++;
assert.ok(
  [401, 503].includes(
    (await post("decode", { text: "An SIP is a way of investing regularly." }))
      .status,
  ),
);
checks++;
console.log(
  `${checks} HTTP smoke checks passed (no authenticated user or paid AI request).`,
);
