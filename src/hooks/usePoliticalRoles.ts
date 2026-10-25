import { useQuery } from '@tanstack/react-query';
import { politicsApi } from '../api/endpoints';
import { useAuth } from '../context/AuthContext';

export function usePoliticalRoles() {
  const { character } = useAuth();
  const characterId = character?.id ?? null;

  const parliamentQ = useQuery({
    queryKey: ['politics', 'parliament'],
    queryFn: () => politicsApi.parliament(),
  });

  const rolesLoading = parliamentQ.isLoading;
  const presidentId = parliamentQ.data?.president.character_id ?? null;
  const seats = parliamentQ.data?.seats ?? [];

  const isPresident =
    !rolesLoading &&
    characterId != null &&
    presidentId != null &&
    presidentId === characterId;

  const mpSeat =
    characterId == null
      ? undefined
      : seats.find((s) => s.mp_character_id === characterId);

  const isMp = !rolesLoading && !!mpSeat;

  return {
    isPresident,
    isMp,
    mpSeat,
    rolesLoading,
    parliament: parliamentQ.data ?? null,
    parliamentQ,
  };
}
