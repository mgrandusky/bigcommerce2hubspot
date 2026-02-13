const { mapCustomerToContact, mapOrderToDeal, mapCartToDeal } = require('../services/mapper');

describe('Data Mapper', () => {
  describe('mapCustomerToContact', () => {
    it('should map customer data to contact format', () => {
      const customer = {
        email: 'test@example.com',
        first_name: 'John',
        last_name: 'Doe',
        phone: '555-1234',
        company: 'Test Co',
      };

      const contact = mapCustomerToContact(customer);

      expect(contact.email).toBe('test@example.com');
      expect(contact.firstname).toBe('John');
      expect(contact.lastname).toBe('Doe');
      expect(contact.phone).toBe('555-1234');
      expect(contact.company).toBe('Test Co');
    });

    it('should use billing address when customer data is missing', () => {
      const customer = {};
      const billingAddress = {
        email: 'billing@example.com',
        first_name: 'Jane',
        last_name: 'Smith',
        street_1: '123 Main St',
        city: 'Boston',
        state: 'MA',
        zip: '02101',
        country: 'US',
      };

      const contact = mapCustomerToContact(customer, billingAddress);

      expect(contact.email).toBe('billing@example.com');
      expect(contact.firstname).toBe('Jane');
      expect(contact.lastname).toBe('Smith');
      expect(contact.address).toBe('123 Main St');
      expect(contact.city).toBe('Boston');
      expect(contact.state).toBe('MA');
      expect(contact.zip).toBe('02101');
      expect(contact.country).toBe('US');
    });
  });

  describe('mapOrderToDeal', () => {
    it('should map order data to deal format', () => {
      const order = {
        id: 12345,
        total_inc_tax: '99.99',
        status: 'Completed',
        date_created: '2023-11-01T10:00:00Z',
        payment_method: 'Credit Card',
      };

      const products = [
        {
          name: 'Product 1',
          quantity: 2,
          price_inc_tax: 29.99,
        },
        {
          name: 'Product 2',
          quantity: 1,
          price_inc_tax: 39.99,
        },
      ];

      const deal = mapOrderToDeal(order, products);

      expect(deal.dealname).toBe('Order #12345');
      expect(deal.amount).toBe(99.99);
      expect(deal.dealstage).toBe('closedwon');
      expect(deal.source).toBe('BigCommerce');
      expect(deal.order_id).toBe('12345');
      expect(deal.description).toContain('Order ID: 12345');
      expect(deal.description).toContain('Product 1');
      expect(deal.description).toContain('Product 2');
    });
  });

  describe('mapCartToDeal', () => {
    it('should map cart data to deal format', () => {
      const cart = {
        id: 'abc123',
        cart_amount: 150.00,
        updated_time: '2023-11-01T10:00:00Z',
        line_items: {
          physical_items: [
            {
              name: 'Product A',
              quantity: 1,
              sale_price: 75.00,
            },
            {
              name: 'Product B',
              quantity: 1,
              sale_price: 75.00,
            },
          ],
        },
      };

      const deal = mapCartToDeal(cart);

      expect(deal.dealname).toBe('Abandoned Cart #abc123');
      expect(deal.amount).toBe(150.00);
      expect(deal.dealstage).toBe('appointmentscheduled');
      expect(deal.source).toBe('BigCommerce - Abandoned Cart');
      expect(deal.cart_id).toBe('abc123');
      expect(deal.description).toContain('Cart ID: abc123');
      expect(deal.description).toContain('Product A');
      expect(deal.description).toContain('Product B');
    });
  });
});
