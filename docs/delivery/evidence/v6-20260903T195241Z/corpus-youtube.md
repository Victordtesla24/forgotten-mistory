# YouTube Channel Corpus — @vicd0ct

**Dataset:** `corpus-youtube` · **Schema** 1.0.0 · **Generated** 2026-09-03T20:08:39Z
**Contract:** R-8, R-113, R-114, R-115, R-119, R-122, R-143, R-182, SC-64.1

## What the channel actually contains

The channel is REACHABLE and NOT empty. It has 10 public videos plus 1 unlisted video that a public playlist exposes. Titles, publish dates, durations and full verbatim descriptions were retrieved for all 11. NO transcript or caption text was retrievable from this host: every watch request was bot-gated (LOGIN_REQUIRED), including from a real browser.

| Item | Count |
|---|---|
| Public videos | 10 |
| Unlisted videos discovered | 1 |
| Total video records in this corpus | 11 |
| Shorts | 0 |
| Live streams / past streams | 0 |
| Playlists | 2 |
| Podcast listings | 1 |
| Videos with full verbatim description captured | 11 |
| Videos with transcript text captured | 0 |

### Channel facts (all sourced)

| Field | Value | Source |
|---|---|---|
| Handle | `@vicd0ct` | resolved from the requested URL |
| Display title | Vic | `ytInitialData.metadata.channelMetadataRenderer.title` |
| Channel ID | `UCJSYpoFkGKKzYTKzAr8vGzQ` | `ytInitialData.metadata.channelMetadataRenderer.externalId` |
| Country | Australia | `aboutChannelViewModel.country` |
| Joined | Joined May 28, 2015 | `aboutChannelViewModel.joinedDateText.content` |
| Video count claimed by YouTube | 10 videos | `aboutChannelViewModel.videoCountText` |
| Tabs present | Home, Videos, Podcasts, Playlists, Search | channel page `ytInitialData` tabs |
| Channel keywords | *(empty string served)* | `channelMetadataRenderer.keywords` |

Channel description, verbatim:

```text
Hello, I’m Vikram, and I work as a Senior Technical Program Manager AI Solution Architect here in Melbourne.

I'm really passionate about solving complex problems and leading teams through challenging projects.

Whether it's discussing the latest in technology, debating philosophical ideas, or planning my next adventure, I love diving deep into topics that spark my genuine whimsy. 

My approach to Life is very simple, I do what brings happiness and value, while making sure I not causing harm to anyone or anything along the way. 
🇦🇺 Naarm
```

Absent tabs, with the exact tool output:

- **/shorts** — `yt-dlp: 'ERROR: [youtube:tab] @vicd0ct: This channel does not have a shorts tab'`
- **/streams** — `yt-dlp: 'ERROR: [youtube:tab] @vicd0ct: This channel does not have a streams tab'`
- **/releases** — `yt-dlp: 'ERROR: [youtube:tab] @vicd0ct: This channel does not have a releases tab'`

## How it was retrieved

**No `YOUTUBE_API_KEY` exists.** Listed variable NAMES only from ~/.claude/.env.production via `grep -oE '^[A-Za-z_][A-Za-z0-9_]*=' | tr -d '='`. 45 names returned; no YOUTUBE_API_KEY (nor any YOUTUBE_* name) among them. No secret values were read, printed or stored.

Methods, in the preference order the task specified:

| Rank | Method | Status | Detail |
|---|---|---|---|
| (a) | yt-dlp | **PARTIAL SUCCESS** | System /usr/local/bin/yt-dlp is BROKEN (ModuleNotFoundError: No module named 'yt_dlp'). Downloaded the standalone linux binary yt-dlp 2026.08.19 into the scratchpad (NOT into the repo) and used it. Channel-tab and playlist enumeration succeeded. Per-video extraction FAILED - bot-gated. |
| (b) | firecrawl MCP | **NOT NEEDED** | curl + ytInitialData parsing already returned the full server-rendered payload; firecrawl was not required. |
| (c) | curl + ytInitialData/ytInitialPlayerResponse parsing | **SUCCESS** | Primary source for per-video title, publish date and verbatim description, and for all channel About fields. |
| (d) | Playwright (real Chrome, headless, unauthenticated) | **USED FOR VERIFICATION ONLY** | Confirmed the bot gate is not a curl artifact: a real browser also received playabilityStatus=LOGIN_REQUIRED and rendered 0 transcript segments. |

**Enumeration method of record:** yt-dlp 2026.08.19 --flat-playlist --dump-single-json against /videos, /podcasts, /playlists (and /shorts, /streams, /releases which do not exist), cross-checked against ytInitialData parsed from the curl-fetched channel page.

**Per-video method of record:** curl watch page + parse ytInitialData (videoPrimaryInfoRenderer, videoSecondaryInfoRenderer, badges).

