export interface BaseAction {
    type: "set"
}

export interface SearchInput {
    type: "search-input"
}

export type ClientAction = SearchInput
