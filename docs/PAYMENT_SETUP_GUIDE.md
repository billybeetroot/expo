# Payment Setup Guide — PerfectPLAY Native App

Payments are delivered in two phases:

- **Phase 8a (Android)** — Google Play Billing via RevenueCat. No Apple account needed.
- **Phase 8b (iOS)** — Apple IAP via RevenueCat. Requires Apple Developer Program enrollment ($99/yr). Deferred until enrollment is complete.

Work through Part A first. Part B can be picked up independently when ready.

---

## Products (both platforms)

| Product | Type | Price | Google product ID | Apple product ID |
|---|---|---|---|---|
| Monthly | Auto-renewable subscription | $12.99/mo | `monthly` | `com.perfectplay.vegas.monthly` |
| Annual | Auto-renewable subscription | $99.99/yr | `annual` | `com.perfectplay.vegas.annual` |
| 48-Hour Pass | One-time / non-renewing | $4.99 | `visitor` | `com.perfectplay.vegas.visitor` |

> **Note on the $5 setup fee:** Exists on the web app but cannot be represented as a native
> IAP product. Not charged to native app subscribers.

> **Note on the 48-Hour Pass:** Google Play does not support non-renewing subscriptions.
> Use a one-time in-app product. Apple does not allow auto-renewable subscriptions shorter
> than 1 week. On iOS, use a non-renewing subscription. RevenueCat handles both.

---

# Part A — Android (Phase 8a)

## A1 — Google Play Console

### A1.1 Confirm your app exists

