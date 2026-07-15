import React from 'react';
import type { IndicatorMessage } from '@/types';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface MessageItemProps {
  message: IndicatorMessage;
  isOwn?: boolean;
}

export function MessageItem({ message, isOwn }: MessageItemProps) {
  const getInitials = (name?: string) => {
    if (!name) return 'U';
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .substring(0, 2)
      .toUpperCase();
  };

  const formattedTime = message.created_at
    ? format(new Date(message.created_at), "d MMM yyyy 'a las' HH:mm", { locale: es })
    : '';

  return (
    <div className={cn('flex w-full gap-3', isOwn ? 'flex-row-reverse' : 'flex-row')}>
      <Avatar className="h-8 w-8 mt-1">
        <AvatarImage src={message.user_avatar} alt={message.user_name || 'User'} />
        <AvatarFallback className="text-xs bg-slate-200">
          {getInitials(message.user_name)}
        </AvatarFallback>
      </Avatar>

      <div className={cn('flex flex-col', isOwn ? 'items-end' : 'items-start', 'max-w-[80%]')}>
        <div className="flex items-center gap-2 mb-1">
          <span className="text-xs font-semibold text-slate-700">
            {message.user_name || 'Usuario'}
          </span>
          <span className="text-[10px] text-slate-500">{formattedTime}</span>
        </div>
        <div
          className={cn(
            'px-4 py-2 rounded-2xl text-sm shadow-sm',
            isOwn
              ? 'bg-blue-600 text-white rounded-tr-none'
              : 'bg-white border border-slate-200 text-slate-800 rounded-tl-none'
          )}
        >
          {message.message}
        </div>
      </div>
    </div>
  );
}
