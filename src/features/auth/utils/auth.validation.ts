export type RegisterFormValues = {
  fullName: string;
  email: string;
  phone: string;
  password: string;
};

export type RegisterFormErrors = Partial<Record<keyof RegisterFormValues, string>>;

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/i;
const PHONE_PATTERN = /^\+?[0-9]{8,15}$/;
const PASSWORD_PATTERN = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,128}$/;

export function validateFullName(value: string): string | null {
  const fullName = value.trim();
  if (!fullName) {
    return "Full name is required.";
  }
  if (fullName.length < 2) {
    return "Full name must be at least 2 characters.";
  }
  if (fullName.length > 100) {
    return "Full name must be at most 100 characters.";
  }
  return null;
}

export function validateEmail(value: string): string | null {
  const email = value.trim();
  if (!email) {
    return "Email is required.";
  }
  if (!EMAIL_PATTERN.test(email)) {
    return "Enter a valid email address.";
  }
  return null;
}

export function validatePhone(value: string): string | null {
  const phone = value.trim();
  if (!phone) {
    return null;
  }
  if (!PHONE_PATTERN.test(phone.replace(/[\s-]/g, ""))) {
    return "Enter a valid phone number (8–15 digits).";
  }
  return null;
}

export function validatePassword(value: string): string | null {
  if (!value) {
    return "Password is required.";
  }
  if (value.length < 8 || value.length > 128) {
    return "Password must be 8–128 characters.";
  }
  if (!PASSWORD_PATTERN.test(value)) {
    return "Password needs uppercase, lowercase, and a number.";
  }
  return null;
}

export function validateRegisterForm(values: RegisterFormValues): RegisterFormErrors {
  const errors: RegisterFormErrors = {};

  const fullNameError = validateFullName(values.fullName);
  if (fullNameError) {
    errors.fullName = fullNameError;
  }

  const emailError = validateEmail(values.email);
  if (emailError) {
    errors.email = emailError;
  }

  const phoneError = validatePhone(values.phone);
  if (phoneError) {
    errors.phone = phoneError;
  }

  const passwordError = validatePassword(values.password);
  if (passwordError) {
    errors.password = passwordError;
  }

  return errors;
}

export function isRegisterFormValid(values: RegisterFormValues): boolean {
  return Object.keys(validateRegisterForm(values)).length === 0;
}
