export interface CSVValidationError {
  row: number;
  field: string;
  message: string;
  severity: 'error' | 'warning';
}

export interface CSVValidationResult {
  isValid: boolean;
  errors: CSVValidationError[];
  data: any[];
}

const REQUIRED_FIELDS = ['name', 'label', 'type', 'required'];
const VALID_FIELD_TYPES = [
  'text',
  'number',
  'date',
  'datetime',
  'boolean',
  'email',
  'phone',
  'url',
  'textarea',
  'select',
  'multiselect',
];
const OPTION_ALLOWED_TYPES = ['select', 'multiselect'];

export function validateCSV(csvContent: string): CSVValidationResult {
  const errors: CSVValidationError[] = [];
  const lines = csvContent.split('\n').filter((line) => line.trim());

  // Check if file is empty
  if (lines.length === 0) {
    errors.push({
      row: 0,
      field: 'file',
      message: 'CSV file is completely empty',
      severity: 'error',
    });
    return { isValid: false, errors, data: [] };
  }

  // Check if only headers exist
  if (lines.length === 1) {
    errors.push({
      row: 0,
      field: 'file',
      message: 'CSV file contains only headers with no data rows',
      severity: 'error',
    });
    return { isValid: false, errors, data: [] };
  }

  const headers = parseCSVLine(lines[0]).map((h) => h.toLowerCase().trim());

  // Check for required headers
  const missingHeaders = REQUIRED_FIELDS.filter(
    (field) => !headers.includes(field)
  );
  if (missingHeaders.length > 0) {
    errors.push({
      row: 0,
      field: 'headers',
      message: `Missing required headers: ${missingHeaders.join(', ')}`,
      severity: 'error',
    });
  }

  const data: any[] = [];

  // Validate each data row
  for (let i = 1; i < lines.length; i++) {
    const values = parseCSVLine(lines[i]);
    const rowData: any = {};

    // Skip empty rows
    if (values.every((v) => !v.trim())) continue;

    headers.forEach((header, index) => {
      rowData[header] = values[index]?.trim() || '';
    });

    // Check required fields are not empty
    REQUIRED_FIELDS.forEach((field) => {
      if (!rowData[field]) {
        errors.push({
          row: i + 1,
          field,
          message: `Required field '${field}' is empty`,
          severity: 'error',
        });
      }
    });

    // Validate field type
    if (
      rowData.type &&
      !VALID_FIELD_TYPES.includes(rowData.type.toLowerCase())
    ) {
      errors.push({
        row: i + 1,
        field: 'type',
        message: `Invalid field type '${rowData.type}'. Valid types: ${VALID_FIELD_TYPES.join(', ')}`,
        severity: 'error',
      });
    }

    // Validate options field
    if (rowData.options && rowData.options.trim()) {
      const fieldType = rowData.type?.toLowerCase();
      if (!OPTION_ALLOWED_TYPES.includes(fieldType)) {
        errors.push({
          row: i + 1,
          field: 'options',
          message: `Options are only allowed for 'select' and 'multiselect' field types, not '${fieldType}'`,
          severity: 'error',
        });
      }
    }

    // Validate required field format
    if (rowData.required) {
      const reqValue = rowData.required.toLowerCase().trim();
      if (!['true', 'false', '1', '0'].includes(reqValue)) {
        errors.push({
          row: i + 1,
          field: 'required',
          message: `Required field must be 'true', 'false', '1', or '0', got '${rowData.required}'`,
          severity: 'error',
        });
      }
    }

    // Validate name format (no spaces, valid identifier)
    if (rowData.name && !/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(rowData.name)) {
      errors.push({
        row: i + 1,
        field: 'name',
        message: `Field name '${rowData.name}' must be a valid identifier (letters, numbers, underscore, no spaces)`,
        severity: 'warning',
      });
    }

    data.push(rowData);
  }

  return {
    isValid: errors.filter((e) => e.severity === 'error').length === 0,
    errors,
    data,
  };
}

function parseCSVLine(line: string): string[] {
  const values: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      values.push(current);
      current = '';
    } else {
      current += char;
    }
  }
  values.push(current);
  return values;
}

export function generateErrorReport(errors: CSVValidationError[]): string {
  const report = [
    'CSV Validation Error Report',
    '='.repeat(30),
    '',
    `Total Issues Found: ${errors.length}`,
    `Errors: ${errors.filter((e) => e.severity === 'error').length}`,
    `Warnings: ${errors.filter((e) => e.severity === 'warning').length}`,
    '',
    'Details:',
    '-'.repeat(20),
  ];

  errors.forEach((error, index) => {
    report.push(
      `${index + 1}. Row ${error.row}, Field '${error.field}': ${error.message} [${error.severity.toUpperCase()}]`
    );
  });

  report.push('');
  report.push('Required CSV Format:');
  report.push('name,label,type,required,options,aiPrompt');
  report.push(
    'patient_name,Patient Name,text,true,,Extract patient name from input'
  );
  report.push('age,Age,number,true,,Extract age as number');
  report.push(
    'gender,Gender,select,true,"Male,Female,Other",Extract gender from options'
  );

  return report.join('\n');
}
