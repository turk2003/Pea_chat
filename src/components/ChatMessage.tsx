import { Message } from '@/types';

interface ChatMessageProps {
  message: Message;
}

export function ChatMessage({ message }: ChatMessageProps) {
  return (
    <div
      className={`p-4 rounded-lg ${
        message.role === 'user'
          ? 'bg-blue-100  ml-auto max-w-[80%]'
          : 'bg-purple-100 max-w-[80%]'
      }`}
    >
      <div className="text-sm mb-1">
        {message.role === 'user' ? 'คุณ' : 'PEA Assistant'}
      </div>
      <div className="whitespace-pre-wrap">{message.content}</div>
      {message.timestamp && (
        <div className="text-xs mt-2 opacity-70">
          {message.timestamp.toLocaleTimeString('th-TH')}
        </div>
      )}
    </div>
  );
}