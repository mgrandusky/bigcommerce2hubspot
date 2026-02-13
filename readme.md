# BigCommerce to HubSpot Integration

A Node.js integration service that automatically synchronizes completed orders and abandoned carts from BigCommerce to HubSpot CRM.

## Features

- 🛒 **Order Sync**: Automatically creates HubSpot contacts and deals for completed BigCommerce orders
- 🛍️ **Abandoned Cart Recovery**: Tracks abandoned carts and creates deals in HubSpot for follow-up
- 🔄 **Real-time Updates**: Uses BigCommerce webhooks for instant synchronization
- 🔐 **Secure**: Webhook signature verification and secure API authentication
- 🔁 **Reliable**: Automatic retry logic with exponential backoff for failed API calls
- 📊 **Detailed Logging**: Comprehensive logging for monitoring and debugging

## Architecture

```
BigCommerce Webhooks → Express Server → Data Mapping → HubSpot API
                             ↓
                       Retry Logic & Error Handling
```

## Prerequisites

- Node.js 16.x or higher
- BigCommerce store with API credentials
- HubSpot account with API access
- Public URL for webhook endpoint (use ngrok for local development)

## Installation

1. Clone the repository:
```bash
git clone https://github.com/mgrandusky/bigcommerce2hubspot.git
cd bigcommerce2hubspot
```

2. Install dependencies:
```bash
npm install
```

3. Create environment configuration:
```bash
cp .env.example .env
```

4. Configure environment variables (see Configuration section)

## Configuration

### Environment Variables

Edit `.env` file with your credentials:

```env
# Server Configuration
PORT=3000
NODE_ENV=production

# BigCommerce API Configuration
BIGCOMMERCE_STORE_HASH=your_store_hash
BIGCOMMERCE_ACCESS_TOKEN=your_access_token
BIGCOMMERCE_CLIENT_ID=your_client_id
BIGCOMMERCE_CLIENT_SECRET=your_client_secret

# HubSpot API Configuration
HUBSPOT_API_KEY=your_hubspot_api_key
# OR use OAuth
HUBSPOT_ACCESS_TOKEN=your_hubspot_oauth_token

# Webhook Configuration
WEBHOOK_SECRET=your_webhook_secret

# HubSpot Pipeline Configuration (optional)
HUBSPOT_PIPELINE_ID=default
HUBSPOT_ORDER_STAGE_ID=closedwon
HUBSPOT_ABANDONED_CART_STAGE_ID=appointmentscheduled

# Retry Configuration (optional)
MAX_RETRY_ATTEMPTS=3
RETRY_DELAY_MS=1000

# Logging (optional)
LOG_LEVEL=info
```

### Getting BigCommerce API Credentials

1. Log in to your BigCommerce store admin panel
2. Navigate to **Advanced Settings** > **API Accounts**
3. Click **Create API Account**
4. Select **Create V2/V3 API Token**
5. Set the following OAuth scopes:
   - Orders: `read-only` or `modify`
   - Customers: `read-only` or `modify`
   - Carts: `read-only` or `modify`
6. Save and copy your credentials:
   - Store Hash (from store URL: `store-{hash}.mybigcommerce.com`)
   - Access Token
   - Client ID
   - Client Secret

### Getting HubSpot API Credentials

#### Option 1: API Key (Simpler, but being deprecated)
1. Log in to your HubSpot account
2. Go to **Settings** > **Integrations** > **API Key**
3. Generate or copy your API key
4. Add to `.env` as `HUBSPOT_API_KEY`

