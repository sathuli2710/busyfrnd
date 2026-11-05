#!/usr/bin/env bash
# Local native build of the mobile apps (no EAS account needed for Android).
#   scripts/build-mobile.sh android [customer|vendor|all]   -> prebuilt/android/*.apk   (Linux/macOS/Windows-WSL, needs JDK 17 + Android SDK)
#   scripts/build-mobile.sh ios     [customer|vendor|all]   -> prebuilt/ios/*.app.tar.gz (macOS + Xcode only: simulator build)
# Production store builds (signed AAB/IPA) should use EAS:  pnpm --filter @busyfrnd/customer-mobile build:production
# API_URL bakes the server address into the app (users can still override it on the login screen).
set -euo pipefail
PLATFORM=${1:?usage: build-mobile.sh <android|ios> [customer|vendor|all]}
WHICH=${2:-all}
ROOT=$(cd "$(dirname "$0")/.." && pwd)
export EXPO_PUBLIC_API_URL=${API_URL:-${EXPO_PUBLIC_API_URL:-http://10.0.2.2:4000}}
export EXPO_NO_TELEMETRY=1 CI=1
OUT="$ROOT/prebuilt/$PLATFORM"; mkdir -p "$OUT"

build_one() {
  local app=$1 dir="$ROOT/apps/$1-mobile"
  echo "=== $PLATFORM: $app (API: $EXPO_PUBLIC_API_URL)"
  ( cd "$dir"
    rm -rf android ios
    npx expo prebuild --platform "$PLATFORM" --no-install --clean
    if [ "$PLATFORM" = android ]; then
      ( cd android && ./gradlew assembleRelease --no-daemon -Dorg.gradle.jvmargs="-Xmx4g -XX:MaxMetaspaceSize=1g" \
          -PreactNativeArchitectures="${ANDROID_ARCHS:-arm64-v8a,x86_64}" )
      cp android/app/build/outputs/apk/release/app-release.apk "$OUT/busyfrnd-$app.apk"
    else
      ( cd ios && pod install && xcodebuild -workspace *.xcworkspace -scheme "$(ls -d *.xcworkspace | sed 's/.xcworkspace//')" \
          -configuration Release -sdk iphonesimulator -derivedDataPath build CODE_SIGNING_ALLOWED=NO )
      tar -czf "$OUT/busyfrnd-$app.app.tar.gz" -C ios/build/Build/Products/Release-iphonesimulator ./*.app
    fi
    rm -rf android ios )
}

case "$WHICH" in all) build_one customer; build_one vendor;; customer|vendor) build_one "$WHICH";; *) echo "unknown app $WHICH"; exit 1;; esac
echo "Done -> $OUT"; ls -lh "$OUT"
