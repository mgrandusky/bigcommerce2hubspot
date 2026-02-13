# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2026-02-13

### Added
- Initial release
- BigCommerce webhook listeners for order creation and cart abandonment
- HubSpot API integration for contacts and deals
- Data mapping from BigCommerce to HubSpot
- Webhook signature verification
- Rate limiting for security
- Retry logic with exponential backoff
- Comprehensive error handling and logging
- Express server with async webhook processing
- Unit tests for data mapping
- ESLint and Jest configuration
- Comprehensive documentation (README, QUICKSTART, CONTRIBUTING)
- Example webhook payloads
- MIT License

### Security
- Rate limiting on webhook endpoint (100 requests per minute per IP)
- Webhook signature verification using HMAC SHA-256
- Secure credential management via environment variables

## [Unreleased]

### Planned Features
- Product catalog synchronization
- Custom field mapping configuration
- Webhook event filtering
- Admin dashboard for monitoring
- Support for multiple BigCommerce stores
- GraphQL API support
- Batch processing for high-volume stores
- Webhook retry mechanism for failed syncs
- Custom HubSpot pipeline configuration UI

---

[1.0.0]: https://github.com/mgrandusky/bigcommerce2hubspot/releases/tag/v1.0.0
