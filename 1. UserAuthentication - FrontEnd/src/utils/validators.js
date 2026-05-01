export const validateEmail = (email) => {
  if (!email) return 'Email is required';
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!re.test(email)) return 'Enter a valid email address';
  return null;
};

export const validatePassword = (password) => {
  if (!password) return 'Password is required';
  if (password.length < 8) return 'Password must be at least 8 characters';
  if (!/[A-Z]/.test(password)) return 'Must contain at least one uppercase letter';
  if (!/[0-9]/.test(password)) return 'Must contain at least one number';
  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) return 'Must contain at least one special character';
  return null;
};

export const validatePhone = (phone) => {
  if (!phone) return 'Phone number is required';
  const cleaned = phone.replace(/\s+/g, '');
  if (!/^\+?[0-9]{7,15}$/.test(cleaned)) return 'Enter a valid phone number (7–15 digits)';
  return null;
};

export const validateUsername = (username) => {
  if (!username) return 'Name is required';
  if (username.trim().length < 2) return 'Name must be at least 2 characters';
  if (username.trim().length > 32) return 'Name must be under 32 characters';
  return null;
};
