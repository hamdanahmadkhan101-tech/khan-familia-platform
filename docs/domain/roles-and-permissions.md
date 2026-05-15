# Roles and Permissions

## Roles (MVP)

- PlatformAdmin
- Moderator
- OperationsAgent
- VendorAdmin
- VendorStaff
- Customer

## Permission Matrix (High Level)

| Capability             | PlatformAdmin | Moderator | OperationsAgent | VendorAdmin | VendorStaff | Customer  |
| ---------------------- | ------------- | --------- | --------------- | ----------- | ----------- | --------- |
| Approve vendors        | Yes           | Yes       | No              | No          | No          | No        |
| Publish inventory      | Yes           | Yes       | No              | Yes         | Limited     | No        |
| Manage pricing         | Yes           | No        | Limited         | Yes         | Limited     | No        |
| View bookings          | Yes           | Yes       | Yes             | Yes (own)   | Yes (own)   | Yes (own) |
| Manage bookings        | Yes           | Yes       | Yes             | Yes (own)   | Limited     | Limited   |
| Verify manual payments | Yes           | No        | Yes             | No          | No          | No        |
| Manage payouts         | Yes           | No        | No              | Yes (own)   | No          | No        |

## Notes

- Vendor roles are scoped to a single vendor.
- Moderators cannot change pricing or payouts.
- Operations agents handle manual confirmations and payment verification.
