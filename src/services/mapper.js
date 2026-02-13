const logger = require('../utils/logger');

/**
 * Map BigCommerce customer data to HubSpot contact format
 * @param {Object} customer - BigCommerce customer object
 * @param {Object} billingAddress - Billing address from order/cart
 * @returns {Object} - Mapped contact data
 */
function mapCustomerToContact(customer, billingAddress = {}) {
  const contactData = {};

  // Email (required)
  if (customer.email) {
    contactData.email = customer.email;
  } else if (billingAddress.email) {
    contactData.email = billingAddress.email;
  }

  // Name
  if (customer.first_name) {
    contactData.firstname = customer.first_name;
  } else if (billingAddress.first_name) {
    contactData.firstname = billingAddress.first_name;
  }

  if (customer.last_name) {
    contactData.lastname = customer.last_name;
  } else if (billingAddress.last_name) {
    contactData.lastname = billingAddress.last_name;
  }

  // Phone
  if (customer.phone) {
    contactData.phone = customer.phone;
  } else if (billingAddress.phone) {
    contactData.phone = billingAddress.phone;
  }

  // Company
  if (customer.company) {
    contactData.company = customer.company;
  } else if (billingAddress.company) {
    contactData.company = billingAddress.company;
  }

  // Address
  if (billingAddress.street_1) {
    contactData.address = billingAddress.street_1;
    if (billingAddress.street_2) {
      contactData.address += `, ${billingAddress.street_2}`;
    }
  }

  if (billingAddress.city) {
    contactData.city = billingAddress.city;
  }

  if (billingAddress.state) {
    contactData.state = billingAddress.state;
  }

  if (billingAddress.zip) {
    contactData.zip = billingAddress.zip;
  }

  if (billingAddress.country) {
    contactData.country = billingAddress.country;
  }

  logger.debug('Mapped customer to contact', { contactData });
  return contactData;
}

/**
 * Map BigCommerce order to HubSpot deal format
 * @param {Object} order - BigCommerce order object
 * @param {Array} products - Order products/line items
 * @returns {Object} - Mapped deal data
 */
function mapOrderToDeal(order, products = []) {
  const dealData = {
    dealname: `Order #${order.id}`,
    amount: parseFloat(order.total_inc_tax || order.total || 0),
    dealstage: 'closedwon',
    source: 'BigCommerce',
    order_id: order.id.toString(),
  };

  // Set close date to order date
  if (order.date_created) {
    dealData.closedate = new Date(order.date_created).getTime();
  }

  // Build description with order details
  const descriptionParts = [
    `Order ID: ${order.id}`,
    `Status: ${order.status || 'Unknown'}`,
    `Total: $${dealData.amount.toFixed(2)}`,
  ];

  if (order.payment_method) {
    descriptionParts.push(`Payment Method: ${order.payment_method}`);
  }

  if (products && products.length > 0) {
    descriptionParts.push('\nProducts:');
    products.forEach((product) => {
      descriptionParts.push(
        `- ${product.name || product.product_name || 'Unknown'} (Qty: ${product.quantity}) - $${product.price_inc_tax || product.price || 0}`
      );
    });
  }

  dealData.description = descriptionParts.join('\n');

  logger.debug('Mapped order to deal', { dealData });
  return dealData;
}

/**
 * Map BigCommerce abandoned cart to HubSpot deal format
 * @param {Object} cart - BigCommerce cart object
 * @returns {Object} - Mapped deal data
 */
function mapCartToDeal(cart) {
  const dealData = {
    dealname: `Abandoned Cart #${cart.id}`,
    amount: parseFloat(cart.cart_amount || cart.base_amount || 0),
    dealstage: 'appointmentscheduled', // Or custom abandoned cart stage
    source: 'BigCommerce - Abandoned Cart',
    cart_id: cart.id.toString(),
  };

  // Set close date to cart update date
  if (cart.updated_time) {
    dealData.closedate = new Date(cart.updated_time).getTime();
  } else if (cart.created_time) {
    dealData.closedate = new Date(cart.created_time).getTime();
  }

  // Build description with cart details
  const descriptionParts = [
    `Cart ID: ${cart.id}`,
    `Status: Abandoned`,
    `Total: $${dealData.amount.toFixed(2)}`,
  ];

  if (cart.line_items && cart.line_items.physical_items) {
    descriptionParts.push('\nProducts:');
    cart.line_items.physical_items.forEach((item) => {
      descriptionParts.push(
        `- ${item.name} (Qty: ${item.quantity}) - $${item.sale_price || item.list_price || 0}`
      );
    });
  }

  if (cart.line_items && cart.line_items.digital_items) {
    cart.line_items.digital_items.forEach((item) => {
      descriptionParts.push(
        `- ${item.name} (Qty: ${item.quantity}) - $${item.sale_price || item.list_price || 0}`
      );
    });
  }

  dealData.description = descriptionParts.join('\n');

  logger.debug('Mapped cart to deal', { dealData });
  return dealData;
}

module.exports = {
  mapCustomerToContact,
  mapOrderToDeal,
  mapCartToDeal,
};
