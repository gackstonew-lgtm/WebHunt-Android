# Google Play Store Release & Deployment Guide

This document outlines the exact steps to create a release keystore, configure release signing, generate the signed `app-release.aab` bundle, and upload it to the Google Play Console.

---

## 1. Creating a Production Keystore

Open a terminal or command prompt (where Java's `keytool` is in your PATH) and run:

```bash
keytool -genkeypair -v -keystore webhunt-release-key.jks -keyalg RSA -keysize 2048 -validity 10000 -alias webhunt_key
```

You will be prompted to:
1. Enter and confirm a strong keystore password.
2. Provide organization/developer details.
3. Confirm the distinguished name.

> [!CAUTION]
> Store `webhunt-release-key.jks` and your passwords in a secure password vault or encrypted backup. **If you lose this key, you will not be able to update your application on Google Play!**

---

## 2. Configuring `keystore.properties`

Create a file named `keystore.properties` inside the `android/` directory (adjacent to `build.gradle.kts`):

```properties
storeFile=C:/path/to/webhunt-release-key.jks
storePassword=YourKeystorePasswordHere
keyAlias=webhunt_key
keyPassword=YourKeyPasswordHere
```

> [!NOTE]
> `keystore.properties` and `*.jks` are already added to `android/.gitignore` and will never be committed into source control.

---

## 3. Generating the Signed Android App Bundle (AAB)

From the `android/` directory, execute:

### On Windows:
```cmd
gradlew.bat bundleRelease
```

### On macOS / Linux:
```bash
./gradlew bundleRelease
```

### Or using Android Studio GUI:
1. Select **Build ➔ Generate Signed Bundle / APK...**
2. Select **Android App Bundle** and click **Next**.
3. Choose your `webhunt-release-key.jks`, enter your passwords and alias.
4. Select destination folder and choose build variant **release**.
5. Click **Create**.

Your signed Google Play bundle will be generated at:
```
android/app/build/outputs/bundle/release/app-release.aab
```

---

## 4. Google Play Console Upload

1. Sign in to the [Google Play Console](https://play.google.com/console).
2. Select or create your application:
   - **App name**: `WebHunt`
   - **Default language**: English (United States)
   - **App or game**: App
   - **Free or paid**: Free (in-app purchases/subscriptions)
3. Under **Release ➔ Production** (or **Testing ➔ Internal testing**):
   - Click **Create new release**.
   - Upload `app-release.aab`.
   - Enter release notes (e.g. `Initial release of WebHunt for Android - Worldwide B2B & Remote Lead Radar`).
   - Click **Next** and review the release validation.
4. Complete the **Policy & Content** declarations:
   - **Privacy Policy**: Link to your live privacy policy (e.g. `https://webhunt.app/legal/privacy`).
   - **App Access**: Provide test credentials if required.
   - **Target Audience**: Age 18+.
   - **Data Safety Form**: Declare that the app collects email and name for account management, encrypted in transit over HTTPS.
5. Submit for review!
