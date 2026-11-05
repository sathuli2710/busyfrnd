#!/usr/bin/env bash
# End-to-end API smoke test against a running API (default http://localhost:4000) using the mock OTP + mock gateway.
set -euo pipefail
API=${API:-http://localhost:4000}
j() { node -e "let s='';process.stdin.on('data',d=>s+=d).on('end',()=>{const o=JSON.parse(s);console.log(eval('o'+process.argv[1]))})" "$1"; }
post() { curl -sf -X "${3:-POST}" "$API/api$1" -H 'content-type: application/json' ${TOKEN:+-H "authorization: Bearer $TOKEN"} -d "$2"; }
get() { curl -sf "$API/api$1" ${TOKEN:+-H "authorization: Bearer $TOKEN"}; }
ok() { echo "✓ $1"; }

echo "== customer =="
post /auth/otp/request '{"phone":"9999900002","role":"CUSTOMER"}' >/dev/null
TOKEN=$(post /auth/otp/verify '{"phone":"9999900002","code":"123456","role":"CUSTOMER"}' | j .token); ok "customer login (mock OTP)"
STORES=$(get "/catalog/stores?lat=13.0827&lng=80.2707&radius=20" -H 'x-channel: app'); echo "$STORES" | j .length | xargs -I{} echo "✓ {} stores within 20km"
SID=$(echo "$STORES" | j "[0].id"); SNAME=$(echo "$STORES" | j "[0].name")
STORE=$(get "/catalog/stores/$SID"); IID=$(echo "$STORE" | j ".items[0].id"); ok "store page: $SNAME"
get "/catalog/search?q=rice&lat=13.0827&lng=80.2707" | j ".items.length" | xargs -I{} echo "✓ product search 'rice' -> {} item(s)"
post "/cart/$SID/items" "{\"itemId\":\"$IID\",\"qty\":2}" PUT >/dev/null; ok "added to cart"
QPICK=$(post /checkout/quote "{\"storeId\":\"$SID\",\"fulfillment\":\"PICKUP\",\"paymentMode\":\"FULL\"}"); echo "✓ pickup total: $(echo "$QPICK" | j .total) paise (no delivery line: $(echo "$QPICK" | j ".lines.filter(l=>l.key==='delivery').length"))"
CO=$(post /checkout "{\"storeId\":\"$SID\",\"fulfillment\":\"PICKUP\",\"paymentMode\":\"FULL\"}"); OID=$(echo "$CO" | j .orderId)
REF=$(echo "$CO" | j .paymentSessionId | sed 's/^mock_//')
curl -s -o /dev/null "$API/pay/mock-confirm?ref=$REF&ok=1"; ok "mock payment confirmed"
echo "✓ order status: $(get /orders/$OID | j .status)"
CUST=$TOKEN

echo "== vendor =="
post /auth/otp/request '{"phone":"9999900001","role":"VENDOR","email":"demo.vendor@busyfrnd.app"}' >/dev/null
TOKEN=$(post /auth/otp/verify '{"phone":"9999900001","code":"123456","role":"VENDOR","email":"demo.vendor@busyfrnd.app","emailCode":"123456"}' | j .token); ok "vendor login (phone+email OTP)"
VENDOR=$TOKEN
echo "✓ vendor orders: $(get /vendor/orders | j .length)"
for st in ACCEPTED PREPARING READY; do post /vendor/orders/$OID/status "{\"status\":\"$st\"}" PATCH >/dev/null; done; ok "order marked READY"
echo "✓ AI buddy: $(post /ai/assistant '{"text":"how much did I sell today","language":"en"}' | j .reply)"
echo "✓ AI onboarding draft: $(post /ai/onboarding '{"text":"my shop is called Kumar Bakery. cake 300 rupees, bread 40","language":"en"}' | j '.name+" / "+o.category+" / "+o.items.length+" items"')"
echo "✓ dashboard revenue today: $(get /vendor/dashboard | j .revenueToday)"

echo "== customer sees notification =="
TOKEN=$CUST; echo "✓ latest: $(get /notifications | j '[0].body')"
echo "== admin =="
TOKEN=$(post /auth/admin/login '{"email":"admin@busyfrnd.app","password":"admin12345"}' | j .token)
ADMIN=$TOKEN
echo "✓ admin stats: $(get /admin/stats | node -pe 'JSON.stringify(JSON.parse(require("fs").readFileSync(0,"utf8")))')"

echo "== store lifecycle (vendor -> admin review -> publish) =="
TOKEN=$VENDOR
NS=$(post /vendor/stores '{"name":"Kumar Bakery","category":"bakery","lat":13.09,"lng":80.28,"templateId":"menu-saffron","offersPickup":true,"offersDelivery":false}' | j .id); ok "store created (DRAFT)"
post /vendor/stores/$NS/items '{"items":[{"name":"Cake","pricePaise":30000},{"name":"Bread","pricePaise":4000}]}' >/dev/null
if post /vendor/stores/$NS '{"offersPickup":false,"offersDelivery":false}' PATCH >/dev/null 2>&1; then echo "✗ allowed both fulfilment off"; exit 1; else ok "rejects turning off both pickup+delivery"; fi
if post /vendor/stores/$NS/publish '{"web":true,"app":true}' >/dev/null 2>&1; then echo "✗ published without approval"; exit 1; else ok "publish blocked before admin approval"; fi
post /vendor/stores/$NS/submit '{"web":true,"app":true}' >/dev/null; ok "submitted for review"
TOKEN=$ADMIN; post /admin/stores/$NS/review '{"decision":"APPROVE"}' >/dev/null; ok "admin approved"
TOKEN=$VENDOR; post /vendor/stores/$NS/publish '{"web":true,"app":false}' >/dev/null; ok "published to web only"
echo "ALL OK"
