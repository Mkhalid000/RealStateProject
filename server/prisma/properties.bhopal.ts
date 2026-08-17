import {Facing, Furnishing, ListingType, PropertyType, VerificationStatus} from '@prisma/client';

/**
 * Bhopal listings.
 *
 * Kept in their own module so they can be seeded on their own
 * (`npm run db:seed:bhopal`) without re-running — and overwriting — the rest of
 * the demo catalogue. `seed.ts` includes them too, so a fresh install gets them.
 *
 * Prices follow the same convention as the rest of the seed: INR-scale amounts
 * (monthly for rentals), stored against the catalogue's default currency.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const BHOPAL_PROPERTIES: any[] = [
  {
    title: 'Lake-Facing 3BHK — Shymala Hills',
    slug: 'lake-facing-3bhk-shymala-hills-bhopal',
    type: PropertyType.apartment,
    listingType: ListingType.buy,
    description:
      'A calm, light-filled 3-bedroom apartment on Shymala Hills with an uninterrupted view of the Upper Lake from the living room and the master suite. Vitrified flooring throughout, a modular kitchen with chimney and hob, and a wide balcony built for the evening breeze off Bhojtal. Two covered parking bays, and Van Vihar, Birla Mandir and the State Museum are all within a short drive.',
    price: 9800000,
    priceNegotiable: true,
    featured: true,

    country: 'India',
    state: 'Madhya Pradesh',
    city: 'Bhopal',
    locality: 'Shymala Hills',
    address: 'B-402, Lake Crest Residency, Shymala Hills, Bhopal',
    landmark: 'Opposite Boat Club, near Upper Lake',
    pincode: '462013',
    latitude: 23.2472,
    longitude: 77.393,

    bhk: 3,
    bathrooms: 3,
    balconies: 2,
    superBuiltUpArea: 1850,
    carpetArea: 1420,
    floorNumber: 4,
    totalFloors: 8,
    propertyAge: '1-5 years',
    furnishing: Furnishing.semi_furnished,
    facing: Facing.north_east,

    amenities: [
      'Parking', 'Lift', 'Power Backup', 'CCTV', 'Security Guard',
      'Garden', 'Gym', 'Club House', '24x7 Water',
    ],
    imageUrls: [
      'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=1600&q=80',
      'https://images.unsplash.com/photo-1600585154526-990dced4db0d?auto=format&fit=crop&w=1600&q=80',
      'https://images.unsplash.com/photo-1600566753376-12c8ab8b9753?auto=format&fit=crop&w=1600&q=80',
      'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=1600&q=80',
    ],
  },

  {
    title: 'Contemporary 4BHK Villa — Kerwa Dam Road',
    slug: 'contemporary-4bhk-villa-kerwa-dam-road-bhopal',
    type: PropertyType.villa,
    listingType: ListingType.buy,
    description:
      'A double-height, four-bedroom villa on Kerwa Dam Road, set back from the road on a 4,000 sq-ft plot with mature trees on three sides. Full-height glazing across the living and dining area, an open kitchen with a utility court, a family lounge on the first floor and a landscaped rear garden with a deck. Gated community with an internal club and round-the-clock security, ten minutes from Kerwa Dam.',
    price: 21500000,
    priceNegotiable: true,
    featured: true,

    country: 'India',
    state: 'Madhya Pradesh',
    city: 'Bhopal',
    locality: 'Kerwa Dam Road',
    address: 'Villa 27, Aakriti Eco City, Kerwa Dam Road, Bhopal',
    landmark: 'Near Kerwa Dam turn-off',
    pincode: '462044',
    latitude: 23.1387,
    longitude: 77.3585,

    bhk: 4,
    bathrooms: 4,
    balconies: 3,
    superBuiltUpArea: 3600,
    carpetArea: 2900,
    plotArea: 4000,
    totalFloors: 2,
    propertyAge: 'New (0-1 year)',
    furnishing: Furnishing.semi_furnished,
    facing: Facing.east,

    amenities: [
      'Parking', 'Garden', 'Power Backup', 'CCTV', 'Security Guard',
      'Club House', 'Swimming Pool', 'Terrace', '24x7 Water', 'High-Speed WiFi',
    ],
    imageUrls: [
      'https://images.unsplash.com/photo-1613490493576-7fde63acd811?auto=format&fit=crop&w=1600&q=80',
      'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?auto=format&fit=crop&w=1600&q=80',
      'https://images.unsplash.com/photo-1580587771525-78b9dba3b914?auto=format&fit=crop&w=1600&q=80',
      'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1600&q=80',
    ],
  },

  {
    title: 'Corporate Office Floor — MP Nagar Zone-I',
    slug: 'corporate-office-floor-mp-nagar-bhopal',
    type: PropertyType.office,
    listingType: ListingType.rent,
    description:
      "A fitted 4,200 sq-ft office floor in the heart of MP Nagar Zone-I, Bhopal's central business district. Twelve cabins, a 20-seat boardroom, an open workstation bay, reception and pantry, with split ACs and DG backup already in place. Lift access from a double-height lobby and eight reserved parking bays in the basement. Walking distance from DB Mall and the Habibganj (Rani Kamlapati) station road.",
    price: 185000,
    priceNegotiable: true,
    featured: false,

    country: 'India',
    state: 'Madhya Pradesh',
    city: 'Bhopal',
    locality: 'MP Nagar',
    address: '3rd Floor, Gulmohar Business Park, Zone-I, MP Nagar, Bhopal',
    landmark: 'Near DB City Mall',
    pincode: '462011',
    latitude: 23.233,
    longitude: 77.4342,

    bathrooms: 4,
    superBuiltUpArea: 4200,
    carpetArea: 3400,
    floorNumber: 3,
    totalFloors: 7,
    propertyAge: '5-10 years',
    furnishing: Furnishing.furnished,
    facing: Facing.north,

    amenities: [
      'Parking', 'Lift', 'Power Backup', 'CCTV', 'Security Guard',
      'High-Speed WiFi', 'Air Conditioning', '24x7 Water',
    ],
    imageUrls: [
      'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=1600&q=80',
      'https://images.unsplash.com/photo-1497366811353-6870744d04b2?auto=format&fit=crop&w=1600&q=80',
      'https://images.unsplash.com/photo-1600121848594-d8644e57abab?auto=format&fit=crop&w=1600&q=80',
    ],
  },

  {
    title: 'Furnished 2BHK — Shahpura',
    slug: 'furnished-2bhk-shahpura-bhopal',
    type: PropertyType.apartment,
    listingType: ListingType.rent,
    description:
      'A fully furnished 2-bedroom apartment overlooking Shahpura Lake, available on a long lease. Comes with beds, wardrobes, a five-seater sofa, dining set, washing machine, refrigerator and split ACs in both bedrooms. Quiet, family-oriented tower with a lift, backup power and a small children\'s play area. Five minutes from Manisha Market and the Bansal Hospital road.',
    price: 26000,
    priceNegotiable: false,
    featured: false,

    country: 'India',
    state: 'Madhya Pradesh',
    city: 'Bhopal',
    locality: 'Shahpura',
    address: 'C-1203, Silver Springs, Shahpura, Bhopal',
    landmark: 'Near Shahpura Lake',
    pincode: '462039',
    latitude: 23.1965,
    longitude: 77.4297,

    bhk: 2,
    bathrooms: 2,
    balconies: 2,
    superBuiltUpArea: 1180,
    carpetArea: 920,
    floorNumber: 12,
    totalFloors: 14,
    propertyAge: '1-5 years',
    furnishing: Furnishing.furnished,
    facing: Facing.west,

    amenities: [
      'Parking', 'Lift', 'Power Backup', 'CCTV', 'Security Guard',
      'Gym', 'Garden', '24x7 Water', 'High-Speed WiFi',
    ],
    imageUrls: [
      'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=1600&q=80',
      'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=1600&q=80',
      'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=1600&q=80',
    ],
  },

  {
    title: 'Gated Residential Plot — Katara Hills',
    slug: 'gated-residential-plot-katara-hills-bhopal',
    type: PropertyType.plot,
    listingType: ListingType.buy,
    description:
      'A clear-title 2,400 sq-ft corner plot inside a gated, RERA-approved layout at Katara Hills. Internal roads, street lighting, storm-water drains and boundary walls are complete, with electricity and municipal water lines at the plot edge. East-facing with a 30-foot road on two sides — ready to build on, with no construction deadline imposed by the developer.',
    price: 4900000,
    priceNegotiable: true,
    featured: false,

    country: 'India',
    state: 'Madhya Pradesh',
    city: 'Bhopal',
    locality: 'Katara Hills',
    address: 'Plot 88, Sagar Green Hills Extension, Katara Hills, Bhopal',
    landmark: 'Near Katara Hills Bypass',
    pincode: '462043',
    latitude: 23.1867,
    longitude: 77.4863,

    plotArea: 2400,
    propertyAge: 'New (0-1 year)',
    facing: Facing.east,

    amenities: ['Gated Community', 'Security Guard', 'Street Lighting', '24x7 Water', 'Park'],
    imageUrls: [
      'https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=1600&q=80',
      'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?auto=format&fit=crop&w=1600&q=80',
      'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=1600&q=80',
    ],
  },

  {
    title: 'High-Street Shop — New Market, TT Nagar',
    slug: 'high-street-shop-new-market-bhopal',
    type: PropertyType.shop,
    listingType: ListingType.rent,
    description:
      'A ground-floor retail unit on the main New Market circle, with an 18-foot frontage and a mezzanine for storage. Continuous footfall through the day from the TT Nagar and Malviya Nagar catchment, with established apparel, jewellery and food brands on either side. Shutters, flooring and power load are in place; suitable for fashion, mobile retail or a quick-service kitchen.',
    price: 95000,
    priceNegotiable: true,
    featured: false,

    country: 'India',
    state: 'Madhya Pradesh',
    city: 'Bhopal',
    locality: 'New Market',
    address: 'Shop 14, Ground Floor, Bhadbhada Road, New Market, TT Nagar, Bhopal',
    landmark: 'Opposite New Market bus stop',
    pincode: '462003',
    latitude: 23.2337,
    longitude: 77.4009,

    bathrooms: 1,
    superBuiltUpArea: 720,
    carpetArea: 600,
    floorNumber: 0,
    totalFloors: 3,
    propertyAge: '10+ years',
    furnishing: Furnishing.unfurnished,
    facing: Facing.south,

    amenities: ['Parking', 'Power Backup', 'CCTV', 'Security Guard', '24x7 Water'],
    imageUrls: [
      'https://images.unsplash.com/photo-1583847268964-b28dc8f51f92?auto=format&fit=crop&w=1600&q=80',
      'https://images.unsplash.com/photo-1600047509807-ba8f99d2cdde?auto=format&fit=crop&w=1600&q=80',
      'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=1600&q=80',
    ],
  },

  {
    title: 'Garden Duplex 3BHK — Bawadiya Kalan',
    slug: 'garden-duplex-3bhk-bawadiya-kalan-bhopal',
    type: PropertyType.villa,
    listingType: ListingType.buy,
    description:
      'A three-bedroom duplex on Bawadiya Kalan with its own front garden and a rear utility yard. The ground floor holds a double-height living room, a guest bedroom and an open kitchen; two bedroom suites and a study occupy the first floor, opening onto a covered terrace. Corner unit in a small 24-house enclave, minutes from Aashima Mall and the Hoshangabad Road corridor.',
    price: 8900000,
    priceNegotiable: true,
    featured: false,

    country: 'India',
    state: 'Madhya Pradesh',
    city: 'Bhopal',
    locality: 'Bawadiya Kalan',
    address: 'D-9, Sagar Landmark Duplexes, Bawadiya Kalan, Bhopal',
    landmark: 'Near Aashima Mall, Hoshangabad Road',
    pincode: '462039',
    latitude: 23.1875,
    longitude: 77.4471,

    bhk: 3,
    bathrooms: 3,
    balconies: 2,
    superBuiltUpArea: 2100,
    carpetArea: 1680,
    plotArea: 1500,
    totalFloors: 2,
    propertyAge: '5-10 years',
    furnishing: Furnishing.semi_furnished,
    facing: Facing.north,

    amenities: [
      'Parking', 'Garden', 'Power Backup', 'CCTV', 'Security Guard',
      'Terrace', '24x7 Water', 'Park',
    ],
    imageUrls: [
      'https://images.unsplash.com/photo-1600566752355-35792bedcfea?auto=format&fit=crop&w=1600&q=80',
      'https://images.unsplash.com/photo-1600573472592-401b489a3cdc?auto=format&fit=crop&w=1600&q=80',
      'https://images.unsplash.com/photo-1600585154526-990dced4db0d?auto=format&fit=crop&w=1600&q=80',
    ],
  },
].map(p => ({
  // shared across every Bhopal listing
  currency: 'USD',
  ownerName: 'Arjun Mehta',
  ownerPhone: '+91 98765 43210',
  ownerWhatsapp: '+91 98765 43210',
  ownerEmail: 'agent@realreels.app',
  agencyName: 'Aurevia Luxury Estates',
  status: 'active',
  isVerified: true,
  verificationStatus: VerificationStatus.verified,
  ...p,
}));
