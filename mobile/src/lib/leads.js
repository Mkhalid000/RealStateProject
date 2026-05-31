import {api} from './api';

/** Create an enquiry (lead) for a property. Mirrors the web `/leads` POST. */
export async function createLead({name, email, phone, message, propertyId}) {
  const {data} = await api.post('/leads', {
    name,
    ...(email ? {email} : {}),
    ...(phone ? {phone} : {}),
    ...(message ? {message} : {}),
    propertyId,
    source: 'mobile',
  });
  return data;
}
