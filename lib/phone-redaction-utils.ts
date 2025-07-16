// lib/phone-redaction-utils.ts

/**
 * This file contains utility functions for redacting phone numbers.
 */

/**
 * Redacts a phone number by replacing all digits with asterisks.
 *
 * @param phoneNumber The phone number to redact.
 * @returns The redacted phone number.
 */
export function redactPhoneNumber(phoneNumber: string): string {
  if (!phoneNumber) {
    return phoneNumber
  }

  return phoneNumber.replace(/\d/g, "*")
}

/**
 * Redacts a phone number, leaving the last few digits visible.
 *
 * @param phoneNumber The phone number to redact.
 * @param visibleDigits The number of digits to leave visible at the end. Defaults to 4.
 * @returns The redacted phone number.
 */
export function redactPhoneNumberPartial(phoneNumber: string, visibleDigits = 4): string {
  if (!phoneNumber) {
    return phoneNumber
  }

  const numDigits = phoneNumber.replace(/[^0-9]/g, "").length // Count only digits
  const digitsToRedact = numDigits - visibleDigits

  if (digitsToRedact <= 0) {
    return phoneNumber // Not enough digits to redact
  }

  let redactedPhoneNumber = ""
  let digitsRedacted = 0

  for (let i = 0; i < phoneNumber.length; i++) {
    if (/\d/.test(phoneNumber[i])) {
      if (digitsRedacted < digitsToRedact) {
        redactedPhoneNumber += "*"
        digitsRedacted++
      } else {
        redactedPhoneNumber += phoneNumber[i]
      }
    } else {
      redactedPhoneNumber += phoneNumber[i]
    }
  }

  return redactedPhoneNumber
}
