'use client';
import {
  AccountingRepository,
  type ContractDetail,
  type ContractFilterInput,
  type ContractSummary,
  type CreateContractInput,
} from '@repo/data';
import {
  type QueryClient,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import { useSdk } from './use-graphql-client';

export function useContracts(filter?: ContractFilterInput) {
  const sdk = useSdk();
  const repository = new AccountingRepository(sdk);

  return useQuery<ContractSummary[]>({
    queryKey: ['accounting', 'contracts', filter],
    queryFn: () => repository.findContracts(filter),
    staleTime: 30 * 1000,
  });
}

export function useMyContracts(filter?: ContractFilterInput) {
  const sdk = useSdk();
  const repository = new AccountingRepository(sdk);

  return useQuery<ContractSummary[]>({
    queryKey: ['accounting', 'my-contracts', filter],
    queryFn: () => repository.findMyContracts(filter),
    staleTime: 30 * 1000,
  });
}

export function useContract(id?: string) {
  const sdk = useSdk();
  const repository = new AccountingRepository(sdk);

  return useQuery<ContractDetail>({
    queryKey: ['accounting', 'contract', id],
    queryFn: () => repository.findContractById(id ?? ''),
    staleTime: 30 * 1000,
    enabled: !!id,
  });
}

function invalidateContractQueries(queryClient: QueryClient) {
  queryClient.invalidateQueries({ queryKey: ['accounting', 'contracts'] });
  queryClient.invalidateQueries({ queryKey: ['accounting', 'my-contracts'] });
}

export function useCreateContract() {
  const sdk = useSdk();
  const queryClient = useQueryClient();
  const repository = new AccountingRepository(sdk);

  return useMutation({
    mutationFn: (input: CreateContractInput) =>
      repository.createContract(input),
    onSuccess: () => invalidateContractQueries(queryClient),
  });
}

export function useSignContract() {
  const sdk = useSdk();
  const queryClient = useQueryClient();
  const repository = new AccountingRepository(sdk);

  return useMutation({
    mutationFn: (contractId: string) => repository.signContract(contractId),
    onSuccess: (result) => {
      queryClient.invalidateQueries({
        queryKey: ['accounting', 'contract', result.id],
      });
      invalidateContractQueries(queryClient);
    },
  });
}

export function useDeclineContract() {
  const sdk = useSdk();
  const queryClient = useQueryClient();
  const repository = new AccountingRepository(sdk);

  return useMutation({
    mutationFn: ({
      contractId,
      reason,
    }: {
      contractId: string;
      reason: string;
    }) => repository.declineContract(contractId, reason),
    onSuccess: (result) => {
      queryClient.invalidateQueries({
        queryKey: ['accounting', 'contract', result.id],
      });
      invalidateContractQueries(queryClient);
    },
  });
}
