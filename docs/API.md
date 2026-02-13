# BigCommerce to HubSpot Integration - Admin API

This document describes the Admin API endpoints for managing the BigCommerce to HubSpot integration.

## Authentication

All admin API endpoints (except `/admin/auth/login` and `/admin/auth/register`) require JWT authentication.

### Login

POST /admin/auth/login

Request:
{
  "email": "admin@example.com",
  "password": "your-password"
}

Response:
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "uuid",
    "email": "admin@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "role": "admin"
  }
}

## Sync Logs

GET /admin/sync-logs - Retrieve sync logs with filters
GET /admin/sync-logs/stats - Get sync statistics
GET /admin/sync-logs/:id - Get single sync log
POST /admin/sync-logs/:id/retry - Retry failed sync

See full documentation at: https://github.com/mgrandusky/bigcommerce2hubspot
