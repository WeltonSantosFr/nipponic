export interface CreateCardDto {
  jpText: string;
  enText: string;
}

export interface UpdateCardDto {
  jpText?: string;
  enText?: string;
}
