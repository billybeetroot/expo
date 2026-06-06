# Payment Setup Guide — PerfectPLAY Native App

This guide covers everything that must be configured **outside the codebase** before
RevenueCat IAP can be implemented in the app. Work through the sections in order.
At the end, record all the IDs and keys in one place — the implementation needs them.

---

## Pre-requisite: Apple Developer Program enrollment

A standard Apple ID is **not sufficient** for any step in this guide. You must be enrolled
in the **Apple Developer Program** ($99 USD/year) before proceeding.

Enrollment grants access to:
- App Store Connect (where products, subscriptions, and test accounts are managed)
- Code signing certificates and provisioning profiles (required for all device builds)
- StoreKit sandbox testing
- App Store submission

**Enroll here:** [developer.apple.com/programs/enroll](https://developer.apple.com/programs/enroll/)

Enrollment is reviewed by Apple and typically activates within 24–48 hours. Complete it
before starting any other step in this guide.

---

## Overview

Three products to create on both platforms:

| Product | Type | Price | Apple product ID | Google product ID |
|---|---|---|---|---|
| Monthly | Auto-renewable subscription | $12.95/mo | `com.perfectplay.vegas.monthly` | `monthly` |
| Annual | Auto-renewable subscription | $99.00/yr | `com.perfectplay.vegas.annual` | `annual` |
| 48-Hour Pass | Non-renewing subscription | $4.99 | `com.perfectplay.vegas.visitor` | `visitor` |

> **Note on the 48-Hour Pass:** Apple does not allow auto-renewable subscriptions shorter
> than 1 week, so the Visitor Pass is a **non-renewing subscription** (manually managed).
> RevenueCat handles non-renewing subscriptions; the app just checks entitlement expiry.
> Google Play has the same limitation, so use a non-renewable product there too.

> **Note on the $5 setup fee:** This charge exists on the web app but cannot be represented
> as a native IAP product. It does not apply to native app subscribers.

---

## Section 1 — Apple App Store Connect

### 1.1 Confirm your app exists

> Requires Apple Developer Program enrollment (see Pre-requisite above). App Store Connect
> will not be accessible with a standard Apple ID.

1. Go to [App Store Connect](https://appstoreconnect.apple.com) and sign in with your
   **developer** Apple ID (the one enrolled in the Developer Program).
2. Go to My Apps.
3. Confirm an app with bundle ID `com.perfectplay.vegas` exists. If not, create it:
   - Platform: iOS
   - Bundle ID: `com.perfectplay.vegas`
   - Name: PerfectPLAY

### 1.2 Create a Subscription Group

Subscription groups link your monthly and annual plans so a user can only hold one at a time.

1. Select your app → In-App Purchases → Manage.
2. Click **+** → Auto-Renewable Subscription.
3. When prompted to create or select a subscription group, create a new group:
   - Reference Name: `PerfectPLAY Premium`
4. Save the **Subscription Group ID** — RevenueCat needs it.

### 1.3 Create the Monthly subscription

Inside your subscription group:

1. Click **+** to add a subscription.
2. Reference Name: `Monthly`
3. Product ID: `com.perfectplay.vegas.monthly`
4. Subscription Duration: **1 Month**
5. Price: **$12.95** (select from the price tier grid)
6. Localisation (English):
   - Display Name: `Monthly Membership`
   - Description: `Full access to all PerfectPLAY game variants and strategy tools.`
7. Save.

### 1.4 Create the Annual subscription

Inside the same subscription group:

1. Reference Name: `Annual`
2. Product ID: `com.perfectplay.vegas.annual`
3. Subscription Duration: **1 Year**
4. Price: **$99.00**
5. Localisation:
   - Display Name: `Annual Membership`
   - Description: `Full access to all PerfectPLAY game variants and strategy tools.`
6. Save.

### 1.5 Create the 48-Hour Visitor Pass (non-renewing)

This is a separate product, **not** inside the subscription group.

1. In-App Purchases → Manage → **+** → Non-Renewing Subscription.
2. Reference Name: `Visitor Pass`
3. Product ID: `com.perfectplay.vegas.visitor`
4. Duration: you will manage expiry manually in RevenueCat / your backend (48 hours from purchase).
5. Price: **$4.99**
6. Localisation:
   - Display Name: `48-Hour Visitor Pass`
   - Description: `48 hours of full access to all PerfectPLAY game variants.`
7. Save.

### 1.6 Create an App Store Connect API Key (for RevenueCat)

RevenueCat needs API access to verify receipts and pull product data automatically.

1. App Store Connect → Users and Access → **Keys** tab.
2. Click **+** → Name: `RevenueCat`, Role: **Admin** (or at minimum App Manager).
3. Download the `.p8` key file — **you can only download it once**.
4. Note the **Key ID** and **Issuer ID** shown on the same screen.

---

## Section 2 — Google Play Console

### 2.1 Confirm your app exists

1. Go to [Google Play Console](https://play.google.com/console).
2. Confirm an app with package name `com.perfectplay.vegas` exists. If not, create it.

### 2.2 Set up a Google Play billing service account (for RevenueCat)

RevenueCat needs a service account to verify Google Play purchases.

1. Google Play Console → Setup → API access.
2. Link to a Google Cloud project (create one if needed).
3. In the linked Google Cloud project → IAM & Admin → Service Accounts → **Create Service Account**.
   - Name: `revenuecat`
   - Role: **Editor** at the project level (required for Play Developer API)
4. Create a JSON key for the service account → download the `.json` file.
5. Back in Google Play Console → Setup → API access → Grant access to the service account.
   - Permissions needed: **View financial data**, **Manage orders and subscriptions**.
6. Save the service account `.json` file — RevenueCat needs it.

### 2.3 Create the Monthly subscription

1. Google Play Console → Your app → Monetise → Products → Subscriptions → **Create subscription**.
2. Product ID: `monthly`
3. Name: `Monthly Membership`
4. Description: `Full access to all PerfectPLAY game variants and strategy tools.`
5. Add a base plan:
   - Billing period: **Monthly**
   - Price: **$12.99** (Google requires prices to match App Store tiers — the nearest tier to $12.95 is $12.99; align with your App Store price tier)
6. Activate.

### 2.4 Create the Annual subscription

1. Product ID: `annual`
2. Name: `Annual Membership`
3. Base plan: **Yearly**, Price: **$99.99** (nearest tier to $99.00)
4. Activate.

### 2.5 Create the 48-Hour Visitor Pass

Google Play does not support non-renewing subscriptions directly. Use a **one-time product** (in-app product, not a subscription):

1. Products → In-app products → **Create product**.
2. Product ID: `visitor`
3. Name: `48-Hour Visitor Pass`
4. Description: `48 hours of full access to all PerfectPLAY game variants.`
5. Price: **$4.99**
6. Mark as **Active**.

> The app code will record the purchase timestamp and enforce the 48-hour window.
> RevenueCat handles this via its non-subscription purchase tracking.

---

## Section 3 — RevenueCat Dashboard

### 3.1 Create a RevenueCat account and project

1. Go to [app.revenuecat.com](https://app.revenuecat.com) and sign up.
2. Create a new **Project**: `PerfectPLAY`.

### 3.2 Add the iOS app

1. Project → Apps → **+** → App Store.
2. App name: `PerfectPLAY iOS`
3. Bundle ID: `com.perfectplay.vegas`
4. Upload the App Store Connect API key:
   - Upload the `.p8` file from Section 1.6
   - Enter the Key ID and Issuer ID
5. Save. Copy the **iOS Public API Key** — this goes in the app as `EXPO_PUBLIC_REVENUECAT_IOS_KEY`.

### 3.3 Add the Android app

1. Project → Apps → **+** → Play Store.
2. App name: `PerfectPLAY Android`
3. Package name: `com.perfectplay.vegas`
4. Upload the service account JSON from Section 2.2.
5. Save. Copy the **Android Public API Key** — this goes in the app as `EXPO_PUBLIC_REVENUECAT_ANDROID_KEY`.

### 3.4 Create an Entitlement

An entitlement is what the app checks to know if the user is a member.

1. Project → Entitlements → **+**.
2. Identifier: `premium`
3. Description: `Full access to all game variants`
4. Save.

### 3.5 Create Products

Tell RevenueCat about each store product:

**iOS Products** (Project → Apps → PerfectPLAY iOS → Products):
1. Add product → `com.perfectplay.vegas.monthly` → type: Auto-renewable subscription
2. Add product → `com.perfectplay.vegas.annual` → type: Auto-renewable subscription
3. Add product → `com.perfectplay.vegas.visitor` → type: Non-renewing subscription, duration: **2 days**

**Android Products** (Project → Apps → PerfectPLAY Android → Products):
1. Add product → `monthly` → type: Subscription
2. Add product → `annual` → type: Subscription
3. Add product → `visitor` → type: Non-subscription (one-time)

### 3.6 Create an Offering

An offering is what you present to the user in the purchase UI.

1. Project → Offerings → **+**.
2. Identifier: `default`
3. Description: `PerfectPLAY membership options`
4. Add three **Packages**:

| Package identifier | Display name | iOS product | Android product |
|---|---|---|---|
| `$rc_monthly` | Monthly | `com.perfectplay.vegas.monthly` | `monthly` |
| `$rc_annual` | Annual | `com.perfectplay.vegas.annual` | `annual` |
| `visitor` | 48-Hour Pass | `com.perfectplay.vegas.visitor` | `visitor` |

5. Set `default` as the current offering.

### 3.7 Attach products to the Premium entitlement

1. Project → Entitlements → `premium` → Attach products.
2. Add all six products (3 iOS + 3 Android).
3. Save.

### 3.8 Configure the RevenueCat webhook (for Firestore sync)

This sends purchase events to np2 so web and native subscriber state stays in sync.

1. Project → Integrations → Webhooks → **+**.
2. Webhook URL: `https://perfectplay.vegas/api/revenuecat-webhook`
   *(This endpoint needs to be built in np2 — see Section 4.)*
3. Events to send: **all** (or at minimum: `INITIAL_PURCHASE`, `RENEWAL`, `CANCELLATION`, `EXPIRATION`).
4. Copy the **Webhook Signing Secret** — np2 needs it to verify the payload.
5. Save.

---

## Section 4 — np2 Webhook Endpoint

A new API route is needed in np2 to receive RevenueCat events and write membership state to
Firestore. This is ~40 lines of code mirroring what `/api/stripe-webhook` already does.

**What it needs to do:**

1. Verify the `X-RevenueCat-Signature` header using the signing secret from Section 3.8.
2. Parse the event body — RevenueCat sends JSON with an `event` object containing:
   - `event.type` — e.g. `INITIAL_PURCHASE`, `RENEWAL`, `CANCELLATION`, `EXPIRATION`
   - `event.app_user_id` — the Firebase UID (passed to RevenueCat as the user ID)
   - `event.product_id` — e.g. `com.perfectplay.vegas.monthly`
   - `event.expiration_at_ms` — Unix timestamp of subscription expiry
3. On `INITIAL_PURCHASE` or `RENEWAL`: write `member: true`, `paymentPlanType`, `currentPeriodEnd` to Firestore (keyed by user email or UID — match the existing schema).
4. On `CANCELLATION` or `EXPIRATION`: write `member: false`.

**Env var needed in np2:** `REVENUECAT_WEBHOOK_SECRET` (from Section 3.8).

This can be implemented in np2 separately and does not block the native app code.

---

## Section 5 — Environment Variables to Add

Once the above is complete, add these to `../perfectplay.env/.env`:

```
EXPO_PUBLIC_REVENUECAT_IOS_KEY=<your RevenueCat iOS public API key>
EXPO_PUBLIC_REVENUECAT_ANDROID_KEY=<your RevenueCat Android public API key>
```

And add this to np2's env:

```
REVENUECAT_WEBHOOK_SECRET=<your RevenueCat webhook signing secret>
```

---

## Section 6 — Checklist Before Starting Code

- [ ] App Store Connect: Monthly, Annual, and Visitor Pass products created and saved
- [ ] App Store Connect: API key (`.p8` file, Key ID, Issuer ID) downloaded
- [ ] Google Play Console: Monthly, Annual, and Visitor Pass products created and active
- [ ] Google Play Console: Service account JSON downloaded, permissions granted
- [ ] RevenueCat: project created, both apps added, API keys copied
- [ ] RevenueCat: entitlement `premium` created with all 6 products attached
- [ ] RevenueCat: `default` offering created with 3 packages
- [ ] RevenueCat: webhook URL configured, signing secret copied
- [ ] np2: `/api/revenuecat-webhook` endpoint built and deployed
- [ ] `perfectplay.env/.env`: both RevenueCat keys added
- [ ] np2 env: `REVENUECAT_WEBHOOK_SECRET` added

---

## Sandbox Testing (once code is implemented)

- **iOS:** Use a Sandbox tester account (create in App Store Connect → Users and Access → Sandbox Testers). StoreKit purchases in development automatically hit sandbox.
- **Android:** Use a Google Play licence tester account (Play Console → Setup → Licence testing). Test purchases are free and can be cancelled/refunded instantly.
- RevenueCat dashboard shows sandbox transactions in real time under Customer History.
