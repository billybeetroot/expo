# EAS Setup Guide — PerfectPLAY Native App

This guide covers the one-time setup needed to use Expo EAS Build for this project.
After completing it, you will never need to use Xcode as a build tool — only as a
simulator host.

---

## Background

This project uses **Expo managed workflow** with `expo-dev-client`. The build chain is:

- **EAS Build** (cloud) — compiles the native iOS and Android binaries
- **`expo-dev-client`** — a custom development shell (like Expo Go, but includes all the
  project's native modules: `expo-speech-recognition`, `react-native-purchases`, etc.)
- **`yarn start`** — runs the Metro JS bundler; the dev client connects to it for hot reload

You build the dev client once (or when native packages change). Daily JS development
requires only `yarn start` — no builds, no Xcode, no queue.

---

## Section 1 — Install EAS CLI

```bash
npm install -g eas-cli
```

Verify:

```bash
eas --version
# Should print 12.x or higher
```

---

## Section 2 — Create an Expo Account

If you don't already have one:

1. Go to [expo.dev](https://expo.dev) and sign up.
2. Confirm your email.

---

## Section 3 — Log In

```bash
eas login
```

Enter your Expo account email and password when prompted.

---

## Section 4 — Link the Project to Your Expo Account

Run this from inside the project directory:

```bash
cd /Users/macb/devspot/expo
eas init
```

This will:
- Ask you to confirm the app name (`PerfectPLAY`) and slug (`perfectplay`)
- Create the app on expo.dev if it doesn't exist
- Write a `projectId` into `app.json` under `expo.extra.eas`

After it completes, `app.json` will have a new block like:

```json
"extra": {
  "eas": {
    "projectId": "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
  }
}
```

Commit this change:

```bash
git add app.json
git commit -m "Add EAS project ID"
git push origin main
```

---

## Section 5 — Apple Credentials (iOS builds)

EAS needs to sign iOS builds with your Apple Developer account certificates.

1. Make sure you are enrolled in the **Apple Developer Program**
   ([developer.apple.com](https://developer.apple.com)) — paid membership required for
   device builds and App Store submission.
2. When you run your first iOS build (Section 6), EAS will prompt you to sign in with
   your Apple ID and will manage certificates and provisioning profiles automatically.
   Choose **"Let EAS handle credentials"** when asked — this is the recommended path.

> **Simulator builds** (development profile) do not require Apple credentials or a paid
> developer account. You only need credentials for device builds and production.

---

## Section 6 — Build the Development Client

### iOS Simulator

```bash
yarn build:sim:ios
```

This creates a `.tar.gz` simulator build in the cloud. EAS will:
1. Queue the build (may take 10–20 minutes on the free tier)
2. Send you an email with a download link when complete
3. Show a QR code / link in the terminal

When complete, install it on the simulator:

```bash
# Extract the .tar.gz, then:
xcrun simctl install booted PerfectPLAY.app
```

Or simply drag the `.app` file onto the running simulator window.

### Android Emulator

```bash
yarn build:sim:android
```

This creates an `.apk` file. When complete:

1. Start your Android emulator (via Android Studio AVD Manager)
2. Drag the downloaded `.apk` onto the emulator window

---

## Section 7 — Daily Development Workflow

Once the dev client is installed on the simulator:

```bash
yarn start
```

This starts the Metro bundler. Open the PerfectPLAY app on the simulator — it will connect
to Metro automatically. JS changes hot-reload instantly. No builds needed.

**When do you need to rebuild?**

Only when you add or update a native package (e.g. installing `react-native-purchases` in
Phase 8). After `yarn add <package>`, run `yarn build:sim:ios` again and reinstall.

---

## Section 8 — Production Builds

When ready to submit to the App Store or Google Play:

```bash
# Build production binary
yarn build:ios
yarn build:android

# Submit to stores
yarn submit:ios
yarn submit:android
```

EAS Submit will prompt for App Store Connect credentials (Apple ID + app-specific password
or API key) on first run. It can also be configured in `eas.json` to avoid re-entering
credentials each time.

---

## Section 9 — Preview Builds (TestFlight / Internal Testing)

For sharing a release-quality build without going through full App Store review:

```bash
yarn build:preview:ios
```

This builds a release configuration and can be uploaded to TestFlight. Useful for testing
payment flows (RevenueCat sandbox), voice features on a physical device, and general QA
before submission.

---

## Quick Reference

| Task | Command |
|---|---|
| Log in to EAS | `eas login` |
| Link project (one-time) | `eas init` |
| Daily development | `yarn start` |
| Build iOS dev client (simulator) | `yarn build:sim:ios` |
| Build Android dev client (emulator) | `yarn build:sim:android` |
| Build iOS preview (TestFlight) | `yarn build:preview:ios` |
| Build production iOS | `yarn build:ios` |
| Build production Android | `yarn build:android` |
| Submit to App Store | `yarn submit:ios` |
| Submit to Google Play | `yarn submit:android` |
| Check build status | `eas build:list` |

---

## Notes

- **Free tier limits:** EAS free tier allows 30 builds/month. Development and preview builds
  count toward this limit. The paid Production plan (~$29/month) gives unlimited builds and
  priority queue.
- **Build queue:** iOS builds typically take 10–20 minutes on the free tier (including queue
  wait). Android builds are usually faster.
- **Local builds:** If queue times are a problem, `eas build --local` runs the build on your
  machine. This still requires Xcode installed but does not require opening Xcode or managing
  the project manually.
- **Xcode role:** Xcode is installed on your machine only to provide the iOS Simulator. It
  is not used as a build tool.
