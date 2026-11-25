# SonicWave R8 / ProGuard Optimization Rules

# Keep application components declared in AndroidManifest.xml
-keep class com.sonicwave.app.SonicWaveApplication { *; }
-keep class com.sonicwave.app.MainActivity { *; }
-keep class com.sonicwave.app.service.ConversionForegroundService { *; }

# Keep engine models, history entries, and photo models
-keep class com.sonicwave.app.engine.** { *; }

# Keep youtubedl-android, embedded FFmpeg, and Aria2c bindings & JNI bridges
-keep class com.yausername.youtubedl_android.** { *; }
-keep class com.yausername.youtubedl_common.** { *; }
-keep class com.yausername.ffmpeg.** { *; }
-keep class com.yausername.aria2c.** { *; }
-dontwarn com.yausername.**

# Jackson / JSON databind used internally by youtubedl-android mapper
-keepnames class com.fasterxml.jackson.** { *; }
-keepclassmembers class * {
    @com.fasterxml.jackson.annotation.* <fields>;
    @com.fasterxml.jackson.annotation.* <methods>;
}
-dontwarn com.fasterxml.jackson.**

# Kotlinx serialization & reflection metadata
-keepattributes *Annotation*,Signature,InnerClasses,EnclosingMethod
-keep class kotlinx.serialization.** { *; }
-keepclassmembers class kotlinx.serialization.json.** {
    *** Companion;
}
-keepclasseswithmembers class * {
    @kotlinx.serialization.Serializable <fields>;
}

# Coroutines & Lifecycle ViewModel
-keepclassmembers class * extends androidx.lifecycle.ViewModel {
    <init>(...);
}
-keepclassmembers class * extends androidx.lifecycle.AndroidViewModel {
    <init>(android.app.Application);
}
-dontwarn kotlinx.coroutines.**

# Coil / OkHttp networking
-dontwarn okhttp3.**
-dontwarn okio.**
-dontwarn retrofit2.**
-dontwarn org.conscrypt.**
-dontwarn org.bouncycastle.**
-dontwarn org.openjsse.**
