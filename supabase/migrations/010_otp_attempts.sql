/* ===================================================================
   010_otp_attempts.sql
   - Adds an `attempts` counter to `otps` so OTP verification can be rate
     limited. Without it, a 6-digit code (1,000,000 combinations) within its
     5-minute window can be brute-forced, since request throttling only limits
     how many codes are SENT — not how many guesses are tried.
   - The verify endpoint increments this on each wrong guess and rejects the
     code once it crosses a small threshold, forcing the user to request a
     fresh one.
   =================================================================== */

alter table otps add column if not exists attempts integer not null default 0;
