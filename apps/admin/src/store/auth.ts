import { AppDispatch, AppGetState, RootState } from '@/store';
import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { UserManager, UserManagerSettings, UserProfile } from 'oidc-client-ts';

type WithEnabled<T> =
  | {
      enabled: false;
    }
  | ({
      enabled: true;
    } & T);

interface GroupAuthorization {
  type: 'group';
  group: string;
}

type AuthorizationConfig = GroupAuthorization;

interface AuthConfig {
  config: Omit<UserManagerSettings, 'redirect_uri' | 'response_mode'>;
  authorization?: WithEnabled<AuthorizationConfig>;
}

type AuthConfigConditional = WithEnabled<AuthConfig>;

export interface AuthState {
  userManager: UserManager | undefined;
  authorized: boolean;
  authenticated: boolean;
  loading: boolean;
  profile: UserProfile | undefined;
  token: string | undefined;
  config: AuthConfigConditional | undefined;
}

const initialState: AuthState = {
  userManager: undefined,
  authorized: false,
  authenticated: false,
  loading: true,
  profile: undefined,
  token: undefined,
  config: undefined,
};

export const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setConfig: (
      state,
      { payload: { config } }: PayloadAction<{ config: AuthConfigConditional }>,
    ) => {
      state.config = config;
    },

    setUserManager: (
      state,
      { payload: { userManager } }: PayloadAction<{ userManager: UserManager }>,
    ) => {
      state.userManager = userManager;
    },

    loginSuccess: (
      state,
      {
        payload: { authorized, profile, token },
      }: PayloadAction<{
        profile: UserProfile;
        authorized: boolean;
        token: string | undefined;
      }>,
    ) => {
      state.profile = profile;
      state.authorized = authorized;
      state.authenticated = true;
      state.token = token;
      state.loading = false;
    },
    loginError: (state) => {
      state.loading = false;
    },
    loginSkipped: (state) => {
      state.loading = false;
      state.authenticated = true;
      state.authorized = true;
    },
  },
});

const { setUserManager, setConfig, loginSkipped, loginError, loginSuccess } =
  authSlice.actions;

export async function logout(_dispatch: AppDispatch, getState: AppGetState) {
  const manager = getState().auth.userManager;
  await manager?.signoutRedirect({
    post_logout_redirect_uri: location.href,
  });
}

export async function toAccountPage(
  _dispatch: AppDispatch,
  getState: AppGetState,
) {
  const profileURL = getState().auth.profile?.profile;
  if (profileURL) {
    window.location.href = profileURL;
  }
}

// https://github.com/authts/react-oidc-context/blob/4a2a457371b9829bc2c02bdb5f916f068335e562/src/utils.ts
function hasAuthParams(location = window.location) {
  // response_mode: fragment
  const searchParams = new URLSearchParams(location.hash.replace('#', '?'));
  if (
    (searchParams.get('code') || searchParams.get('error')) &&
    searchParams.get('state')
  ) {
    return true;
  }

  return false;
}

function checkAuthorization(config: AuthConfig, profile: UserProfile) {
  if (!config.authorization?.enabled) {
    return true;
  }
  if (config.authorization.type === 'group') {
    return ((profile.groups ?? []) as string[]).includes(
      config.authorization.group,
    );
  }
  return false;
}

async function fetchAuthConfig() {
  const resp = await fetch('/api/gateway/auth_config');
  const data = await resp.json();
  return data as AuthConfigConditional;
}

export async function login(dispatch: AppDispatch) {
  try {
    const authConfig = await fetchAuthConfig();

    dispatch(setConfig({ config: authConfig }));

    if (!authConfig.enabled) {
      dispatch(loginSkipped());
      return;
    }

    const manager = new UserManager({
      ...authConfig.config,
      redirect_uri: window.location.href,
      response_mode: 'fragment',
    });
    dispatch(setUserManager({ userManager: manager }));

    let user = await manager.getUser();

    // 用户完成登录后会将本次用的 state 从 storage 中删除，如果此时（不可避免地）
    // 通过返回再次跳转到包含 state 的地址则会报错，因此这里判断如果已经完成登录，则
    // 不再调用 signinCallback
    if (!user && hasAuthParams()) {
      await manager.signinCallback();
      const url = new URL(window.location.href);
      url.hash = '';
      window.location.replace(url.href);
    }

    if (!user) {
      user = await manager.getUser();
    }

    if (!user) {
      await manager.signinRedirect();
    } else {
      dispatch(
        loginSuccess({
          authorized: checkAuthorization(authConfig, user.profile),
          profile: user.profile,
          token: user.access_token,
        }),
      );
    }
  } catch (error) {
    console.error(error);
    dispatch(loginError);
  }
}

export async function initAuth(dispatch: AppDispatch) {
  await dispatch(login);
}

const authReducer = authSlice.reducer;

export default authReducer;

export const selectToken = (state: RootState) => state.auth.token;
export const selectProfile = (state: RootState) => state.auth.profile;
export const selectAuth = (state: RootState) => state.auth;
export const selectHasAccountPage = (state: RootState) =>
  Boolean(state.auth.profile?.profile);
