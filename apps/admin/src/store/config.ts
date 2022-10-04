import { AdminConfig } from '@/generated/types';
import { RootState } from '@/store';
import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface ConfigState {
  data: AdminConfig | undefined;
}

const initialState: ConfigState = {
  data: undefined,
};

export const configSlice = createSlice({
  name: 'config',
  initialState,
  reducers: {
    setConfig: (
      state,
      { payload: { data } }: PayloadAction<{ data: AdminConfig }>,
    ) => {
      state.data = data;
    },
  },
});

export const { setConfig } = configSlice.actions;

const configReducer = configSlice.reducer;

export default configReducer;

export const selectConfig = (state: RootState) => state.config.data;
