const logActivity = require('../../utils/activityLogger');

const makeUser = (existingLog = []) => ({
  activityLog: [...existingLog],
});

describe('logActivity — basic entry creation', () => {
  it('prepends a new entry to activityLog', () => {
    const user = makeUser();
    logActivity(user, 'login', 'User logged in');
    expect(user.activityLog).toHaveLength(1);
    expect(user.activityLog[0].action).toBe('login');
    expect(user.activityLog[0].detail).toBe('User logged in');
  });

  it('newest entry is always at index 0', () => {
    const user = makeUser();
    logActivity(user, 'first_action');
    logActivity(user, 'second_action');
    expect(user.activityLog[0].action).toBe('second_action');
    expect(user.activityLog[1].action).toBe('first_action');
  });

  it('sets a timestamp on each entry', () => {
    const user = makeUser();
    const before = Date.now();
    logActivity(user, 'test');
    const after = Date.now();
    const ts = new Date(user.activityLog[0].timestamp).getTime();
    expect(ts).toBeGreaterThanOrEqual(before);
    expect(ts).toBeLessThanOrEqual(after);
  });

  it('defaults detail to empty string when not provided', () => {
    const user = makeUser();
    logActivity(user, 'profile_updated');
    expect(user.activityLog[0].detail).toBe('');
  });

  it('stores the provided detail string', () => {
    const user = makeUser();
    logActivity(user, 'avatar_updated', 'Profile picture changed');
    expect(user.activityLog[0].detail).toBe('Profile picture changed');
  });
});

describe('logActivity — IP handling', () => {
  it('captures IP from req.ip', () => {
    const user = makeUser();
    logActivity(user, 'login', '', { ip: '192.168.1.1' });
    expect(user.activityLog[0].ip).toBe('192.168.1.1');
  });

  it('defaults IP to empty string when req is null', () => {
    const user = makeUser();
    logActivity(user, 'login', '', null);
    expect(user.activityLog[0].ip).toBe('');
  });

  it('defaults IP to empty string when req is undefined', () => {
    const user = makeUser();
    logActivity(user, 'login', '', undefined);
    expect(user.activityLog[0].ip).toBe('');
  });

  it('defaults IP to empty string when req has no ip property', () => {
    const user = makeUser();
    logActivity(user, 'login', '', {});
    expect(user.activityLog[0].ip).toBe('');
  });

  it('stores IPv6 address correctly', () => {
    const user = makeUser();
    logActivity(user, 'login', '', { ip: '::1' });
    expect(user.activityLog[0].ip).toBe('::1');
  });
});

describe('logActivity — 20-entry cap', () => {
  it('caps activityLog at 20 entries', () => {
    const existing = Array.from({ length: 20 }, (_, i) => ({
      action: `action_${i}`, detail: '', ip: '', timestamp: new Date(),
    }));
    const user = makeUser(existing);
    logActivity(user, 'new_action');
    expect(user.activityLog).toHaveLength(20);
  });

  it('newest entry is kept when cap is reached', () => {
    const existing = Array.from({ length: 20 }, (_, i) => ({
      action: `action_${i}`, detail: '', ip: '', timestamp: new Date(),
    }));
    const user = makeUser(existing);
    logActivity(user, 'overflow_action');
    expect(user.activityLog[0].action).toBe('overflow_action');
  });

  it('oldest entry is dropped when cap is reached', () => {
    const existing = Array.from({ length: 20 }, (_, i) => ({
      action: `action_${i}`, detail: '', ip: '', timestamp: new Date(),
    }));
    const user = makeUser(existing);
    logActivity(user, 'new_action');
    const actions = user.activityLog.map((e) => e.action);
    // The last original entry (action_19) is dropped; action_0 is still present
    expect(actions).not.toContain('action_19');
    expect(actions[0]).toBe('new_action');
  });

  it('does not cap when log has fewer than 20 entries', () => {
    const existing = Array.from({ length: 10 }, (_, i) => ({
      action: `action_${i}`, detail: '', ip: '', timestamp: new Date(),
    }));
    const user = makeUser(existing);
    logActivity(user, 'new_action');
    expect(user.activityLog).toHaveLength(11);
  });

  it('adding 5 entries to empty log results in 5 entries', () => {
    const user = makeUser();
    for (let i = 0; i < 5; i++) logActivity(user, `action_${i}`);
    expect(user.activityLog).toHaveLength(5);
  });
});

describe('logActivity — action field', () => {
  it('stores any string as action', () => {
    const user = makeUser();
    logActivity(user, 'custom_event_type');
    expect(user.activityLog[0].action).toBe('custom_event_type');
  });

  it('stores empty string action', () => {
    const user = makeUser();
    logActivity(user, '');
    expect(user.activityLog[0].action).toBe('');
  });
});
