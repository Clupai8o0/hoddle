import { MessageSquare } from "lucide-react";

export default function MessagesPage() {
  return (
    <div className="flex-1 flex items-center justify-center">
      <div className="text-center max-w-xs">
        <MessageSquare
          size={40}
          strokeWidth={1.5}
          className="mx-auto mb-4 text-on-surface-variant"
        />
        <p className="font-display text-lg font-semibold text-on-surface mb-2">
          No conversation selected
        </p>
        <p className="font-body text-sm text-on-surface-variant">
          Choose a conversation from the sidebar or start a new one.
        </p>
      </div>
    </div>
  );
}
