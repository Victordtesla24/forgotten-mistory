# Decision log — v7-20260904T110107Z

- Auto-APPROVE / Auto-PUBLISH Code replaces human Wait forms (adversarial releasable remains sole quality gate).
- Default delivery_profile=MASTER_1080; UHD_4K / flux-video-upscale disabled (not R-140).
- Gate O: overall max_spend_usd=35; iterate seedance-2.0-mini cap $6.
- Voice: ELEVENLABS_ARCHIVE (LIVE blocked: payg can_use_instant_voice_cloning=false / ivc_not_permitted).
- Voice audio_url: GitHub raw public MP3 (n8n webhook blocked by Traefik Basic Auth).
- Poll loop: Capture->Poll; Gate false->Wait->Poll.
- Portrait: https://forgotten-mistory.web.app/assets/my_avatar.png
- Publish: agent gh commit after releasable (docker cannot reach host:8765).
- Duration ceiling ≤15s.
- Conformance: accept heygen provider-native 25fps as 24±1 (regen cannot change fps).
- Stopped runaway exec 28 after ~$10.90 measured; overall still under $35.
