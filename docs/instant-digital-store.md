# Instant Digital Store

The catalog has 18 unique source projects. Each design is **$2 USD, one-time**, before any tax Paddle displays at checkout. Four dashboard projects also appear in Sidebars; one purchase includes that full project, not two charges.

Caption URLs:
- https://www.dev-mania.com/store/dashboards/
- https://www.dev-mania.com/store/sidebars/
- https://www.dev-mania.com/store/otp/
- https://www.dev-mania.com/store/checkout/

Individual pages use `/store/design/{slug}/`. Public preview JPGs and product metadata are safe to publish. Never commit the ZIP packages, secret values, or private signed download links to this public repository.

## Required account setup

1. In Cloudflare, create a **private** R2 bucket `devmania-design-code` (no r2.dev URL and no public custom domain). Bind it to the existing `devmania` Worker as `STORE_FILES`. Add the binding to wrangler.toml only after the bucket exists:

   ```toml
   [[r2_buckets]]
   binding = "STORE_FILES"
   bucket_name = "devmania-design-code"
   ```

2. Upload each source ZIP to the object key in the private package manifest, `designs/{slug}/1.0.0.zip`. The session endpoint checks that its source file exists before opening checkout.
3. Configure Paddle Billing with the approved `www.dev-mania.com` checkout domain while preserving the existing Trackora default payment link; DevMania uses its own Paddle.js overlay on `https://www.dev-mania.com/store/`. Create one standard software product and a non-recurring USD price with `unit_price.amount = "200"` per catalog slug. Do not use regional overrides. Set quantity minimum and maximum to 1. `scripts/setup-store-paddle.mjs` can create/reuse these using a scoped key supplied locally through `PADDLE_API_KEY`; it does not enable checkout.
4. Verify a sending domain in Resend and set a sender such as `DevMania <store@dev-mania.com>` after it is verified. Set the Worker secret `STORE_FROM_EMAIL` to that address.
5. Set Worker secrets: `PADDLE_CLIENT_TOKEN`, `PADDLE_API_KEY` (customer read access at runtime), `PADDLE_WEBHOOK_SECRET`, `RESEND_API_KEY`, `STORE_FROM_EMAIL`, and `STORE_DOWNLOAD_SECRET` (a random value of at least 32 bytes). Set `STORE_PRICE_IDS` to a JSON object mapping each catalog slug to its real `pri_...` ID. Set `STORE_CHECKOUT_ENABLED=false` until end-to-end checks pass. Never put API keys in browser code or chat.
6. Add a Paddle notification destination at `https://www.dev-mania.com/api/store/paddle`, subscribed to `transaction.completed`. Save that destination's secret as `PADDLE_WEBHOOK_SECRET`. Use matching sandbox keys/prices on an isolated test Worker first.
7. Complete a Paddle sandbox purchase and verify the signed webhook, correct ZIP download, and email receipt. Only then configure the verified live prices/keys and set `STORE_CHECKOUT_ENABLED=true`.

## Fulfillment and downloads

Checkout obtains a signed, short-lived claim from the server and passes it through Paddle custom data. A browser checkout-completed event alone never unlocks source. The webhook validates Paddle's signature, completed status, USD currency, exact 200-cent one-time price, known price ID, and positive quantity. A Durable Object retains the paid order and its versioned file mapping.

After signed payment confirmation, a matching buyer browser may retrieve private download links; Resend also sends the same purchased files as links to the Paddle customer's email. Download tokens expire after seven days and are checked against the paid order before a private R2 object is streamed. No customer email or code file is exposed by the public catalog.

Email retries reuse both the Resend idempotency key and identical email body. A recorded successful submission is not sent again. Ambiguous sends older than 23 hours require manual review. Resend acceptance does not prove mailbox delivery; monitor bounces and failed Paddle notifications. Keep old versioned objects and sold price mappings available. Route expired-link support requests through receipt ownership verification.

Run `node tests/store.mjs`, `npm test`, `npm run check`, and `node scripts/build-cloudflare.mjs` before deployment. Automated tests simulate Paddle and Resend; they do not prove the live account is configured.

References: [Paddle overlay checkout](https://developer.paddle.com/build/checkout/build-overlay-checkout/), [signature verification](https://developer.paddle.com/webhooks/about/signature-verification/), [product creation](https://developer.paddle.com/api-reference/products/create-product/), [price creation](https://developer.paddle.com/api-reference/prices/create-price/).

## Provisioning status — November 10, 2026

- Live Paddle account is shared with Trackora. Preserve all Trackora products, default link, checkout styling and notification destination.
- Created 18 DevMania products with active one-time USD 2.00 prices; public price IDs are recorded in `store-price-ids-live.json`.
- DevMania domain submitted for checkout approval; latest status **Not approved** (`rejected` in the API). Paddle provides no reason in the domain table and only a Remove action; do not remove/re-add it to bypass review. Contact Paddle support for the reason and re-review.
- Separate DevMania client token and transaction-completed notification destination created. The notification destination remains inactive pending deployment verification.
- Dedicated runtime Paddle key has only `customer.read`; rotate before **February 8, 2027**. Setup key is separate and expires on the same date. Never commit either value.
- Private R2 bucket `devmania-design-code` exists with public access disabled; all 18 source ZIPs uploaded.
- Resend sending domain `mail.dev-mania.com` has dedicated DKIM TXT and two DNS-only CNAME records; verification is complete. Existing Purelymail root-domain records were preserved.
- Purchases remain disabled pending domain approval, an end-to-end sandbox checkout/download test.
