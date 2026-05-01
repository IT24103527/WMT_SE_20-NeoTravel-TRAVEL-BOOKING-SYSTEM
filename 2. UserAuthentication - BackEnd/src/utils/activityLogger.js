/**
 * Appends an entry to user.activityLog (max 20 entries).
 * Call user.save() after this.
 */
const logActivity = (user, action, detail = '', req = null) => {
  user.activityLog.unshift({
    action,
    detail,
    ip:        req?.ip || '',
    timestamp: new Date(),
  });
  if (user.activityLog.length > 20)
    user.activityLog = user.activityLog.slice(0, 20);
};

module.exports = logActivity;
