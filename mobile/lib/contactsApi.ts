import { apiRequest } from '@/lib/api';

export type ContactRequestIncoming = {
  id: string;
  fromUser: { id: string; name?: string | null; image?: string | null; userTag?: string | null };
  status: string;
  createdAt: string;
};

export type ContactRequestOutgoing = {
  id: string;
  toUser: { id: string; name?: string | null; image?: string | null };
  status: string;
  createdAt: string;
};

export type ContactRequestsResponse = {
  incoming: ContactRequestIncoming[];
  outgoing: ContactRequestOutgoing[];
};

/** GET /api/me/contacts/requests — входящие и исходящие запросы в друзья */
export async function getContactRequests(): Promise<ContactRequestsResponse> {
  const data = await apiRequest<ContactRequestsResponse>('/api/me/contacts/requests');
  return {
    incoming: Array.isArray(data.incoming) ? data.incoming : [],
    outgoing: Array.isArray(data.outgoing) ? data.outgoing : [],
  };
}

/** POST /api/me/contacts/requests — отправить запрос в друзья */
export async function sendContactRequest(toUserId: string): Promise<{ id: string; toUserId: string; status: string; createdAt: string }> {
  return apiRequest('/api/me/contacts/requests', {
    method: 'POST',
    body: JSON.stringify({ toUserId: toUserId.trim() }),
  });
}

/** PATCH /api/me/contacts/requests/[id] — принять или отклонить входящий запрос */
export async function respondToContactRequest(
  requestId: string,
  action: 'accept' | 'decline'
): Promise<{ status: string }> {
  return apiRequest(`/api/me/contacts/requests/${requestId}`, {
    method: 'PATCH',
    body: JSON.stringify({ action }),
  });
}
