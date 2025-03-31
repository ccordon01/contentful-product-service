# AD Products API

## Overview

This project is a backend service for managing product data. It fetches data from Contentful, inserts it into a MongoDB database, and provides both public and private endpoints for interacting with the data.

## Setup

### Prerequisites

1. **Docker**: Make sure Docker is installed on your system.
2. **Node.js**: Ensure Node.js is installed if you plan to run the application locally without Docker.

### Environment Variables

#### Run Locally

Create a file named `.env` in the root directory with the following content:

```env
# APP
APP_PORT=3000

# RABBITMQ
RABBITMQ_URL=amqp://amqp:5672

# DATABASE
MONGODB_URI=mongodb://mongodb:27017/ad_contentful_db

# CONTENTFUL API
CONTENTFUL_URL=https://cdn.contentful.com
CONTENTFUL_SPACE_ID=
CONTENTFUL_ACCESS_TOKEN=
CONTENTFUL_ENVIRONMENT=
CONTENTFUL_CONTENT_TYPE=

# AUTHENTICATION
JWT_SECRET=7f5fbdda-4921-49ef-9d60-94d681902f2a
```

Add the access needed to interact with the Contentful API, as this is a public repository no keys will be exposed here.

**Note:** Don't worry about JWT_SECRET, trust me, it's a necessary variable for the app but sharing its value doesn't compromise the information.

#### Dockerfile

You should customize the '.env.docker' file with the information mentioned above, this is a template you can use to be sure of the name of the variables, remember that for this you need to have MongoDB running on your local computer. if you don't have it check the next section.

```sh
docker run -p 5100:3000 --env-file .env.docker ad-products-api
```

#### Docker Compose

When using Docker Compose, you should add your environment variables to the `.env.docker-compose` file. This separate file provides the following advantages:

- **Clear organization**: Each deployment method has its own configuration file
- **Error prevention**: Avoids confusion by having context-specific configurations

Build and Run the Application, Open a terminal and navigate to the project directory. Run the following command to build and start the services:

```sh
docker-compose up --build
```

This command starts the application and MongoDB services. The application will be available at `http://localhost:3100`.

## Usage and How it works

### Populate the Database for the First Time

The application is configured to fetch data from Contentful every hour. To manually trigger data fetching and populate the database, you can use the public endpoint:

```sh
curl -X POST http://localhost:3100/api/v1/products/fetch \
  -H 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpYXQiOjE3NDM0NDYzODMsImV4cCI6MTc0MzQ1NzE4M30.BQd6Motz8AVWfh7JmKkeeKYXrhGZ2Mx0sLyiavmvv4c
```

**Note:** This endpoint can be used at any time not only at the beginning, its objective is to synchronize products on demand. Remember the port may vary depending on how you are running the application, please check before calling this service.

### Swagger

The API documentation is available at `http://localhost:3100/api/docs`

### Authentication

For the purpose of this project, you don’t need a username or password. Each time you call this service, it will provide you with a JWT token that is valid for 3 hours. This token is required to access the private endpoints.

#### Sign In

`GET /api/v1/auth/sign-in`
Authenticates and returns a JWT token.

### Assumptions

For this project, the Product SKU is used as the primary identifier for products. During each synchronization with the API, products are added to the database. When a product is deleted, it is marked as deleted in our database. This approach allows us to:

- Track products that have been deleted.
- Ensure that deleted products are not included in future synchronizations.
- Optimize database performance with an index based on productSku, making product searches and lookups significantly more efficient.

### Considerations

#### Rate Limiting

**Important for Public Endpoints**: Our API implements rate limiting (10 requests per 15 seconds per IP) to protect public endpoints from abuse. Exceeding this limit results in HTTP 429 errors.

### Environment Variable Validation

**Critical for Application Startup**: The application validates all required environment variables during initialization. Please ensure that:

- All variables defined in the `.env`, `.env.docker`, or `.env.docker-compose` files are properly set
- Contentful credentials (CONTENTFUL_SPACE_ID, CONTENTFUL_ACCESS_TOKEN, etc.) are valid and have appropriate permissions
- Database connection strings point to accessible instances
- RabbitMQ URL is correctly configured

Missing or invalid environment variables will cause the application to fail on startup with specific error messages identifying the issues. Pay special attention to third-party service credentials, as authentication failures may not be immediately obvious and could affect synchronization processes.

### Product Synchronization

The application uses a message queue system (RabbitMQ) and pagination to efficiently synchronize products from Contentful to the MongoDB database. This approach provides several benefits:

#### Message Queue Architecture

- **Producer/Consumer Model**: For the purpose of this project, both the consumer and producer are implemented within the same application. The producer creates individual messages for each product, and the consumer handles inserting or updating them in the database.
- **Resilient Processing**: Using a message queue ensures that product data is not lost if an error occurs during processing. Failed operations can be retried.
- **Asynchronous Workflow**: The synchronization process runs in the background without blocking the main application.

#### Pagination Strategy

- **Efficient Data Fetching**: When fetching products from Contentful, the application retrieves them in pages of 10 products at a time.
- **Individual Processing**: After retrieving each page, the system creates one message per product and sends it to the queue.
- **Resource Optimization**: This approach prevents overwhelming the system when dealing with large catalogs.
- **Consistent Performance**: The combination of pagination and queue-based processing ensures consistent performance regardless of the catalog size.

Each time the synchronization is triggered (either automatically or via the manual endpoint), the system:

1. Fetches products from Contentful in pages of 10
2. For each product in the page, creates an individual message in the queue
3. Processes these messages one by one to update the database

### Product Lifecycle

The system manages the complete lifecycle of products as follows:

#### Creation
- When a product is detected for the first time during synchronization, all its information is recorded in MongoDB.
- Each product receives a complete record including its SKU, name, price, stock, and other relevant attributes.

#### Update
- During subsequent synchronizations, the system looks for existing products by their SKU.
- If the product already exists in the database, its data is updated with the most recent information from Contentful.
- This ensures that changes such as price updates, descriptions, or inventory levels are correctly reflected.

#### Deletion
- When a product is deleted, it is not physically removed from the database.
- Instead, it is marked as "inactive" in the system.
- Automatically, its stock is set to 0.

#### Reactivation
- If a previously deleted product reappears is reactivated, the system will detect it in the next synchronization.
- The product will automatically regain its "active" status.
- Updates to its stock and other attributes will be allowed again.
- This process requires no manual intervention and is part of the normal synchronization flow.

