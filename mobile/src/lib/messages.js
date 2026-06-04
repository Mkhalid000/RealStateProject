import {api} from './api';

/** Returns [{id, userId, agentId, user, agent, lastMessage, lastMessageAt}] */
export async function fetchConversations() {
  const {data} = await api.get('/chat/conversations');
  return data;
}

/** Returns [{id, conversationId, senderId, text, createdAt}] */
export async function fetchMessages(conversationId) {
  const {data} = await api.get(`/chat/conversations/${conversationId}/messages`);
  return data;
}

/** Send a message in an existing conversation. */
export async function sendMessage({conversationId, text}) {
  const {data} = await api.post(`/chat/conversations/${conversationId}/messages`, {text});
  return data;
}

/** Create a conversation with an agent (get-or-create). Returns the conversation. */
export async function startConversation({agentId}) {
  const {data} = await api.post('/chat/conversations', {agentId});
  return data;
}

/** Total unread message count across all conversations: {count: number} */
export async function fetchUnreadMessageCount() {
  const {data} = await api.get('/chat/conversations/unread-count');
  return data;
}
