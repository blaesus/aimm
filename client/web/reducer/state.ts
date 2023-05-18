import { ObjectMap } from "../../../data/sharedTypes";
import { FileRecord, Repository, Revision } from "@prisma/client";
import { ClientAction } from "./action";

export interface UIState {

}

export interface EntitiesState {
    repositories: ObjectMap<Repository>
    revisions: ObjectMap<Revision>
    fileRecords: ObjectMap<FileRecord>
}

export interface ClientState {
    entities: EntitiesState,
    ui: UIState,
}

function getInitialEntitiesState(): EntitiesState {
    return {
        repositories: {},
        revisions: {},
        fileRecords: {}
    }
}

function getInitialUIState(): UIState {
    return {}
}

export function getInitialClientState(): ClientState {
    return {
        entities: getInitialEntitiesState(),
        ui: getInitialUIState(),
    }
}

function entitiesReducer(entities: EntitiesState, action: ClientAction): EntitiesState {
    switch (action.type) {
        default: {
            return entities;
        }
    }
}

function uiReducer(ui: UIState, action: ClientAction): UIState {
    switch (action.type) {
        default: {
            return ui;
        }
    }
}

export function reducer(state: ClientState, action: ClientAction): ClientState {
    state = {
        entities: entitiesReducer(state.entities, action),
        ui: uiReducer(state.ui, action),
    };
    return state;
}

