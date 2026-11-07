// Test compatibility aliases. Runtime provider selection uses MailtrapEmailProvider or MockEmailProvider.
export { MailtrapEmailProvider as SmtpEmailProvider, MockEmailProvider as BrevoApiEmailProvider } from './email-provider.js';
