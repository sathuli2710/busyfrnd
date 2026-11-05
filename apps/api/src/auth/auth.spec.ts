import { BadRequestException } from '@nestjs/common';
import { normalizePhone } from './auth.service';

describe('normalizePhone', () => {
  it('adds +91 to 10-digit numbers', () => expect(normalizePhone('98765 43210')).toBe('+919876543210'));
  it('accepts 0-prefixed and 91-prefixed', () => {
    expect(normalizePhone('09876543210')).toBe('+919876543210');
    expect(normalizePhone('919876543210')).toBe('+919876543210');
  });
  it('keeps full international numbers', () => expect(normalizePhone('+14155550123')).toBe('+14155550123'));
  it('rejects garbage', () => expect(() => normalizePhone('12345')).toThrow(BadRequestException));
});
