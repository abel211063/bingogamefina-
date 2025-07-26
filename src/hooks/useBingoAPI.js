import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '../api/apiClient';
import { toast } from 'react-toastify';

const fetchGameState = async () => {
  const { data } = await apiClient.get('/game');
  return data;
};

const postAction = async (actionFn) => {
  const { data } = await actionFn();
  return data;
};

export const useBingoAPI = () => {
  const queryClient = useQueryClient();
  const queryKey = ['gameState'];

  const { data: gameState, isLoading, isError } = useQuery({
    queryKey,
    queryFn: fetchGameState,
    refetchInterval: 2000,
  });

  const { mutate, isPending } = useMutation({
    mutationFn: postAction,
    onSuccess: (data) => {
      toast.success(data.message || 'Action successful!');
      if (data.isWinner) toast.info("🎉 Congratulations, you're a WINNER! 🎉");
      queryClient.invalidateQueries({ queryKey });
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'An error occurred.');
    },
  });

  const submitBet = (betData) => mutate(() => apiClient.post('/bet', betData));
  const drawNumber = () => mutate(() => apiClient.post('/draw'));
  const resetGame = () => mutate(() => apiClient.post('/reset'));

  return { gameState, isLoading, isError, submitBet, drawNumber, resetGame, isPending };
};