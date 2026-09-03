export interface CreateDeckDto {
  name: string;
  isPublic?: boolean;
  cardIds?: string[];
}

export interface UpdateDeckDto {
  name?: string;
  isPublic?: boolean;
}

export interface AddCardsDto {
  cardIds: string[];
}

export interface ReorderCardsDto {
  cardIds: string[];
}
