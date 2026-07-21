const {
  withDangerousMod,
  withAndroidManifest,
  withMainApplication,
  withPlugins,
} = require('@expo/config-plugins');
const fs = require('fs');
const path = require('path');

const PACKAGE_PATH = 'com/yugamai/helpapp/wakelock';

// 1. Copy the two Kotlin files into the generated android/ tree on every prebuild.
function withWakeLockNativeFiles(config) {
  return withDangerousMod(config, [
    'android',
    async (config) => {
      const destDir = path.join(
        config.modRequest.platformProjectRoot,
        'app/src/main/java',
        PACKAGE_PATH
      );
      fs.mkdirSync(destDir, { recursive: true });

      const srcDir = path.join(__dirname, 'native');
      fs.copyFileSync(
        path.join(srcDir, 'WakeLockModule.kt.template'),
        path.join(destDir, 'WakeLockModule.kt')
      );
      fs.copyFileSync(
        path.join(srcDir, 'WakeLockPackage.kt.template'),
        path.join(destDir, 'WakeLockPackage.kt')
      );

      return config;
    },
  ]);
}

// 2. Add WAKE_LOCK permission.
function withWakeLockPermission(config) {
  return withAndroidManifest(config, (config) => {
    const manifest = config.modResults.manifest;
    const perms = manifest['uses-permission'] || [];
    const already = perms.some(
      (p) => p.$['android:name'] === 'android.permission.WAKE_LOCK'
    );
    if (!already) {
      perms.push({ $: { 'android:name': 'android.permission.WAKE_LOCK' } });
    }
    manifest['uses-permission'] = perms;
    return config;
  });
}

// 3. Register the package + set the OkHttp callTimeout in MainApplication.kt.
function withWakeLockMainApplication(config) {
  return withMainApplication(config, (config) => {
    let contents = config.modResults.contents;

    // --- import lines ---
    const importAnchor = 'import com.facebook.react.ReactApplication';
    const newImports = [
      importAnchor,
      'import com.yugamai.helpapp.wakelock.WakeLockPackage',
      'import com.facebook.react.modules.network.OkHttpClientFactory',
      'import com.facebook.react.modules.network.OkHttpClientProvider',
      'import com.facebook.react.modules.network.ReactCookieJarContainer',
      'import okhttp3.OkHttpClient',
      'import java.util.concurrent.TimeUnit',
    ].join('\n');

    if (!contents.includes('import com.yugamai.helpapp.wakelock.WakeLockPackage')) {
      contents = contents.replace(importAnchor, newImports);
    }

    // --- register package inside getPackages() ---
    // Anchor matches the actual generated template, which returns
    // PackageList(this).packages.apply { ... } directly — there is no
    // intermediate `val packages =` line to hook into.
    if (!contents.includes('add(WakeLockPackage())')) {
      contents = contents.replace(
        /PackageList\(this\)\.packages\.apply \{/,
        `PackageList(this).packages.apply {\n              add(WakeLockPackage())`
      );
    }

    // --- OkHttp factory class, appended once at end of file ---
    // IMPORTANT: built from OkHttpClientProvider.createClientBuilder(), not a
    // bare OkHttpClient.Builder(). A bare builder's default cookie jar doesn't
    // implement CookieJarContainer, which crashes FrescoModule at startup with
    // a ClassCastException. createClientBuilder() + explicit ReactCookieJarContainer
    // preserves what RN's internals expect; we only add the timeout on top.
    if (!contents.includes('class HelpAppOkHttpClientFactory')) {
      contents += `

class HelpAppOkHttpClientFactory : OkHttpClientFactory {
  override fun createNewNetworkModuleClient(): OkHttpClient =
    OkHttpClientProvider.createClientBuilder()
      .cookieJar(ReactCookieJarContainer())
      .callTimeout(12, TimeUnit.SECONDS) // hard ceiling — kills a stalled call
      .build()                            // regardless of whether JS is awake
}
`;
    }

    // --- wire the factory in onCreate(), before super.onCreate() side effects matter ---
    if (!contents.includes('OkHttpClientProvider.setOkHttpClientFactory')) {
      contents = contents.replace(
        /override fun onCreate\(\) \{/,
        `override fun onCreate() {\n    OkHttpClientProvider.setOkHttpClientFactory(HelpAppOkHttpClientFactory())`
      );
    }

    config.modResults.contents = contents;
    return config;
  });
}

module.exports = function withWakeLock(config) {
  return withPlugins(config, [
    withWakeLockNativeFiles,
    withWakeLockPermission,
    withWakeLockMainApplication,
  ]);
};