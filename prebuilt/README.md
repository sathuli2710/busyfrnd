# Pre-built binaries

| File | App | ABIs | SHA-256 |
|---|---|---|---|
| `android/busyfrnd-customer.apk` | Customer app (`app.busyfrnd.customer`) | arm64-v8a, x86_64 | `e3fb89278e5d62bd854b75d8bde682f84da28ff7247124091aa9d28eb0206238` |
| `android/busyfrnd-vendor.apk` | Vendor app (`app.busyfrnd.vendor`) | arm64-v8a, x86_64 | `03875cd1016a471a419ca55e9efaec50175200ae772afbb18a200279f4e74cb4` |

* Built with `scripts/build-mobile.sh android all` (default `API_URL=http://10.0.2.2:4000`, i.e. an API running on the host of an Android emulator).
  On a real phone, open **Server settings** on the login screen and enter your API URL (e.g. `http://192.168.1.10:4000`).
* Signed with the Expo **debug** keystore: good for sideloading and testing, not for Google Play. Allows cleartext HTTP for testing.
* **iOS builds are not included**: they require macOS + Xcode (simulator) or an Apple Developer account (device/TestFlight). See the root README.
* Not tested on a device or emulator in the build environment.

* Rebuilt with the premium redesign (Reanimated, haptics, gradients, AI orb). The UI was verified by rendering the same React Native code with React Native Web in Chromium; native animations/haptics/voice still need a real-device check.
