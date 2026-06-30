/* Auth Page — Login/Register/Forgot Password */
import { auth } from '../js/auth.js';
import { FormValidator, getPasswordStrength } from '../js/validation.js';
import { Toast } from '../js/ui.js';
import { router } from '../js/router.js';
import { ICONS, icon } from '../js/helpers.js';
import { CONFIG } from '../js/config.js';

export function renderLogin() { return _renderAuthPage('login'); }
export function renderRegister() { return _renderAuthPage('register'); }
export function renderForgotPassword() { return _renderAuthPage('forgot'); }

function _renderAuthPage(mode) {
  const html = `
    <div class="container" style="min-height: 80vh; display: flex; align-items: center; justify-content: center; padding: var(--space-8) var(--space-4);">
      <div class="glass-card" style="width: 100%; max-width: 440px;">
        <div style="text-align: center; margin-bottom: var(--space-8);">
          <div class="logo__icon" style="width: 48px; height: 48px; margin: 0 auto var(--space-4); font-size: var(--fs-xl);">L</div>
          <h2>${mode === 'login' ? 'Welcome Back' : mode === 'register' ? 'Create Account' : 'Reset Password'}</h2>
          <p class="text-secondary text-sm mt-2">${mode === 'login' ? 'Sign in to your LUXE account' : mode === 'register' ? 'Join LUXE for exclusive benefits' : 'Enter your email to reset your password'}</p>
        </div>

        ${mode === 'login' ? `
          <form id="login-form">
            <div class="form-group"><label class="form-label form-label--required">Email</label><input class="form-input" name="email" type="email" placeholder="demo@luxe.com" required></div>
            <div class="form-group"><label class="form-label form-label--required">Password</label><input class="form-input" name="password" type="password" placeholder="Demo@123" required></div>
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: var(--space-6);">
              <label class="form-checkbox"><input type="checkbox" name="remember"><span class="text-sm">Remember me</span></label>
              <a href="/forgot-password" class="text-sm link">Forgot password?</a>
            </div>
            <button type="submit" class="btn btn--primary btn--lg btn--block">Sign In</button>
            <p style="text-center; margin-top: var(--space-4); font-size: var(--fs-sm); color: var(--text-secondary); text-align: center;">
              Demo: <strong>${CONFIG.DEMO_USER.email}</strong> / <strong>${CONFIG.DEMO_USER.password}</strong>
            </p>
          </form>
          <p style="text-align: center; margin-top: var(--space-6); font-size: var(--fs-sm); color: var(--text-secondary);">
            Don't have an account? <a href="/register" class="link" style="font-weight: var(--fw-semibold);">Create one</a>
          </p>
        ` : mode === 'register' ? `
          <form id="register-form">
            <div class="form-group"><label class="form-label form-label--required">Full Name</label><input class="form-input" name="name" placeholder="John Doe" required></div>
            <div class="form-group"><label class="form-label form-label--required">Email</label><input class="form-input" name="email" type="email" placeholder="john@example.com" required></div>
            <div class="form-group">
              <label class="form-label form-label--required">Password</label>
              <input class="form-input" name="password" type="password" placeholder="Min 8 characters" id="reg-password" required>
              <div class="password-strength" id="password-strength"><div class="password-strength__bar"><div class="password-strength__fill" id="strength-fill"></div></div><div class="password-strength__text" id="strength-text"></div></div>
            </div>
            <div class="form-group"><label class="form-label form-label--required">Confirm Password</label><input class="form-input" name="confirmPassword" type="password" placeholder="Repeat password" required></div>
            <label class="form-checkbox" style="margin-bottom: var(--space-6);"><input type="checkbox" required><span class="text-sm">I agree to the <a href="/terms" class="link">Terms</a> and <a href="/privacy" class="link">Privacy Policy</a></span></label>
            <button type="submit" class="btn btn--primary btn--lg btn--block">Create Account</button>
          </form>
          <p style="text-align: center; margin-top: var(--space-6); font-size: var(--fs-sm); color: var(--text-secondary);">
            Already have an account? <a href="/login" class="link" style="font-weight: var(--fw-semibold);">Sign in</a>
          </p>
        ` : `
          <form id="forgot-form">
            <div class="form-group"><label class="form-label form-label--required">Email</label><input class="form-input" name="email" type="email" placeholder="your@email.com" required></div>
            <button type="submit" class="btn btn--primary btn--lg btn--block">Send Reset Link</button>
          </form>
          <p style="text-align: center; margin-top: var(--space-6); font-size: var(--fs-sm);"><a href="/login" class="link">${ICONS.arrowLeft} Back to login</a></p>
        `}
      </div>
    </div>
  `;

  setTimeout(() => {
    /* Login */
    document.getElementById('login-form')?.addEventListener('submit', async (e) => {
      e.preventDefault();
      const btn = e.target.querySelector('button[type="submit"]');
      const originalText = btn.textContent;
      btn.textContent = 'Signing in...';
      btn.disabled = true;

      const fd = new FormData(e.target);
      const result = await auth.login(fd.get('email'), fd.get('password'));
      
      btn.textContent = originalText;
      btn.disabled = false;

      if (result.success) { Toast.success('Welcome back!', `Hello, ${result.user.name}`); router.navigate('/account'); }
      else { Toast.error('Login Failed', result.message); }
    });
    /* Register */
    document.getElementById('register-form')?.addEventListener('submit', async (e) => {
      e.preventDefault();
      const fd = new FormData(e.target);
      if (fd.get('password') !== fd.get('confirmPassword')) { Toast.error('Error', 'Passwords do not match'); return; }
      
      const btn = e.target.querySelector('button[type="submit"]');
      const originalText = btn.textContent;
      btn.textContent = 'Creating...';
      btn.disabled = true;

      const result = await auth.register({ name: fd.get('name'), email: fd.get('email'), password: fd.get('password') });
      
      btn.textContent = originalText;
      btn.disabled = false;

      if (result.success) { Toast.success('Welcome!', 'Your account has been created.'); router.navigate('/account'); }
      else { Toast.error('Registration Failed', result.message); }
    });
    /* Forgot */
    document.getElementById('forgot-form')?.addEventListener('submit', (e) => {
      e.preventDefault();
      Toast.success('Email Sent', 'If an account exists, you will receive a reset link.');
    });
    /* Password strength */
    document.getElementById('reg-password')?.addEventListener('input', (e) => {
      const { strength, label } = getPasswordStrength(e.target.value);
      const fill = document.getElementById('strength-fill');
      const text = document.getElementById('strength-text');
      if (fill) { fill.className = `password-strength__fill password-strength__fill--${strength}`; }
      if (text) { text.textContent = e.target.value ? label : ''; text.style.color = { weak: 'var(--color-error-500)', fair: 'var(--color-warning-500)', good: 'var(--color-info-500)', strong: 'var(--color-success-500)' }[strength]; }
    });
  }, 50);

  return html;
}
