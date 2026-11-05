# Pre-built binaries

| File | App | ABIs | SHA-256 |
|---|---|---|---|
| `android/busyfrnd-customer.apk` | Customer app (`app.busyfrnd.customer`) | arm64-v8a, x86_64 | `5066828e6d5e255e107abd3f433b9a49144168fdf1610508ef2f7283ff88ce38` |
| `android/busyfrnd-vendor.apk` | Vendor app (`app.busyfrnd.vendor`) | arm64-v8a, x86_64 | `869dfc6e8dde8f5308e2cf042032b3db36d3afa4a60971b5a1a7f37c9dbc805e` |

* Built with `scripts/build-mobile.sh android all` (default `API_URL=http://10.0.2.2:4000`, i.e. an API running on the host of an Android emulator).
  On a real phone, open **Server settings** on the login screen and enter your API URL (e.g. `http://192.168.1.10:4000`).
* Signed with the Expo **debug** keystore: good for sideloading and testing, not for Google Play. Allows cleartext HTTP for testing.
* **iOS builds are not included**: they require macOS + Xcode (simulator) or an Apple Developer account (device/TestFlight). See the root README.
* Not tested on a device or emulator in the build environment.
