/** Participant profile subset used in chat UI */
export interface ChatParticipant {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
  role: "student" | "mentor" | "admin";
}

/** Row from conversations table */
export interface Conversation {
  id: string;
  participant_one: string;
  participant_two: string;
  created_at: string;
  updated_at: string;
}

/** Row from messages table */
export interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  body: string;
  created_at: string;
}

/** Row from conversation_read_cursors */
export interface ConversationReadCursor {
  conversation_id: string;
  profile_id: string;
  last_read_at: string;
}

/** Conversation list item — joined with other participant + last message + unread count */
export interface ConversationWithMeta {
  id: string;
  updated_at: string;
  other_participant: ChatParticipant;
  last_message: {
    id: string;
    body: string;
    sender_id: string;
    created_at: string;
  } | null;
  unread_count: number;
}

/** Message with the sender's profile attached */
export interface MessageWithSender extends Message {
  sender: ChatParticipant;
}

/** Standard server action result type */
export type ActionResult<T = void> =
  | { ok: true; data: T }
  | { ok: false; error: string };
