import { useQuery } from '@tanstack/react-query';
import { cabinetApi, politicsApi } from '../api/endpoints';
import { useAuth } from '../context/AuthContext';

export function usePoliticalRoles() {
  const { character } = useAuth();
  const characterId = character?.id ?? null;

  const parliamentQ = useQuery({
    queryKey: ['politics', 'parliament'],
    queryFn: () => politicsApi.parliament(),
  });

  const cabinetMeQ = useQuery({
    queryKey: ['cabinet', 'me'],
    queryFn: () => cabinetApi.me(),
    enabled: characterId != null,
  });

  const officePayQ = useQuery({
    queryKey: ['politics', 'office-pay', 'me', characterId],
    queryFn: () => politicsApi.myOfficePay(),
    enabled: characterId != null,
  });

  const rolesLoading = parliamentQ.isLoading;
  const presidentId = parliamentQ.data?.president.character_id ?? null;
  const vpId = parliamentQ.data?.vice_president?.character_id ?? null;
  const speakerId = parliamentQ.data?.speaker?.character_id ?? null;
  const seats = parliamentQ.data?.seats ?? [];

  const isPresident =
    !rolesLoading &&
    characterId != null &&
    presidentId != null &&
    presidentId === characterId;

  const isVicePresident =
    !rolesLoading &&
    characterId != null &&
    vpId != null &&
    vpId === characterId;

  const isSpeaker =
    !rolesLoading &&
    characterId != null &&
    speakerId != null &&
    speakerId === characterId;

  const mpSeat =
    characterId == null
      ? undefined
      : seats.find((s) => s.mp_character_id === characterId);

  const isMp = !rolesLoading && !!mpSeat;
  const isMinister = !!cabinetMeQ.data;
  /** Matches BE: office holders cannot take state/company employee jobs. */
  const holdsOffice =
    isPresident ||
    isVicePresident ||
    isSpeaker ||
    isMp ||
    isMinister ||
    (officePayQ.data?.roles.length ?? 0) > 0;

  return {
    isPresident,
    isVicePresident,
    isSpeaker,
    isMp,
    isMinister,
    holdsOffice,
    mpSeat,
    rolesLoading,
    parliament: parliamentQ.data ?? null,
    parliamentQ,
    officePay: officePayQ.data ?? null,
  };
}
