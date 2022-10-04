import useAppClient from '@/client/hooks';
import Layout from '@/components/Layout';
import { GetConfigDocument } from '@/generated/types';
import { store } from '@/store';
import { initAuth, selectAuth } from '@/store/auth';
import { setConfig } from '@/store/config';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { ExcludeTypename } from '@/utils/graphql';
import { ApolloProvider, useQuery } from '@apollo/client';
import { useMount } from 'ahooks';
import { Provider } from 'react-redux';
import './global.less';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default function App(props: any) {
  return (
    <Provider store={store}>
      <AppInner {...props} />
    </Provider>
  );
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function AppInner(props: any) {
  const dispatch = useAppDispatch();
  const client = useAppClient();
  const { authorized } = useAppSelector(selectAuth);

  useMount(async () => {
    await dispatch(initAuth);
  });

  useQuery(GetConfigDocument, {
    skip: !authorized,
    onCompleted: (response) => {
      const data = response.config as ExcludeTypename<typeof response.config>;
      dispatch(setConfig({ data }));
    },
    client,
  });

  return (
    <ApolloProvider client={client}>
      <Layout {...props} />
    </ApolloProvider>
  );
}
