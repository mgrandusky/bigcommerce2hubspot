const axios = require('axios');
const { config } = require('../config');
const logger = require('../utils/logger');
const { retryWithBackoff } = require('../utils/retry');

class HubSpotClient {
  constructor() {
    this.apiKey = config.hubspot.apiKey;
    this.accessToken = config.hubspot.accessToken;
    this.baseUrl = 'https://api.hubapi.com';
    
    // Use either API key or OAuth token
    const headers = {
      'Content-Type': 'application/json',
    };

    if (this.accessToken) {
      headers['Authorization'] = `Bearer ${this.accessToken}`;
    }

    this.client = axios.create({
      baseURL: this.baseUrl,
      headers,
    });

    // Add API key to params if using API key authentication
    if (this.apiKey && !this.accessToken) {
      this.client.interceptors.request.use((config) => {
        config.params = { ...config.params, hapikey: this.apiKey };
        return config;
      });
    }
  }

  /**
   * Create or update a HubSpot contact
   * @param {Object} contactData - Contact properties
   * @returns {Promise<Object>} - Created/updated contact
   */
  async createOrUpdateContact(contactData) {
    return retryWithBackoff(
      async () => {
        const email = contactData.email;
        logger.info(`Creating/updating HubSpot contact for ${email}`);

        try {
          // Try to find existing contact by email using correct endpoint
          const searchResponse = await this.client.get(
            `/contacts/v1/contact/email/${encodeURIComponent(email)}/profile`
          );

          if (searchResponse.data && searchResponse.data.vid) {
            // Update existing contact
            const vid = searchResponse.data.vid;
            const updateResponse = await this.client.post(
              `/contacts/v1/contact/vid/${vid}/profile`,
              { properties: this._formatContactProperties(contactData) }
            );
            logger.info(`Updated HubSpot contact ${vid}`);
            return updateResponse.data;
          }
        } catch (error) {
          if (error.response && error.response.status === 404) {
            // Contact doesn't exist, create new one
            const createResponse = await this.client.post('/contacts/v1/contact', {
              properties: this._formatContactProperties(contactData),
            });
            logger.info(`Created HubSpot contact ${createResponse.data.vid}`);
            return createResponse.data;
          }
          throw error;
        }
      },
      config.retry.maxAttempts,
      config.retry.delayMs,
      'Create/update contact'
    );
  }

  /**
   * Create a HubSpot deal
   * @param {Object} dealData - Deal properties
   * @returns {Promise<Object>} - Created deal
   */
  async createDeal(dealData) {
    return retryWithBackoff(
      async () => {
        logger.info(`Creating HubSpot deal: ${dealData.dealname}`);

        const response = await this.client.post('/deals/v1/deal', {
          properties: this._formatDealProperties(dealData),
        });

        logger.info(`Created HubSpot deal ${response.data.dealId}`);
        return response.data;
      },
      config.retry.maxAttempts,
      config.retry.delayMs,
      'Create deal'
    );
  }

  /**
   * Associate a deal with a contact
   * @param {Number} dealId - HubSpot deal ID
   * @param {Number} contactId - HubSpot contact ID (vid)
   * @returns {Promise<Object>} - Association result
   */
  async associateDealWithContact(dealId, contactId) {
    return retryWithBackoff(
      async () => {
        logger.info(`Associating deal ${dealId} with contact ${contactId}`);

        const response = await this.client.put(
          `/deals/v1/deal/${dealId}/associations/CONTACT`,
          {
            fromObjectId: dealId,
            toObjectId: contactId,
            category: 'HUBSPOT_DEFINED',
            definitionId: 3, // Deal to Contact association
          }
        );

        logger.info(`Associated deal ${dealId} with contact ${contactId}`);
        return response.data;
      },
      config.retry.maxAttempts,
      config.retry.delayMs,
      'Associate deal with contact'
    );
  }

  /**
   * Format contact properties for HubSpot API
   * @param {Object} contactData - Raw contact data
   * @returns {Array} - Formatted properties array
   */
  _formatContactProperties(contactData) {
    const properties = [];

    if (contactData.email) {
      properties.push({ property: 'email', value: contactData.email });
    }
    if (contactData.firstname) {
      properties.push({ property: 'firstname', value: contactData.firstname });
    }
    if (contactData.lastname) {
      properties.push({ property: 'lastname', value: contactData.lastname });
    }
    if (contactData.phone) {
      properties.push({ property: 'phone', value: contactData.phone });
    }
    if (contactData.company) {
      properties.push({ property: 'company', value: contactData.company });
    }
    if (contactData.address) {
      properties.push({ property: 'address', value: contactData.address });
    }
    if (contactData.city) {
      properties.push({ property: 'city', value: contactData.city });
    }
    if (contactData.state) {
      properties.push({ property: 'state', value: contactData.state });
    }
    if (contactData.zip) {
      properties.push({ property: 'zip', value: contactData.zip });
    }
    if (contactData.country) {
      properties.push({ property: 'country', value: contactData.country });
    }

    return properties;
  }

