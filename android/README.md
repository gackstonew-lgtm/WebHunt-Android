# WebHunt Native Android Studio Application

Production-ready native Android Studio application in Kotlin for **WebHunt — Worldwide B2B & Remote Tech Lead Radar**.

---

## 📱 Project Specifications

| Property | Value |
|---|---|
| **Application ID** | `com.webhunt.app` |
| **Namespace** | `com.webhunt.app` |
| **Minimum SDK** | API 26 (Android 8.0 Oreo) |
| **Target SDK** | API 35 (Android 15) |
| **Compile SDK** | API 35 |
| **Version Code** | `1` |
| **Version Name** | `1.0.0` |
| **Programming Language** | Kotlin 2.1.0 |
| **UI Framework** | Jetpack Compose (Material 3 with custom WebHunt tokens) |
| **Networking** | Retrofit 2.11 + OkHttp 4.12 + KotlinX Serialization |
| **Security** | Android KeyStore + EncryptedSharedPreferences (AES256-GCM) |

---

## 🚀 Opening in Android Studio

1. Launch **Android Studio** (Koala / Ladybug / Meerkat or newer recommended).
2. Select **File ➔ Open...** (or "Open" from the Welcome screen).
3. Browse to the `android/` directory inside this repository:
   ```
   c:\xampp\htdocs\WebHunt Android\android
   ```
4. Click **OK**. Android Studio will import the Gradle project, resolve dependencies from Google & Maven Central, and index the project automatically.
5. Make sure **JDK 17** or **JDK 21** is selected under **Settings ➔ Build, Execution, Deployment ➔ Build Tools ➔ Gradle ➔ Gradle JDK**.

---

## 🌐 Configuring Backend API Connection

The native Android app communicates with your WebHunt Next.js server via standard REST API endpoints under `/api/mobile/`:

- **Android Emulator**: Uses `http://10.0.2.2:3000/` automatically in debug builds (maps to `http://localhost:3000` on your development PC).
- **Physical Device / Production**: Set your live production domain in `android/app/build.gradle.kts`:
  ```kotlin
  buildTypes {
      release {
          buildConfigField("String", "BASE_URL", "\"https://your-webhunt-domain.com/\"")
      }
  }
  ```

---

## 🔒 Security Guarantee

- **Zero Secrets in APK**: The APK/AAB contains **no** database credentials, private API keys, or server secrets. All external provider searches (OpenStreetMap, Google Places, Remote Job Feeds) are executed on the backend via authenticated endpoints.
- **Hardware-Backed Session Security**: Session tokens are stored using `EncryptedSharedPreferences` encrypted with an AES256-GCM master key managed by the hardware Android KeyStore.
- **Strict HTTPS Network Policy**: Cleartext HTTP traffic is forbidden in release mode via `network_security_config.xml`.

---

## 📦 Generating Google Play Release Artifact (AAB)

To generate the signed Android App Bundle (`app-release.aab`):

1. Follow the instructions in [PLAY_STORE_RELEASE_GUIDE.md](./PLAY_STORE_RELEASE_GUIDE.md) to generate your keystore and set up `keystore.properties`.
2. Run in terminal or Android Studio Gradle panel:
   ```bash
   ./gradlew bundleRelease
   ```
3. Your signed production bundle will be located at:
   ```
   android/app/build/outputs/bundle/release/app-release.aab
   ```
