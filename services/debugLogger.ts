// NOTE ON expo-file-system VERSION: expo-file-system@19.x (Expo SDK 54) ships
// a rewritten, synchronous File/Directory API as the default export. The old
// documentDirectory / readAsStringAsync / writeAsStringAsync style doesn't
// resolve cleanly on this install (confirmed via a type error on this exact
// package version), so this uses the new API directly instead of fighting
// the legacy path. All file reads/writes below are synchronous — no await
// needed for them, which is actually simpler than the old API.
import { File, Paths } from "expo-file-system";
import * as Sharing from "expo-sharing";

const logFile = new File(Paths.document, "debug-log.txt");

// ─── Why this file exists ────────────────────────────────────────────────────
// adb logcat is NOT a reliable record for this bug. It rotates (old lines get
// silently dropped once the buffer fills) and it is completely gone across a
// reboot or an OS-level app kill. That's exactly the situation we care about
// (phone locked for hours, tracking dies, nobody's watching logcat live).
//
// This module patches console.log / console.warn / console.error so that
// EVERY existing log line in the app — with zero changes needed at each call
// site — also gets written to a plain text file in the app's private storage.
// That file persists across app restarts, OS kills, and reboots. It only
// disappears if the app is uninstalled or the user clears app data.

const MAX_LOG_BYTES = 2 * 1024 * 1024; // 2MB cap — trim to newest half when exceeded
const FLUSH_INTERVAL_MS = 1000; // batch writes so we're not doing disk IO on every single log line

// One short random ID generated fresh each time the JS process starts.
// This is how you tell apart two different runs in the log file even when
// nothing else about them looks different — e.g. "was this restart from the
// original process, or did the OS kill and relaunch us?"
const SESSION_ID = Math.random().toString(36).slice(2, 8);

let installed = false;
let pendingLines: string[] = [];
let flushTimer: ReturnType<typeof setTimeout> | null = null;
let writeQueue: Promise<void> = Promise.resolve();

function nowIso(): string {
  return new Date().toISOString();
}

function stringifyArgs(args: unknown[]): string {
  return args
    .map((a) => {
      if (typeof a === "string") return a;
      try {
        return JSON.stringify(a);
      } catch {
        return String(a);
      }
    })
    .join(" ");
}

function scheduleFlush() {
  if (flushTimer) return;
  flushTimer = setTimeout(() => {
    flushTimer = null;
    void flushNow();
  }, FLUSH_INTERVAL_MS);
}

async function appendChunkToFile(chunk: string) {
  try {
    if (!logFile.exists) {
      logFile.create();
    }
    const existing = logFile.exists ? logFile.text() : "";
    let combined = existing + chunk;
    if (combined.length > MAX_LOG_BYTES) {
      // Keep the newest half so the file never grows unbounded, but don't
      // lose everything — older-but-still-relevant history stays.
      combined = combined.slice(Math.floor(combined.length / 2));
    }
    logFile.write(combined);
  } catch (err) {
    // Deliberately using the ORIGINAL console here (not the patched one) to
    // avoid any risk of infinite recursion if writing itself fails.
    originalConsole.log("❌ debugLogger: failed to write log file:", err);
  }
}

/** Force-write any buffered lines right now. Call this before anything that
 * might kill the process (fatal errors, unhandled rejections) so the last
 * few log lines aren't lost to the 1s batching window. */
export async function flushLogsNow(): Promise<void> {
  if (pendingLines.length === 0) return;
  const chunk = pendingLines.join("");
  pendingLines = [];
  if (flushTimer) {
    clearTimeout(flushTimer);
    flushTimer = null;
  }
  writeQueue = writeQueue.then(() => appendChunkToFile(chunk));
  await writeQueue;
}

async function flushNow(): Promise<void> {
  await flushLogsNow();
}

function persistLine(level: string, args: unknown[]) {
  const line = `${nowIso()} [${SESSION_ID}] ${level}: ${stringifyArgs(args)}\n`;
  pendingLines.push(line);
  scheduleFlush();
}

// Keep references to the real console methods before patching, both so the
// patch can call through to them and so our own error-handling above never
// recurses into itself.
const originalConsole = {
  log: console.log.bind(console),
  warn: console.warn.bind(console),
  error: console.error.bind(console),
};

/** Call this ONCE, as early as possible in the app's lifecycle (top of
 * services/backgroundLocation.ts, before any other imports run their own
 * top-level logging). Safe to call multiple times — only installs once. */
export function installPersistentLogging() {
  if (installed) return;
  installed = true;

  console.log = (...args: unknown[]) => {
    originalConsole.log(...args);
    persistLine("LOG", args);
  };
  console.warn = (...args: unknown[]) => {
    originalConsole.warn(...args);
    persistLine("WARN", args);
  };
  console.error = (...args: unknown[]) => {
    originalConsole.error(...args);
    persistLine("ERROR", args);
  };

  persistLine("SESSION", [`New JS session started (session=${SESSION_ID})`]);
}

/** Read the full persisted log as a single string (for in-app viewing/debugging). */
export async function readAllLogs(): Promise<string> {
  try {
    if (!logFile.exists) return "(no log file yet)";
    return logFile.text();
  } catch (err) {
    return `(error reading log file: ${String(err)})`;
  }
}

/** Wipe the persisted log file (e.g. before starting a fresh soak test). */
export async function clearLogs(): Promise<void> {
  try {
    await flushLogsNow();
    if (logFile.exists) logFile.delete();
  } catch (err) {
    originalConsole.log("❌ debugLogger: failed to clear log file:", err);
  }
}

/** Opens the native share sheet with the log file — WhatsApp, email, Drive,
 * "Save to Files", whatever the user picks. No adb / cable needed. */
export async function shareLogs(): Promise<void> {
  try {
    await flushLogsNow();
    if (!logFile.exists) {
      originalConsole.log("⚠️ shareLogs: no log file exists yet");
      return;
    }
    const canShare = await Sharing.isAvailableAsync();
    if (!canShare) {
      originalConsole.log("⚠️ shareLogs: Sharing not available on this device");
      return;
    }
    await Sharing.shareAsync(logFile.uri, {
      mimeType: "text/plain",
      dialogTitle: "Help App debug log",
    });
  } catch (err) {
    originalConsole.log("❌ shareLogs error:", err);
  }
}

export async function getLogFilePath(): Promise<string> {
  return logFile.uri;
}