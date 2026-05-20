package com.discordlite.app;

import android.content.Context;
import android.media.AudioManager;
import android.webkit.JavascriptInterface;

public class AudioBridge {
    private final Context context;

    public AudioBridge(Context context) {
        this.context = context;
    }

    // Called from JS before getUserMedia to set correct audio mode
    @JavascriptInterface
    public void setCallMode() {
        AudioManager am = (AudioManager) context.getSystemService(Context.AUDIO_SERVICE);
        if (am != null) {
            am.setMode(AudioManager.MODE_IN_COMMUNICATION);
            am.setSpeakerphoneOn(true);
            am.setStreamVolume(
                AudioManager.STREAM_VOICE_CALL,
                am.getStreamMaxVolume(AudioManager.STREAM_VOICE_CALL),
                0
            );
        }
    }

    @JavascriptInterface
    public void setNormalMode() {
        AudioManager am = (AudioManager) context.getSystemService(Context.AUDIO_SERVICE);
        if (am != null) {
            am.setMode(AudioManager.MODE_NORMAL);
            am.setSpeakerphoneOn(false);
        }
    }

    @JavascriptInterface
    public boolean isMicPermissionGranted() {
        return android.content.pm.PackageManager.PERMISSION_GRANTED ==
            context.checkSelfPermission(android.Manifest.permission.RECORD_AUDIO);
    }
}
