import {PrismaClient, UserRole, PropertyType, ListingType, Furnishing, Facing, VerificationStatus} from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import {BHOPAL_PROPERTIES} from './properties.bhopal';

const prisma = new PrismaClient();

async function main() {
  /* ── 1. Admin user ── */
  const email = process.env.ADMIN_EMAIL ?? 'admin@realreels.app';
  const password = process.env.ADMIN_PASSWORD ?? 'admin12345';
  const passwordHash = await bcrypt.hash(password, 10);

  const admin = await prisma.user.upsert({
    where: {email},
    update: {role: UserRole.admin},
    create: {
      email,
      passwordHash,
      fullName: 'Admin',
      role: UserRole.admin,
      isVerified: true,
    },
  });

  console.log(`✔  Admin: ${admin.email} / ${password}`);

  /* ── 2. Sample agent user ── */
  const agentEmail = 'agent@realreels.app';
  const agent = await prisma.user.upsert({
    where: {email: agentEmail},
    update: {},
    create: {
      email: agentEmail,
      passwordHash: await bcrypt.hash('agent12345', 10),
      fullName: 'Arjun Mehta',
      role: UserRole.agent,
      isVerified: true,
      phone: '+91 98765 43210',
      bio: 'Luxury real estate specialist with 12+ years of experience across Mumbai, Goa and Delhi.',
    },
  });

  console.log(`✔  Agent: ${agent.email} / agent12345`);

  /* ── 3. Helper to upsert property by slug ── */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async function upsertProperty(data: any) {
    const slug = data.slug as string;
    await prisma.property.upsert({
      where: {slug},
      update: data,
      create: data,
    });
    console.log(`  ↳  Property: ${data.title}`);
  }

  /* ── 4. Seed properties ── */
  await upsertProperty({
    agentId: agent.id,
    title: 'Skyline Penthouse — Bandra West',
    slug: 'skyline-penthouse-bandra-west',
    type: PropertyType.apartment,
    listingType: ListingType.buy,
    description:
      'An extraordinary penthouse crowning a 28-storey tower in the heart of Bandra West. Enjoy unobstructed panoramic views of the Arabian Sea, a sprawling private terrace, double-height ceilings, and every premium finish imaginable. Includes 3 dedicated car parks and direct lift access. Walking distance to Bandra Bandstand and Linking Road.',
    price: 42000000,
    currency: 'USD',
    priceNegotiable: false,
    featured: true,

    country: 'India',
    state: 'Maharashtra',
    city: 'Mumbai',
    locality: 'Bandra West',
    address: '28th Floor, Tower A, Skyline Residences, Carter Road, Bandra West',
    landmark: 'Near Bandstand Promenade',
    pincode: '400050',
    latitude: 19.0596,
    longitude: 72.8295,

    bhk: 4,
    bathrooms: 4,
    balconies: 3,
    superBuiltUpArea: 4800,
    carpetArea: 3600,
    floorNumber: 28,
    totalFloors: 28,
    propertyAge: 'New (0-1 year)',
    furnishing: Furnishing.furnished,
    facing: Facing.west,

    amenities: [
      'Parking', 'Swimming Pool', 'Gym', 'Lift', 'CCTV', 'Security Guard',
      'Club House', 'High-Speed WiFi', 'Smart Home', 'Power Backup', 'Garden',
    ],
    imageUrls: [
      'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=1600&q=80',
      'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=1600&q=80',
      'https://images.unsplash.com/photo-1600566753376-12c8ab8b9753?auto=format&fit=crop&w=1600&q=80',
      'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=1600&q=80',
    ],

    ownerName: 'Arjun Mehta',
    ownerPhone: '+91 98765 43210',
    ownerWhatsapp: '+91 98765 43210',
    ownerEmail: 'agent@realreels.app',
    agencyName: 'Aurevia Luxury Estates',

    status: 'active',
    isVerified: true,
    verificationStatus: VerificationStatus.verified,
  });

  await upsertProperty({
    agentId: agent.id,
    title: 'Portuguese Heritage Villa — North Goa',
    slug: 'portuguese-heritage-villa-north-goa',
    type: PropertyType.villa,
    listingType: ListingType.buy,
    description:
      'A meticulously restored 200-year-old Portuguese villa set on 1.2 acres of lush landscaped grounds in Assagao, North Goa. Original terracotta tiles, hand-carved wooden doors, carved stone arches and a private infinity pool overlooking paddy fields. Perfect as a private residence, boutique guesthouse or luxury holiday home.',
    price: 38500000,
    currency: 'USD',
    priceNegotiable: true,
    featured: true,

    country: 'India',
    state: 'Goa',
    city: 'North Goa',
    locality: 'Assagao',
    address: 'Casa Lusitana, Assagao Village, North Goa',
    landmark: 'Near Assagao Market',
    pincode: '403507',
    latitude: 15.5799,
    longitude: 73.7896,

    bhk: 5,
    bathrooms: 5,
    balconies: 4,
    superBuiltUpArea: 6200,
    carpetArea: 4800,
    plotArea: 52272,
    totalFloors: 2,
    propertyAge: '10+ years',
    furnishing: Furnishing.furnished,
    facing: Facing.east,

    amenities: [
      'Swimming Pool', 'Garden', 'Parking', 'CCTV', 'Security Guard',
      'Terrace', 'BBQ Area', 'Power Backup', '24x7 Water', 'High-Speed WiFi',
    ],
    imageUrls: [
      'https://images.unsplash.com/photo-1613490493576-7fde63acd811?auto=format&fit=crop&w=1600&q=80',
      'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?auto=format&fit=crop&w=1600&q=80',
      'https://images.unsplash.com/photo-1600585154526-990dced4db0d?auto=format&fit=crop&w=1600&q=80',
      'https://images.unsplash.com/photo-1580587771525-78b9dba3b914?auto=format&fit=crop&w=1600&q=80',
    ],

    ownerName: 'Arjun Mehta',
    ownerPhone: '+91 98765 43210',
    ownerWhatsapp: '+91 98765 43210',
    ownerEmail: 'agent@realreels.app',
    agencyName: 'Aurevia Luxury Estates',

    status: 'active',
    isVerified: true,
    verificationStatus: VerificationStatus.verified,
  });

  await upsertProperty({
    agentId: admin.id,
    title: 'Modern 3BHK Apartment — Whitefield, Bangalore',
    slug: 'modern-3bhk-apartment-whitefield-bangalore',
    type: PropertyType.apartment,
    listingType: ListingType.buy,
    description:
      "A contemporary 3-bedroom apartment in one of Bangalore's most sought-after tech corridors. Designed for the discerning professional, it features an open-plan kitchen with German fixtures, a master suite with walk-in wardrobe, a 180 sq-ft balcony with garden views, and access to a full-amenity clubhouse. Minutes from ITPL and Cessna Business Park.",
    price: 12800000,
    currency: 'USD',
    priceNegotiable: false,
    featured: false,

    country: 'India',
    state: 'Karnataka',
    city: 'Bangalore',
    locality: 'Whitefield',
    address: 'A-704, Prestige Sunrise Park, Brookfield, Whitefield, Bangalore',
    landmark: 'Near ITPL Main Gate',
    pincode: '560066',
    latitude: 12.9716,
    longitude: 77.7483,

    bhk: 3,
    bathrooms: 3,
    balconies: 2,
    superBuiltUpArea: 1850,
    carpetArea: 1400,
    floorNumber: 7,
    totalFloors: 18,
    propertyAge: '1-5 years',
    furnishing: Furnishing.semi_furnished,
    facing: Facing.north_east,

    amenities: [
      'Parking', 'Swimming Pool', 'Gym', 'Lift', 'CCTV', 'Security Guard',
      'Club House', 'Kids Play Area', 'Jogging Track', 'Power Backup', 'High-Speed WiFi',
    ],
    imageUrls: [
      'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=1600&q=80',
      'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=1600&q=80',
      'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=1600&q=80',
    ],

    ownerName: 'Admin',
    ownerEmail: 'admin@realreels.app',
    agencyName: 'Aurevia Luxury Estates',

    status: 'active',
    isVerified: true,
    verificationStatus: VerificationStatus.verified,
  });

  await upsertProperty({
    agentId: agent.id,
    title: 'Grade-A Office Space — Cyber City, Gurugram',
    slug: 'grade-a-office-space-cyber-city-gurugram',
    type: PropertyType.office,
    listingType: ListingType.rent,
    description:
      'Fully fitted Grade-A office space on the 12th floor of a premium corporate tower in Cyber City, Gurugram. Includes 18 private cabins, a 30-seat conference room, a reception lobby, a server room, and a pantry. 24-hour air conditioning, DG backup, and 3 dedicated parking bays. Ideal for technology, consulting, or financial services firms.',
    price: 650000,
    currency: 'USD',
    priceNegotiable: true,
    featured: false,

    country: 'India',
    state: 'Haryana',
    city: 'Gurugram',
    locality: 'Cyber City',
    address: '12th Floor, Block C, DLF Infinity Towers, Phase 2, Cyber City, Gurugram',
    landmark: 'Near Cyber Hub',
    pincode: '122002',
    latitude: 28.4950,
    longitude: 77.0890,

    bathrooms: 4,
    superBuiltUpArea: 8200,
    carpetArea: 6500,
    floorNumber: 12,
    totalFloors: 22,
    propertyAge: '5-10 years',
    furnishing: Furnishing.furnished,
    facing: Facing.south,

    amenities: [
      'Parking', 'Lift', 'CCTV', 'Security Guard', 'Power Backup', 'High-Speed WiFi',
      'Smart Home', '24x7 Water', 'Metro Nearby',
    ],
    imageUrls: [
      'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=1600&q=80',
      'https://images.unsplash.com/photo-1497366811353-6870744d04b2?auto=format&fit=crop&w=1600&q=80',
      'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?auto=format&fit=crop&w=1600&q=80',
    ],

    ownerName: 'Arjun Mehta',
    ownerPhone: '+91 98765 43210',
    ownerWhatsapp: '+91 98765 43210',
    ownerEmail: 'agent@realreels.app',
    agencyName: 'Aurevia Commercial',

    status: 'active',
    isVerified: true,
    verificationStatus: VerificationStatus.verified,
  });

  await upsertProperty({
    agentId: agent.id,
    title: 'Premium Residential Plot — Sector 150, Noida',
    slug: 'premium-residential-plot-sector-150-noida',
    type: PropertyType.plot,
    listingType: ListingType.buy,
    description:
      "A freehold corner residential plot in Noida's greener, newer Sector 150, directly on the Yamuna Expressway corridor. The plot is in a gated, RERA-approved township with wide roads, underground utilities and a dedicated park. An excellent long-term investment in one of NCR's fastest-appreciating sectors.",
    price: 8500000,
    currency: 'USD',
    priceNegotiable: true,
    featured: false,

    country: 'India',
    state: 'Uttar Pradesh',
    city: 'Noida',
    locality: 'Sector 150',
    address: 'Plot No. C-47, Sector 150, Noida',
    landmark: 'Near Nirala Estate Gate 2',
    pincode: '201310',
    latitude: 28.4089,
    longitude: 77.5260,

    plotArea: 2250,
    superBuiltUpArea: 0,
    propertyAge: 'Under construction',
    facing: Facing.north,

    amenities: [
      'Parking', 'Security Guard', 'CCTV', 'Garden', 'Power Backup', '24x7 Water',
      'Metro Nearby', 'School Nearby', 'Hospital Nearby',
    ],
    imageUrls: [
      'https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=1600&q=80',
      'https://images.unsplash.com/photo-1583847268964-b28dc8f51f92?auto=format&fit=crop&w=1600&q=80',
    ],

    ownerName: 'Arjun Mehta',
    ownerPhone: '+91 98765 43210',
    ownerEmail: 'agent@realreels.app',
    agencyName: 'Aurevia Luxury Estates',

    status: 'active',
    isVerified: true,
    verificationStatus: VerificationStatus.verified,
  });

  await upsertProperty({
    agentId: agent.id,
    title: 'Luxury 4BHK Villa — Jubilee Hills, Hyderabad',
    slug: 'luxury-4bhk-villa-jubilee-hills-hyderabad',
    type: PropertyType.villa,
    listingType: ListingType.buy,
    description:
      "A striking contemporary villa built across three levels in the prestigious Jubilee Hills neighbourhood of Hyderabad. A double-height entrance foyer, Italian marble flooring, a chef's kitchen, a private screening room, a rooftop infinity pool and panoramic city views define this exceptional home. 4 ensuite bedrooms, a driver's room and a 4-car basement garage. Prime road-facing position.",
    price: 28000000,
    currency: 'USD',
    priceNegotiable: false,
    featured: true,

    country: 'India',
    state: 'Telangana',
    city: 'Hyderabad',
    locality: 'Jubilee Hills',
    address: 'Road No. 36, Jubilee Hills, Hyderabad',
    landmark: 'Near Jubilee Hills Check Post',
    pincode: '500033',
    latitude: 17.4316,
    longitude: 78.4070,

    bhk: 4,
    bathrooms: 5,
    balconies: 3,
    superBuiltUpArea: 5500,
    carpetArea: 4200,
    plotArea: 7200,
    totalFloors: 3,
    propertyAge: 'New (0-1 year)',
    furnishing: Furnishing.furnished,
    facing: Facing.north_east,

    amenities: [
      'Swimming Pool', 'Parking', 'Gym', 'CCTV', 'Security Guard', 'Power Backup',
      'Garden', 'Terrace', 'Rooftop Access', 'Smart Home', 'EV Charging', 'High-Speed WiFi',
      'Club House', 'Kids Play Area', 'BBQ Area',
    ],
    imageUrls: [
      'https://images.unsplash.com/photo-1600047509807-ba8f99d2cdde?auto=format&fit=crop&w=1600&q=80',
      'https://images.unsplash.com/photo-1600566752355-35792bedcfea?auto=format&fit=crop&w=1600&q=80',
      'https://images.unsplash.com/photo-1600573472592-401b489a3cdc?auto=format&fit=crop&w=1600&q=80',
      'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1600&q=80',
      'https://images.unsplash.com/photo-1600121848594-d8644e57abab?auto=format&fit=crop&w=1600&q=80',
    ],

    ownerName: 'Arjun Mehta',
    ownerPhone: '+91 98765 43210',
    ownerWhatsapp: '+91 98765 43210',
    ownerEmail: 'agent@realreels.app',
    agencyName: 'Aurevia Luxury Estates',

    status: 'active',
    isVerified: true,
    verificationStatus: VerificationStatus.verified,
  });

  await upsertProperty({
    agentId: agent.id,
    title: 'Sea-Facing 3BHK — Marine Drive, Mumbai',
    slug: 'sea-facing-3bhk-marine-drive-mumbai',
    type: PropertyType.apartment,
    listingType: ListingType.rent,
    description:
      'A rare sea-facing 3-bedroom residence on the Queen\'s Necklace. Floor-to-ceiling windows frame the Arabian Sea from every principal room, with a 400 sq-ft living room, a refitted modular kitchen and a private servant quarter. Fully furnished and available on a long lease. Covered parking for two cars.',
    price: 385000,
    currency: 'USD',
    priceNegotiable: true,
    featured: true,

    country: 'India',
    state: 'Maharashtra',
    city: 'Mumbai',
    locality: 'Marine Drive',
    address: '11th Floor, Sea Green Apartments, Netaji Subhash Road, Marine Drive',
    landmark: 'Opposite Wankhede Stadium',
    pincode: '400020',
    latitude: 18.9432,
    longitude: 72.8231,

    bhk: 3,
    bathrooms: 3,
    balconies: 2,
    superBuiltUpArea: 2200,
    carpetArea: 1750,
    floorNumber: 11,
    totalFloors: 16,
    propertyAge: '10+ years',
    furnishing: Furnishing.furnished,
    facing: Facing.west,

    amenities: [
      'Parking', 'Lift', 'CCTV', 'Security Guard', 'Power Backup',
      '24x7 Water', 'High-Speed WiFi', 'Gym', 'Metro Nearby',
    ],
    imageUrls: [
      'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=1600&q=80',
      'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=1600&q=80',
      'https://images.unsplash.com/photo-1600566753376-12c8ab8b9753?auto=format&fit=crop&w=1600&q=80',
    ],

    ownerName: 'Arjun Mehta',
    ownerPhone: '+91 98765 43210',
    ownerWhatsapp: '+91 98765 43210',
    ownerEmail: 'agent@realreels.app',
    agencyName: 'Aurevia Luxury Estates',

    status: 'active',
    isVerified: true,
    verificationStatus: VerificationStatus.verified,
  });

  await upsertProperty({
    agentId: agent.id,
    title: 'Waterfront Duplex Villa — Alibaug',
    slug: 'waterfront-duplex-villa-alibaug',
    type: PropertyType.villa,
    listingType: ListingType.buy,
    description:
      'A serene duplex villa a two-minute walk from Awas Beach, set on a half-acre plot with mature coconut palms. Double-height living area, an outdoor deck with a plunge pool, an open kitchen and four ensuite bedrooms. A 20-minute ferry from Gateway of India makes this an ideal weekend retreat or rental asset.',
    price: 21500000,
    currency: 'USD',
    priceNegotiable: true,
    featured: false,

    country: 'India',
    state: 'Maharashtra',
    city: 'Alibaug',
    locality: 'Awas',
    address: 'Villa 7, Beach Grove Estate, Awas Road, Alibaug',
    landmark: 'Near Awas Beach',
    pincode: '402201',
    latitude: 18.6900,
    longitude: 72.8700,

    bhk: 4,
    bathrooms: 4,
    balconies: 3,
    superBuiltUpArea: 3900,
    carpetArea: 3100,
    plotArea: 21780,
    totalFloors: 2,
    propertyAge: '1-5 years',
    furnishing: Furnishing.furnished,
    facing: Facing.west,

    amenities: [
      'Swimming Pool', 'Garden', 'Parking', 'CCTV', 'Security Guard',
      'Terrace', 'BBQ Area', 'Power Backup', '24x7 Water',
    ],
    imageUrls: [
      'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?auto=format&fit=crop&w=1600&q=80',
      'https://images.unsplash.com/photo-1580587771525-78b9dba3b914?auto=format&fit=crop&w=1600&q=80',
      'https://images.unsplash.com/photo-1600585154526-990dced4db0d?auto=format&fit=crop&w=1600&q=80',
    ],

    ownerName: 'Arjun Mehta',
    ownerPhone: '+91 98765 43210',
    ownerWhatsapp: '+91 98765 43210',
    ownerEmail: 'agent@realreels.app',
    agencyName: 'Aurevia Luxury Estates',

    status: 'active',
    isVerified: true,
    verificationStatus: VerificationStatus.verified,
  });

  await upsertProperty({
    agentId: agent.id,
    title: 'High-Street Retail Shop — Colaba Causeway, Mumbai',
    slug: 'high-street-retail-shop-colaba-causeway-mumbai',
    type: PropertyType.shop,
    listingType: ListingType.rent,
    description:
      'A ground-floor retail unit on the busiest stretch of Colaba Causeway, with a 22-foot glass frontage and a mezzanine for stock. Continuous footfall from tourists and residents, with neighbouring international apparel and cafe brands. Ready for fit-out; suitable for fashion, F&B or specialty retail.',
    price: 425000,
    currency: 'USD',
    priceNegotiable: true,
    featured: false,

    country: 'India',
    state: 'Maharashtra',
    city: 'Mumbai',
    locality: 'Colaba',
    address: 'Shop No. 4, Ground Floor, Mandlik Road, Colaba Causeway',
    landmark: 'Near Regal Cinema',
    pincode: '400001',
    latitude: 18.9220,
    longitude: 72.8320,

    bathrooms: 1,
    superBuiltUpArea: 950,
    carpetArea: 720,
    floorNumber: 0,
    totalFloors: 5,
    propertyAge: '10+ years',
    furnishing: Furnishing.unfurnished,
    facing: Facing.east,

    amenities: [
      'CCTV', 'Security Guard', 'Power Backup', '24x7 Water', 'Lift', 'Metro Nearby',
    ],
    imageUrls: [
      'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?auto=format&fit=crop&w=1600&q=80',
      'https://images.unsplash.com/photo-1497366811353-6870744d04b2?auto=format&fit=crop&w=1600&q=80',
    ],

    ownerName: 'Arjun Mehta',
    ownerPhone: '+91 98765 43210',
    ownerEmail: 'agent@realreels.app',
    agencyName: 'Aurevia Commercial',

    status: 'active',
    isVerified: true,
    verificationStatus: VerificationStatus.verified,
  });

  await upsertProperty({
    agentId: admin.id,
    title: 'Corner Showroom — Koregaon Park, Pune',
    slug: 'corner-showroom-koregaon-park-pune',
    type: PropertyType.commercial,
    listingType: ListingType.buy,
    description:
      'A double-height corner showroom on North Main Road, Koregaon Park — Pune\'s premier lifestyle and dining district. Two street frontages, 16-foot ceilings, a dedicated loading bay and 8 reserved parking bays in the basement. Currently leased to an automotive brand; vacant possession available on request.',
    price: 16500000,
    currency: 'USD',
    priceNegotiable: false,
    featured: false,

    country: 'India',
    state: 'Maharashtra',
    city: 'Pune',
    locality: 'Koregaon Park',
    address: 'Unit 1 & 2, Ground Floor, North Main Road, Koregaon Park, Pune',
    landmark: 'Near Lane 5 Junction',
    pincode: '411001',
    latitude: 18.5362,
    longitude: 73.8939,

    bathrooms: 2,
    superBuiltUpArea: 3400,
    carpetArea: 2800,
    floorNumber: 0,
    totalFloors: 4,
    propertyAge: '5-10 years',
    furnishing: Furnishing.semi_furnished,
    facing: Facing.north_west,

    amenities: [
      'Parking', 'Lift', 'CCTV', 'Security Guard', 'Power Backup',
      '24x7 Water', 'High-Speed WiFi',
    ],
    imageUrls: [
      'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=1600&q=80',
      'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=1600&q=80',
    ],

    ownerName: 'Admin',
    ownerEmail: 'admin@realreels.app',
    agencyName: 'Aurevia Commercial',

    status: 'active',
    isVerified: true,
    verificationStatus: VerificationStatus.verified,
  });

  await upsertProperty({
    agentId: agent.id,
    title: 'Furnished Studio — Koramangala, Bangalore',
    slug: 'furnished-studio-koramangala-bangalore',
    type: PropertyType.apartment,
    listingType: ListingType.rent,
    description:
      'A compact, fully furnished studio in Koramangala 5th Block, built for founders and remote professionals. Includes a queen bed, a work desk with dual-monitor mount, a kitchenette with appliances, and 300 Mbps fibre. Cafes, co-working spaces and the Sony World junction are all within a five-minute walk.',
    price: 42000,
    currency: 'USD',
    priceNegotiable: false,
    featured: false,

    country: 'India',
    state: 'Karnataka',
    city: 'Bangalore',
    locality: 'Koramangala',
    address: 'Flat 302, Ivy Residency, 80 Feet Road, 5th Block, Koramangala',
    landmark: 'Near Sony World Signal',
    pincode: '560095',
    latitude: 12.9352,
    longitude: 77.6245,

    bhk: 1,
    bathrooms: 1,
    balconies: 1,
    superBuiltUpArea: 620,
    carpetArea: 480,
    floorNumber: 3,
    totalFloors: 5,
    propertyAge: '1-5 years',
    furnishing: Furnishing.furnished,
    facing: Facing.south_east,

    amenities: [
      'Lift', 'CCTV', 'Security Guard', 'Power Backup', 'High-Speed WiFi',
      'Parking', '24x7 Water',
    ],
    imageUrls: [
      'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=1600&q=80',
      'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=1600&q=80',
    ],

    ownerName: 'Arjun Mehta',
    ownerPhone: '+91 98765 43210',
    ownerWhatsapp: '+91 98765 43210',
    ownerEmail: 'agent@realreels.app',
    agencyName: 'Aurevia Luxury Estates',

    status: 'active',
    isVerified: true,
    verificationStatus: VerificationStatus.verified,
  });

  await upsertProperty({
    agentId: agent.id,
    title: 'Valley-View Cottage — Kasauli, Himachal',
    slug: 'valley-view-cottage-kasauli-himachal',
    type: PropertyType.villa,
    listingType: ListingType.buy,
    description:
      'A stone-and-timber cottage perched on a south-facing ridge above Kasauli, with uninterrupted views across the Shivalik valley. Deodar-panelled interiors, two fireplaces, a sun-room and a terraced garden with an orchard of apricot and plum. Motorable road access up to the gate and a 90-minute drive from Chandigarh airport.',
    price: 18700000,
    currency: 'USD',
    priceNegotiable: true,
    featured: true,

    country: 'India',
    state: 'Himachal Pradesh',
    city: 'Kasauli',
    locality: 'Garkhal',
    address: 'Pine Ridge Cottage, Garkhal Road, Kasauli',
    landmark: 'Near Garkhal Chowk',
    pincode: '173204',
    latitude: 30.9010,
    longitude: 76.9650,

    bhk: 3,
    bathrooms: 3,
    balconies: 2,
    superBuiltUpArea: 2600,
    carpetArea: 2050,
    plotArea: 13068,
    totalFloors: 2,
    propertyAge: '10+ years',
    furnishing: Furnishing.semi_furnished,
    facing: Facing.south,

    amenities: [
      'Garden', 'Parking', 'Terrace', 'Power Backup', '24x7 Water',
      'CCTV', 'BBQ Area', 'High-Speed WiFi',
    ],
    imageUrls: [
      'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1600&q=80',
      'https://images.unsplash.com/photo-1613490493576-7fde63acd811?auto=format&fit=crop&w=1600&q=80',
      'https://images.unsplash.com/photo-1600121848594-d8644e57abab?auto=format&fit=crop&w=1600&q=80',
    ],

    ownerName: 'Arjun Mehta',
    ownerPhone: '+91 98765 43210',
    ownerWhatsapp: '+91 98765 43210',
    ownerEmail: 'agent@realreels.app',
    agencyName: 'Aurevia Luxury Estates',

    status: 'active',
    isVerified: true,
    verificationStatus: VerificationStatus.verified,
  });

  await upsertProperty({
    agentId: admin.id,
    title: 'Beachside Plot — East Coast Road, Chennai',
    slug: 'beachside-plot-east-coast-road-chennai',
    type: PropertyType.plot,
    listingType: ListingType.buy,
    description:
      'A DTCP-approved residential plot 400 metres from the shoreline on East Coast Road, between Muttukadu and Kovalam. Level ground, clear title, and compound-walled on three sides. The surrounding stretch has seen steady villa development, making this well-suited to a private beach home or a rental villa project.',
    price: 6900000,
    currency: 'USD',
    priceNegotiable: true,
    featured: false,

    country: 'India',
    state: 'Tamil Nadu',
    city: 'Chennai',
    locality: 'Kovalam',
    address: 'Plot 22, Ocean Breeze Layout, East Coast Road, Kovalam, Chennai',
    landmark: 'Near Muttukadu Boat House',
    pincode: '603112',
    latitude: 12.7920,
    longitude: 80.2470,

    plotArea: 4800,
    superBuiltUpArea: 0,
    propertyAge: 'Under construction',
    facing: Facing.east,

    amenities: [
      'Security Guard', 'CCTV', '24x7 Water', 'Power Backup',
      'Garden', 'School Nearby', 'Hospital Nearby',
    ],
    imageUrls: [
      'https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=1600&q=80',
      'https://images.unsplash.com/photo-1583847268964-b28dc8f51f92?auto=format&fit=crop&w=1600&q=80',
    ],

    ownerName: 'Admin',
    ownerEmail: 'admin@realreels.app',
    agencyName: 'Aurevia Luxury Estates',

    status: 'active',
    isVerified: true,
    verificationStatus: VerificationStatus.verified,
  });

  await upsertProperty({
    agentId: agent.id,
    title: 'Plug-and-Play Office — HITEC City, Hyderabad',
    slug: 'plug-and-play-office-hitec-city-hyderabad',
    type: PropertyType.office,
    listingType: ListingType.rent,
    description:
      'A 120-seat plug-and-play office on the 8th floor of a LEED-certified tower in HITEC City. Handed over with workstations, four meeting rooms, two phone booths, a break-out lounge and a fully equipped pantry. Redundant power and internet, 24/7 building access and 20 reserved parking bays. Move-in ready.',
    price: 780000,
    currency: 'USD',
    priceNegotiable: true,
    featured: false,

    country: 'India',
    state: 'Telangana',
    city: 'Hyderabad',
    locality: 'HITEC City',
    address: '8th Floor, Wing B, Cyber Pearl, HITEC City, Madhapur, Hyderabad',
    landmark: 'Near Inorbit Mall',
    pincode: '500081',
    latitude: 17.4413,
    longitude: 78.3800,

    bathrooms: 6,
    superBuiltUpArea: 11500,
    carpetArea: 9200,
    floorNumber: 8,
    totalFloors: 15,
    propertyAge: '5-10 years',
    furnishing: Furnishing.furnished,
    facing: Facing.north,

    amenities: [
      'Parking', 'Lift', 'CCTV', 'Security Guard', 'Power Backup',
      'High-Speed WiFi', 'Smart Home', '24x7 Water', 'Metro Nearby', 'Gym',
    ],
    imageUrls: [
      'https://images.unsplash.com/photo-1497366811353-6870744d04b2?auto=format&fit=crop&w=1600&q=80',
      'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=1600&q=80',
      'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?auto=format&fit=crop&w=1600&q=80',
    ],

    ownerName: 'Arjun Mehta',
    ownerPhone: '+91 98765 43210',
    ownerWhatsapp: '+91 98765 43210',
    ownerEmail: 'agent@realreels.app',
    agencyName: 'Aurevia Commercial',

    status: 'active',
    isVerified: true,
    verificationStatus: VerificationStatus.verified,
  });

  await upsertProperty({
    agentId: agent.id,
    title: 'Lakefront 2BHK — New Town, Kolkata',
    slug: 'lakefront-2bhk-new-town-kolkata',
    type: PropertyType.apartment,
    listingType: ListingType.buy,
    description:
      'A bright 2-bedroom apartment overlooking Eco Park\'s central lake in Action Area II, New Town. Vitrified flooring throughout, a wide living-dining space opening onto a lake-facing balcony, and a modular kitchen with a utility deck. The complex offers a clubhouse, lap pool and a landscaped jogging loop.',
    price: 7400000,
    currency: 'USD',
    priceNegotiable: false,
    featured: false,

    country: 'India',
    state: 'West Bengal',
    city: 'Kolkata',
    locality: 'New Town',
    address: 'Flat 9C, Tower 3, Lakeview Heights, Action Area II, New Town',
    landmark: 'Opposite Eco Park Gate 4',
    pincode: '700161',
    latitude: 22.5960,
    longitude: 88.4790,

    bhk: 2,
    bathrooms: 2,
    balconies: 2,
    superBuiltUpArea: 1180,
    carpetArea: 900,
    floorNumber: 9,
    totalFloors: 14,
    propertyAge: '1-5 years',
    furnishing: Furnishing.semi_furnished,
    facing: Facing.south_west,

    amenities: [
      'Parking', 'Swimming Pool', 'Gym', 'Lift', 'CCTV', 'Security Guard',
      'Club House', 'Kids Play Area', 'Jogging Track', 'Power Backup', 'Garden',
    ],
    imageUrls: [
      'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=1600&q=80',
      'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=1600&q=80',
      'https://images.unsplash.com/photo-1600585154526-990dced4db0d?auto=format&fit=crop&w=1600&q=80',
    ],

    ownerName: 'Arjun Mehta',
    ownerPhone: '+91 98765 43210',
    ownerWhatsapp: '+91 98765 43210',
    ownerEmail: 'agent@realreels.app',
    agencyName: 'Aurevia Luxury Estates',

    status: 'active',
    isVerified: true,
    verificationStatus: VerificationStatus.verified,
  });

  await upsertProperty({
    agentId: agent.id,
    title: 'Backwater Heritage Villa — Kumarakom, Kerala',
    slug: 'backwater-heritage-villa-kumarakom-kerala',
    type: PropertyType.villa,
    listingType: ListingType.buy,
    description:
      'A traditional Kerala nalukettu villa on 90 metres of private frontage along the Vembanad backwaters. Carved rosewood pillars, a central courtyard, sloping tiled roofs and wide verandahs on all sides. Includes a boat jetty, a caretaker cottage and a mature garden of mango and jackfruit. Runs successfully as a boutique homestay.',
    price: 24500000,
    currency: 'USD',
    priceNegotiable: true,
    featured: true,

    country: 'India',
    state: 'Kerala',
    city: 'Kumarakom',
    locality: 'Vembanad',
    address: 'Thekkedath Villa, Kavanattinkara, Kumarakom, Kottayam',
    landmark: 'Near Kumarakom Bird Sanctuary',
    pincode: '686563',
    latitude: 9.6180,
    longitude: 76.4300,

    bhk: 5,
    bathrooms: 5,
    balconies: 2,
    superBuiltUpArea: 5100,
    carpetArea: 4200,
    plotArea: 34000,
    totalFloors: 2,
    propertyAge: '10+ years',
    furnishing: Furnishing.furnished,
    facing: Facing.north_west,

    amenities: [
      'Garden', 'Parking', 'Swimming Pool', 'CCTV', 'Security Guard',
      'Terrace', 'BBQ Area', 'Power Backup', '24x7 Water', 'High-Speed WiFi',
    ],
    imageUrls: [
      'https://images.unsplash.com/photo-1600566752355-35792bedcfea?auto=format&fit=crop&w=1600&q=80',
      'https://images.unsplash.com/photo-1600573472592-401b489a3cdc?auto=format&fit=crop&w=1600&q=80',
      'https://images.unsplash.com/photo-1613490493576-7fde63acd811?auto=format&fit=crop&w=1600&q=80',
      'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?auto=format&fit=crop&w=1600&q=80',
    ],

    ownerName: 'Arjun Mehta',
    ownerPhone: '+91 98765 43210',
    ownerWhatsapp: '+91 98765 43210',
    ownerEmail: 'agent@realreels.app',
    agencyName: 'Aurevia Luxury Estates',

    status: 'active',
    isVerified: true,
    verificationStatus: VerificationStatus.verified,
  });

  /* ── 4b. Bhopal listings (their own module, also runnable on their own
         via `npm run db:seed:bhopal`) ── */
  for (const property of BHOPAL_PROPERTIES) {
    await upsertProperty({agentId: agent.id, ...property});
  }

  /* ── 5. Sample reels (Instagram-style feed) ── */
  const propSlugs = [
    'skyline-penthouse-bandra-west',
    'portuguese-heritage-villa-north-goa',
    'modern-3bhk-apartment-whitefield-bangalore',
    'grade-a-office-space-cyber-city-gurugram',
    'luxury-4bhk-villa-jubilee-hills-hyderabad',
  ];
  const seededProps = await prisma.property.findMany({
    where: {slug: {in: propSlugs}},
    select: {id: true, slug: true},
  });
  const propIdBySlug = Object.fromEntries(seededProps.map(p => [p.slug, p.id]));

  const SAMPLE_VIDEOS = [
    'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
    'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4',
    'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4',
    'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4',
    'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/Sintel.mp4',
  ];

  const reels = [
    {id: 'seed-reel-1', caption: 'Sky-high living above Bandra — sunset from the 28th floor ✨', video: SAMPLE_VIDEOS[0], thumb: 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=800&q=80', slug: 'skyline-penthouse-bandra-west', boosted: true, likes: 184, comments: 21},
    {id: 'seed-reel-2', caption: 'A 200-year-old Portuguese villa restored to perfection 🏛️', video: SAMPLE_VIDEOS[1], thumb: 'https://images.unsplash.com/photo-1613490493576-7fde63acd811?auto=format&fit=crop&w=800&q=80', slug: 'portuguese-heritage-villa-north-goa', boosted: true, likes: 142, comments: 17},
    {id: 'seed-reel-3', caption: 'Modern 3BHK walkthrough in Whitefield — minutes from ITPL', video: SAMPLE_VIDEOS[2], thumb: 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=800&q=80', slug: 'modern-3bhk-apartment-whitefield-bangalore', boosted: false, likes: 76, comments: 8},
    {id: 'seed-reel-4', caption: 'Grade-A office space in Cyber City, Gurugram 🏢', video: SAMPLE_VIDEOS[3], thumb: 'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=800&q=80', slug: 'grade-a-office-space-cyber-city-gurugram', boosted: false, likes: 53, comments: 5},
    {id: 'seed-reel-5', caption: 'Contemporary 4BHK villa in Jubilee Hills — rooftop infinity pool 🌊', video: SAMPLE_VIDEOS[4], thumb: 'https://images.unsplash.com/photo-1600047509807-ba8f99d2cdde?auto=format&fit=crop&w=800&q=80', slug: 'luxury-4bhk-villa-jubilee-hills-hyderabad', boosted: false, likes: 98, comments: 12},
  ];

  for (const r of reels) {
    const data = {
      agentId: agent.id,
      videoUrl: r.video,
      thumbnailUrl: r.thumb,
      caption: r.caption,
      propertyId: propIdBySlug[r.slug] ?? null,
      isBoosted: r.boosted,
      boostExpiresAt: r.boosted ? new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) : null,
      likeCount: r.likes,
      commentCount: r.comments,
    };
    await prisma.reel.upsert({
      where: {id: r.id},
      update: data,
      create: {id: r.id, ...data},
    });
    console.log(`  ↳  Reel: ${r.caption.slice(0, 42)}…`);
  }

  console.log(
    `\n✅  Seed complete — ${16 + BHOPAL_PROPERTIES.length} properties, 5 reels added.\n`,
  );
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
