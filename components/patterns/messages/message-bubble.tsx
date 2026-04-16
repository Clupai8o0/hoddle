import type { MessageWithSender } from "@/lib/types/messages";

export interface MessageBubbleProps {
  message: MessageWithSender;
  isOwn: boolean;
}

function formatTimeMelbourne(isoString: string): string {
  return new Intl.DateTimeFormat("en-AU", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: "Australia/Melbourne",
  }).format(new Date(isoString));
}

export function MessageBubble({ message, isOwn }: MessageBubbleProps) {
  const time = formatTimeMelbourne(message.created_at);

  return (
    <div className={`flex flex-col gap-0.5 ${isOwn ? "items-end" : "items-start"}`}>
      <div
        className={`max-w-[72%] px-4 py-2.5 ${
          isOwn
            ? "bg-primary text-on-primary rounded-2xl rounded-br-sm"
            : "bg-surface-container-low text-on-surface rounded-2xl rounded-bl-sm"
        }`}
      >
        <p className="font-body text-sm leading-relaxed whitespace-pre-wrap break-words">
          {message.body}
        </p>
      </div>
      <time
        dateTime={message.created_at}
        className="font-body text-xs text-on-surface-variant px-1"
      >
        {time}
      </time>
    </div>
  );
}
