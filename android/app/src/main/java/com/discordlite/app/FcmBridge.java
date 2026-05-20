package com.discordlite.app;

import android.content.Context;
import android.content.SharedPreferences;
import android.webkit.JavascriptInterface;
import com.google.firebase.messaging.FirebaseMessaging;

public class FcmBridge {

    private static String fcmToken = null;
    private final Context context;

    public FcmBridge(Context context) {
        this.context = context;
        // Load saved token from prefs
        SharedPreferences prefs = context.getSharedPreferences("ducky_prefs", Context.MODE_PRIVATE);
        fcmToken = prefs.getString("fcm_token", null);

        // Always refresh token from Firebase
        FirebaseMessaging.getInstance().getToken()
            .addOnCompleteListener(task -> {
                if (task.isSuccessful() && task.getResult() != null) {
                    fcmToken = task.getResult();
                    // Save to prefs
                    prefs.edit().putString("fcm_token", fcmToken).apply();
                }
            });
    }

    public static void setToken(String token) {
        fcmToken = token;
    }

    @JavascriptInterface
    public String getFcmToken() {
        return fcmToken != null ? fcmToken : "";
    }
}
