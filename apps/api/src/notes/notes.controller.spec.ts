import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NotesController } from './notes.controller';
import { NotesService } from './notes.service';
import type { JwtPayload, CreateNoteDto } from '@nipponic/shared';

describe('NotesController', () => {
  let controller: NotesController;
  let notesServiceMock: {
    create: ReturnType<typeof vi.fn>;
    findAll: ReturnType<typeof vi.fn>;
    update: ReturnType<typeof vi.fn>;
    delete: ReturnType<typeof vi.fn>;
  };

  const mockUser: JwtPayload = {
    sub: 'user_123',
    email: 'user@example.com',
    username: 'testuser',
  };

  beforeEach(() => {
    notesServiceMock = {
      create: vi.fn(),
      findAll: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    };
    controller = new NotesController(notesServiceMock as unknown as NotesService);
  });

  it('create - should call notesService.create with note data and user id', async () => {
    // Arrange
    const createNoteDto: CreateNoteDto = {
      title: 'Note title',
      enText: 'Sample english text',
      jpText: 'Sample japanese text',
    };
    const expectedNote = {
      id: 'note_1',
      ...createNoteDto,
      userId: mockUser.sub,
    };
    notesServiceMock.create.mockResolvedValue(expectedNote);

    // Act
    const result = await controller.create(createNoteDto, mockUser);

    // Assert
    expect(result).toEqual(expectedNote);
    expect(notesServiceMock.create).toHaveBeenCalledWith(createNoteDto, mockUser.sub);
  });

  it('findAll - should call notesService.findAll with user id and return user notes', async () => {
    // Arrange
    const expectedNotes = [
      { id: 'note_1', title: 'Note 1', content: 'Content 1', userId: mockUser.sub },
      { id: 'note_2', title: 'Note 2', content: 'Content 2', userId: mockUser.sub },
    ];
    notesServiceMock.findAll.mockResolvedValue(expectedNotes);

    // Act
    const result = await controller.findAll(mockUser);

    // Assert
    expect(result).toEqual(expectedNotes);
    expect(notesServiceMock.findAll).toHaveBeenCalledWith(mockUser.sub);
  });

  it('update - should call notesService.update with user id, note id, and update payload', async () => {
    // Arrange
    const noteId = 'note_123';
    const updateNoteDto = {
      content: 'Updated content',
      title: 'Updated title',
    };
    const expectedUpdatedNote = {
      id: noteId,
      ...updateNoteDto,
      userId: mockUser.sub,
    };
    notesServiceMock.update.mockResolvedValue(expectedUpdatedNote);

    // Act
    const result = await controller.update(mockUser, noteId, updateNoteDto);

    // Assert
    expect(result).toEqual(expectedUpdatedNote);
    expect(notesServiceMock.update).toHaveBeenCalledWith(mockUser.sub, noteId, updateNoteDto);
  });

  it('delete - should call notesService.delete with user id and note id', async () => {
    // Arrange
    const noteId = 'note_123';
    const deleteResult = { id: noteId };
    notesServiceMock.delete.mockResolvedValue(deleteResult);

    // Act
    const result = await controller.delete(mockUser, noteId);

    // Assert
    expect(result).toEqual(deleteResult);
    expect(notesServiceMock.delete).toHaveBeenCalledWith(mockUser.sub, noteId);
  });
});