#### Option 2: OAuth (Recommended)
1. Create a HubSpot app in the [Developer Portal](https://developers.hubspot.com/)
2. Configure OAuth scopes: `contacts`, `crm.objects.deals.write`, `crm.objects.contacts.write`
3. Complete OAuth flow to get an access token
4. Add to `.env` as `HUBSPOT_ACCESS_TOKEN`

### Registering Webhooks in BigCommerce

1. Use BigCommerce API or Control Panel to register webhooks
2. Set webhook destination to your public URL: `https://your-domain.com/webhook`
3. Register these webhook events:
   - `store/order/created`
   - `store/cart/abandoned`

#### Using BigCommerce API to Register Webhooks:

```bash
curl -X POST \
  https://api.bigcommerce.com/stores/{store_hash}/v3/hooks \
  -H 'X-Auth-Token: {access_token}' \
  -H 'Content-Type: application/json' \
  -d '{
    "scope": "store/order/created",
    "destination": "https://your-domain.com/webhook",
    "is_active": true,
    "headers": {}
  }'
```

Repeat for `store/cart/abandoned` scope.

## Usage

### Running the Server

**Development mode** (with auto-reload):
```bash
npm run dev
```

**Production mode**:
```bash
npm start
```

The server will start on the configured port (default: 3000).

### Testing the Integration

1. **Health Check**: 
```bash
curl http://localhost:3000/health
```

2. **Test Order Webhook** (replace with actual data):
```bash
curl -X POST http://localhost:3000/webhook \
  -H 'Content-Type: application/json' \
  -d '{
    "scope": "store/order/created",
    "data": {
      "id": 12345
    }
  }'
```

3. **Check Logs**: Monitor console output for sync status

## Project Structure

```
bigcommerce2hubspot/
├── src/
│   ├── clients/              # API clients
│   │   ├── bigcommerce.js    # BigCommerce API client
│   │   └── hubspot.js        # HubSpot API client
│   ├── config/               # Configuration management
│   │   └── index.js          # Environment config
│   ├── handlers/             # Webhook handlers
│   │   └── webhook.js        # Webhook processing logic
│   ├── services/             # Business logic
│   │   ├── mapper.js         # Data mapping/transformation
│   │   └── sync.js           # Sync orchestration
│   ├── utils/                # Utilities
│   │   ├── logger.js         # Logging setup
│   │   └── retry.js          # Retry logic
│   └── index.js              # Express server setup
├── .env.example              # Example environment variables
├── .gitignore                # Git ignore rules
├── package.json              # Dependencies and scripts
└── README.md                 # This file
```

## Data Mapping

### BigCommerce Customer → HubSpot Contact
- `email` → `email` (required)
- `first_name` → `firstname`
- `last_name` → `lastname`
- `phone` → `phone`
- `company` → `company`
- Billing address → Address fields

### BigCommerce Order → HubSpot Deal
- Order ID → Deal name (`Order #{id}`)
- `total_inc_tax` → `amount`
- Status → `closedwon` (completed orders)
- Products → Deal description
- `date_created` → `closedate`

### BigCommerce Cart → HubSpot Deal
- Cart ID → Deal name (`Abandoned Cart #{id}`)
- `cart_amount` → `amount`
- Status → Custom stage (abandoned cart)
- Line items → Deal description
- `updated_time` → `closedate`

## Error Handling

The integration includes comprehensive error handling:

- **Retry Logic**: Failed API calls are retried up to 3 times with exponential backoff
- **Graceful Degradation**: Missing customer data is handled gracefully
- **Webhook Acknowledgment**: Webhooks are acknowledged immediately to prevent timeouts
- **Async Processing**: Heavy processing is done asynchronously after webhook response
- **Detailed Logging**: All errors are logged with context for debugging

## Deployment

### Using PM2 (Recommended for production)

1. Install PM2:
```bash
npm install -g pm2
```

2. Start the application:
```bash
pm2 start src/index.js --name bigcommerce2hubspot
```

3. Configure auto-restart:
```bash
pm2 startup
pm2 save
```

### Using Docker

1. Create `Dockerfile`:
```dockerfile
FROM node:16-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 3000
CMD ["npm", "start"]
```

2. Build and run:
```bash
docker build -t bigcommerce2hubspot .
docker run -p 3000:3000 --env-file .env bigcommerce2hubspot
```

### Cloud Deployment

The application can be deployed to:
- **Heroku**: Use the Heroku Node.js buildpack
- **AWS Elastic Beanstalk**: Deploy as Node.js application
- **Google Cloud Run**: Containerize and deploy
- **Azure App Service**: Deploy as Node.js web app
- **DigitalOcean App Platform**: Deploy from Git repository

**Important**: Ensure your deployment platform provides a public URL for BigCommerce webhooks.

## Monitoring

### Logs

- Development: Console output with colored formatting
- Production: JSON-formatted logs in `logs/` directory
  - `combined.log`: All logs
  - `error.log`: Error logs only

### Recommended Monitoring Tools

- **Log Management**: Loggly, Papertrail, or CloudWatch Logs
- **Application Monitoring**: New Relic, Datadog, or Application Insights
- **Uptime Monitoring**: UptimeRobot, Pingdom, or StatusCake

## Security Best Practices

1. **Keep Secrets Secure**: Never commit `.env` file to version control
2. **Use HTTPS**: Always use HTTPS for webhook endpoints in production
3. **Verify Signatures**: Webhook signature verification is enabled by default
4. **Rotate Credentials**: Regularly rotate API keys and tokens
5. **Limit Permissions**: Use minimum required API scopes/permissions
6. **Update Dependencies**: Regularly update npm packages for security patches

## Troubleshooting

### Common Issues

**Webhook not receiving data:**
- Verify webhook URL is publicly accessible
- Check BigCommerce webhook registration
- Review webhook signature configuration

**Order/cart sync failing:**
- Check API credentials are correct
- Verify API permissions/scopes
- Review logs for specific error messages

**Missing customer email:**
- Some orders/carts may not have email addresses
- These will be skipped with a warning log

**HubSpot rate limiting:**
- Default retry logic handles rate limits
- Consider implementing queue system for high-volume stores

## Contributing

Contributions are welcome! Please:
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

MIT License - see LICENSE file for details

## Support

For issues and questions:
- GitHub Issues: [Create an issue](https://github.com/mgrandusky/bigcommerce2hubspot/issues)
- Documentation: This README

## Roadmap

Future enhancements:
- [ ] Support for product catalog sync
- [ ] Custom field mapping configuration
- [ ] Webhook event filtering
- [ ] Admin dashboard for monitoring
- [ ] Support for multiple BigCommerce stores
- [ ] GraphQL API support

---

Built with ❤️ for BigCommerce and HubSpot users
