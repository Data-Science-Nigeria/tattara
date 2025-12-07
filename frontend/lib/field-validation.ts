export interface ValidationResult {
  isValid: boolean;
  error?: string;
}

export function validateFieldValue(
  value: string | boolean | number | string[],
  fieldType: string,
  options?: string[]
): ValidationResult {
  if (typeof value === 'boolean') {
    return fieldType === 'boolean'
      ? { isValid: true }
      : { isValid: false, error: 'Expected boolean value' };
  }

  // Handle multiselect arrays
  if (Array.isArray(value)) {
    if (fieldType === 'multiselect') {
      if (options && options.length > 0) {
        const invalidValues = value.filter((val) => !options.includes(val));
        return invalidValues.length > 0
          ? { isValid: false, error: 'Please select valid options only' }
          : { isValid: true };
      }
      return { isValid: true };
    }
    return { isValid: false, error: 'Unexpected array value' };
  }

  // Convert to string for validation
  const stringValue = String(value);

  if (!stringValue || !stringValue.trim()) {
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

    case 'text':
    case 'textarea':
      // Text fields should not be purely numeric
      const isOnlyNumbers = /^\d+$/.test(stringValue.trim());
      return isOnlyNumbers
        ? { isValid: false, error: 'Text field cannot contain only numbers' }
        : { isValid: true };

    case 'select':
      if (options && options.length > 0) {
        return !options.includes(stringValue)
          ? { isValid: false, error: 'Please select a valid option' }
          : { isValid: true };
      }
      return { isValid: true };

    case 'multiselect':
      // Already handled above for arrays
      return { isValid: true };

    default:
      return { isValid: true };
  }
}
