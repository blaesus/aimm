import { createContext, useContext, Dispatch } from 'react';
import { ClientState, getInitialClientState } from "../reducer/state";
import { ClientAction } from "../reducer/action";

interface ClientContext {
    state: ClientState,
    dispatch: Dispatch<ClientAction>
}

export const ClientStateContext = createContext<ClientContext>({
    state: getInitialClientState(),
    dispatch: () => {},
});
