'use client';

import React, { useRef, useEffect, useState } from 'react';
import { toast } from 'sonner';
import { saveDestinationValue, sendIndicatorMessage } from '@/sdk/api/evaluations-api';
import { useMessages } from '@/sdk/hooks/useMessages';
import { MessageItem } from '@/components/molecules/MessageItem';
import { MessageInput } from '@/components/molecules/MessageInput';
import { Skeleton } from '@/components/ui/skeleton';
import { getUserId } from '@/lib/auth';

interface IndicatorMessagesProps {
  evaluationId: string;
  indicatorId: string;
  indicatorValueId?: string;
  readOnly?: boolean;
}

export function IndicatorMessages({ evaluationId, indicatorId, indicatorValueId: propValueId, readOnly }: IndicatorMessagesProps) {
  const [localValueId, setLocalValueId] = useState<string | undefined>(propValueId);
  const indicatorValueId = localValueId || propValueId;

  const { messages, isLoading: isLoadingMessages, mutate } = useMessages(indicatorValueId);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = messagesContainerRef.current;
    if (container) {
      container.scrollTop = container.scrollHeight;
    }
  }, [messages]);

  // Sync when parent provides the ID (after initial load)
  useEffect(() => {
    if (propValueId) {
      setLocalValueId(propValueId);
    }
  }, [propValueId]);

  const handleSend = async (text: string) => {
    try {
      let id = indicatorValueId;

      // Auto-create indicator value if it doesn't exist yet
      if (!id) {
        const newValue = await saveDestinationValue(evaluationId, indicatorId, {
          destination_value: 0,
        });
        id = newValue.id;
        setLocalValueId(id);
      }

      // Use direct API call with resolved ID — the hook's sendMessage closure
      // still references the initial (possibly undefined) indicatorValueId.
      await sendIndicatorMessage(id, text);
      await mutate();
    } catch (error: any) {
      toast.error(error.message || 'Error al enviar el mensaje');
    }
  };

  // Get current user ID from JWT to determine isOwn
  const currentUserId = getUserId('unknown');

  return (
    <div className="flex flex-col gap-4">
      <div ref={messagesContainerRef} className="flex flex-col gap-4 max-h-[400px] overflow-y-auto pr-2 pb-2">
        {isLoadingMessages ? (
          Array.from({ length: 3 }).map((_, i) => (
            <Skeleton
              key={i}
              className={`h-16 w-3/4 rounded-2xl ${i % 2 === 0 ? '' : 'ml-auto'}`}
            />
          ))
        ) : messages.length === 0 ? (
          <div className="py-8">
            <p className="text-center text-sm text-gray-500">
              No hay mensajes para este indicador.
            </p>
          </div>
        ) : (
          messages.map((msg) => (
            <MessageItem
              key={msg.id}
              message={msg}
              isOwn={msg.user_id === currentUserId}
            />
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {!readOnly && (
        <MessageInput onSend={handleSend} />
      )}
    </div>
  );
}
