# BigCommerce to HubSpot Enterprise Integration

An enterprise-grade Node.js integration service that provides bi-directional synchronization between BigCommerce and HubSpot CRM with advanced features including queue management, admin API, and comprehensive logging.

## 🚀 Enterprise Features

### Core Sync Features
- ✅ **Bi-directional Sync**: Sync data between BigCommerce and HubSpot in both directions
- ✅ **Order Sync**: Automatically creates HubSpot contacts and deals for completed orders
- ✅ **Abandoned Cart Recovery**: Tracks abandoned carts and creates deals for follow-up
- ✅ **Contact Updates**: Sync HubSpot contact changes back to BigCommerce customers
- ✅ **Order Status Updates**: Update BigCommerce orders when deals move through HubSpot pipelines
- ✅ **Marketing Preferences**: Sync marketing opt-in/opt-out between platforms

### Infrastructure & Scalability
- ✅ **Queue System**: Redis-backed Bull queues for high-volume processing
- ✅ **Database Layer**: SQLite for development, PostgreSQL for production
- ✅ **Comprehensive Logging**: Track all syncs with detailed audit logs
- ✅ **Retry Logic**: Automatic retry with exponential backoff for failed syncs
- ✅ **Docker Support**: Full Docker and Docker Compose setup for easy deployment

### Admin & Management
- ✅ **Admin API**: RESTful API for managing the integration
- ✅ **JWT Authentication**: Secure admin access with role-based permissions
- ✅ **Sync History**: View and search sync logs with detailed information
- ✅ **Manual Retry**: Retry failed syncs through the admin API
- ✅ **Statistics**: Real-time sync statistics and success rates

### Security
- ✅ **Webhook Signature Verification**: Verify BigCommerce webhooks
- ✅ **Password Hashing**: bcrypt for secure password storage
- ✅ **JWT Tokens**: Secure API authentication
- ✅ **Role-based Access Control**: Admin, user, and readonly roles

## Quick Start

### Using Docker (Recommended)

1. Clone and configure:
```bash
git clone https://github.com/mgrandusky/bigcommerce2hubspot.git
cd bigcommerce2hubspot
cp .env.example .env
# Edit .env with your credentials
```

2. Start with Docker Compose:
```bash
docker-compose up -d
```

This starts the application with PostgreSQL and Redis for production use.

### Development Setup

```bash
# Install dependencies
npm install

# Copy environment file
cp .env.example .env

# Edit .env with your credentials

# Run in development mode
npm run dev
```

## Environment Configuration

See `.env.example` for all available options. Key configurations:

```env
# BigCommerce
BIGCOMMERCE_STORE_HASH=your_store_hash
BIGCOMMERCE_ACCESS_TOKEN=your_token

# HubSpot
HUBSPOT_API_KEY=your_api_key

# Database (SQLite for dev, PostgreSQL for prod)
DB_DIALECT=sqlite
DB_STORAGE=./data/database.sqlite

# Queue System (Optional)
QUEUE_ENABLED=false
REDIS_HOST=localhost

# Admin Interface
ADMIN_ENABLED=true
JWT_SECRET=change-this-in-production
```

## Admin API

### First-time Setup

1. Start the server
2. Register the first admin user:
```bash
curl -X POST http://localhost:3000/admin/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@example.com",
    "password": "secure-password",
    "firstName": "Admin",
    "lastName": "User"
  }'
```

3. Get your JWT token:
```bash
curl -X POST http://localhost:3000/admin/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@example.com",
    "password": "secure-password"
  }'
```

### API Endpoints

- `POST /admin/auth/login` - Login and get JWT token
- `POST /admin/auth/register` - Register first admin (only if no users exist)
- `GET /admin/sync-logs` - Get sync logs with filters
- `GET /admin/sync-logs/stats` - Get sync statistics
- `GET /admin/sync-logs/:id` - Get specific sync log
- `POST /admin/sync-logs/:id/retry` - Retry a failed sync

