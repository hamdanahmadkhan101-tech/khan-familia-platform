# Soft Delete Policy

## Soft Deletable

- Vendor (if no legal constraints)
- Property and UnitType (when no active bookings)
- TourPackage and TourDeparture (when no active bookings)
- Inquiry and Quote

## Not Soft Deletable (Immutable)

- PropertyBooking and TourBooking
- PaymentIntent, PaymentRecord, Refund
- AuditLog entries

## Archival Instead of Delete

- Properties and tours should be archived rather than removed when historical bookings exist.
- Vendor suspension is preferred over deletion.

## Legal and Audit Considerations

- Booking history must remain intact for disputes and reconciliation.
- Personal data may be anonymized but not removed from booking records.