> The system `yt-dlp` at `/usr/local/bin/yt-dlp` is broken on this host (`ModuleNotFoundError: No module named 'yt_dlp'`). A standalone `yt-dlp 2026.08.19` binary was fetched into the scratchpad, used, and deleted. Nothing was installed into the repo.

## The videos

Ordered newest first, as the channel presents them. Durations are `mm:ss`.

| # | Video ID | Title | Published | Duration | Listing | Desc. chars |
|---|---|---|---|---|---|---|
| 1 | `p9pGAmqJCSk` | JARVIS - I Built a Real Arc Reactor HUD for My Mac (Apple Silicon Telemetry) | Apr 16, 2026 | 2:01 | Public | 1781 |
| 2 | `OEn5RzSEwpc` | Lost Birth Time? An Ancient "Sherlock Holmes" Method now can Find It | Nov 27, 2025 | 3:10 | Public | 1317 |
| 3 | `gMe4FZbjcQE` | Part 2: I Coded a 7,000-Year-Old Algorithm (It Actually Works) | Nov 25, 2025 | 10:05 | Public | 905 |
| 4 | `TDOubaCAw7I` | Part 1: How 7,000 years old Sanskrit Verses mapped the Cosmos without Computers | Nov 22, 2025 | 8:37 | Public | 506 |
| 5 | `6RT2caAAYfs` | प्राचीन अल्गोरिदम (भाग ३): प्राचीन भारताचे हे 'अल्गोरिदम' आज जगासाठी का महत्वाचे आहे? 🌍✨ | Nov 20, 2025 | 6:26 | Public | 835 |
| 6 | `c_M_LSB65RA` | प्राचीन अल्गोरिदम (भाग २): ७००० वर्ष जुने संस्कृत श्लोक जेव्हा 'पायथन कोड' (Python Code) बनतात! 🐍💻 | Nov 20, 2025 | 6:47 | Public | 908 |
| 7 | `_L-jRltlZI4` | प्राचीन अल्गोरिदम (भाग १):  ५००० वर्षांपूर्वी टेलिस्कोपशिवाय भारतीय ऋषींनी अवकाश कसे मोजले? 🔭 | Nov 20, 2025 | 7:35 | Public | 863 |
| 8 | `Q5yGe7uBkFA` | 7000 years old algorithm | Nov 20, 2025 | 0:44 | Public | 89 |
| 9 | `Q1NwbcHbAh0` | The 7,000-Year-Old Code Hidden in Sanskrit (Vedic Astronomy/Astrology) | Nov 19, 2025 | 7:13 | Public | 766 |
| 10 | `oiTfTeqvP0Y` | दिव्य संहिता :- प्राचीन विज्ञान | Nov 19, 2025 | 7:58 | Public | 243 |
| 11 | `9meaN-ZZAvc` | I Coded a 7,000-Year-Old Algorithm (It Actually Works) | Nov 22, 2025 | 10:03 | Unlisted | 905 |

Publish dates are day-precision as rendered by YouTube (`videoPrimaryInfoRenderer.dateText`). The bot-gated page did **not** serve `itemprop="uploadDate"`, `itemprop="datePublished"` or `playerMicroformatRenderer.publishDate`, so no ISO timestamp is available for any video — day precision is the maximum this evidence supports.

Full verbatim descriptions for all 11 videos are in `corpus-youtube.json` under `videos[].description.value`.

## What is NOT observable

### 1. Transcripts and captions — for every one of the 11 videos

Recorded as `"not observable"` in the JSON, per video. This is not a partial failure; **zero** transcript text was retrieved.

Every watch-page request from this host returned:

```text
playabilityStatus.status  = "LOGIN_REQUIRED"
playabilityStatus.reason  = "Sign in to confirm you’re not a bot"
captions.playerCaptionsTracklistRenderer.captionTracks = []  (absent)
```

Commands attempted and their exact output:

- `/tmp/.../ytdlp --dump-json --skip-download 'https://www.youtube.com/watch?v=<id>'`
  - exit `1` — ERROR: [youtube] <id>: Sign in to confirm you’re not a bot. Use --cookies-from-browser or --cookies for the authentication.
- `/tmp/.../ytdlp --dump-json --extractor-args 'youtube:player_client=<tv_simply|web_safari|android_vr|mweb|tv>' ...`
  - exit `1` — same 'Sign in to confirm you’re not a bot' error for all five alternate player clients
- `POST https://www.youtube.com/youtubei/v1/get_transcript (WEB client 2.20260903.01.00, params from watch-page getTranscriptEndpoint, with and without visitorData/API key)`
  - exit `400` — HTTP 400 {"error":{"code":400,"message":"Precondition check failed.","reason":"failedPrecondition"}}
