/**
 * prisma/seed.ts — Khan Familia Travels Platform
 *
 * Seeds the development database with:
 *   - 3 platform users  (super-admin, tenant/host, guest)
 *   - 1 tenant          (KFT Hospitality — the property management company)
 *   - 1 TenantUser row  (tenant user is OWNER of the tenant)
 *   - 4 properties      (hotels in Swat Valley area, pre-approved)
 *   - 2–3 UnitTypes     per property (room types)
 *   - UnitInventory     for the next 90 days per unit type
 *   - Common amenities  (WiFi, Parking, etc.)
 *
 * Idempotent: safe to run multiple times — uses upsert everywhere.
 *
 * Run with:
 *   pnpm --filter @khan-familia/database run prisma:db:seed
 */

import {
  PrismaClient,
  PlatformRole,
  TenantRole,
  PropertyType,
  PropertyCategory,
  BusinessVertical,
  PropertyApprovalStatus,
  FeatureType,
} from '@prisma/client';
import { addDays, startOfDay } from 'date-fns';

const db = new PrismaClient();

// ---------------------------------------------------------------------------
// CLERK USER IDs — real IDs from your Clerk dashboard
// ---------------------------------------------------------------------------
const CLERK_SUPER_ADMIN_ID = 'user_3Fg4M1L11hlkHHGM8c90aZVymLc';
const CLERK_TENANT_ID = 'user_3Fg4WN77NrSKLsbtXgvIGZ1Ztok';
const CLERK_GUEST_ID = 'user_3Fg4ROb1ik9MczRc8dZPDFrUIye';

// ---------------------------------------------------------------------------
// HELPERS
// ---------------------------------------------------------------------------

/** Generate UnitInventory rows for a single UnitType for the next N days */
async function seedInventory(
  unitTypeId: string,
  propertyId: string,
  tenantId: string,
  totalCount: number,
  defaultRate: number,
  daysAhead = 90,
) {
  const today = startOfDay(new Date());
  const rows = Array.from({ length: daysAhead }, (_, i) => ({
    propertyId,
    unitTypeId,
    tenantId,
    date: addDays(today, i),
    totalCount,
    availableCount: totalCount,
    bookedCount: 0,
    blockedCount: 0,
    priceOverride: null as number | null,
  }));

  // Bulk upsert — Prisma doesn't support createManyAndReturn with skipDuplicates on all DBs,
  // so we use createMany with skipDuplicates (works on PostgreSQL).
  await db.unitInventory.createMany({
    data: rows,
    skipDuplicates: true,
  });
}

