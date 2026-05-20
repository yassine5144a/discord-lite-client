package com.discordlite.app;

import android.content.Context;
import android.content.Intent;
import android.os.Build;
import android.webkit.JavascriptInterface;

public class VoiceBridge {
    private final Context context;

    public VoiceBridge(Context context) {
        this.context = context;
    }

    @JavascriptInterface
    public void startVoiceService() {
        Intent intent = new Intent(context, VoiceCallService.class);
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            context.startForegroundService(intent);
        } else {
            context.startService(intent);
        }
    }

    @JavascriptInterface
    public void stopVoiceService() {
        Intent intent = new Intent(context, VoiceCallService.class);
        intent.setAction("STOP");
        context.startService(intent);
    }

    @JavascriptInterface
    public boolean isVoiceServiceRunning() {
        return VoiceCallService.isRunning;
    }
}