1. Go to [Google Play Console](https://play.google.com/console).
2. Confirm an app with package name `com.perfectplay.vegas` exists. If not, create it.

> A Google Play developer account is required ($25 one-time registration fee).
> Register at [play.google.com/console/signup](https://play.google.com/console/signup).

### A1.2 Set up a billing service account (for RevenueCat)

RevenueCat needs a service account to verify Google Play purchases server-side.

1. Google Play Console → Setup → **API access**.
2. Link to a Google Cloud project (create one if needed).
3. In the linked Google Cloud project → IAM & Admin → Service Accounts →
   **Create Service Account**:
   - Name: `revenuecat`
   - Role: **Editor** at the project level (required for Play Developer API)
4. Create a **JSON key** for the service account → download the `.json` file.
5. Back in Google Play Console → Setup → API access → **Grant access** to the service account.
   - Permissions needed: **View financial data**, **Manage orders and subscriptions**.
6. Save the `.json` file — RevenueCat needs it in A2.3.

### A1.3 Create the Monthly subscription

1. Your app → Monetise → Products → Subscriptions → **Create subscription**.
2. Product ID: `monthly`
3. Name: `Monthly Membership`
4. Description: `Full access to all PerfectPLAY game variants and strategy tools.`
5. Add a base plan: Billing period **Monthly**, Price **$12.99**.
6. Activate.

### A1.4 Create the Annual subscription

1. Product ID: `annual`
2. Name: `Annual Membership`
3. Base plan: **Yearly**, Price **$99.99**.
4. Activate.

### A1.5 Create the 48-Hour Visitor Pass

1. Products → **In-app products** → Create product.
2. Product ID: `visitor`
3. Name: `48-Hour Visitor Pass`
4. Description: `48 hours of full access to all PerfectPLAY game variants.`
5. Price: **$4.99**.
6. Mark as **Active**.

---

## A2 — RevenueCat Dashboard (Android)

### A2.1 Create a RevenueCat account and project

1. Go to [app.revenuecat.com](https://app.revenuecat.com) and sign up.
2. Create a new **Project**: `PerfectPLAY`.

### A2.2 Add the Android app

1. Project → Apps → **+** → Play Store.
2. App name: `PerfectPLAY Android`
3. Package name: `com.perfectplay.vegas`
4. Upload the service account JSON from A1.2.
5. Save. Copy the **Android Public API Key** → this goes in the app as
   `EXPO_PUBLIC_REVENUECAT_ANDROID_KEY`.

### A2.3 Create an Entitlement

1. Project → Entitlements → **+**.
2. Identifier: `premium`
3. Description: `Full access to all game variants`
4. Save.

### A2.4 Create Android Products in RevenueCat

Project → Apps → PerfectPLAY Android → Products:

1. Add product → `monthly` → type: Subscription
2. Add product → `annual` → type: Subscription
3. Add product → `visitor` → type: Non-subscription (one-time)

### A2.5 Create an Offering

1. Project → Offerings → **+**.
2. Identifier: `default`
3. Description: `PerfectPLAY membership options`
4. Add three Packages:

| Package identifier | Display name | Android product |
|---|---|---|
| `$rc_monthly` | Monthly | `monthly` |
| `$rc_annual` | Annual | `annual` |
| `visitor` | 48-Hour Pass | `visitor` |

5. Set `default` as the current offering.

### A2.6 Attach products to the Premium entitlement

1. Project → Entitlements → `premium` → Attach products.
2. Attach all three Android products.
3. Save.

### A2.7 Configure the RevenueCat webhook

1. Project → Integrations → Webhooks → **+**.
2. Webhook URL: `https://perfectplay.vegas/api/revenuecat-webhook`
3. Events to send: all (minimum: `INITIAL_PURCHASE`, `RENEWAL`, `CANCELLATION`, `EXPIRATION`).
4. Copy the **Webhook Signing Secret** — np2 needs it.
5. Save.

---

## A3 — np2 Webhook Endpoint

A new route in np2 receives RevenueCat events and writes membership state to Firestore,
keeping web and native subscriber state in sync.

**What it needs to do:**

1. Verify the `X-RevenueCat-Signature` header using the signing secret from A2.7.
2. Parse the event body:
   - `event.type` — `INITIAL_PURCHASE`, `RENEWAL`, `CANCELLATION`, `EXPIRATION`
   - `event.app_user_id` — Firebase UID
   - `event.product_id` — e.g. `monthly`
   - `event.expiration_at_ms` — Unix timestamp of subscription expiry
3. On `INITIAL_PURCHASE` or `RENEWAL`: write `member: true`, `paymentPlanType`,
   `currentPeriodEnd` to Firestore (same fields the Stripe webhook writes).
4. On `CANCELLATION` or `EXPIRATION`: write `member: false`.

**Env var needed in np2:** `REVENUECAT_WEBHOOK_SECRET` (from A2.7).

This is ~40 lines of code and can be built in np2 independently of the native app.

---

## A4 — Environment Variables (Android)

Add to `../perfectplay.env/.env`:

```
EXPO_PUBLIC_REVENUECAT_ANDROID_KEY=<your RevenueCat Android public API key>
```

Add to np2's env:

```
REVENUECAT_WEBHOOK_SECRET=<your RevenueCat webhook signing secret>
```

---

## A5 — Android Checklist Before Starting Code

- [ ] Google Play Console: Monthly, Annual, and Visitor Pass products created and active
- [ ] Google Play Console: Service account JSON downloaded, permissions granted
- [ ] RevenueCat: project created, Android app added, Android API key copied
- [ ] RevenueCat: entitlement `premium` created with 3 Android products attached
- [ ] RevenueCat: `default` offering created with 3 packages
- [ ] RevenueCat: webhook URL configured, signing secret copied
- [ ] np2: `/api/revenuecat-webhook` endpoint built and deployed
- [ ] `perfectplay.env/.env`: `EXPO_PUBLIC_REVENUECAT_ANDROID_KEY` added
- [ ] np2 env: `REVENUECAT_WEBHOOK_SECRET` added

---

## Android Sandbox Testing

1. In Google Play Console → Setup → **Licence testing**, add your Google account as a
   licence tester.
2. Test purchases via the licence tester account are free and can be cancelled instantly.
3. RevenueCat dashboard shows sandbox transactions under Customer History in real time.

---

---

# Part B — iOS (Phase 8b, Deferred)

> **Prerequisite: Apple Developer Program enrollment.**
> A standard Apple ID is not sufficient. Enroll at
> [developer.apple.com/programs/enroll](https://developer.apple.com/programs/enroll/)
> ($99 USD/year). Activation takes 24–48 hours.
> **Complete Part A before starting Part B.**

## B1 — App Store Connect

### B1.1 Confirm your app exists

1. Go to [App Store Connect](https://appstoreconnect.apple.com) and sign in with your
   enrolled developer Apple ID → My Apps.
2. Confirm an app with bundle ID `com.perfectplay.vegas` exists. If not, create it.

### B1.2 Create a Subscription Group

1. Select your app → In-App Purchases → Manage → **+** → Auto-Renewable Subscription.
2. Create a subscription group: Reference Name `PerfectPLAY Premium`.
3. Save the **Subscription Group ID** — RevenueCat needs it.

### B1.3 Create the Monthly subscription

1. Inside the subscription group → **+**.
2. Reference Name: `Monthly`, Product ID: `com.perfectplay.vegas.monthly`
3. Duration: **1 Month**, Price: **$12.95**
4. Localisation: Display Name `Monthly Membership`.
5. Save.

### B1.4 Create the Annual subscription

1. Reference Name: `Annual`, Product ID: `com.perfectplay.vegas.annual`
2. Duration: **1 Year**, Price: **$99.00**
3. Localisation: Display Name `Annual Membership`.
4. Save.

### B1.5 Create the 48-Hour Visitor Pass (non-renewing)

1. In-App Purchases → Manage → **+** → **Non-Renewing Subscription**.
2. Reference Name: `Visitor Pass`, Product ID: `com.perfectplay.vegas.visitor`
3. Price: **$4.99**, Display Name: `48-Hour Visitor Pass`.
4. Save.

### B1.6 Create an App Store Connect API Key

1. App Store Connect → Users and Access → **Keys** tab → **+**.
2. Name: `RevenueCat`, Role: **Admin**.
3. Download the `.p8` file — **downloadable only once**.
4. Note the **Key ID** and **Issuer ID**.

---

## B2 — RevenueCat Dashboard (iOS additions)

The RevenueCat project already exists from Part A. Add iOS to it.

### B2.1 Add the iOS app

1. Project → Apps → **+** → App Store.
2. App name: `PerfectPLAY iOS`, Bundle ID: `com.perfectplay.vegas`.
3. Upload the `.p8` file from B1.6, enter Key ID and Issuer ID.
4. Save. Copy the **iOS Public API Key** → `EXPO_PUBLIC_REVENUECAT_IOS_KEY`.

### B2.2 Create iOS Products in RevenueCat

Project → Apps → PerfectPLAY iOS → Products:

1. Add product → `com.perfectplay.vegas.monthly` → Auto-renewable subscription
2. Add product → `com.perfectplay.vegas.annual` → Auto-renewable subscription
3. Add product → `com.perfectplay.vegas.visitor` → Non-renewing subscription, duration: 2 days

### B2.3 Add iOS products to the offering and entitlement

1. Offerings → `default` → edit each package to add the iOS product alongside the Android one.
2. Entitlements → `premium` → Attach the three iOS products.

---

## B3 — Environment Variables (iOS)

Add to `../perfectplay.env/.env`:

```
EXPO_PUBLIC_REVENUECAT_IOS_KEY=<your RevenueCat iOS public API key>
```

---

## B4 — iOS Checklist Before Starting Code

- [ ] Apple Developer Program: enrolled and activated
- [ ] App Store Connect: Monthly, Annual, and Visitor Pass products created
- [ ] App Store Connect: API key (`.p8`, Key ID, Issuer ID) downloaded
- [ ] RevenueCat: iOS app added to existing project, iOS API key copied
- [ ] RevenueCat: iOS products created and attached to offering + entitlement
- [ ] `perfectplay.env/.env`: `EXPO_PUBLIC_REVENUECAT_IOS_KEY` added

---

## iOS Sandbox Testing

1. App Store Connect → Users and Access → **Sandbox Testers** → create a test account.
2. On the simulator, sign in to the App Store with the sandbox account.
3. StoreKit purchases in development automatically hit sandbox — no real charges.
4. RevenueCat dashboard shows sandbox transactions under Customer History.
