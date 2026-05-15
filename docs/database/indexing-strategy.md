# Indexing Strategy

## High-Value Indexes

- Property search: city, region, vendor_id, status
- Tour search: region, status, departure_date
- Availability: unit_type_id + date, departure_id
- Booking lookup: booking_reference, customer_id, vendor_id
- Payment lookup: booking_id, payment_status
- Inquiry lookup: customer_id, status, created_at

## Availability Query Optimization

- Composite indexes on (unit_type_id, date)
- Composite indexes on (departure_id, departure_date)

## Geo Considerations

- Use geospatial indexing for property and pickup locations.
- Store location geometry in separate columns to avoid hot rows.

## Reporting

- Use covering indexes for daily booking summaries.
- Avoid wide multi-purpose indexes; favor targeted ones.
