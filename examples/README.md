# Interactive Provider Examples

This directory contains standalone examples and templates for implementing custom SMS and Email providers for Livestock AI.

## Overview

Livestock AI uses a provider pattern for its notification systems. While the core application comes with standard providers (Twilio, Resend, etc.), you might need to integrate with a service specific to your region or infrastructure.

These examples show how to implement the `SMSProvider` and `EmailProvider` interfaces correctly.

## Prerequisites

- [Bun](https://bun.sh) installed globally
- Basic understanding of TypeScript and the `fetch` API

## Quick Start

1. Install dependencies for the examples:

   ```bash
   cd examples
   bun install
   ```

2. Copy the environment template and add your credentials:

   ```bash
   cp .env.example .env
   ```

3. Run the tests to see the examples in action:
   ```bash
   bun test
   ```

## Included Examples

### SMS Providers

- **Twilio**: Global industry standard (Core Service - `examples/sms/twilio.ts`)
- **Termii**: Leading provider in Nigeria (Core Service - `examples/sms/termii.ts`)
- **Africa's Talking**: Popular in East Africa (`examples/sms/africas-talking.ts`)
- **Zenvia**: Market leader in Brazil (`examples/sms/zenvia.ts`)
- **MSG91**: Top provider in India (`examples/sms/msg91.ts`)
- **BulkSMS**: Reliable South African service (`examples/sms/bulksms.ts`)
- **Custom Template**: A boilerplate for your own provider (`examples/templates/custom-sms-provider.ts`)

### Email Providers

- **Resend**: Modern developer-centric email (Core Service - `examples/email/resend.ts`)
- **AWS SES**: Enterprise-grade email service (`examples/email/aws-ses.ts`)
- **SMTP**: Standard protocol for local testing (Core Service - `examples/email/smtp.ts`)
- **Mailgun**: Powerful developer-centric alternative (`examples/email/mailgun.ts`)
- **Custom Template**: A boilerplate for your own provider (`examples/templates/custom-email-provider.ts`)

## Integration Guide

To use one of these providers in your main application:

1. Copy the provider file (e.g., `africas-talking.ts`) to `app/features/integrations/sms/providers/`.
2. Register the provider in `app/features/integrations/sms/index.ts`.
3. Add any necessary configuration keys to `app/features/integrations/config.ts`.
4. Set the required environment variables in your main `.env` file.

## Troubleshooting

- **TypeScript Errors**: Ensure you have run `bun install` in both the root and `examples/` directory.
- **Provider Not Found**: Double-check the registration step in the integration guide.