Full API documentation: [docs/API.md](docs/API.md)

## Architecture

```
┌─────────────────────┐
│  BigCommerce Store  │
└──────────┬──────────┘
           │ Webhooks
           ▼
┌─────────────────────────────────────────────┐
│         Express Application                  │
│  ┌─────────────────────────────────────┐   │
│  │     Webhook Handler                  │   │
│  └──────────┬──────────────────────────┘   │
│             │                                 │
│             ▼                                 │
│  ┌─────────────────────┐                    │
│  │   Queue System      │ (Optional)         │
│  │   Bull + Redis      │                    │
│  └──────────┬──────────┘                    │
│             │                                 │
│             ▼                                 │
│  ┌─────────────────────┐                    │
│  │   Sync Services     │                    │
│  │   - Order Sync      │                    │
│  │   - Cart Sync       │                    │
│  │   - Contact Sync    │                    │
│  │   - Deal Sync       │                    │
│  └──────────┬──────────┘                    │
│             │                                 │
│  ┌──────────▼──────────┐                    │
│  │   Database Layer    │                    │
│  │   (Sync Logs)       │                    │
│  └─────────────────────┘                    │
│                                               │
│  ┌─────────────────────┐                    │
│  │    Admin API        │                    │
│  │    (REST + JWT)     │                    │
│  └─────────────────────┘                    │
└────────────┬────────────────────────────────┘
             │
             ▼
┌─────────────────────┐
│   HubSpot CRM       │
└─────────────────────┘
```

## Deployment

### Docker Production

```bash
# Start with PostgreSQL and Redis
docker-compose up -d

# View logs
docker-compose logs -f app

# Stop services
docker-compose down
```

### Heroku

```bash
heroku create bigcommerce2hubspot
heroku addons:create heroku-postgresql:hobby-dev
heroku addons:create heroku-redis:hobby-dev
git push heroku main
```

### AWS/GCP/Azure

See [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md) for detailed deployment guides.

## Testing

```bash
# Run tests with coverage
npm test

# Run linter
npm run lint
```

## Monitoring

### Health Checks

```bash
# Application health
curl http://localhost:3000/health

# Admin API health
curl http://localhost:3000/admin/health
```

### Sync Statistics

```bash
# Get sync stats (last 24 hours)
curl http://localhost:3000/admin/sync-logs/stats \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## Project Structure

```
bigcommerce2hubspot/
├── src/
│   ├── admin/              # Admin API
│   │   ├── middleware/     # Auth middleware
│   │   └── routes/         # API routes
│   ├── clients/            # API clients
│   │   ├── bigcommerce.js
│   │   └── hubspot.js
│   ├── database/           # Database layer
│   │   └── models/         # Sequelize models
│   ├── handlers/           # Webhook handlers
│   ├── queue/              # Queue system
│   ├── services/           # Business logic
│   │   ├── sync.js         # BC → HS sync
│   │   ├── biDirectionalSync.js # HS → BC sync
│   │   ├── mapper.js       # Data mapping
│   │   └── syncLog.js      # Logging service
│   └── utils/              # Utilities
├── docs/                   # Documentation
├── examples/               # Example payloads
├── Dockerfile
├── docker-compose.yml
└── package.json
```

## Roadmap

Planned features:

- [ ] Web-based Admin UI (React)
- [ ] Field mapping configuration UI
- [ ] Multiple pipeline support
- [ ] Product catalog sync
- [ ] Custom HubSpot objects
- [ ] Slack/Teams notifications
- [ ] Advanced analytics dashboard
- [ ] OAuth 2.0 for HubSpot
- [ ] Bulk import tools

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for contribution guidelines.

## License

MIT License - see [LICENSE](LICENSE)

## Support

- Documentation: [docs/](docs/)
- Issues: [GitHub Issues](https://github.com/mgrandusky/bigcommerce2hubspot/issues)
- Quick Start: [QUICKSTART.md](QUICKSTART.md)

---

Built with ❤️ for BigCommerce and HubSpot users
