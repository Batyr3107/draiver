'use client';

import { useEffect, useState, useCallback } from 'react';
import { Socket } from 'socket.io-client';

interface Message {
  id: string;
  rideId: string;
  senderId: string;
  receiverId: string;
  content: string;
  isRead: boolean;
  createdAt: string;
  sender: {
    id: string;
    firstName: string;
    lastName: string;
    avatar?: string;
  };
}

interface UseChatOptions {
  socket: Socket | null;
  rideId: string;
  onNewMessage?: (message: Message) => void;
}

/**
 * Hook для работы с чатом поездки
 */
export function useChat({ socket, rideId, onNewMessage }: UseChatOptions) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [loading, setLoading] = useState(false);

  // Присоединение к комнате чата
  useEffect(() => {
    if (!socket || !rideId) return;

    // Присоединяемся к комнате
    socket.emit('chat:join', rideId);

    // Обработчик присоединения
    socket.on('chat:joined', () => {
      console.log(`💬 Joined chat room: ${rideId}`);
      // Загружаем историю сообщений
      loadMessages();
    });

    // Обработчик новых сообщений
    socket.on('chat:message', (message: Message) => {
      console.log('💬 New message received:', message);
      setMessages((prev) => [...prev, message]);
      onNewMessage?.(message);
    });

    // Обработчик "печатает..."
    socket.on('chat:typing', ({ userId, isTyping: typing }) => {
      setIsTyping(typing);
    });

    return () => {
      socket.off('chat:joined');
      socket.off('chat:message');
      socket.off('chat:typing');
    };
  }, [socket, rideId, onNewMessage]);

  // Загрузка истории сообщений
  const loadMessages = useCallback(async () => {
    if (!rideId) return;

    setLoading(true);
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/chat/ride/${rideId}`,
        {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        }
      );

      if (response.ok) {
        const data = await response.json();
        setMessages(data.data || []);
      }
    } catch (error) {
      console.error('Error loading messages:', error);
    } finally {
      setLoading(false);
    }
  }, [rideId]);

  // Отправка сообщения
  const sendMessage = useCallback((content: string) => {
    if (!socket || !rideId || !content.trim()) return;

    socket.emit('chat:message', {
      rideId,
      content: content.trim()
    });
  }, [socket, rideId]);

  // Отправка индикатора "печатает..."
  const setTyping = useCallback((typing: boolean) => {
    if (!socket || !rideId) return;

    socket.emit('chat:typing', {
      rideId,
      isTyping: typing
    });
  }, [socket, rideId]);

  return {
    messages,
    isTyping,
    loading,
    sendMessage,
    setTyping,
    loadMessages
  };
}

export default useChat;
