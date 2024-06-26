import { ObjectMap, ObjectWithId } from "../../../data/sharedTypes";
import { Benchmark, BenchmarkResult, FileRecord, Repository, Revision } from "@prisma/client";
import { ClientAction } from "./action";
import { PageName, parseUrl } from "../clientUtils";
import { MatchedItems } from "../../../data/aimmApi";

export interface SearchPageState {
    keyword: string,
    matchedItems: MatchedItems,
}

export interface PagesState {
    current: PageName,
    search: SearchPageState,
}


export interface UIState {
    pages: PagesState,
}

export interface EntitiesState {
    repositories: ObjectMap<Repository>;
    revisions: ObjectMap<Revision>;
    fileRecords: ObjectMap<FileRecord>;
    benchmarks: ObjectMap<Benchmark>;
    benchmarkResults: ObjectMap<BenchmarkResult>;
}

export interface ClientState {
    entities: EntitiesState,
    ui: UIState,
}

function getInitialEntitiesState(): EntitiesState {
    return {
        repositories: {},
        revisions: {},
        fileRecords: {},
        benchmarks: {},
        benchmarkResults: {},
    };
}

function getInitialUIState(): UIState {
    return {
        pages: {
            current: "home",
            search: {
                keyword: "",
                matchedItems: {
                    reposByName: [],
                    filesByHash: [],
                }
            },
        },
    };
}

export function getInitialClientState(): ClientState {
    return {
        entities: getInitialEntitiesState(),
        ui: getInitialUIState(),
    };
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
            nextEntities.benchmarks = mergeArray(nextEntities.benchmarks, action.benchmarks)
            nextEntities.benchmarkResults = mergeArray(nextEntities.benchmarkResults, action.benchmarkResults)
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
                    },
                },
            };
        }
        case "SearchSuccessAction": {
            return {
                ...ui,
                pages: {
                    ...ui.pages,
                    search: {
                        ...ui.pages.search,
                        matchedItems: action.matchedItems,
                    },
                },
            };

        }
        case "ChangeUrl": {
            const result = {...ui};
            const pathState = parseUrl(action.url);
            if (pathState.searchKeyword) {
                result.pages.search.keyword = pathState.searchKeyword;
            }
            return result;
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