// ---------------------------------------------------------------------------
// MAIN SEED
// ---------------------------------------------------------------------------
async function main() {
  console.log('🌱  Starting seed...\n');

  // -------------------------------------------------------------------------
  // 1. USERS
  // -------------------------------------------------------------------------
  console.log('👤  Seeding users...');

  const superAdmin = await db.user.upsert({
    where: { clerkId: CLERK_SUPER_ADMIN_ID },
    update: {},
    create: {
      clerkId: CLERK_SUPER_ADMIN_ID,
      username: 'superadmin',
      email: 'admin@khanfamiliatravels.tech',
      role: PlatformRole.SUPER_ADMIN,
      avatarUrl: null,
    },
  });

  const tenantUser = await db.user.upsert({
    where: { clerkId: CLERK_TENANT_ID },
    update: {},
    create: {
      clerkId: CLERK_TENANT_ID,
      username: 'kft_host',
      email: 'host@khanfamiliatravels.tech',
      role: PlatformRole.USER,
      avatarUrl: null,
    },
  });

  const guestUser = await db.user.upsert({
    where: { clerkId: CLERK_GUEST_ID },
    update: {},
    create: {
      clerkId: CLERK_GUEST_ID,
      username: 'guest_traveler',
      email: 'guest@khanfamiliatravels.tech',
      role: PlatformRole.USER,
      avatarUrl: null,
    },
  });

  console.log(`   ✓ Super Admin: ${superAdmin.email}`);
  console.log(`   ✓ Tenant/Host: ${tenantUser.email}`);
  console.log(`   ✓ Guest:       ${guestUser.email}\n`);

  // -------------------------------------------------------------------------
  // 2. TENANT
  // -------------------------------------------------------------------------
  console.log('🏢  Seeding tenant...');

  const tenant = await db.tenant.upsert({
    where: { id: 'seed-tenant-kft-hospitality' },
    update: {},
    create: {
      id: 'seed-tenant-kft-hospitality',
      name: 'KFT Hospitality',
      slug: 'kft-hospitality',
      businessVertical: BusinessVertical.ACCOMMODATIONS_STAYS,
      propertyLimit: 10,
      staffLimit: 10,
    },
  });

  console.log(`   ✓ Tenant: ${tenant.name} (${tenant.slug})\n`);

  // -------------------------------------------------------------------------
  // 3. TENANT MEMBERSHIP  (tenant user is the OWNER)
  // -------------------------------------------------------------------------
  console.log('🔑  Seeding tenant membership...');

  await db.tenantUser.upsert({
    where: {
      tenantId_userId: { tenantId: tenant.id, userId: tenantUser.id },
    },
    update: {},
    create: {
      tenantId: tenant.id,
      userId: tenantUser.id,
      role: TenantRole.OWNER,
    },
  });

  // Also set the tenant's defaultTenant on the tenantUser
  await db.user.update({
    where: { id: tenantUser.id },
    data: { defaultTenantId: tenant.id },
  });

  console.log(`   ✓ ${tenantUser.email} → OWNER of ${tenant.name}\n`);

  // -------------------------------------------------------------------------
  // 4. COMMON AMENITIES
  // -------------------------------------------------------------------------
  console.log('🛎   Seeding amenities...');

  const featuresData = [
    { name: 'Free WiFi', icon: 'wifi', type: FeatureType.PROPERTY, isPopular: true },
    { name: 'Free Parking', icon: 'car', type: FeatureType.PROPERTY, isPopular: true },
    { name: 'Air Conditioning', icon: 'wind', type: FeatureType.UNIT, isPopular: true },
    { name: 'Heating', icon: 'flame', type: FeatureType.UNIT, isPopular: false },
    { name: 'Restaurant', icon: 'utensils', type: FeatureType.PROPERTY, isPopular: true },
    { name: 'Room Service', icon: 'bell', type: FeatureType.PROPERTY, isPopular: false },
    { name: 'Mountain View', icon: 'mountain', type: FeatureType.UNIT, isPopular: true },
    { name: 'River View', icon: 'waves', type: FeatureType.UNIT, isPopular: true },
    { name: 'Balcony', icon: 'door-open', type: FeatureType.UNIT, isPopular: false },
    { name: 'Hot Water', icon: 'droplets', type: FeatureType.UNIT, isPopular: true },
    { name: 'Flat-screen TV', icon: 'tv', type: FeatureType.UNIT, isPopular: false },
    { name: 'Garden', icon: 'tree-pine', type: FeatureType.PROPERTY, isPopular: false },
    { name: 'BBQ Facilities', icon: 'flame', type: FeatureType.PROPERTY, isPopular: false },
    {
      name: 'Laundry Service',
      icon: 'shirt',
      type: FeatureType.PROPERTY,
      isPopular: false,
    },
    {
      name: '24-Hour Front Desk',
      icon: 'clock',
      type: FeatureType.PROPERTY,
      isPopular: true,
    },
  ];

  const features: Record<string, string> = {};
  for (const f of featuresData) {
    const created = await db.feature.upsert({
      where: { name: f.name },
      update: {},
      create: f,
    });
    features[f.name] = created.id;
  }
  console.log(`   ✓ ${featuresData.length} features seeded\n`);

  // -------------------------------------------------------------------------
  // Helper: attach features to a property
  // -------------------------------------------------------------------------
  async function attachFeatures(propertyId: string, names: string[]) {
    for (const name of names) {
      const featureId = features[name];
      if (!featureId) continue;
      await db.propertyFeature.upsert({
        where: { propertyId_featureId: { propertyId, featureId } },
        update: {},
        create: { propertyId, featureId },
      });
    }
  }

  // -------------------------------------------------------------------------
  // 5. PROPERTIES
  // -------------------------------------------------------------------------
  console.log('🏨  Seeding properties...\n');

  // ── Property 1: Swat Valley Grand Hotel ────────────────────────────────────
  console.log('   📍 Property 1: Swat Valley Grand Hotel');

  const prop1 = await db.property.upsert({
    where: { id: 'seed-prop-swat-grand' },
    update: {},
    create: {
      id: 'seed-prop-swat-grand',
      tenantId: tenant.id,
      slug: 'swat-valley-grand-hotel',
      name: 'Swat Valley Grand Hotel',
      description:
        'A premium hotel nestled in the heart of Swat Valley, offering breathtaking mountain views and world-class hospitality. Each room is elegantly designed with a perfect blend of modern comfort and traditional Pakistani craftsmanship.',
      city: 'Mingora',
      country: 'Pakistan',
      address: 'Main Saidu Road, Mingora, Swat',
      propertyType: PropertyType.HOTEL,
      propertyCategory: PropertyCategory.HOTELS_HOSPITALITY,
      starRating: 4,
      checkInTime: '14:00',
      checkOutTime: '12:00',
      timezone: 'Asia/Karachi',
      languages: ['en', 'ur'],
      totalRooms: 20,
      totalFloors: 4,
      approvalStatus: PropertyApprovalStatus.APPROVED,
      approvedAt: new Date(),
      approvedById: superAdmin.id,
      minPricePerNight: 8000,
      averageRating: 4.7,
      totalReviews: 24,
      images: {
        create: [
          {
            url: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=800&q=80',
            publicId: 'Hotel1',
            isPrimary: true,
            order: 0,
          },
          {
            url: 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=800&q=80',
            publicId: 'Hotel2',
            isPrimary: false,
            order: 1,
          },
          {
            url: 'https://images.unsplash.com/photo-1542314831-c6a4d27ce6a2?auto=format&fit=crop&w=800&q=80',
            publicId: 'Hotel3',
            isPrimary: false,
            order: 2,
          },
        ],
      },
      houseRules: {
        smokingAllowed: false,
        petsAllowed: false,
        partiesAllowed: false,
        quietHoursFrom: '22:00',
        quietHoursTo: '07:00',
      },
    },
  });

  await db.location.upsert({
    where: { propertyId: prop1.id },
    update: {},
    create: {
      propertyId: prop1.id,
      lat: 35.0032,
      lng: 72.3311,
      state: 'Khyber Pakhtunkhwa',
      zipCode: '19200',
    },
  });

  await attachFeatures(prop1.id, [
    'Free WiFi',
    'Free Parking',
    'Air Conditioning',
    'Restaurant',
    'Room Service',
    'Mountain View',
    'Hot Water',
    'Flat-screen TV',
    '24-Hour Front Desk',
  ]);

  const p1u1 = await db.unitType.upsert({
    where: { propertyId_name: { propertyId: prop1.id, name: 'Deluxe Mountain View Room' } },
    update: {},
    create: {
      propertyId: prop1.id,
      tenantId: tenant.id,
      name: 'Deluxe Mountain View Room',
      unitCount: 8,
      capacity: 2,
      defaultRate: 8000,
      description:
        'Spacious room with floor-to-ceiling windows offering stunning mountain panoramas. King bed, premium bedding, and a private balcony.',
      images: [
        {
          url: 'https://images.unsplash.com/photo-1611892440504-42a792e24d32?auto=format&fit=crop&w=800&q=80',
          publicId: 'room1',
          isPrimary: true,
        },
        {
          url: 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=800&q=80',
          publicId: 'room2',
          isPrimary: false,
        },
      ],
    },
  });

  const p1u2 = await db.unitType.upsert({
    where: { propertyId_name: { propertyId: prop1.id, name: 'Standard Room' } },
    update: {},
    create: {
      propertyId: prop1.id,
      tenantId: tenant.id,
      name: 'Standard Room',
      unitCount: 12,
      capacity: 2,
      defaultRate: 5500,
      description:
        'Comfortable and well-appointed room with all essential amenities. Queen bed and garden view.',
      images: [
        {
          url: 'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?auto=format&fit=crop&w=800&q=80',
          publicId: 'room3',
          isPrimary: true,
        },
        {
          url: 'https://images.unsplash.com/photo-1611892440504-42a792e24d32?auto=format&fit=crop&w=800&q=80',
          publicId: 'room4',
          isPrimary: false,
        },
      ],
    },
  });

  await seedInventory(p1u1.id, prop1.id, tenant.id, p1u1.unitCount, p1u1.defaultRate!);
  await seedInventory(p1u2.id, prop1.id, tenant.id, p1u2.unitCount, p1u2.defaultRate!);
  console.log('      ✓ 2 unit types + 90 days inventory\n');

  // ── Property 2: Malam Jabba Mountain Resort ─────────────────────────────────
  console.log('   📍 Property 2: Malam Jabba Mountain Resort');

  const prop2 = await db.property.upsert({
    where: { id: 'seed-prop-malam-jabba' },
    update: {},
    create: {
      id: 'seed-prop-malam-jabba',
      tenantId: tenant.id,
      slug: 'malam-jabba-mountain-resort',
      name: 'Malam Jabba Mountain Resort',
      description:
        "Pakistan's premier mountain resort at an elevation of 9,000 feet. Experience the magic of snow-capped peaks, lush pine forests, and crisp mountain air. The only resort in Pakistan with a ski lift.",
      city: 'Malam Jabba',
      country: 'Pakistan',
      address: 'Malam Jabba Ski Resort Road, Swat',
      propertyType: PropertyType.RESORT,
      propertyCategory: PropertyCategory.HOTELS_HOSPITALITY,
      starRating: 5,
      checkInTime: '15:00',
      checkOutTime: '11:00',
      timezone: 'Asia/Karachi',
      languages: ['en', 'ur'],
      totalRooms: 15,
      totalFloors: 3,
      approvalStatus: PropertyApprovalStatus.APPROVED,
      approvedAt: new Date(),
      approvedById: superAdmin.id,
      minPricePerNight: 12000,
      averageRating: 4.9,
      totalReviews: 41,
      images: {
        create: [
          {
            url: 'https://images.unsplash.com/photo-1571003123894-1f0594d2b5d9?auto=format&fit=crop&w=800&q=80',
            publicId: 'Hotel4',
            isPrimary: true,
            order: 0,
          },
          {
            url: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=800&q=80',
            publicId: 'Hotel5',
            isPrimary: false,
            order: 1,
          },
          {
            url: 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=800&q=80',
            publicId: 'Hotel6',
            isPrimary: false,
            order: 2,
          },
        ],
      },
      houseRules: {
        smokingAllowed: false,
        petsAllowed: true,
        partiesAllowed: false,
        quietHoursFrom: '23:00',
        quietHoursTo: '07:00',
      },
    },
  });

  await db.location.upsert({
    where: { propertyId: prop2.id },
    update: {},
    create: {
      propertyId: prop2.id,
      lat: 35.1736,
      lng: 72.5652,
      state: 'Khyber Pakhtunkhwa',
      zipCode: '19130',
    },
  });

  await attachFeatures(prop2.id, [
    'Free WiFi',
    'Free Parking',
    'Heating',
    'Restaurant',
    'Mountain View',
    'Hot Water',
    'Balcony',
    'Garden',
    'BBQ Facilities',
    '24-Hour Front Desk',
  ]);

  const p2u1 = await db.unitType.upsert({
    where: { propertyId_name: { propertyId: prop2.id, name: 'Alpine Suite' } },
    update: {},
    create: {
      propertyId: prop2.id,
      tenantId: tenant.id,
      name: 'Alpine Suite',
      unitCount: 5,
      capacity: 3,
      defaultRate: 18000,
      description:
        'Our flagship suite with a private hot tub, fireplace, and 270-degree panoramic mountain views. Perfect for couples and honeymooners.',
      images: [
        {
          url: 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=800&q=80',
          publicId: 'room5',
          isPrimary: true,
        },
        {
          url: 'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?auto=format&fit=crop&w=800&q=80',
          publicId: 'room6',
          isPrimary: false,
        },
      ],
    },
  });

  const p2u2 = await db.unitType.upsert({
    where: { propertyId_name: { propertyId: prop2.id, name: 'Ski Chalet Room' } },
    update: {},
    create: {
      propertyId: prop2.id,
      tenantId: tenant.id,
      name: 'Ski Chalet Room',
      unitCount: 10,
      capacity: 2,
      defaultRate: 12000,
      description:
        'Cozy timber-panelled room with mountain and forest views. Twin or king bed configuration available.',
      images: [
        {
          url: 'https://images.unsplash.com/photo-1611892440504-42a792e24d32?auto=format&fit=crop&w=800&q=80',
          publicId: 'room7',
          isPrimary: true,
        },
        {
          url: 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=800&q=80',
          publicId: 'room8',
          isPrimary: false,
        },
      ],
    },
  });

  await seedInventory(p2u1.id, prop2.id, tenant.id, p2u1.unitCount, p2u1.defaultRate!);
  await seedInventory(p2u2.id, prop2.id, tenant.id, p2u2.unitCount, p2u2.defaultRate!);
  console.log('      ✓ 2 unit types + 90 days inventory\n');

  // ── Property 3: Kalam Riverside Lodge ──────────────────────────────────────
  console.log('   📍 Property 3: Kalam Riverside Lodge');

  const prop3 = await db.property.upsert({
    where: { id: 'seed-prop-kalam-lodge' },
    update: {},
    create: {
      id: 'seed-prop-kalam-lodge',
      tenantId: tenant.id,
      slug: 'kalam-riverside-lodge',
      name: 'Kalam Riverside Lodge',
      description:
        'A charming riverside lodge on the banks of the Swat River in Kalam. Wake up to the sound of rushing water and birdsong. The perfect base for trekking, fishing, and exploring Upper Swat.',
      city: 'Kalam',
      country: 'Pakistan',
      address: 'Kalam Main Bazaar Road, Upper Swat',
      propertyType: PropertyType.GUESTHOUSE,
      propertyCategory: PropertyCategory.VACATION_RENTALS,
      starRating: 3,
      checkInTime: '13:00',
      checkOutTime: '11:00',
      timezone: 'Asia/Karachi',
      languages: ['en', 'ur', 'ps'],
      totalRooms: 10,
      totalFloors: 2,
      approvalStatus: PropertyApprovalStatus.APPROVED,
      approvedAt: new Date(),
      approvedById: superAdmin.id,
      minPricePerNight: 4500,
      averageRating: 4.5,
      totalReviews: 18,
      images: {
        create: [
          {
            url: 'https://images.unsplash.com/photo-1542314831-c6a4d27ce6a2?auto=format&fit=crop&w=800&q=80',
            publicId: 'Hotel7',
            isPrimary: true,
            order: 0,
          },
          {
            url: 'https://images.unsplash.com/photo-1571003123894-1f0594d2b5d9?auto=format&fit=crop&w=800&q=80',
            publicId: 'Hotel8',
            isPrimary: false,
            order: 1,
          },
          {
            url: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=800&q=80',
            publicId: 'Hotel9',
            isPrimary: false,
            order: 2,
          },
        ],
      },
      houseRules: {
        smokingAllowed: false,
        petsAllowed: false,
        partiesAllowed: false,
      },
    },
  });

  await db.location.upsert({
    where: { propertyId: prop3.id },
    update: {},
    create: {
      propertyId: prop3.id,
      lat: 35.4869,
      lng: 72.5751,
      state: 'Khyber Pakhtunkhwa',
      zipCode: '19020',
    },
  });

  await attachFeatures(prop3.id, [
    'Free WiFi',
    'Free Parking',
    'River View',
    'Mountain View',
    'Hot Water',
    'Heating',
    'Garden',
    'Laundry Service',
  ]);

  const p3u1 = await db.unitType.upsert({
    where: { propertyId_name: { propertyId: prop3.id, name: 'River View Cabin' } },
    update: {},
    create: {
      propertyId: prop3.id,
      tenantId: tenant.id,
      name: 'River View Cabin',
      unitCount: 5,
      capacity: 2,
      defaultRate: 5500,
      description:
        "Private wooden cabin on the river's edge. Sit on your deck and watch the crystal-clear Swat River flow by.",
      images: [
        {
          url: 'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?auto=format&fit=crop&w=800&q=80',
          publicId: 'room9',
          isPrimary: true,
        },
        {
          url: 'https://images.unsplash.com/photo-1611892440504-42a792e24d32?auto=format&fit=crop&w=800&q=80',
          publicId: 'room10',
          isPrimary: false,
        },
      ],
    },
  });

  const p3u2 = await db.unitType.upsert({
    where: { propertyId_name: { propertyId: prop3.id, name: 'Budget Room' } },
    update: {},
    create: {
      propertyId: prop3.id,
      tenantId: tenant.id,
      name: 'Budget Room',
      unitCount: 5,
      capacity: 2,
      defaultRate: 4500,
      description:
        'Simple, clean room with all essentials. Great value for backpackers and solo travellers.',
      images: [
        {
          url: 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=800&q=80',
          publicId: 'room1',
          isPrimary: true,
        },
      ],
    },
  });

  await seedInventory(p3u1.id, prop3.id, tenant.id, p3u1.unitCount, p3u1.defaultRate!);
  await seedInventory(p3u2.id, prop3.id, tenant.id, p3u2.unitCount, p3u2.defaultRate!);
  console.log('      ✓ 2 unit types + 90 days inventory\n');

  // ── Property 4: Bahrain Heritage Haveli ────────────────────────────────────
  console.log('   📍 Property 4: Bahrain Heritage Haveli');

  const prop4 = await db.property.upsert({
    where: { id: 'seed-prop-bahrain-haveli' },
    update: {},
    create: {
      id: 'seed-prop-bahrain-haveli',
      tenantId: tenant.id,
      slug: 'bahrain-heritage-haveli',
      name: 'Bahrain Heritage Haveli',
      description:
        'A beautifully restored traditional haveli in Bahrain town, blending centuries-old Pashtun architecture with modern comforts. An authentic cultural stay surrounded by walnut and apple orchards.',
      city: 'Bahrain',
      country: 'Pakistan',
      address: 'Near Bahrain Bazaar, Swat Valley',
      propertyType: PropertyType.B_AND_B,
      propertyCategory: PropertyCategory.ALTERNATIVE_STAYS,
      starRating: 4,
      checkInTime: '14:00',
      checkOutTime: '12:00',
      timezone: 'Asia/Karachi',
      languages: ['en', 'ur', 'ps'],
      totalRooms: 8,
      totalFloors: 2,
      approvalStatus: PropertyApprovalStatus.APPROVED,
      approvedAt: new Date(),
      approvedById: superAdmin.id,
      minPricePerNight: 6500,
      averageRating: 4.8,
      totalReviews: 12,
      images: {
        create: [
          {
            url: 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=800&q=80',
            publicId: 'Hotel10',
            isPrimary: true,
            order: 0,
          },
          {
            url: 'https://images.unsplash.com/photo-1542314831-c6a4d27ce6a2?auto=format&fit=crop&w=800&q=80',
            publicId: 'Hotel11',
            isPrimary: false,
            order: 1,
          },
          {
            url: 'https://images.unsplash.com/photo-1571003123894-1f0594d2b5d9?auto=format&fit=crop&w=800&q=80',
            publicId: 'Hotel1b',
            isPrimary: false,
            order: 2,
          },
        ],
      },
      houseRules: {
        smokingAllowed: false,
        petsAllowed: false,
        partiesAllowed: false,
        quietHoursFrom: '21:00',
        quietHoursTo: '07:00',
      },
    },
  });

  await db.location.upsert({
    where: { propertyId: prop4.id },
    update: {},
    create: {
      propertyId: prop4.id,
      lat: 35.2186,
      lng: 72.5562,
      state: 'Khyber Pakhtunkhwa',
      zipCode: '19060',
    },
  });

  await attachFeatures(prop4.id, [
    'Free WiFi',
    'Free Parking',
    'Mountain View',
    'Hot Water',
    'Heating',
    'Garden',
    'BBQ Facilities',
    'Laundry Service',
    'Restaurant',
  ]);

  const p4u1 = await db.unitType.upsert({
    where: { propertyId_name: { propertyId: prop4.id, name: 'Heritage Suite' } },
    update: {},
    create: {
      propertyId: prop4.id,
      tenantId: tenant.id,
      name: 'Heritage Suite',
      unitCount: 3,
      capacity: 3,
      defaultRate: 9000,
      description:
        'A grand suite with hand-painted wooden ceilings, traditional Swati furniture, and a private courtyard garden. The jewel of the haveli.',
      images: [
        {
          url: 'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?auto=format&fit=crop&w=800&q=80',
          publicId: 'room2b',
          isPrimary: true,
        },
        {
          url: 'https://images.unsplash.com/photo-1611892440504-42a792e24d32?auto=format&fit=crop&w=800&q=80',
          publicId: 'room3b',
          isPrimary: false,
        },
      ],
    },
  });

  const p4u2 = await db.unitType.upsert({
    where: { propertyId_name: { propertyId: prop4.id, name: 'Orchard Room' } },
    update: {},
    create: {
      propertyId: prop4.id,
      tenantId: tenant.id,
      name: 'Orchard Room',
      unitCount: 5,
      capacity: 2,
      defaultRate: 6500,
      description:
        'A cozy room overlooking the walnut and apple orchards. Traditional Pashtun wooden furniture with modern en-suite bathroom.',
      images: [
        {
          url: 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=800&q=80',
          publicId: 'room4b',
          isPrimary: true,
        },
        {
          url: 'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?auto=format&fit=crop&w=800&q=80',
          publicId: 'room5b',
          isPrimary: false,
        },
      ],
    },
  });

  await seedInventory(p4u1.id, prop4.id, tenant.id, p4u1.unitCount, p4u1.defaultRate!);
  await seedInventory(p4u2.id, prop4.id, tenant.id, p4u2.unitCount, p4u2.defaultRate!);
  console.log('      ✓ 2 unit types + 90 days inventory\n');

  // -------------------------------------------------------------------------
  // DONE
  // -------------------------------------------------------------------------
  console.log('✅  Seed complete!\n');
  console.log('Summary:');
  console.log('  Users:        3 (super-admin, host, guest)');
  console.log('  Tenant:       1 (KFT Hospitality)');
  console.log('  Amenities:    15');
  console.log('  Properties:   4 (Swat Valley area, all APPROVED)');
  console.log('  Unit Types:   8 (2 per property)');
  console.log('  Inventory:    ~1,440 rows (8 unit types × 90 days)');
}

main()
  .catch((e) => {
    console.error('❌  Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
