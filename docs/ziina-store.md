# DevMania Ziina checkout

Each individual design costs exactly USD 2.00 (200 minor units), one time. Ziina receives the fixed server-side price; client amounts, currencies, return URLs and test flags are ignored. Tips are disabled.

## Existing account and credential

Fixenator's frontend is on Cloudflare Pages, but its existing `ZIINA_API_KEY` is stored in Supabase project `asxhgdsuypnvlrizpuis`. The key was not retrieved, exported, rotated or copied. Existing Fixenator functions, database settings and Ziina account webhook were left unchanged.

The separate `devmania-ziina` Edge Function uses that credential internally. It accepts only ECDSA P-256 signed requests from DevMania's Worker, timestamps within 60 seconds, fixed-price creates for the 65 catalog slugs, and reads matching a DevMania order message. It fixes return URLs and strips card data and unrelated provider fields. Its public verification key is in `integrations/ziina-bridge`; its private signing key exists only in the Worker secret `ZIINA_BRIDGE_PRIVATE_KEY`. The function uses its own signature authentication (`verify_jwt=false`); anonymous calls return 401. It does not access the Supabase database or service-role credential.

## Worker settings

- `STORE_PAYMENT_PROVIDER=ziina`
- `ZIINA_BRIDGE_URL=https://asxhgdsuypnvlrizpuis.supabase.co/functions/v1/devmania-ziina`
- `ZIINA_BRIDGE_PRIVATE_KEY`: PKCS8 base64 ECDSA signing key, secret
- `ZIINA_ACCOUNT_ID`: optional additional merchant-account pin
- Existing `RESEND_API_KEY`, `STORE_FROM_EMAIL`, `STORE_DOWNLOAD_SECRET`, `STORE_FILES` and `STORE_ORDERS`
- `STORE_CHECKOUT_ENABLED=true` only after the hosted test flow and delivery checks pass

`STORE_TEST_KEY` is a temporary secret for authenticated operator testing while public checkout is disabled. A matching `X-Store-Test-Key` header creates a test-only intent; setting `test:true` in a browser request cannot do so. Remove this secret after verification. Never put it in URLs or browser bundles.

## Confirmation and delivery

The buyer enters a delivery email before navigating to Ziina's hosted checkout. The Worker saves a versioned product snapshot, server-issued claim nonce, provider intent ID, merchant ID and exact order message in a Durable Object before returning the hosted URL.

Ziina return parameters never prove payment. Both receipt polling and Durable Object alarms independently fetch Ziina's authenticated payment status and verify the saved intent, merchant, order message, USD 200 amount and no tips/extra VAT before marking paid. Alarms run after 15 seconds, then back off to one minute and eventually one hour for up to 48 hours. They continue after browser closure and after disabling new sales. Failed/canceled orders never unlock downloads.

Paid orders receive private, expiring R2 download links and Resend email delivery. Emails use stable bodies and idempotency keys. Repeated confirmations do not resend successful emails. Missing packages fail before payment creation. Monitor old pending orders and delivery failures; ambiguous email retries older than 23 hours require manual review.

The optional `/api/store/ziina` signed-webhook handler also performs independent provider verification. It is **not registered** on this shared Ziina account; background reconciliation provides automatic delivery without replacing the existing webhook.

## Verification and deployment

Run `node tests/store.mjs`, `node tests/store-ziina.mjs`, `node tests/ziina-bridge.mjs`, `npm test`, `npm run check`, `node scripts/build-cloudflare.mjs`, and browser checkout checks. Deploy the bridge independently through Supabase; the DevMania Git build does not deploy it. Preserve the private signing key when redeploying the same public verification key.

No real-money charge or refund is needed for testing. Use Ziina's documented test mode and test cards. A successful test does not prove live card processing or settlement; record those separately if later verified.

References: https://docs.ziina.com/developers/custom-integration, https://docs.ziina.com/api-reference/payment-intent, https://docs.ziina.com/supported-currencies, https://supabase.com/docs/guides/functions/auth.

## Production verification — 10 November 2026

Ziina is enabled for all 65 individual designs at USD 2.00. The merchant account is pinned with `ZIINA_ACCOUNT_ID`; temporary `STORE_TEST_KEY` access was removed after verification.

The hosted test checkout for OTP V6 completed successfully. Before any receipt polling, the background reconciliation sent the delivery email to the store owner (received at 15:03 Dubai time). The receipt then confirmed paid; the 13,525-byte private ZIP matched the package manifest SHA-256 and passed ZIP integrity checks. A modified download token returned 403. The existing Fixenator credential and account webhook were preserved.

This was a test-mode payment, not a real charge or proof of live settlement.

## Full gallery expansion — 10 November 2026

The catalog contains 65 unique source projects across 11 categories. Four dashboard projects are also listed as sidebars, without requiring a separate purchase. The duplicate Apple Dock RAR archive is not a separate SKU.

All 47 added projects passed isolated production builds. Each new ZIP was checked against the supplied source-file list and sizes, passed ZIP integrity checks, and was uploaded to private R2 and downloaded again for SHA-256 verification. Existing 18 package objects were preserved. The signed Ziina adapter allowlist was expanded to match the full catalog; the fixed USD 2.00 price and order/download authentication remain unchanged.

Every product page uses one per-design video, with native controls and no autoplay. Desktop video and purchase frames have matching heights; mobile stacks them. New previews are recorded from the imported project builds with synthetic form inputs.

Car-rental package: corrected the Mercedes model URL to the existing bundled model subfolder; rebuilt and verified the rendered 3D model, ZIP integrity and replacement private R2 SHA-256.
