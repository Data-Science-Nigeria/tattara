export interface ValidationResult {
  isValid: boolean;
  error?: string;
}

export function validateFieldValue(
  value: string | boolean,
  fieldType: string
): ValidationResult {
  if (typeof value === 'boolean') {
    return fieldType === 'boolean'
      ? { isValid: true }
      : { isValid: false, error: 'Expected boolean value' };
  }

  const stringValue = value as string;

  if (!stringValue.trim()) {
    return { isValid: true }; // Empty values are handled by required validation
  }

  switch (fieldType) {
    case 'number':
      const num = Number(stringValue);
      return isNaN(num)
        ? { isValid: false, error: 'Must be a valid number' }
        : { isValid: true };

    case 'email':
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      return !emailRegex.test(stringValue)
        ? { isValid: false, error: 'Must be a valid email address' }
        : { isValid: true };

    case 'phone':
      const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
      return !phoneRegex.test(stringValue.replace(/[\s\-\(\)]/g, ''))
        ? { isValid: false, error: 'Must be a valid phone number' }
        : { isValid: true };

    case 'url':
      try {
        new URL(stringValue);
        return { isValid: true };
      } catch {
        return { isValid: false, error: 'Must be a valid URL' };
      }

    case 'date':
      const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
      if (!dateRegex.test(stringValue)) {
        return { isValid: false, error: 'Must be a valid date (YYYY-MM-DD)' };
      }
      const date = new Date(stringValue);
      return isNaN(date.getTime())
        ? { isValid: false, error: 'Must be a valid date' }
        : { isValid: true };

    case 'datetime':
      const datetime = new Date(stringValue);
      return isNaN(datetime.getTime())
        ? { isValid: false, error: 'Must be a valid date and time' }
        : { isValid: true };

    default:
      return { isValid: true };
  }
}
