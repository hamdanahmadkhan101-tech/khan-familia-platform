# Tour Domain Design (Persistence)

## Scope

Tours remain a separate bounded context from properties. The design supports fixed departures and
custom operator-managed requests.

## Core Entities

- TourPackage
- TourDeparture
- TourHold
- TourBooking
- ItineraryItem
- PickupPoint
- TransportAssignment
- TourPricingRule

## Relationships

- TourPackage 1:N TourDeparture
- TourPackage 1:N ItineraryItem
- TourPackage 1:N PickupPoint
- TourDeparture 1:N TourBooking
- TourDeparture 1:N TourHold

## Capacity Management

- Capacity is tracked per departure.
- Holds reserve seats before confirmation.
- Confirmed bookings decrement remaining capacity.

## Pricing Concepts

- Per-participant pricing per departure.
- Seasonal overrides stored separately from base rules.
- Manual overrides recorded with audit trail.

## Operational Reality

- Some tours are admin-managed today; vendor-managed tours are future-compatible.
- Custom tour requests are treated as inquiry + quote before any hold.
