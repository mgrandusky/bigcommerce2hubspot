# Quick Start Guide

Get up and running with BigCommerce to HubSpot integration in 5 minutes.

## 1. Install Dependencies

```bash
npm install
```

## 2. Configure Environment Variables

Copy the example environment file:
```bash
cp .env.example .env
```

Edit `.env` and add your credentials:
```env
# BigCommerce
BIGCOMMERCE_STORE_HASH=abc123def
BIGCOMMERCE_ACCESS_TOKEN=your_token_here

# HubSpot
HUBSPOT_API_KEY=your_api_key_here

# Webhook
WEBHOOK_SECRET=your_secret_here
```

## 3. Start the Server

**Development mode:**
```bash
npm run dev
```

**Production mode:**
```bash
npm start
```

The server will start on port 3000 (configurable via PORT environment variable).

## 4. Register Webhooks in BigCommerce

Register two webhooks using the BigCommerce API:

### Order Created Webhook
```bash
curl -X POST \
  https://api.bigcommerce.com/stores/{store_hash}/v3/hooks \
  -H 'X-Auth-Token: {access_token}' \
  -H 'Content-Type: application/json' \
  -d '{
    "scope": "store/order/created",
    "destination": "https://your-domain.com/webhook",
    "is_active": true
  }'
```

### Cart Abandoned Webhook
```bash
curl -X POST \
  https://api.bigcommerce.com/stores/{store_hash}/v3/hooks \
  -H 'X-Auth-Token: {access_token}' \
  -H 'Content-Type: application/json' \
  -d '{
    "scope": "store/cart/abandoned",
    "destination": "https://your-domain.com/webhook",
    "is_active": true
  }'
```

## 5. Test the Integration

### Health Check
```bash
curl http://localhost:3000/health
```

### Test Webhook (for development)
```bash
curl -X POST http://localhost:3000/webhook \
  -H 'Content-Type: application/json' \
  -d '{
    "scope": "store/order/created",
    "data": { "id": 12345 }
  }'
```

## Getting Your Credentials

### BigCommerce API Credentials

1. Log in to your BigCommerce admin panel
2. Go to **Advanced Settings** > **API Accounts**
3. Click **Create API Account** > **Create V2/V3 API Token**
4. Required OAuth Scopes:
   - Orders: read-only
   - Customers: read-only
   - Carts: read-only
5. Copy your credentials

### HubSpot API Key

1. Log in to HubSpot
2. Go to **Settings** > **Integrations** > **API Key**
3. Generate or view your API key
4. Copy the key

## Deployment Options

### Using PM2
```bash
npm install -g pm2
pm2 start src/index.js --name bigcommerce2hubspot
pm2 save
```

### Using Docker
```bash
docker build -t bigcommerce2hubspot .
docker run -p 3000:3000 --env-file .env bigcommerce2hubspot
```

### Cloud Platforms
- **Heroku**: `git push heroku main`
- **AWS Elastic Beanstalk**: Use Node.js platform
- **Google Cloud Run**: Deploy containerized app
- **DigitalOcean**: Use App Platform

## Troubleshooting

**Server won't start:**
- Check environment variables are set correctly
- Verify port 3000 is not in use

**Webhooks not working:**
- Ensure webhook URL is publicly accessible (use ngrok for local testing)
- Verify webhook signature secret matches

**No data in HubSpot:**
- Check logs for error messages
- Verify API credentials have correct permissions
- Ensure customer email exists (required for contact creation)

## Next Steps

- Review the full [README.md](readme.md) for detailed documentation
- Monitor logs for sync status
- Set up monitoring and alerts
- Configure custom deal stages for abandoned carts

## Support

For issues: https://github.com/mgrandusky/bigcommerce2hubspot/issues
