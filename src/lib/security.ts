/**
 * Sanitizes input string to prevent XSS attacks
 * Removes potentially dangerous HTML tags and attributes
 * 
 * @param input The string to sanitize
 * @returns Sanitized string safe for display
 */
export const sanitizeInput = (input: string): string => {
  if (!input) return ''
  
  const str = String(input)
  
  return str
    .replace(/<(script|iframe|object|embed|form|style)[^>]*>[\s\S]*?<\/\1>/gi, '')
    .replace(/on\w+="[^"]*"/g, '')
    .replace(/on\w+='[^']*'/g, '')
    .replace(/on\w+=\S+/g, '')
    .replace(/javascript:[^\s"']+/gi, '')
    .replace(/data:[^\s"']+/gi, 'data:blocked')
    .replace(/eval\(.*\)/gi, '')
    .replace(/expression\(.*\)/gi, '')
    .replace(/<script[^>]*>/gi, '')
    .replace(/<\/script>/gi, '')
    .replace(/<\/?iframe[^>]*>/gi, '')
    .replace(/<\/?object[^>]*>/gi, '')
    .replace(/<\/?embed[^>]*>/gi, '')
    .replace(/<\/?form[^>]*>/gi, '')
}

/**
 * HTML escapes a string to safely display in HTML content
 * Converts special characters to their HTML entity equivalents
 * 
 * @param input The string to escape
 * @returns HTML escaped string
 */
export const escapeHtml = (input: string): string => {
  if (!input) return ''
  
  const str = String(input)
  
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}

/**
 * Complete XSS protection - sanitizes and escapes input
 * Use this when inserting user input into HTML
 * 
 * @param input User input to be protected against XSS
 * @returns Safe string for HTML insertion
 */
export const xssProtect = (input: string): string => {
  return escapeHtml(sanitizeInput(input))
}