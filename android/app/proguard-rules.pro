# ProGuard / R8 Rules for WebHunt Production App

# Keep Kotlin Serialization models
-keepattributes *Annotation*,Signature,InnerClasses,EnclosingMethod
-keepclassmembers class * {
    @kotlinx.serialization.Serializable <fields>;
}
-keep class com.webhunt.app.data.model.** { *; }

# Retrofit & OkHttp
-dontwarn okio.**
-dontwarn javax.annotation.**
-keepattributes EnclosingMethod
-keep class retrofit2.** { *; }
-keepclasseswithmembers class * {
    @retrofit2.http.* <methods>;
}

# AndroidX Security Crypto & Tink
-keepclassmembers class androidx.security.crypto.** { *; }
-dontwarn com.google.errorprone.annotations.**

# Coil image loading
-keep class coil.** { *; }

# Coroutines
-keepclassmembers class kotlinx.coroutines.** { *; }

