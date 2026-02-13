# Deployment Guide

## Docker Deployment

### Development

```bash
docker-compose -f docker-compose.dev.yml up
```

### Production

1. Copy .env.example to .env and configure
2. Run with Docker Compose:

```bash
docker-compose up -d
```

## Cloud Platforms

### Heroku

```bash
heroku create bigcommerce2hubspot
heroku addons:create heroku-postgresql:hobby-dev
heroku addons:create heroku-redis:hobby-dev
git push heroku main
```

### AWS ECS/Fargate

See AWS documentation for container deployment.

### Google Cloud Run

```bash
gcloud run deploy bigcommerce2hubspot --source .
```

