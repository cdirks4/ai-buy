/**
 * Debug configuration for the application
 * Controls whether detailed error information is displayed in the UI
 */

// Enable detailed error display in development or when explicitly enabled
export const DEBUG_CONFIG = {
  // Show detailed error information in the UI
  SHOW_DETAILED_ERRORS: process.env.NODE_ENV === 'development' || process.env.NEXT_PUBLIC_SHOW_DETAILED_ERRORS === 'true',
  
  // Log level for console messages
  LOG_LEVEL: process.env.NODE_ENV === 'development' ? 'debug' : 'error',
  
  // Additional debug flags can be added here
  TRACE_TRANSACTIONS: process.env.NODE_ENV === 'development',
} as const;

interface DetailedError {
  message?: string;
  code?: string;
  data?: any;
  reason?: string;
  transaction?: {
    hash?: string;
    from?: string;
    to?: string;
    data?: string;
    value?: string;
  };
  receipt?: {
    status?: number;
    gasUsed?: string;
    blockNumber?: number;
  };
  balance?: string;
  allowance?: string;
}

// Helper function to format error details for display
export function formatErrorDetails(error: any): string {
  if (!DEBUG_CONFIG.SHOW_DETAILED_ERRORS) {
    return '';
  }

  try {
    const details: DetailedError = {
      message: error.message,
      code: error.code,
      data: error.data,
      reason: error.reason,
      transaction: error.transaction,
      receipt: error.receipt,
      balance: error.balance,
      allowance: error.allowance,
    };

    // Remove undefined properties recursively
    const cleanObject = (obj: any): any => {
      Object.keys(obj).forEach(key => {
        if (obj[key] === undefined) {
          delete obj[key];
        } else if (typeof obj[key] === 'object' && obj[key] !== null) {
          cleanObject(obj[key]);
          if (Object.keys(obj[key]).length === 0) {
            delete obj[key];
          }
        }
      });
      return obj;
    };

    const cleanedDetails = cleanObject(details);

    return JSON.stringify(cleanedDetails, null, 2);
  } catch {
    // If anything goes wrong during formatting, return the error as a string
    return String(error);
  }
}
