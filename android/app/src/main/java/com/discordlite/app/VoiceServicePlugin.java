package com.discordlite.app;

import android.content.Intent;
import android.os.Build;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

@CapacitorPlugin(name = "VoiceService")
public class VoiceServicePlugin extends Plugin {

    @PluginMethod
    public void startService(PluginCall call) {
        Intent intent = new Intent(getContext(), VoiceCallService.class);
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            getContext().startForegroundService(intent);
        } else {
            getContext().startService(intent);
        }
        call.resolve();
    }

    @PluginMethod
    public void stopService(PluginCall call) {
        Intent intent = new Intent(getContext(), VoiceCallService.class);
        intent.setAction("STOP");
        getContext().startService(intent);
        call.resolve();
    }
}
