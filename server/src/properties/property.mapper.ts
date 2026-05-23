import {Property as SharedProperty} from '@realreels/shared';
import {Prisma, Property, User} from '@prisma/client';
import {toPublicProfile} from '../profiles/profile.mapper';

type PropertyWithAgent = Property & {agent?: User};

export function toProperty(p: PropertyWithAgent): SharedProperty {
  return {
    id: p.id,
    agentId: p.agentId,
    agent: p.agent ? toPublicProfile(p.agent) : undefined,
    title: p.title,
    description: p.description,
    price: decimalToNumber(p.price),
    currency: p.currency,
    locationText: p.locationText,
    latitude: p.latitude,
    longitude: p.longitude,
    type: p.type as SharedProperty['type'],
    bedrooms: p.bedrooms,
    bathrooms: p.bathrooms,
    areaSqft: p.areaSqft,
    amenities: p.amenities,
    imageUrls: p.imageUrls,
    status: p.status as SharedProperty['status'],
    createdAt: p.createdAt.toISOString(),
  };
}

export function decimalToNumber(d: Prisma.Decimal | number): number {
  return typeof d === 'number' ? d : Number(d.toString());
}
