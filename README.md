# Quaattack!

Tap-to-bonk mobile game: stop the ducks from stealing your picnic sandwich.
The whole game lives in `src/game.html` (the same page as the playtest artifact).
Capacitor wraps it as an iPhone and Android app.

## Build

```
npm install
npm run ios       # builds www/, syncs, opens Xcode (needs a Mac)
npm run android   # builds www/, syncs, opens Android Studio
```

After editing `src/game.html`, run `npm run sync` to copy it into both apps.

## In-app purchases

Purchases go through RevenueCat (`@revenuecat/purchases-capacitor`). In a browser the
shop stays a free test shop; inside the app it charges through the App Store or Google Play.

1. Create the power-up packs in App Store Connect and Google Play Console as **consumables**
   (Google: one-time products) with these IDs:

   | Pack | Product ID | Gives | Price |
   |---|---|---|---|
   | Bag of bread | `quaattack_bread_5` | 5 Bread | $0.99 |
   | Bucket of water | `quaattack_moat_5` | 5 Moats | $0.99 |
   | Megaphone | `quaattack_quack_3` | 3 Super Quacks | $0.99 |
   | Picnic bundle | `quaattack_picnic_bundle` | 5 Bread, 5 Moats, 3 Super Quacks | $2.49 |

   Styles are pay-what-you-want. Each paid style is sold as four **non-consumables**
   (Google: one-time products the app never consumes), and buying any one of them unlocks it.
   Classic Club and Red Gingham are free and have no product.

   | Tier | Product ID suffix | Google Play | App Store |
   |---|---|---|---|
   | 1 | `_t1` | $0.25 | $0.29 (Apple's lowest price) |
   | 2 | `_t2` | $1.00 | $0.99 or $1.00 |
   | 3 | `_t3` | $2.00 | $1.99 or $2.00 |
   | 4 | `_t4` | $5.00 | $4.99 or $5.00 |

   Product IDs are the style ID plus the suffix, for example `quaattack_blanket_ducks_t3`.
   That makes 28 products:

   | Style | Product ID prefix |
   |---|---|
   | PB&J sandwich | `quaattack_sandwich_pbj` |
   | Big Hoagie sandwich | `quaattack_sandwich_hoagie` |
   | Blue Gingham blanket | `quaattack_blanket_blue` |
   | Highland Plaid blanket | `quaattack_blanket_plaid` |
   | Polka Dots blanket | `quaattack_blanket_polka` |
   | Rainbow Stripes blanket | `quaattack_blanket_rainbow` |
   | Duck Print blanket | `quaattack_blanket_ducks` |

   The app shows each store's own local price. `LIST_PRICES` and `TIERS` in `src/game.html`
   are only what the browser test shop displays.

2. Create a RevenueCat project, connect both stores, and add the same product IDs.
3. Put the RevenueCat public SDK keys into `RC_KEYS` in `src/game.html`
   (`appl_...` for iOS, `goog_...` for Android), then `npm run sync`.

Every purchase sits behind a parental gate (a spelled-out multiplication question).
The app is listed for a general audience (rated 4+, not the Kids category), so the gate
isn't required, but it stays because younger kids play it.

## Save data

Progress, best scores, power-up stash and the daily streak are saved on the device.
Power-ups are consumables: deleting the app loses them, which is normal for consumables.
Styles are non-consumables tied to the store account: the app reads them back on launch,
and the shop's Restore purchases button (which Apple requires) brings them to a new device.

## Difficulty tools

`tools/` holds the simulated 8-year-old player used to calibrate the 100 levels
(`TUNE` and `DIFFICULTY` in `src/game.html`).

## Google Play release build

`.github/workflows/android-release.yml` builds the signed `.aab` that Play Console asks for.

1. Add four repository secrets (Settings → Secrets and variables → Actions):
   `ANDROID_KEYSTORE_BASE64`, `ANDROID_KEYSTORE_PASSWORD`, `ANDROID_KEY_ALIAS`, `ANDROID_KEY_PASSWORD`.
   The upload key and its passwords are kept outside the repo. Never commit them.
2. Open the Actions tab → **Android release bundle** → **Run workflow**, and enter a version like `1.0`.
3. When the run finishes, download the bundle from the run's **Artifacts** and upload it in Play Console.

Every run gets a higher version code automatically (the run number), so each upload is accepted.

## App Store (TestFlight) build

`.github/workflows/ios-testflight.yml` builds the iPhone app on a GitHub Mac runner, signs it with
Apple's cloud signing and uploads it to App Store Connect. No Mac needed.

1. Add four repository secrets: `APPLE_TEAM_ID`, `ASC_KEY_ID`, `ASC_ISSUER_ID` and `ASC_KEY_P8`
   (the whole text of the App Store Connect API key's `.p8` file, from an Admin-role key).
2. Actions tab → **iOS TestFlight upload** → **Run workflow**, with a version like `1.0`.
3. The build appears in App Store Connect → TestFlight after Apple finishes processing it (about 10–30 minutes).

The app runs on iPhone and iPad, portrait only. On iPad the whole game is scaled up from a phone-sized layout, so it plays the same.

## Store assets and website

- `store/google-play/`: the 512 px icon, the 1024×500 feature graphic and five 1080×2160 phone screenshots.
- `store/app-store/`: the 1024 px icon, iPhone screenshots in 6.9", 6.7", 6.5" and 6.3" sizes, and 13" iPad screenshots (2064×2752).
- `docs/`: the privacy policy (`privacy.html`) and a small home page. Turn on GitHub Pages
  (Settings → Pages → Deploy from a branch → `main`, folder `/docs`) and the policy is at
  https://sickgrof92.github.io/Quaattack/privacy.html.
