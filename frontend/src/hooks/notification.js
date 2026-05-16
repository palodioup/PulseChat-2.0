// utils/notificationHelper.js

/**
 * Handles browser permission states and fires a native desktop notification
 * @param {string} title - Main header of the notification popup
 * @param {string} body - Short form preview message body text
 */
export const triggerSystemNotification = async (title, body) => {
  if (!("Notification" in window)) {
    console.warn("This browser does not support desktop notifications.");
    return;
  }

  // Request permission if the user hasn't explicitly decided yet
  if (Notification.permission === "default") {
    await Notification.requestPermission();
  }

  // Fire notification only if permission is granted
  if (Notification.permission === "granted") {
    const notification = new Notification(title, {
      body: body,
      icon: "/icon-192x192.png", // Path to your public folder icon assets
      tag: "pulsechat-msg",  // Overwrites older popups from this app to avoid flooding the screen
    });

    // Bring the PulseChat-2.0 window tab to focus if clicked
    notification.onclick = () => {
      window.focus();
    };
  }
};
