import UIKit
import Capacitor

// ============================================================
// FIREBASE MESSAGING INTEGRATION
// To enable push notifications on iOS:
//
// 1. Add GoogleService-Info.plist to this project (App target)
//    Download it from Firebase Console → Project Settings → iOS app
//
// 2. In Xcode Signing & Capabilities:
//    - Add "Push Notifications" capability
//    - Add "Background Modes" capability → check "Remote notifications"
//
// 3. In Podfile, add:
//    pod 'FirebaseMessaging'
//    Then run: pod install
//
// 4. Uncomment the FirebaseApp.configure() line below
//    and uncomment the import FirebaseMessaging line
//
// 5. In Firebase Console → Project Settings → Cloud Messaging:
//    Upload your APNs Auth Key (.p8 file) or APNs Certificate
// ============================================================

import FirebaseMessaging

@UIApplicationMain
class AppDelegate: UIResponder, UIApplicationDelegate {

    var window: UIWindow?

    func application(_ application: UIApplication, didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]?) -> Bool {
        // ✅ Step 1: Configure Firebase BEFORE anything else.
        FirebaseApp.configure()

        return true
    }

    // =========================================================
    // APNs / FCM REGISTRATION CALLBACKS
    // These are REQUIRED for push notifications to work on iOS.
    // The Capacitor PushNotifications plugin registers for APNs,
    // and iOS calls these delegate methods with the result.
    // =========================================================

    /// Called when iOS successfully registers with APNs.
    /// The device token here is forwarded to the Capacitor plugin,
    /// which then hands it to the FCM SDK to get an FCM token.
    func application(_ application: UIApplication,
                     didRegisterForRemoteNotificationsWithDeviceToken deviceToken: Data) {
        // Capacitor's ApplicationDelegateProxy forwards the token to all plugins,
        // including @capacitor/push-notifications which bridges it to FCM.
        NotificationCenter.default.post(
            name: .capacitorDidRegisterForRemoteNotifications,
            object: deviceToken
        )
    }

    /// Called when APNs registration fails.
    /// Common reasons: Push capability not enabled in Xcode, or no APNs key
    ///                 configured in Firebase Console.
    func application(_ application: UIApplication,
                     didFailToRegisterForRemoteNotificationsWithError error: Error) {
        NotificationCenter.default.post(
            name: .capacitorDidFailToRegisterForRemoteNotifications,
            object: error
        )
    }

    // =========================================================
    // APP LIFECYCLE
    // =========================================================

    func applicationWillResignActive(_ application: UIApplication) {
        // App is transitioning to inactive (incoming call, user pressed home, etc.)
    }

    func applicationDidEnterBackground(_ application: UIApplication) {
        // App moved to background — save state if necessary
    }

    func applicationWillEnterForeground(_ application: UIApplication) {
        // App coming back to foreground — good place to refresh FCM token status
    }

    func applicationDidBecomeActive(_ application: UIApplication) {
        // App fully active — good place to clear the badge count
        UIApplication.shared.applicationIconBadgeNumber = 0
    }

    func applicationWillTerminate(_ application: UIApplication) {
        // App about to be killed
    }

    // =========================================================
    // URL / DEEP LINK HANDLING
    // Required for Capacitor app to handle custom URL schemes
    // and Universal Links tapped in push notifications.
    // =========================================================

    func application(_ app: UIApplication, open url: URL, options: [UIApplication.OpenURLOptionsKey: Any] = [:]) -> Bool {
        return ApplicationDelegateProxy.shared.application(app, open: url, options: options)
    }

    func application(_ application: UIApplication, continue userActivity: NSUserActivity, restorationHandler: @escaping ([UIUserActivityRestoring]?) -> Void) -> Bool {
        return ApplicationDelegateProxy.shared.application(application, continue: userActivity, restorationHandler: restorationHandler)
    }

}
