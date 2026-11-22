# Quaattack! playable ad

A guided demo of under 30 seconds of the game, made to run inside other apps as a playable ad.

**Upload this file:** `playable/dist/quaattack-playable.html`

## What the viewer plays

1. **Tap the ducks.** Three mallards waddle in, with a pointing hand on the nearest one.
2. **Throw bread.** A flock arrives, time slows down, and the Bread button glows. Tap it, tap the grass, then bonk the ducks while they snack.
3. **Ducklings.** Two lines of fast ducklings.
4. **Swarm.** 28 ducks rush in from every side. Time slows again and the Super Quack button glows. One tap sends every duck flying.
5. **Magic Goose.** The wizard goose teleports on every bonk and takes four hits (six in the game).
6. **End card** with the score, birds bonked, and a big **Play Free** button.

The demo can't be lost. A duck that reaches the blanket takes a bite, but at least one bite of sandwich always survives.
A viewer who keeps tapping reaches the end card in about 17 seconds. Each beat has a time limit: leftover ducks run off, and if a power-up prompt is ignored for 2 seconds, the ad uses it for them. So even with no taps at all, the end card shows up by 25 seconds (`END_BY` in `playable/playable.html`).
A small **Install** button stays in the top corner the whole time.

## Ad network specs it meets

- One HTML file with everything inline: art drawn in code, fonts and sounds embedded as base64. It makes no network requests.
- About 250 KB, well under the usual 2 MB and 5 MB limits.
- MRAID 2.0/3.0 aware. It waits for `ready` and for the ad to be viewable before starting, pauses when hidden, and opens the store with `mraid.open()`.
  Without MRAID, it uses the network's own hook when one exists (`FbPlayableAd.onCTAClick()` for Meta, `ExitApi.exit()` for Google Ads), then `window.open()`.
- Works in portrait and landscape. In landscape the power-ups move into a column on the right. Tablets get the phone layout scaled up.
- Silent until the first touch, with a mute button.

Most networks (AppLovin, Unity, ironSource, Mintegral, Liftoff, Vungle) inject `mraid.js` themselves, so the file doesn't include a `<script src="mraid.js">` tag.
If a network's validator asks for one, add it inside `<head>` of the built file before uploading.
Google Ads wants a zip with the HTML, so zip `quaattack-playable.html` on its own.

## Store links

The Android link points at the real package, `com.quaattack.game`.
The App Store ID isn't in the repo yet, so the iPhone link is a placeholder (`id0000000000`). Rebuild with the real one before launching:

```
IOS_URL=https://apps.apple.com/app/id1234567890 npm run playable
```

`ANDROID_URL` works the same way, for example to add campaign tracking parameters.

## Editing

The ad's flow, layout and text live in `playable/playable.html`.
The duck art, picnic, sounds, bonking, goose teleport, bread toss and super quack are copied out of `src/game.html` every time you build, so changes to the game's art show up in the ad automatically.

```
npm run playable
```

The build fails if a piece it copies from the game is renamed, if anything would load from the network, or if the file goes over 5 MB.

## Fonts

Bagel Fat One and Baloo 2 (Latin subsets) are in `playable/fonts/`. Both are from Google Fonts under the SIL Open Font License, which allows embedding them.
