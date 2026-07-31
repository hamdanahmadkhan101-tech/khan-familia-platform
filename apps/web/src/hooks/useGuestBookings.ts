import { useQuery } from '@tanstack/react-query';
import { useApi } from './useApi';

export function useGuestBookings(scope: 'upcoming' | 'past' | 'cancelled') {
  const client = useApi();

  return useQuery({
    queryKey: ['guestBookings', scope],
    queryFn: async () => {
      if (!client) throw new Error('API client not initialized');
      const { bookings } = await client.listGuestBookings({ scope });
      return bookings;
    },
    enabled: !!client,
  });
}
