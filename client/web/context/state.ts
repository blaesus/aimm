import { createContext, useContext, Dispatch } from 'react';
import { ClientState, getInitialClientState } from "../reducer/state";
import { ClientAction } from "../reducer/action";

export const ClientStateContext = createContext<ClientState>(getInitialClientState());
export const ClientDispatchContext = createContext<Dispatch<ClientAction>>(() => {});