  /**
   * Format deal properties for HubSpot API
   * @param {Object} dealData - Raw deal data
   * @returns {Array} - Formatted properties array
   */
  _formatDealProperties(dealData) {
    const properties = [];

    if (dealData.dealname) {
      properties.push({ name: 'dealname', value: dealData.dealname });
    }
    if (dealData.amount !== undefined) {
      properties.push({ name: 'amount', value: dealData.amount });
    }
    if (dealData.dealstage) {
      properties.push({ name: 'dealstage', value: dealData.dealstage });
    }
    if (dealData.pipeline) {
      properties.push({ name: 'pipeline', value: dealData.pipeline });
    }
    if (dealData.closedate) {
      properties.push({ name: 'closedate', value: dealData.closedate });
    }
    if (dealData.description) {
      properties.push({ name: 'description', value: dealData.description });
    }

    // Add custom properties
    if (dealData.order_id) {
      properties.push({ name: 'order_id', value: dealData.order_id });
    }
    if (dealData.cart_id) {
      properties.push({ name: 'cart_id', value: dealData.cart_id });
    }
    if (dealData.source) {
      properties.push({ name: 'source', value: dealData.source });
    }

    return properties;
  }

  /**
   * Get a HubSpot contact by ID
   * @param {Number} contactId - HubSpot contact ID (vid)
   * @returns {Promise<Object>} - Contact data
   */
  async getContact(contactId) {
    return retryWithBackoff(
      async () => {
        logger.info(`Fetching HubSpot contact ${contactId}`);
        const response = await this.client.get(`/contacts/v1/contact/vid/${contactId}/profile`);
        return response.data;
      },
      config.retry.maxAttempts,
      config.retry.delayMs,
      `Get contact ${contactId}`
    );
  }

  /**
   * Get a HubSpot deal by ID
   * @param {Number} dealId - HubSpot deal ID
   * @returns {Promise<Object>} - Deal data
   */
  async getDeal(dealId) {
    return retryWithBackoff(
      async () => {
        logger.info(`Fetching HubSpot deal ${dealId}`);
        const response = await this.client.get(`/deals/v1/deal/${dealId}`);
        return response.data;
      },
      config.retry.maxAttempts,
      config.retry.delayMs,
      `Get deal ${dealId}`
    );
  }

  /**
   * Update a HubSpot deal
   * @param {Number} dealId - HubSpot deal ID
   * @param {Object} dealData - Deal properties to update
   * @returns {Promise<Object>} - Updated deal
   */
  async updateDeal(dealId, dealData) {
    return retryWithBackoff(
      async () => {
        logger.info(`Updating HubSpot deal ${dealId}`);
        const response = await this.client.put(`/deals/v1/deal/${dealId}`, {
          properties: this._formatDealProperties(dealData),
        });
        return response.data;
      },
      config.retry.maxAttempts,
      config.retry.delayMs,
      `Update deal ${dealId}`
    );
  }

  /**
   * Add contact to a list
   * @param {Number} listId - HubSpot list ID
   * @param {Number} contactId - HubSpot contact ID (vid)
   * @returns {Promise<Object>} - Result
   */
  async addContactToList(listId, contactId) {
    return retryWithBackoff(
      async () => {
        logger.info(`Adding contact ${contactId} to list ${listId}`);
        const response = await this.client.post(
          `/contacts/v1/lists/${listId}/add`,
          { vids: [contactId] }
        );
        return response.data;
      },
      config.retry.maxAttempts,
      config.retry.delayMs,
      `Add contact to list`
    );
  }

  /**
   * Create a timeline event
   * @param {Object} eventData - Timeline event data
   * @returns {Promise<Object>} - Created event
   */
  async createTimelineEvent(eventData) {
    return retryWithBackoff(
      async () => {
        logger.info(`Creating timeline event: ${eventData.eventTypeId}`);
        const response = await this.client.put(
          `/integrations/v1/${eventData.appId}/timeline/event`,
          eventData
        );
        return response.data;
      },
      config.retry.maxAttempts,
      config.retry.delayMs,
      'Create timeline event'
    );
  }
}

module.exports = HubSpotClient;
