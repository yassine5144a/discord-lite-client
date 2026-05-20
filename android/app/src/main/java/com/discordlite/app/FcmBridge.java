package com.discordlite.app;

import android.content.Context;
import android.content.SharedPreferences;
import android.webkit.JavascriptInterface;

public class FcmBridge {

    private static String fcmToken = null;
    private final Context context;

    public FcmBridge(Context context) {
        this.context = context;
        // Load saved token
        SharedPreferences prefs = context.getSharedPreferences("ducky_prefs", Context.MODE_PRIVATE);
        fcmToken = prefs.getString("fcm_token", null);
    }

    public static void setToken(String token) {
        fcmToken = token;
    }

    @JavascriptInterface
    public String getFcmToken() {
        return fcmToken != null ? fcmToken : "";
    }
}