- `Playwright (real Chrome, headless, unauthenticated) -> navigate watch page, click 'Show transcript'`
  - exit `0` — ytInitialPlayerResponse.playabilityStatus.status='LOGIN_REQUIRED'; captionTracks length 0; transcript engagement panel opened but rendered 0 ytd-transcript-segment-renderer nodes

Notably, a **`Show transcript` control IS advertised** on all 11 videos (`getTranscriptEndpoint` present in `ytInitialData`), which indicates transcripts exist server-side. Clicking it in a real headless Chrome opened the panel and rendered **0** `ytd-transcript-segment-renderer` nodes. So the transcripts exist but are not reachable unauthenticated from this host.

**What would make them observable:** An authenticated YouTube session (channel-owner cookies) or a YOUTUBE_API_KEY with captions.download scope. Neither is present on this host.

### 2. Like counts

`"not observable"` — the like control renders, but no count is exposed in the unauthenticated, bot-gated payload.

### 3. ISO publish timestamps

`not observable` — see the note under the video table. Day precision only.

## Vanity metrics (R-119)

R-119 forbids vanity metrics in headline position. They are recorded here **as availability only**. These values must not be used as headline data on the site.

| Metric | Available? | Observed value |
|---|---|---|
| Subscriber count | Yes | 83 subscribers |
| Channel total views | Yes | 3,737 views |
| Per-video view count | Yes (all 11) | see `videos[].vanity_metrics_availability` |
| Per-video like count | No | not observable |

## Playlists

### The Math of the Stars

`PLrQIbUti-A-GqWuBEQbxvIVIhh4_x-BEg` · listed as *playlist* · 4 distinct videos: `9meaN-ZZAvc`, `TDOubaCAw7I`, `Q5yGe7uBkFA`, `Q1NwbcHbAh0`

Description, verbatim:

```text
"History books say one thing, the stars say another. What do you trust more?
```

### प्राचीन अल्गोरिदम: ५००० वर्षांपूर्वी टेलिस्कोपशिवाय भारतीय ऋषींनी अवकाश कसे मोजले? 🔭

`PLrQIbUti-A-EUHHEUZIsVj7BQoWZrUTbV` · listed as *playlist + podcast* · 3 distinct videos: `6RT2caAAYfs`, `c_M_LSB65RA`, `_L-jRltlZI4`

Description, verbatim:

```text
५००० वर्षांपूर्वी, जेव्हा जगात कोणाकडेही कॉम्प्युटर किंवा टेलिस्कोप नव्हते, तेव्हा आपल्या भारतीय ऋषींनी ग्रहांची स्थिती इतक्या अचूकपणे कशी मोजली? 🤯

'द एन्शियंट अल्गोरिदम' (The Ancient Algorithm) च्या पहिल्या भागात आपण इतिहासाची पाने उलघडून पाहणार आहोत. सिंधू संस्कृतीपासून ते छत्रपती शिवाजी महाराजांच्या काळापर्यंत, ज्योतिषशास्त्र हे केवळ भविष्य बघण्याचे साधन नसून, ते जगातील पहिले 'डेटा सायन्स' कसे होते, हे आपण पुराव्यासह पाहणार आहोत.
```

## Findings that constrain the R-113..R-122 strand

**The strand has real material.** 11 records with sourced titles, day-precision publish dates, durations and full verbatim descriptions. The channel is a genuine, if small, creator evidence stream: 10 public videos published between Nov 19 2025 and Apr 16 2026, on two subjects — Vedic/Sanskrit astronomy algorithms (9 videos, English and Marathi) and a macOS telemetry HUD project called JARVIS (1 video).

**The strand cannot quote speech.** R-113..R-122 build a site strand on this corpus. The strand CAN be built from titles + publish dates + durations + verbatim descriptions (11 records, all sourced). It CANNOT quote spoken content: no transcript was observable. Any on-site quotation of what is SAID in a video would be fabrication under the current evidence.

**One video is unlisted and must be excluded.**

9meaN-ZZAvc is Unlisted. It is a near-duplicate of the public gMe4FZbjcQE (identical 905-character description; titles differ only by the 'Part 2: ' prefix; 603s vs 605s). Treat it as NOT publishable content: publishing an unlisted video on the site would expose material the creator chose not to list, even though a public playlist already leaks it.

The unlisted item is detected by `videoPrimaryInfoRenderer.badges[].metadataBadgeRenderer` = `{icon: PRIVACY_UNLISTED, label: "Unlisted"}`. The public video `gMe4FZbjcQE` carries no such badge. YouTube's own About tab reports **10 videos**, corroborating that the 11th is not public.

**Language split matters for presentation.** 4 of the 10 public videos are in Marathi (Devanagari titles and descriptions); 6 are in English. Any listing UI must render Devanagari correctly.

