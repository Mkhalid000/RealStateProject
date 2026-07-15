import {Property as SharedProperty} from '../shared';
import {Prisma, Property, User} from '@prisma/client';
import {toPublicProfile} from '../profiles/profile.mapper';

type PropertyWithAgent = Property & {agent?: User};

export function toProperty(p: PropertyWithAgent): SharedProperty {
  return {
    id: p.id,
    agentId: p.agentId,
    agent: p.agent ? {...toPublicProfile(p.agent), email: p.agent.email} : undefined,

    title: p.title,
    slug: p.slug,
    type: p.type as SharedProperty['type'],
    listingType: p.listingType as SharedProperty['listingType'],
    description: p.description,
    price: decimalToNumber(p.price),
    currency: p.currency,
    priceNegotiable: p.priceNegotiable,
    featured: p.featured,

    country: p.country,
    state: p.state,
    city: p.city,
    locality: p.locality,
    address: p.address,
    landmark: p.landmark,
    pincode: p.pincode,
    latitude: p.latitude,
    longitude: p.longitude,
    locationText: p.locationText,

    bhk: p.bhk,
    bathrooms: p.bathrooms,
    balconies: p.balconies,
    superBuiltUpArea: p.superBuiltUpArea,
    carpetArea: p.carpetArea,
    plotArea: p.plotArea,
    floorNumber: p.floorNumber,
    totalFloors: p.totalFloors,
    propertyAge: p.propertyAge,
    furnishing: p.furnishing as SharedProperty['furnishing'],
    facing: p.facing as SharedProperty['facing'],

    amenities: p.amenities,

    imageUrls: p.imageUrls,
    videoUrl: p.videoUrl,
    virtualTourUrl: p.virtualTourUrl,
    modelUrl: p.modelUrl,
    brochureUrl: p.brochureUrl,

    ownerName: p.ownerName,
    ownerPhone: p.ownerPhone,
    ownerWhatsapp: p.ownerWhatsapp,
    ownerEmail: p.ownerEmail,
    agencyName: p.agencyName,

    status: p.status as SharedProperty['status'],
    isVerified: p.isVerified,
    verificationStatus: p.verificationStatus as SharedProperty['verificationStatus'],
    createdAt: p.createdAt.toISOString(),
  };
}

export function decimalToNumber(d: Prisma.Decimal | number): number {
  return typeof d === 'number' ? d : Number(d.toString());
}
