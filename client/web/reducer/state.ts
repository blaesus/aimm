import { ObjectMap, ObjectWithId } from "../../../data/sharedTypes";
import { FileRecord, Repository, Revision } from "@prisma/client";
import { ClientAction } from "./action";
import { PageName, parsePathName } from "../utils";

export interface SearchPageState {
    keyword: string,
}

export interface PagesState {
    current: PageName,
    search: SearchPageState,
}


export interface UIState {
    pages: PagesState,
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
    return {
        pages: {
            current: "home",
            search: {
                keyword: "",
            }
        }
    }
}

export function getInitialClientState(): ClientState {
    return {
        entities: getInitialEntitiesState(),
        ui: getInitialUIState(),
    }
}

function mergeArray<T extends ObjectWithId>(data: ObjectMap<T>, newData?: T[]): ObjectMap<T> {
    if (!newData) {
        return data;
    }
    const result = {...data};
    for (const datum of newData) {
        result[datum.id] = datum;
    }
    return result;
}


export function entitiesReducer(entities: EntitiesState, action: ClientAction): EntitiesState {
    switch (action.type) {
        case "ProvideEntities": {
            const nextEntities = {...entities};
            nextEntities.repositories = mergeArray(nextEntities.repositories, action.repositories);
            nextEntities.revisions = mergeArray(nextEntities.revisions, action.revisions);
            nextEntities.fileRecords = mergeArray(nextEntities.fileRecords, action.fileRecords);
            return nextEntities;
        }
        default: {
            return entities;
        }
    }
}


function uiReducer(ui: UIState, action: ClientAction): UIState {
    switch (action.type) {
        case "SearchInput": {
            return {
                ...ui,
                pages: {
                    ...ui.pages,
                    search: {
                        ...ui.pages.search,
                        keyword: action.keyword,
                    }
                }
            }
        }
        case "ChangePathname": {
            const pathState = parsePathName(action.pathname);
            return {
                ...ui,
            }
        }
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

