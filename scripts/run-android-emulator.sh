#!/usr/bin/env bash
# scripts/run-android-emulator.sh
#
# End-to-end: finish the throttled NDK + system image install, create an
# AVD, boot the emulator headless, build the Android APK (the real
# "rule out Expo compilation issues" test), install it, launch it,
# verify the app booted, and (with --notify) post a Discord message
# via Hermes Agent ONLY on full success.
#
# Usage:
#   scripts/run-android-emulator.sh                # build + emulator, no notify
#   scripts/run-android-emulator.sh --notify       # + hermes discord on success
#   scripts/run-android-emulator.sh --skip-emulator # gradle build only (no AVD)
#
# Idempotent: safe to re-run. sdkmanager skips installed packages;
# the AVD is created only if missing; gradle assembleDebug is a clean
# build. Long steps (NDK/system image download, gradle build) log to
# /tmp/emu-setup/.

set -euo pipefail

REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
export ANDROID_HOME="${ANDROID_HOME:-/home/asdf/Android/Sdk}"
export ANDROID_SDK_ROOT="$ANDROID_HOME"
export JAVA_HOME="${JAVA_HOME:-/usr/lib/jvm/java-21-openjdk}"
export PATH="$JAVA_HOME/bin:$ANDROID_HOME/platform-tools:$ANDROID_HOME/cmdline-tools/latest/bin:$PATH"
export EXPO_NO_TELEMETRY=1
export CI=1

NDK_VERSION="29.0.14206865"
SYSTEM_IMAGE="system-images;android-34;default;x86_64"
AVD_NAME="fieldsight-mvp"
APK_PATH="$REPO_ROOT/android/app/build/outputs/apk/debug/app-debug.apk"
HERMES_CHANNEL="discord:#general"
LOG_DIR="/tmp/emu-setup"
mkdir -p "$LOG_DIR"

NOTIFY=0
SKIP_EMULATOR=0
for arg in "$@"; do
  case "$arg" in
    --notify) NOTIFY=1 ;;
    --skip-emulator) SKIP_EMULATOR=1 ;;
    --channel=*) HERMES_CHANNEL="${arg#--channel=}" ;;
  esac
done

log() { printf '[run-android] %s\n' "$*"; }

ensure_ndk() {
  if [ -d "$ANDROID_HOME/ndk/$NDK_VERSION" ] && [ -n "$(ls -A "$ANDROID_HOME/ndk/$NDK_VERSION" 2>/dev/null)" ]; then
    log "NDK $NDK_VERSION already installed."
    return
  fi
  log "Installing NDK $NDK_VERSION (may take a while on a throttled network)..."
  yes | sdkmanager --licenses > "$LOG_DIR/lic.log" 2>&1 || true
  sdkmanager "ndk;$NDK_VERSION" 2>&1 | tail -5
}

ensure_system_image() {
  if [ -d "$ANDROID_HOME/system-images/android-34/default/x86_64" ]; then
    log "System image already installed."
    return
  fi
  log "Installing $SYSTEM_IMAGE (may take a while on a throttled network)..."
  sdkmanager "$SYSTEM_IMAGE" 2>&1 | tail -5
}

create_avd() {
  if avdmanager list avd 2>/dev/null | grep -q "Name: $AVD_NAME"; then
    log "AVD $AVD_NAME already exists."
    return
  fi
  log "Creating AVD $AVD_NAME..."
  echo "no" | avdmanager create avd -n "$AVD_NAME" -k "$SYSTEM_IMAGE" -d pixel 2>&1 | tail -5
}

boot_emulator() {
  if [ "$SKIP_EMULATOR" = "1" ]; then
    log "Skipping emulator boot (--skip-emulator)."
    return
  fi
  if adb devices | grep -q "emulator-"; then
    log "Emulator already attached."
    return
  fi
  log "Booting emulator headless..."
  nohup "$ANDROID_HOME/emulator/emulator" -avd "$AVD_NAME" -no-window -no-audio -no-boot-anim -no-snapshot -gpu swiftshader_indirect > "$LOG_DIR/emulator.log" 2>&1 &
  log "Waiting for emulator to boot..."
  adb wait-for-device
  for i in $(seq 1 60); do
    if adb shell getprop sys.boot_completed 2>/dev/null | grep -q "1"; then
      log "Emulator booted."
      return
    fi
    sleep 3
  done
  log "ERROR: emulator did not finish booting within 3 minutes." >&2
  exit 1
}

gradle_build() {
  log "Running gradle assembleDebug (Java 21, the compilation test)..."
  cd "$REPO_ROOT/android"
  ./gradlew --no-daemon clean assembleDebug 2>&1 | tee "$LOG_DIR/gradle.log" | tail -40
  cd "$REPO_ROOT"
  if [ ! -f "$APK_PATH" ]; then
    log "ERROR: APK not produced at $APK_PATH" >&2
    exit 1
  fi
  log "APK built: $APK_PATH ($(du -h "$APK_PATH" | cut -f1))"
}

install_and_launch() {
  if [ "$SKIP_EMULATOR" = "1" ]; then
    log "Skipping install/launch (--skip-emulator)."
    return
  fi
  log "Installing APK on emulator..."
  adb install -r "$APK_PATH" 2>&1 | tail -5
  PKG=$(grep -oE 'applicationId\s+"[^"]+"' "$REPO_ROOT/android/app/build.gradle" | head -1 | sed 's/applicationId\s\+"\(.*\)"/\1/')
  log "Launching $PKG..."
  adb shell monkey -p "$PKG" -c android.intent.category.LAUNCHER 1 2>&1 | tail -3
  sleep 4
  if adb shell pidof "$PKG" >/dev/null 2>&1; then
    log "App $PKG is running (pid $(adb shell pidof "$PKG"))."
  else
    log "ERROR: $PKG did not start." >&2
    exit 1
  fi
  log "--- relevant logcat (last 5s) ---"
  adb logcat -d -t 5s 2>&1 | grep -iE "fieldsight|qvac|reactnative|androidruntime" | tail -20 || true
}

notify_success() {
  if [ "$NOTIFY" != "1" ]; then
    log "Success. (Pass --notify to post a Discord message via Hermes.)"
    return
  fi
  local msg="FieldSight MVP built and launched on the Android emulator."
  msg="$msg NDK $NDK_VERSION, gradle assembleDebug produced $(du -h "$APK_PATH" | cut -f1) APK, app is running."
  msg="$msg Repo: mvp @ $(git -C "$REPO_ROOT" rev-parse --short HEAD)."
  log "Posting to $HERMES_CHANNEL via Hermes..."
  hermes send --to "$HERMES_CHANNEL" -s "FieldSight MVP \xE2\x9C\x85" "$msg" 2>&1 | tail -5
}

ensure_ndk
if [ "$SKIP_EMULATOR" != "1" ]; then
  ensure_system_image
  create_avd
  boot_emulator
fi
gradle_build
install_and_launch
notify_success
log "Done."
